const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Storage directory setup for local/fallback storage
let storageDir = process.env.NAS_STORAGE_DIR || path.join(process.cwd(), 'nas_storage');
try {
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(storageDir, '.test_write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
} catch (e) {
    storageDir = path.join(os.tmpdir(), 'nas_storage');
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }
}

// Quota and size limits (1 GB)
const MAX_LIMIT = 1024 * 1024 * 1024; // 1 GB
const GUEST_MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

function getTotalStorageUsed(dir) {
    let total = 0;
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file.startsWith('.')) continue;
            const filePath = path.join(dir, file);
            try {
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    total += stats.size;
                }
            } catch (err) {}
        }
    }
    return total;
}

app.http('nas', {
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Retrieve origin dynamically from request headers, fallback to '*'
        const origin = request.headers.get('Origin') || request.headers.get('origin') || '*';

        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
            'Access-Control-Allow-Credentials': 'true'
        };

        if (request.method === 'OPTIONS') {
            return { status: 204, headers: corsHeaders };
        }

        const addCors = (responseObj) => {
            return {
                ...responseObj,
                headers: {
                    ...corsHeaders,
                    ...(responseObj.headers || {})
                }
            };
        };

        // Determine if admin
        const authHeader = request.headers.get('Authorization') || '';
        const adminKey = process.env.NAS_ADMIN_KEY || 'admin123';
        const isAdmin = authHeader.replace(/^Bearer\s+/i, '') === adminKey;

        // Subdirectory for isolation
        const subDirName = isAdmin ? 'personal' : 'public';
        const targetDir = path.join(storageDir, subDirName);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const url = new URL(request.url);

        // --- PROXY MODE ---
        const backendUrlStr = process.env.NAS_BACKEND_URL;
        if (backendUrlStr) {
            try {
                const targetUrl = new URL(url.pathname + url.search, backendUrlStr);
                context.log(`Proxying NAS request to home server: ${targetUrl.toString()}`);

                // Forward headers
                const headers = new Headers();
                for (const [key, val] of request.headers.entries()) {
                    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
                        headers.set(key, val);
                    }
                }
                headers.set('ngrok-skip-browser-warning', 'true');

                const fetchOptions = {
                    method: request.method,
                    headers: headers
                };

                if (request.method === 'POST') {
                    const formData = await request.formData();
                    const newFormData = new FormData();
                    for (const [key, val] of formData.entries()) {
                        newFormData.append(key, val);
                    }
                    fetchOptions.body = newFormData;
                    headers.delete('content-type');
                }

                const backendRes = await fetch(targetUrl.toString(), fetchOptions);

                // Read backend response headers
                const resHeaders = {};
                const excludeHeaders = [
                    'content-encoding', 'content-length', 'transfer-encoding', 'connection',
                    'keep-alive', 'access-control-allow-origin', 'access-control-allow-credentials',
                    'access-control-allow-methods', 'access-control-allow-headers', 'server'
                ];
                for (const [key, val] of backendRes.headers.entries()) {
                    if (!excludeHeaders.includes(key.toLowerCase())) {
                        resHeaders[key] = val;
                    }
                }

                // If content is file download, stream body
                if (backendRes.headers.get('content-type') === 'application/octet-stream') {
                    const arrayBuffer = await backendRes.arrayBuffer();
                    return addCors({
                        status: backendRes.status,
                        headers: resHeaders,
                        body: Buffer.from(arrayBuffer)
                    });
                }

                const resText = await backendRes.text();
                let jsonBody;
                try {
                    jsonBody = JSON.parse(resText);
                } catch(e) {
                    jsonBody = { message: resText };
                }

                return addCors({
                    status: backendRes.status,
                    headers: resHeaders,
                    jsonBody: jsonBody
                });
            } catch (err) {
                context.error("NAS Proxy Error:", err);
                return addCors({
                    status: 502,
                    jsonBody: { error: `NAS backend proxy failed: ${err.message}` }
                });
            }
        }

        // --- LOCAL DIRECTORY MODE ---
        try {
            const fileName = url.searchParams.get('file');

            // Seed initial mock files for local demo if directory is empty
            if (fs.existsSync(targetDir)) {
                try {
                    const seededFlag = path.join(targetDir, '.seeded');
                    if (!fs.existsSync(seededFlag)) {
                        const entries = fs.readdirSync(targetDir);
                        const fileEntries = entries.filter(e => fs.statSync(path.join(targetDir, e)).isFile() && !e.startsWith('.'));
                        if (fileEntries.length === 0) {
                            fs.writeFileSync(path.join(targetDir, 'presentation.pdf'), Buffer.alloc(1048576)); // 1MB mock file
                            fs.writeFileSync(path.join(targetDir, 'backup_config.xml'), Buffer.from('<config><version>1.0</version></config>'));
                        }
                        fs.writeFileSync(seededFlag, 'true');
                    }
                } catch (e) {
                    context.log("Failed to seed mock files:", e.message);
                }
            }

            if (request.method === 'GET') {
                if (fileName) {
                    const safeName = path.basename(fileName);
                    const filePath = path.join(targetDir, safeName);
                    if (!fs.existsSync(filePath) || safeName.startsWith('.')) {
                        return addCors({ status: 404, jsonBody: { error: "File not found" } });
                    }
                    const fileBuffer = fs.readFileSync(filePath);
                    return addCors({
                        status: 200,
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': `attachment; filename="${encodeURIComponent(safeName)}"`
                        },
                        body: fileBuffer
                    });
                } else {
                    // List files
                    const files = [];
                    if (fs.existsSync(targetDir)) {
                        const entries = fs.readdirSync(targetDir);
                        for (const entry of entries) {
                            if (entry.startsWith('.')) continue;
                            const filePath = path.join(targetDir, entry);
                            try {
                                const stats = fs.statSync(filePath);
                                if (stats.isFile()) {
                                    files.push({
                                        name: entry,
                                        size: stats.size,
                                        uploadedAt: stats.mtime.toISOString()
                                    });
                                }
                            } catch (e) {}
                        }
                    }
                    // Sort by newest
                    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                    
                    const totalSize = getTotalStorageUsed(targetDir);
                    return addCors({
                        status: 200,
                        jsonBody: {
                            files,
                            totalSize,
                            limit: isAdmin ? 0 : MAX_LIMIT,
                            mode: isAdmin ? 'owner' : 'guest'
                        }
                    });
                }
            }

            if (request.method === 'POST') {
                const formData = await request.formData();
                const file = formData.get('file');
                if (!file) {
                    return addCors({ status: 400, jsonBody: { error: "No file provided" } });
                }

                const name = file.name || 'file';
                const safeName = path.basename(name);
                const size = file.size;

                // Prevent uploading files starting with '.'
                if (safeName.startsWith('.')) {
                    return addCors({ status: 400, jsonBody: { error: "Filenames starting with dot are not allowed" } });
                }

                // Quota check for guests
                if (!isAdmin) {
                    if (size > GUEST_MAX_FILE_SIZE) {
                        return addCors({ status: 400, jsonBody: { error: "File size exceeds 1GB limit for guests" } });
                    }
                    const currentTotal = getTotalStorageUsed(targetDir);
                    let existingSize = 0;
                    const targetPath = path.join(targetDir, safeName);
                    if (fs.existsSync(targetPath)) {
                        try { existingSize = fs.statSync(targetPath).size; } catch(e) {}
                    }
                    if (currentTotal - existingSize + size > MAX_LIMIT) {
                        return addCors({ status: 400, jsonBody: { error: "Guest storage quota of 1GB exceeded" } });
                    }
                }

                const targetPath = path.join(targetDir, safeName);
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(targetPath, buffer);

                return addCors({
                    status: 200,
                    jsonBody: {
                        message: `Successfully uploaded ${safeName}`,
                        file: {
                            name: safeName,
                            size: size,
                            uploadedAt: new Date().toISOString()
                        }
                    }
                });
            }

            if (request.method === 'DELETE') {
                if (!fileName) {
                    return addCors({ status: 400, jsonBody: { error: "Filename parameter required" } });
                }
                const safeName = path.basename(fileName);
                const targetPath = path.join(targetDir, safeName);
                if (!fs.existsSync(targetPath) || safeName.startsWith('.')) {
                    return addCors({ status: 404, jsonBody: { error: "File not found" } });
                }
                fs.unlinkSync(targetPath);
                return addCors({
                    status: 200,
                    jsonBody: { message: `Successfully deleted ${safeName}` }
                });
            }

        } catch (err) {
            context.log("NAS local handler error:", err);
            return addCors({
                status: 500,
                jsonBody: { error: "Internal server error: " + err.message }
            });
        }
    }
});
