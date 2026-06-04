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

        // --- LOCAL DIRECTORY MODE ---
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return addCors({ status: 400, jsonBody: { error: "Invalid JSON body" } });
        }

        const { source, destination, tool, icmpBlock, vlanIsolate, webBlock, ipsActive } = body;
        if (!source || !destination || !tool) {
            return addCors({ status: 400, jsonBody: { error: "Parameters source, destination, and tool are required" } });
        }

        const srcNode = NODES[source];
        const destNode = NODES[destination];
        if (!srcNode || !destNode) {
            return addCors({ status: 400, jsonBody: { error: "Invalid source or destination nodes" } });
        }

        const logs = [];
        const timestamp = () => `[${new Date().toLocaleTimeString()}]`;
        logs.push(`[${timestamp()}] Executing ${tool.toUpperCase()} query from ${srcNode.name} (${srcNode.ip}) to ${destNode.name} (${destNode.ip})...`);

        // Compute standard network hop nodes based on topology
        const hops = [srcNode];
        if (source !== "internet" && destination !== "internet") {
            hops.push(NODES.switch);
            hops.push(destNode);
        } else {
            if (source === "internet") {
                hops.push(NODES.firewall);
                hops.push(NODES.switch);
            } else {
                hops.push(NODES.switch);
                hops.push(NODES.firewall);
            }
            hops.push(destNode);
        }

        // Evaluate firewall security rules
        let isBlocked = false;
        let blockReason = "";
        let blockIndex = hops.length; // path complete index

        // Rule 1: VLAN Isolation (Segregates VLAN 20 from VLAN 10 management servers)
        if (vlanIsolate) {
            if (
                (source === "ws2" && (destination === "dc" || destination === "nas")) ||
                (destination === "ws2" && (source === "dc" || source === "nas"))
            ) {
                isBlocked = true;
                blockIndex = 1; // Core Switch
                blockReason = "VLAN Isolation Active: VLAN 20 subnet is isolated from VLAN 10 domain administration nodes.";
            }
        }

        // Rule 2: ICMP Block (Drops pings at Firewall)
        if (icmpBlock && tool === "ping") {
            if (source === "internet" || destination === "internet") {
                isBlocked = true;
                blockIndex = hops.findIndex(h => h.id === "firewall");
                blockReason = "Firewall Rule Drop: ICMP Echo Requests (Ping) are rejected by active Core Firewall security policy.";
            }
        }

        // Rule 3: Port Filtering Web Block (Drops HTTP at Firewall)
        if (webBlock && tool === "http") {
            if (source === "internet" || destination === "internet") {
                isBlocked = true;
                blockIndex = hops.findIndex(h => h.id === "firewall");
                blockReason = "Firewall ACL Block: Web traffic (Port 80/443) to/from public WAN is filtered by Core Firewall access control list.";
            }
        }

        // Rule 4: Intrusion Prevention (IPS) blocking portscan attacks from Internet
        if (tool === "portscan" && source === "internet") {
            if (ipsActive) {
                isBlocked = true;
                blockIndex = hops.findIndex(h => h.id === "firewall");
                blockReason = "IPS Intrusion Prevention Alert: TCP SYN Port Scan detected from public host. Connection terminated.";
            } else {
                blockReason = "Security Exposure Warning: Public port scan completed. Unhardened ports were queried on datacenter assets.";
            }
        }

        // Handle blocked packet delivery
        if (isBlocked) {
            logs.push(`[*] Packet intercepted at ${hops[blockIndex].name} (${hops[blockIndex].ip}).`);
            logs.push(`[-] Security ACL: ${blockReason}`);
            logs.push(`[-] Diagnostic Failure: Connection timed out. 100% packet loss.`);
            return addCors({
                status: 200,
                jsonBody: {
                    isBlocked: true,
                    blockIndex: blockIndex,
                    blockReason: blockReason,
                    logs: logs
                }
            });
        }

        // --- EXECUTE REAL DIAGNOSTICS FOR UNBLOCKED PATHS ---
        try {
            if (tool === "ping") {
                // Determine if we ping the gateway/internet or query locally
                const pingIp = destNode.ip === "8.8.8.8" ? "8.8.8.8" : destNode.ip;
                
                // If it is a local address and we are not in Gavin's local subnet, ping will timeout
                // unless we are running on Gavin's local server.
                const result = await pingHost(pingIp);
                
                if (result.success) {
                    // Extract latency if possible, or return raw output lines
                    const lines = result.raw.split('\n').filter(l => l.trim());
                    lines.forEach(l => logs.push(`[+] ${l}`));
                    logs.push(`[+] Connection verified. 0% packet loss.`);
                } else {
                    logs.push(`[-] Ping failed: Host is down or unreachable.`);
                    logs.push(`[-] Raw console: ${result.raw}`);
                }

            } else if (tool === "traceroute") {
                // Run a quick ping to get actual endpoint latency to inject into traceroute hops
                const pingIp = destNode.ip === "8.8.8.8" ? "8.8.8.8" : destNode.ip;
                const result = await pingHost(pingIp);
                let latency = "1ms";
                
                if (result.success) {
                    const match = result.raw.match(/time[=<](\d+)(?:\.\d+)?\s*ms/i);
                    if (match) {
                        latency = `${match[1]}ms`;
                    }
                }
                
                logs.push(`[+] Tracing route to ${destNode.name} [${destNode.ip}] over a maximum of 30 hops:`);
                hops.forEach((hop, i) => {
                    const hopLatency = i === hops.length - 1 ? latency : `${i * 2 + 1}ms`;
                    logs.push(` ${i + 1}    <${hopLatency}    <${hopLatency}    <${hopLatency}    ${hop.name} [${hop.ip}]`);
                });
                logs.push(`[+] Trace complete.`);

            } else if (tool === "http") {
                if (destNode.id === "internet") {
                    // Run a real HTTP query to a public website
                    const res = await httpGet("https://www.google.com");
                    if (res) {
                        logs.push(`[+] Sending HTTP GET request to http://${destNode.ip} (google.com)...`);
                        logs.push(`[+] Received HTTP/1.1 ${res.statusCode} ${res.statusMessage}`);
                        res.headers.forEach(h => logs.push(`[+] Header: ${h}`));
                    } else {
                        logs.push(`[-] Failed to connect to http://${destNode.ip}`);
                    }
                } else {
                    // Try to connect to ports 80/443/8006
                    const httpPort = destNode.id === "nas" ? 5000 : destNode.id === "dc" ? 80 : 80;
                    const status = await checkPort(destNode.ip, httpPort);
                    if (status === "OPEN") {
                        logs.push(`[+] Sending HTTP GET request to http://${destNode.ip}:${httpPort}...`);
                        logs.push(`[+] Received HTTP/1.1 200 OK`);
                        logs.push(`[+] Server: Node/IIS (GavinHomeLab)`);
                        logs.push(`[+] Content-Type: text/html; charset=UTF-8`);
                    } else {
                        logs.push(`[-] Connection refused on http://${destNode.ip}:${httpPort}`);
                    }
                }

            } else if (tool === "portscan") {
                logs.push(`[+] Initiating TCP SYN port scan on target ${destNode.name} (${destNode.ip}):`);
                
                // Whitelist of ports to scan based on target
                const portsToScan = [53, 80, 135, 445];
                if (destNode.id === "nas") portsToScan.push(5000);
                if (destNode.id === "dc") portsToScan.push(389); // LDAP
                
                for (const port of portsToScan) {
                    const status = await checkPort(destNode.ip, port);
                    logs.push(`[+] Port ${port.toString().padEnd(6)} : ${status}`);
                }
                logs.push(`[+] Port scan complete.`);
                if (blockReason) {
                    logs.push(`[!] SECURITY WARNING: ${blockReason}`);
                }
            }

            return addCors({
                status: 200,
                jsonBody: {
                    isBlocked: false,
                    blockIndex: blockIndex,
                    blockReason: blockReason,
                    logs: logs
                }
            });

        } catch (err) {
            logs.push(`[-] Diagnostic engine error: ${err.message}`);
            return addCors({
                status: 200,
                jsonBody: {
                    isBlocked: false,
                    blockIndex: blockIndex,
                    blockReason: blockReason,
                    logs: logs
                }
            });
        }
    }
});
