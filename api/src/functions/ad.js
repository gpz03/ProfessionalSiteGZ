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

        const isWindows = os.platform() === 'win32';
        const systemInfo = {
            hostname: os.hostname(),
            platform: os.platform(),
            type: os.type(),
            release: os.release(),
            uptime: os.uptime(),
            arch: os.arch(),
            cpuModel: os.cpus()[0]?.model || 'Unknown',
            totalMemory: os.totalmem(),
            freeMemory: os.freemem()
        };

        try {
            let users = [];
            let services = [];
            let network = [];

            if (isWindows) {
                // Windows System - Run PowerShell queries
                try {
                    const usersRaw = await runCmd('powershell -Command "Get-LocalUser | Select-Object Name, Enabled, Description | ConvertTo-Json"');
                    const parsedUsers = JSON.parse(usersRaw);
                    users = Array.isArray(parsedUsers) ? parsedUsers : [parsedUsers];
                } catch (e) {
                    context.error("Failed to query local Windows users:", e.message);
                    // Fallback using net user
                    try {
                        const netUsers = await runCmd('net user');
                        users = netUsers.split('\n').slice(4).map(u => ({ Name: u.trim(), Enabled: true, Description: 'System Account' })).filter(u => u.Name);
                    } catch(err) {}
                }

                try {
                    const servicesRaw = await runCmd('powershell -Command "Get-Service | Where-Object {$_.Status -eq \'Running\'} | Select-Object -First 10 Name, DisplayName, Status | ConvertTo-Json"');
                    const parsedServices = JSON.parse(servicesRaw);
                    services = Array.isArray(parsedServices) ? parsedServices : [parsedServices];
                } catch (e) {
                    context.error("Failed to query Windows services:", e.message);
                }

                try {
                    const ipRaw = await runCmd('powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike \'127.*\'} | Select-Object IPAddress, InterfaceAlias | ConvertTo-Json"');
                    const parsedIp = JSON.parse(ipRaw);
                    network = Array.isArray(parsedIp) ? parsedIp : [parsedIp];
                } catch (e) {
                    context.error("Failed to query Windows IP settings:", e.message);
                    network = [{ IPAddress: os.networkInterfaces()['Ethernet']?.[0]?.address || '127.0.0.1', InterfaceAlias: 'Ethernet' }];
                }

            } else {
                // Linux / macOS - Fallback queries
                try {
                    // Get local users from /etc/passwd
                    const passwd = await runCmd('cat /etc/passwd | cut -d: -f1,3,7');
                    users = passwd.split('\n').slice(0, 15).map(line => {
                        const [name, uid, shell] = line.split(':');
                        return {
                            Name: name,
                            Enabled: parseInt(uid) >= 0,
                            Description: `UID: ${uid}, Shell: ${shell}`
                        };
                    });
                } catch (e) {
                    context.error("Failed to query Linux passwd:", e.message);
                }

                try {
                    // Get top running processes as services
                    const ps = await runCmd('ps -eo comm,pid,stat --sort=-%cpu | head -n 11');
                    services = ps.split('\n').slice(1).map(line => {
                        const tokens = line.trim().split(/\s+/);
                        return {
                            Name: tokens[0] || 'process',
                            DisplayName: `PID: ${tokens[1] || '0'}`,
                            Status: tokens[2] || 'Running'
                        };
                    });
                } catch (e) {
                    context.error("Failed to query Linux processes:", e.message);
                }

                // Gather host network interfaces
                const nics = os.networkInterfaces();
                for (const name of Object.keys(nics)) {
                    for (const netInfo of nics[name] || []) {
                        if (netInfo.family === 'IPv4' && !netInfo.internal) {
                            network.push({
                                IPAddress: netInfo.address,
                                InterfaceAlias: name
                            });
                        }
                    }
                }
            }

            return addCors({
                status: 200,
                jsonBody: {
                    system: systemInfo,
                    users: users.filter(u => u && u.Name),
                    services: services.filter(s => s && s.Name),
                    network
                }
            });

        } catch (error) {
            context.error("AD/System query endpoint failed:", error);
            return addCors({
                status: 500,
                jsonBody: { error: "Failed to gather host stats: " + error.message }
            });
        }
    }
});
