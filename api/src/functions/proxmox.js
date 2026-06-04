const { app } = require('@azure/functions');
const https = require('https');

// Simple in-memory cache to prevent hammering the home server
let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 60 seconds

app.http('proxmox', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const origin = request.headers.get('Origin') || request.headers.get('origin') || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
            'Access-Control-Allow-Credentials': 'true'
        };

        if (request.method === 'OPTIONS') {
            return {
                status: 204,
                headers: corsHeaders
            };
        }

        // --- PROXY MODE ---
        const url = new URL(request.url);
        const backendUrlStr = process.env.NAS_BACKEND_URL;
        if (backendUrlStr) {
            try {
                const targetUrl = new URL(url.pathname + url.search, backendUrlStr);
                context.log(`Proxying Proxmox request to home server: ${targetUrl.toString()}`);

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
                for (const [key, val] of backendRes.headers.entries()) {
                    resHeaders[key] = val;
                }

                const resText = await backendRes.text();
                let jsonBody;
                try {
                    jsonBody = JSON.parse(resText);
                } catch(e) {
                    jsonBody = { message: resText };
                }

                return {
                    status: backendRes.status,
                    headers: {
                        ...corsHeaders,
                        ...resHeaders
                    },
                    jsonBody: jsonBody
                };
            } catch (err) {
                context.error("Proxmox Proxy Error:", err);
                return {
                    status: 502,
                    headers: corsHeaders,
                    jsonBody: { error: `Proxmox backend proxy failed: ${err.message}` }
                };
            }
        }

        return {
            status: 503,
            headers: corsHeaders,
            jsonBody: { error: "Home Lab connection offline. Please configure NAS_BACKEND_URL in the Azure Portal." }
        };
    }
});
