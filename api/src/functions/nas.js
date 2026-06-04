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

        return addCors({
            status: 503,
            jsonBody: { error: "Home Lab connection offline. Please configure NAS_BACKEND_URL in the Azure Portal." }
        });
    }
});
