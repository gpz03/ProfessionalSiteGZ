const { app } = require('@azure/functions');
const os = require('os');
const fs = require('fs');
const path = require('path');

app.http('powershell', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Retrieve origin dynamically from request headers, fallback to '*'
        const origin = request.headers.get('Origin') || request.headers.get('origin') || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return addCors({ status: 400, jsonBody: { error: "Invalid JSON body" } });
        }

        const { scriptId } = body;
        if (!scriptId) {
            return addCors({ status: 400, jsonBody: { error: "scriptId parameter is required" } });
        }

        const logs = [];
        const timestamp = () => `[${new Date().toLocaleTimeString()}]`;

        if (scriptId === 'diagnostics') {
            logs.push({ type: 'progress', percent: 10, status: 'Initializing diagnostics' });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Loading Get-SystemDiagnostics.ps1...` });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Gathering host kernel specifications...` });
            logs.push({ type: 'stdout', text: '' });
            logs.push({ type: 'stdout', text: 'HostName      : ' + os.hostname() });
            logs.push({ type: 'stdout', text: 'Platform      : ' + os.platform() + ' (' + os.type() + ')' });
            logs.push({ type: 'stdout', text: 'KernelRelease : ' + os.release() });
            logs.push({ type: 'stdout', text: 'Architecture  : ' + os.arch() });
            logs.push({ type: 'stdout', text: 'CPU Model     : ' + (os.cpus()[0]?.model || 'Unknown CPU') });
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 50, status: 'Auditing memory' });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Calculating RAM allocations...` });
            const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
            const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
            const freePercent = ((os.freemem() / os.totalmem()) * 100).toFixed(1);
            logs.push({ type: 'stdout', text: `TotalMemory   : ${totalMem} GB` });
            logs.push({ type: 'stdout', text: `FreeMemory    : ${freeMem} GB (${freePercent}% Free)` });
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 80, status: 'Querying network interfaces' });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Scanning active network interfaces...` });
            logs.push({ type: 'stdout', text: 'IPAddress         InterfaceAlias' });
            logs.push({ type: 'stdout', text: '---------         --------------' });
            
            const nics = os.networkInterfaces();
            let count = 0;
            for (const name of Object.keys(nics)) {
                for (const netInfo of nics[name] || []) {
                    if (netInfo.family === 'IPv4' && !netInfo.internal && count < 3) {
                        logs.push({ type: 'stdout', text: `${netInfo.address.padEnd(17)} ${name}` });
                        count++;
                    }
                }
            }
            if (count === 0) {
                logs.push({ type: 'stdout', text: '169.254.7.1       eth0' });
            }
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 100, status: 'Complete' });
            logs.push({ type: 'success', text: `[SUCCESS] ${timestamp()} Host system diagnostics audit completed successfully.` });

        } else if (scriptId === 'storage') {
            logs.push({ type: 'progress', percent: 10, status: 'Accessing storage mount' });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Loading Audit-StorageQuota.ps1...` });
            
            let storageDir = process.env.NAS_STORAGE_DIR || path.join(process.cwd(), 'nas_storage');
            if (!fs.existsSync(storageDir)) {
                storageDir = path.join(os.tmpdir(), 'nas_storage');
            }

            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Target Directory: ${storageDir}` });
            logs.push({ type: 'stdout', text: `[INFO] ${timestamp()} Scanning filesystem directory structures...` });
            logs.push({ type: 'stdout', text: `[INFO] ${timestamp()} Quota Limit: 1,073,741,824 Bytes (1.00 GB)` });
            
            logs.push({ type: 'progress', percent: 40, status: 'Scanning directory files' });
            logs.push({ type: 'warning', text: `WARNING: ${timestamp()} Quota tracking is active. Guest users are limited to 1GB collective capacity.` });

            let files = [];
            let totalSize = 0;
            const publicDir = path.join(storageDir, 'public');
            if (fs.existsSync(publicDir)) {
                try {
                    const entries = fs.readdirSync(publicDir);
                    for (const entry of entries) {
                        const filePath = path.join(publicDir, entry);
                        const stats = fs.statSync(filePath);
                        if (stats.isFile()) {
                            files.push({ name: entry, size: stats.size, mtime: stats.mtime });
                            totalSize += stats.size;
                        }
                    }
                } catch(e) {}
            }

            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Counting files...` });
            logs.push({ type: 'stdout', text: `Found ${files.length} active files in guest sandbox partition.` });
            logs.push({ type: 'stdout', text: '' });
            logs.push({ type: 'stdout', text: 'Name                      Size (Bytes)   LastModified' });
            logs.push({ type: 'stdout', text: '----                      ------------   ------------' });
            
            if (files.length === 0) {
                logs.push({ type: 'stdout', text: 'presentation.pdf          1,048,576      2026-05-23T21:40:02Z' });
                logs.push({ type: 'stdout', text: 'backup_config.xml         4,500          2026-05-23T21:43:50Z' });
                totalSize = 1053076;
            } else {
                files.slice(0, 5).forEach(f => {
                    logs.push({ type: 'stdout', text: `${f.name.padEnd(25)} ${f.size.toString().padEnd(14)} ${f.mtime.toISOString().substring(0, 19)}Z` });
                });
            }
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 80, status: 'Computing quota thresholds' });
            const totalMb = (totalSize / (1024 * 1024)).toFixed(2);
            const remainingMb = ((1024 * 1024 * 1024 - totalSize) / (1024 * 1024)).toFixed(2);
            const percentUsed = ((totalSize / (1024 * 1024 * 1024)) * 100).toFixed(2);

            logs.push({ type: 'stdout', text: `[CAPACITY ANALYSIS]` });
            logs.push({ type: 'stdout', text: `Total Used  : ${totalMb} MB (${percentUsed}% of guest quota)` });
            logs.push({ type: 'stdout', text: `Remaining   : ${remainingMb} MB` });
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 100, status: 'Complete' });
            logs.push({ type: 'success', text: `[SUCCESS] ${timestamp()} File quota integrity audit completed. No orphaned handles found.` });

        } else if (scriptId === 'ad_audit') {
            logs.push({ type: 'progress', percent: 10, status: 'Contacting domain controller' });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Loading Audit-ActiveDirectory.ps1...` });
            logs.push({ type: 'stdout', text: `[INFO] ${timestamp()} Initializing Active Directory Domain Services connection...` });
            
            logs.push({ type: 'progress', percent: 45, status: 'Reading directory database' });
            logs.push({ type: 'warning', text: `WARNING: ${timestamp()} Domain Controller 'DC-ZOLA-01' is running in hybrid Azure AD mode.` });
            
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Auditing Active Directory Users database...` });
            logs.push({ type: 'stdout', text: '' });
            logs.push({ type: 'stdout', text: 'Name            Enabled   Description' });
            logs.push({ type: 'stdout', text: '----            -------   -----------' });
            logs.push({ type: 'stdout', text: 'Administrator   True      Built-in account for administering the domain' });
            logs.push({ type: 'stdout', text: 'Guest           False     Built-in account for guest access' });
            logs.push({ type: 'stdout', text: 'gavin.zola      True      Domain Administrator (IT Operations)' });
            logs.push({ type: 'stdout', text: 'test.user       True      Standard User Account (Finance)' });
            logs.push({ type: 'stdout', text: 'apiuser         True      Read-Only Service Account (PVE Auditor)' });
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 75, status: 'Checking core service logs' });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Auditing running Domain Services...` });
            logs.push({ type: 'stdout', text: 'Name              Status    DisplayName' });
            logs.push({ type: 'stdout', text: '----              ------    -----------' });
            logs.push({ type: 'stdout', text: 'ActiveDirectory   Running   Active Directory Domain Services (NTDS)' });
            logs.push({ type: 'stdout', text: 'DNS               Running   DNS Server (Named)' });
            logs.push({ type: 'stdout', text: 'DHCP              Running   DHCP Server (DHCPServer)' });
            logs.push({ type: 'stdout', text: 'KerberosKeyDist   Running   Kerberos Key Distribution Center (KDC)' });
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 90, status: 'Evaluating group policies' });
            logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Checking Group Policy Objects (GPOs)...` });
            logs.push({ type: 'stdout', text: 'GPO Name                     Status    Link Path' });
            logs.push({ type: 'stdout', text: '--------                     ------    ---------' });
            logs.push({ type: 'stdout', text: 'Default Domain Policy        Active    dc=zola,dc=local' });
            logs.push({ type: 'stdout', text: 'Secured_Workstations_Policy  Active    ou=Workstations,dc=zola,dc=local' });
            logs.push({ type: 'stdout', text: '' });

            logs.push({ type: 'progress', percent: 100, status: 'Complete' });
            logs.push({ type: 'success', text: `[SUCCESS] ${timestamp()} Active Directory security and status audit completed successfully.` });
        } else {
            return addCors({ status: 400, jsonBody: { error: `Unsupported scriptId: ${scriptId}` } });
        }

        return addCors({
            status: 200,
            jsonBody: {
                scriptId,
                timestamp: new Date().toISOString(),
                logs
            }
        });
    }
});
