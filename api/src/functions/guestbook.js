const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

// Simple in-memory rate-limiting maps
const ipCooldowns = new Map(); // ip -> timestamp
let lastGlobalCommitTime = 0;

const RATE_LIMIT_MS = 60000; // 1 minute per IP
const GLOBAL_COOLDOWN_MS = 120000; // 2 minutes global cooldown to protect GitHub Action minutes

// Helper to escape HTML characters (prevent XSS)
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

app.http('guestbook', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const origin = request.headers.get('Origin') || request.headers.get('origin') || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

        const localPath = path.join(process.cwd(), 'src/data/guestbook.json');
        const repoOwner = 'gpz03';
        const repoName = 'ProfessionalSiteGZ';
        const filePathInRepo = 'src/data/guestbook.json';
        const githubPat = process.env.GITHUB_PAT;

        // --- GET METHOD ---
        if (request.method === 'GET') {
            try {
                const os = require('os');
                const fallbackPath = path.join(os.tmpdir(), 'guestbook.json');
                
                // If a temporary fallback file exists in SWA runtime, read it first
                if (fs.existsSync(fallbackPath)) {
                    const content = fs.readFileSync(fallbackPath, 'utf8');
                    return addCors({ status: 200, jsonBody: JSON.parse(content) });
                }

                // If running locally, we can read local guestbook.json
                if (fs.existsSync(localPath)) {
                    const content = fs.readFileSync(localPath, 'utf8');
                    return addCors({ status: 200, jsonBody: JSON.parse(content) });
                }
                
                // Fallback to fetching directly from GitHub Pages or GitHub API
                // In production, the file is compiled in the static frontend asset list,
                // but we can also fetch it directly from the raw GitHub contents to get the latest
                const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${filePathInRepo}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    return addCors({ status: 200, jsonBody: data });
                }
                
                // Return empty list if file doesn't exist
                return addCors({ status: 200, jsonBody: [] });
            } catch (err) {
                context.error("Failed to read guestbook.json:", err.message);
                return addCors({ status: 500, jsonBody: { error: "Failed to read guestbook: " + err.message } });
            }
        }

        // --- POST METHOD ---
        if (request.method === 'POST') {
            // Get client IP address for rate limiting
            const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('client-ip') || 'anonymous';
            const now = Date.now();

            // 1. IP Rate Limiting check
            const lastIpTime = ipCooldowns.get(clientIp) || 0;
            if (now - lastIpTime < RATE_LIMIT_MS) {
                const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastIpTime)) / 1000);
                return addCors({
                    status: 429,
                    jsonBody: { error: `Please wait ${remaining} seconds before signing the guestbook again.` }
                });
            }

            // 2. Global Commit Cooldown check (only relevant if committing to GitHub)
            if (githubPat && (now - lastGlobalCommitTime < GLOBAL_COOLDOWN_MS)) {
                const remainingGlobal = Math.ceil((GLOBAL_COOLDOWN_MS - (now - lastGlobalCommitTime)) / 1000);
                return addCors({
                    status: 429,
                    jsonBody: { error: `Global commit cooldown in progress. Please try again in ${remainingGlobal} seconds to prevent pipeline spam.` }
                });
            }

            // Parse request body
            let body;
            try {
                body = await request.json();
            } catch(e) {
                return addCors({ status: 400, jsonBody: { error: "Invalid JSON body" } });
            }

            const rawName = body.name;
            const rawMessage = body.message;

            if (!rawName || !rawMessage) {
                return addCors({ status: 400, jsonBody: { error: "Name and message are required fields" } });
            }

            // Sanitize inputs and enforce size limits
            const name = sanitizeString(rawName).slice(0, 50);
            const message = sanitizeString(rawMessage).slice(0, 250);

            if (name.length === 0 || message.length === 0) {
                return addCors({ status: 400, jsonBody: { error: "Name and message cannot be empty" } });
            }

            const newEntry = {
                name,
                message,
                timestamp: new Date().toISOString()
            };

            // Register rate limiting
            ipCooldowns.set(clientIp, now);

            try {
                let currentEntries = [];
                let fileSha = null;

                if (githubPat) {
                    // Update remote file via GitHub API
                    context.log("GitHub PAT detected. Committing guestbook entry to GitHub...");
                    
                    const getUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePathInRepo}`;
                    const getRes = await fetch(getUrl, {
                        headers: {
                            'Authorization': `Bearer ${githubPat}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'Azure-SWA-Guestbook'
                        }
                    });

                    if (getRes.ok) {
                        const fileData = await getRes.json();
                        fileSha = fileData.sha;
                        const fileContent = Buffer.from(fileData.content, 'base64').toString('utf8');
                        currentEntries = JSON.parse(fileContent);
                    } else if (getRes.status !== 404) {
                        throw new Error(`GitHub API GET returned status ${getRes.status}`);
                    }

                    // Append entry
                    currentEntries.push(newEntry);
                    // Keep list limited to last 100 entries to prevent files growing infinitely
                    if (currentEntries.length > 100) {
                        currentEntries = currentEntries.slice(-100);
                    }

                    const updatedContentBase64 = Buffer.from(JSON.stringify(currentEntries, null, 2)).toString('base64');

                    // Push commit
                    const putRes = await fetch(getUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${githubPat}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json',
                            'User-Agent': 'Azure-SWA-Guestbook'
                        },
                        body: JSON.stringify({
                            message: `guestbook: sign by ${name}`,
                            content: updatedContentBase64,
                            sha: fileSha || undefined,
                            branch: 'main'
                        })
                    });

                    if (!putRes.ok) {
                        const errorData = await putRes.json().catch(() => ({}));
                        throw new Error(`GitHub API PUT returned status ${putRes.status}: ${errorData.message || ''}`);
                    }

                    lastGlobalCommitTime = now;
                    context.log("Guestbook entry successfully committed to GitHub. Workflow triggered.");

                } else {
                    // Local File Mode (for dev environment) or Fallback for Cloud Read-Only filesystems
                    context.log("GitHub PAT not configured. Using local/temporary file fallback...");
                    const os = require('os');
                    
                    let targetPath = localPath;
                    let isFallback = false;
                    
                    // Check if we can write to the local directory, otherwise use tmp
                    try {
                        const dir = path.dirname(localPath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        const testFile = path.join(dir, '.test_write');
                        fs.writeFileSync(testFile, 'test');
                        fs.unlinkSync(testFile);
                    } catch (e) {
                        targetPath = path.join(os.tmpdir(), 'guestbook.json');
                        isFallback = true;
                        context.log(`Local directory is read-only. Falling back to: ${targetPath}`);
                    }

                    if (fs.existsSync(targetPath)) {
                        try {
                            const content = fs.readFileSync(targetPath, 'utf8');
                            currentEntries = JSON.parse(content);
                        } catch (e) {
                            context.error("Failed to parse existing guestbook file:", e.message);
                        }
                    } else if (isFallback) {
                        // In fallback mode, if tmp file doesn't exist, we can try reading from the local source file (read-only)
                        // to populate the initial entries
                        if (fs.existsSync(localPath)) {
                            try {
                                const content = fs.readFileSync(localPath, 'utf8');
                                currentEntries = JSON.parse(content);
                            } catch (e) {}
                        }
                    }

                    currentEntries.push(newEntry);
                    if (currentEntries.length > 100) {
                        currentEntries = currentEntries.slice(-100);
                    }

                    try {
                        const dir = path.dirname(targetPath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        fs.writeFileSync(targetPath, JSON.stringify(currentEntries, null, 2), 'utf8');
                    } catch (err) {
                        throw new Error("Local/fallback write failed: " + err.message);
                    }
                }

                return addCors({
                    status: 200,
                    jsonBody: {
                        message: githubPat 
                            ? "Signature added successfully!" 
                            : "Signature saved temporarily! Please configure GITHUB_PAT on Azure to enable real CD pipeline deployments.",
                        entry: newEntry,
                        pipelineTriggered: !!githubPat
                    }
                });

            } catch (err) {
                context.error("Failed to commit guestbook entry:", err.message);
                return addCors({
                    status: 500,
                    jsonBody: { error: "Failed to write signature: " + err.message }
                });
            }
        }
    }
});
