const { app } = require('@azure/functions');
const os = require('os');
const { exec } = require('child_process');
const net = require('net');
const http = require('http');
const https = require('https');

const NODES = {
    internet: { name: "Internet Gateway", ip: "8.8.8.8", type: "internet" },
    firewall: { name: "Core Firewall", ip: "192.168.1.1", type: "firewall" },
    switch: { name: "Core Switch", ip: "192.168.1.2", type: "switch" },
    dc: { name: "Domain Controller (DC-01)", ip: "192.168.1.10", type: "server" },
    nas: { name: "Personal NAS", ip: "192.168.1.50", type: "server" },
    ws1: { name: "Workstation 1 (VLAN 10)", ip: "192.168.10.15", type: "workstation" },
    ws2: { name: "Workstation 2 (VLAN 20)", ip: "192.168.20.22", type: "workstation" }
};

// Map node ID to IP
function getIpForNode(nodeId) {
    return NODES[nodeId]?.ip || "127.0.0.1";
}

// Map node ID to Name
function getNameForNode(nodeId) {
    return NODES[nodeId]?.name || "Unknown Host";
}

// Safely ping a host
function pingHost(ip) {
    return new Promise((resolve) => {
        const cmd = os.platform() === 'win32' 
            ? `ping -n 2 ${ip}` 
            : `ping -c 2 -W 2 ${ip}`;
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, raw: stdout.trim() || stderr.trim() || error.message });
            } else {
                resolve({ success: true, raw: stdout.trim() });
            }
        });
    });
}

// Safely probe a TCP port
function checkPort(ip, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(800);
        socket.on('connect', () => {
            socket.destroy();
            resolve('OPEN');
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve('CLOSED');
        });
        socket.on('error', () => {
            socket.destroy();
            resolve('CLOSED');
        });
        socket.connect(port, ip);
    });
}

// Safely make an HTTP GET request
function httpGet(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { timeout: 1500 }, (res) => {
            const headers = [];
            for (const [key, val] of Object.entries(res.headers)) {
                headers.push(`${key}: ${val}`);
            }
            resolve({
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                headers: headers.slice(0, 6)
            });
        });
        req.on('error', (err) => {
            resolve(null);
        });
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
    });
}

app.http('network', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const origin = request.headers.get('Origin') || request.headers.get('origin') || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

        // --- PROXY MODE ---
        const url = new URL(request.url);
        const backendUrlStr = process.env.NAS_BACKEND_URL;
        if (backendUrlStr) {
            try {
                const targetUrl = new URL(url.pathname + url.search, backendUrlStr);
                context.log(`Proxying Network Diagnostics to home server: ${targetUrl.toString()}`);

                const headers = new Headers();
                for (const [key, val] of request.headers.entries()) {
                    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
                        headers.set(key, val);
                    }
                }
                headers.set('ngrok-skip-browser-warning', 'true');

                const bodyText = await request.text();
                const backendRes = await fetch(targetUrl.toString(), {
                    method: 'POST',
                    headers: headers,
                    body: bodyText
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
                context.error("Network Diagnostics Proxy Error:", err);
                return addCors({
                    status: 502,
                    jsonBody: { error: `Network diagnostics backend proxy failed: ${err.message}` }
                });
            }
        }

                return addCors({
            status: 503,
            jsonBody: { error: "Home Lab connection offline. Please configure NAS_BACKEND_URL in the Azure Portal." }
        });
    }
});
