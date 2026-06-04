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
                status: 200,
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

        const now = Date.now();
        if (cachedData && (now - lastFetch) < CACHE_TTL) {
            return {
                status: 200,
                headers: corsHeaders,
                jsonBody: cachedData
            };
        }

        const proxmoxUrl = process.env.PROXMOX_URL; 
        const tokenId = process.env.PROXMOX_TOKEN_ID;
        const secret = process.env.PROXMOX_SECRET;

        if (!proxmoxUrl || !tokenId || !secret) {
            return {
                status: 503,
                headers: corsHeaders,
                jsonBody: {
                    error: "Proxmox connection not configured. Missing environment variables."
                }
            };
        }

        try {
            // Using https module to bypass self-signed cert issues usually found on home PVE servers
            const fetchData = (path) => {
                return new Promise((resolve, reject) => {
                    const url = new URL(path, proxmoxUrl);
                    const options = {
                        method: 'GET',
                        headers: {
                            'Authorization': `PVEAPIToken=${tokenId}=${secret}`,
                            'ngrok-skip-browser-warning': 'true'
                        },
                        rejectUnauthorized: false // Required for default Proxmox self-signed certs
                    };

                    const req = https.request(url, options, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                try {
                                    resolve(JSON.parse(data));
                                } catch (e) {
                                    reject(new Error("Invalid JSON response"));
                                }
                            } else {
                                reject(new Error(`API Error: ${res.statusCode}`));
                            }
                        });
                    });

                    req.on('error', reject);
                    req.end();
                });
            };

            // Fetch node status and qemu VMs
            // We assume the primary node is named 'pve' (default)
            const nodeStatus = await fetchData('/api2/json/nodes/pve/status');
            const vms = await fetchData('/api2/json/nodes/pve/qemu');

            const result = {
                timestamp: new Date().toISOString(),
                node: {
                    name: 'pve',
                    uptime: nodeStatus.data.uptime,
                    cpu: nodeStatus.data.cpu,
                    memory: {
                        used: nodeStatus.data.memory.used,
                        total: nodeStatus.data.memory.total
                    },
                    disk: {
                        used: nodeStatus.data.rootfs.used,
                        total: nodeStatus.data.rootfs.total
                    }
                },
                vms: vms.data.map(vm => ({
                    vmid: vm.vmid,
                    name: vm.name,
                    status: vm.status,
                    uptime: vm.uptime,
                    cpu: vm.cpu,
                    maxcpu: vm.cpus,
                    maxmem: vm.maxmem
                }))
            };

            cachedData = result;
            lastFetch = now;

            return {
                status: 200,
                headers: corsHeaders,
                jsonBody: result
            };

        } catch (error) {
            context.error("Proxmox API Error:", error.message);
            return {
                status: 500,
                headers: corsHeaders,
                jsonBody: {
                    error: "Failed to fetch data from Proxmox server."
                }
            };
        }
    }
});
