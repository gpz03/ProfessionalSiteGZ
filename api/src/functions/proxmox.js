const { app } = require('@azure/functions');
const https = require('https');

// Simple in-memory cache to prevent hammering the home server
let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 60 seconds

app.http('proxmox', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const now = Date.now();
        if (cachedData && (now - lastFetch) < CACHE_TTL) {
            return {
                status: 200,
                jsonBody: cachedData
            };
        }

        const proxmoxUrl = process.env.PROXMOX_URL; 
        const tokenId = process.env.PROXMOX_TOKEN_ID;
        const secret = process.env.PROXMOX_SECRET;

        if (!proxmoxUrl || !tokenId || !secret) {
            return {
                status: 503,
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
                            'Authorization': `PVEAPIToken=${tokenId}=${secret}`
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
                jsonBody: result
            };

        } catch (error) {
            context.error("Proxmox API Error:", error.message);
            return {
                status: 500,
                jsonBody: {
                    error: "Failed to fetch data from Proxmox server."
                }
            };
        }
    }
});
