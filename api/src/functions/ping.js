const { app } = require('@azure/functions');

app.http('ping', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const origin = request.headers.get('Origin') || request.headers.get('origin') || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
            'Access-Control-Allow-Credentials': 'true'
        };

        if (request.method === 'OPTIONS') {
            return {
                status: 204,
                headers: corsHeaders
            };
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
                context.log(`Proxying Ping request to home server: ${targetUrl.toString()}`);

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

                if (request.method !== 'GET' && request.method !== 'HEAD') {
                    fetchOptions.body = await request.text();
                }

                const backendRes = await fetch(targetUrl.toString(), fetchOptions);

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
                context.error("Ping Proxy Error:", err);
                return addCors({
                    status: 502,
                    jsonBody: { error: `Ping backend proxy failed: ${err.message}` }
                });
            }
        }

        context.log('Ping function processed a request.');

        const serverTime = new Date().toISOString();
        const region = process.env.REGION_NAME || "East US 2 (Azure Static Web Apps Managed)";

        return addCors({
            status: 200,
            jsonBody: {
                message: "Success! Direct connection to Azure Serverless Backend established.",
                serverTime: serverTime,
                region: region,
                architecture: process.arch,
                platform: process.platform,
                nodeVersion: process.version,
                githubPatConfigured: !!process.env.GITHUB_PAT
            }
        });
    }
});
