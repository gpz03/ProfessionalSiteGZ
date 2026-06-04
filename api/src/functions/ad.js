const { app } = require('@azure/functions');
const { exec } = require('child_process');
const os = require('os');

// Run a command safely using child_process.exec
const runCmd = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr.trim() || error.message));
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

app.http('ad', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const origin = request.headers.get('Origin') || request.headers.get('origin') || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

        // --- PROXY MODE ---
        const url = new URL(request.url);
        const backendUrlStr = process.env.NAS_BACKEND_URL;
        if (backendUrlStr) {
            try {
                const targetUrl = new URL(url.pathname + url.search, backendUrlStr);
                context.log(`Proxying Active Directory request to home server: ${targetUrl.toString()}`);

                // Forward headers
                const headers = new Headers();
                for (const [key, val] of request.headers.entries()) {
                    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
                        headers.set(key, val);
                    }
                }
                headers.set('ngrok-skip-browser-warning', 'true');

                const backendRes = await fetch(targetUrl.toString(), {
                    method: 'GET',
                    headers: headers
                });

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
                context.error("Active Directory Proxy Error:", err);
                return addCors({
                    status: 502,
                    jsonBody: { error: `Active Directory backend proxy failed: ${err.message}` }
                });
            }
        }

        return addCors({
            status: 503,
            jsonBody: { error: "Home Lab connection offline. Please configure NAS_BACKEND_URL in the Azure Portal." }
        });
    }
});
