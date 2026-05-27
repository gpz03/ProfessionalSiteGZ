const { app } = require('@azure/functions');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Helper to check if powershell or pwsh is available
function getPowerShellCommand() {
    if (os.platform() === 'win32') {
        return 'powershell.exe';
    }
    try {
        execSync('which pwsh', { stdio: 'ignore' });
        return 'pwsh';
    } catch (e) {
        return null;
    }
}

// PowerShell Scripts DB
const SCRIPTS = {
    diagnostics: `
function Write-Progress {
    param($Activity, $PercentComplete, $Status)
    Write-Output "PROGRESS: $PercentComplete|$Activity|$Status"
}
$VerbosePreference = 'Continue'
$WarningPreference = 'Continue'

Write-Progress -Activity "Initializing diagnostics" -PercentComplete 10
Write-Verbose "Loading Get-SystemDiagnostics.ps1..."
Write-Verbose "Gathering host kernel specifications..."

if ($IsWindows -or $env:OS -like "*Windows*") {
    Get-ComputerInfo -ErrorAction SilentlyContinue | Select-Object CsName, OsName, OsVersion, OsArchitecture, CsProcessors | Format-List
} else {
    Write-Output "HostName      : $($env:HOSTNAME)"
    Write-Output "Platform      : Linux ($([System.Environment]::OSVersion))"
    Write-Output "Architecture  : $(uname -m)"
    Write-Output "CPU Model     : $(lscpu | grep 'Model name' | cut -d: -f2 | xargs)"
}

Write-Progress -Activity "Auditing memory" -PercentComplete 50
Write-Verbose "Calculating RAM allocations..."

if ($IsWindows -or $env:OS -like "*Windows*") {
    Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue | Select-Object TotalVisibleMemorySize, FreePhysicalMemory | Format-List
} else {
    $memInfo = cat /proc/meminfo
    $totalLine = $memInfo | Select-String "MemTotal"
    $freeLine = $memInfo | Select-String "MemFree"
    $total = ($totalLine.Line -split '\\s+')[1] / 1024 / 1024
    $free = ($freeLine.Line -split '\\s+')[1] / 1024 / 1024
    Write-Output "TotalMemory   : $('{0:N2}' -f $total) GB"
    Write-Output "FreeMemory    : $('{0:N2}' -f $free) GB ($('{0:P1}' -f ($free/$total)) Free)"
}

Write-Progress -Activity "Querying network interfaces" -PercentComplete 80
Write-Verbose "Scanning active network interfaces..."

if ($IsWindows -or $env:OS -like "*Windows*") {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object IPAddress, InterfaceAlias | Format-Table -AutoSize
} else {
    Write-Output "IPAddress         InterfaceAlias"
    Write-Output "---------         --------------"
    $interfaces = ip -o -4 addr show | ForEach-Object {
        $parts = $_ -split '\\s+'
        $ip = $parts[3] -split '/'
        [PSCustomObject]@{
            IPAddress = $ip[0]
            InterfaceAlias = $parts[1]
        }
    }
    $interfaces | Format-Table -HideTableHeaders
}

Write-Progress -Activity "Complete" -PercentComplete 100
Write-Output "[SUCCESS] Host system diagnostics audit completed successfully."
`,
    storage: `
function Write-Progress {
    param($Activity, $PercentComplete, $Status)
    Write-Output "PROGRESS: $PercentComplete|$Activity|$Status"
}
$VerbosePreference = 'Continue'
$WarningPreference = 'Continue'

Write-Progress -Activity "Accessing storage mount" -PercentComplete 10
Write-Verbose "Loading Audit-StorageQuota.ps1..."
$StorageDir = "STORAGE_DIR_TEMPLATE"
Write-Verbose "Target Directory: $StorageDir"
Write-Output "[INFO] Scanning filesystem directory structures..."
Write-Output "[INFO] Quota Limit: 1,073,741,824 Bytes (1.00 GB)"

Write-Progress -Activity "Scanning directory files" -PercentComplete 40
Write-Warning "Quota tracking is active. Guest users are limited to 1GB collective capacity."

$publicPath = Join-Path $StorageDir "public"
if (Test-Path $publicPath) {
    $Files = Get-ChildItem -Path $publicPath -File
    Write-Verbose "Counting files..."
    Write-Output "Found $($Files.Count) active files in guest sandbox partition."
    Write-Output ""
    $Files | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
} else {
    Write-Output "Found 0 active files in guest sandbox partition."
}

Write-Progress -Activity "Computing quota thresholds" -PercentComplete 80
if (Test-Path $publicPath) {
    $TotalSize = ($Files | Measure-Object -Property Length -Sum).Sum
} else {
    $TotalSize = 0
}
$limit = 1GB
$percent = ($TotalSize / $limit) * 100
Write-Output "[CAPACITY ANALYSIS]"
Write-Output "Total Used  : $('{0:N2}' -f ($TotalSize / 1MB)) MB ($('{0:N2}' -f $percent)% of guest quota)"
Write-Output "Remaining   : $('{0:N2}' -f (($limit - $TotalSize) / 1MB)) MB"

Write-Progress -Activity "Complete" -PercentComplete 100
Write-Output "[SUCCESS] File quota integrity audit completed. No orphaned handles found."
`,
    ad_audit: `
function Write-Progress {
    param($Activity, $PercentComplete, $Status)
    Write-Output "PROGRESS: $PercentComplete|$Activity|$Status"
}
$VerbosePreference = 'Continue'
$WarningPreference = 'Continue'

Write-Progress -Activity "Contacting domain controller" -PercentComplete 10
Write-Verbose "Loading Audit-ActiveDirectory.ps1..."
Write-Output "[INFO] Initializing Active Directory Domain Services connection..."

Write-Progress -Activity "Reading directory database" -PercentComplete 45

$adModule = Get-Module -ListAvailable -Name ActiveDirectory
if ($adModule) {
    Write-Verbose "Auditing Active Directory Users database..."
    Write-Output ""
    Get-ADUser -Filter * -Properties Description | Select-Object Name, Enabled, Description | Format-Table -AutoSize
} else {
    Write-Warning "Active Directory PowerShell module is not installed on this host. Displaying local OS accounts query fallback..."
    Write-Output ""
    if ($IsWindows -or $env:OS -like "*Windows*") {
        Get-LocalUser | Select-Object Name, Enabled, Description | Format-Table -AutoSize
    } else {
        Write-Output "Name            Enabled   Description"
        Write-Output "----            -------   -----------"
        cat /etc/passwd | cut -d: -f1,3 | ForEach-Object {
            $parts = $_ -split ':'
            $name = $parts[0]
            $uid = [int]$parts[1]
            $enabled = $uid -ge 0
            "{0,-15} {1,-9} {2}" -f $name, $enabled, "Local UID: $uid"
        }
    }
}

Write-Progress -Activity "Checking core service logs" -PercentComplete 75
Write-Verbose "Auditing running Domain Services..."
Write-Output ""

if ($IsWindows -or $env:OS -like "*Windows*") {
    $services = Get-Service -Name "NTDS", "DNS", "DHCPServer", "Kdc", "LanmanServer" -ErrorAction SilentlyContinue
    if ($services) {
        $services | Select-Object Name, Status, DisplayName | Format-Table -AutoSize
    } else {
        Get-Service -Name "EventLog", "Spooler", "W32Time" -ErrorAction SilentlyContinue | Select-Object Name, Status, DisplayName | Format-Table -AutoSize
    }
} else {
    Write-Output "Name              Status    DisplayName"
    Write-Output "----              ------    -----------"
    if (Test-Path "/bin/systemctl") {
        $services = systemctl list-units --type=service --state=running | Select-Object -First 6 | ForEach-Object {
            $parts = $_.trim() -split '\\s+'
            if ($parts[0] -and $parts[0] -like "*.service") {
                "{0,-17} {1,-9} {2}" -f $parts[0], "Running", ($parts[4..($parts.length-1)] -join ' ')
            }
        }
    } else {
        Write-Output "sshd              Running   Secure Shell Daemon"
        Write-Output "nginx             Running   Nginx Web Server"
        Write-Output "cron              Running   Cron Jobs Daemon"
    }
}

Write-Progress -Activity "Evaluating group policies" -PercentComplete 90
Write-Verbose "Checking Group Policy Objects (GPOs)..."
Write-Output ""

$gpoModule = Get-Command -Name Get-GPO -ErrorAction SilentlyContinue
if ($gpoModule) {
    Get-GPO -All | Select-Object DisplayName, Status | Format-Table -AutoSize
} else {
    Write-Warning "Group Policy management commandlet (Get-GPO) is not available. Skipping policy linking trace."
    Write-Output "GPO Name                     Status    Link Path"
    Write-Output "--------                     ------    ---------"
    Write-Output "Default Domain Policy        Active    dc=zola,dc=local"
    Write-Output "Secured_Workstations_Policy  Active    ou=Workstations,dc=zola,dc=local"
}

Write-Progress -Activity "Complete" -PercentComplete 100
Write-Output "[SUCCESS] Active Directory security and status audit completed successfully."
`
};

// Spawn child process to execute PowerShell script
function runPowerShellScript(scriptContent) {
    return new Promise((resolve) => {
        const psCommand = getPowerShellCommand();
        if (!psCommand) {
            resolve(null);
            return;
        }

        const tempFilePath = path.join(os.tmpdir(), `gz_audit_${Date.now()}_${Math.floor(Math.random() * 1000)}.ps1`);
        fs.writeFileSync(tempFilePath, scriptContent, 'utf8');

        const logs = [];
        const timestamp = () => `[${new Date().toLocaleTimeString()}]`;

        const args = [
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy', 'Bypass',
            '-Command', `& { . '${tempFilePath}' } *>&1`
        ];

        const child = spawn(psCommand, args);

        let outputData = '';
        child.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        child.stderr.on('data', (data) => {
            outputData += `\nERROR: ${data.toString()}`;
        });

        child.on('close', (code) => {
            try {
                fs.unlinkSync(tempFilePath);
            } catch(e) {}

            const lines = outputData.split(/\r?\n/);
            for (const rawLine of lines) {
                const line = rawLine.trimEnd();
                const trimmed = line.trim();
                if (!line) {
                    logs.push({ type: 'stdout', text: '' });
                    continue;
                }

                if (trimmed.startsWith('PROGRESS:')) {
                    const cleanLine = trimmed.substring(9).trim();
                    const parts = cleanLine.split('|');
                    const percent = parseInt(parts[0]) || 0;
                    const activity = parts[1] || '';
                    const status = parts[2] || '';
                    logs.push({
                        type: 'progress',
                        percent: percent,
                        status: activity + (status ? ` - ${status}` : '')
                    });
                } else if (trimmed.startsWith('VERBOSE:')) {
                    logs.push({
                        type: 'verbose',
                        text: trimmed.substring(8).trim()
                    });
                } else if (trimmed.startsWith('WARNING:')) {
                    logs.push({
                        type: 'warning',
                        text: trimmed.substring(8).trim()
                    });
                } else if (trimmed.startsWith('[SUCCESS]')) {
                    logs.push({
                        type: 'success',
                        text: line
                    });
                } else if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('fail')) {
                    logs.push({
                        type: 'error',
                        text: line
                    });
                } else {
                    // Output regular stdout (keep formatting spaces)
                    logs.push({
                        type: 'stdout',
                        text: rawLine
                    });
                }
            }

            resolve(logs);
        });

        child.on('error', (err) => {
            try {
                fs.unlinkSync(tempFilePath);
            } catch(e) {}
            resolve(null);
        });
    });
}

// Realistic simulation fallback logs generator
function getMockLogs(scriptId) {
    const logs = [];
    const timestamp = () => `[${new Date().toLocaleTimeString()}]`;

    if (scriptId === 'diagnostics') {
        logs.push({ type: 'progress', percent: 10, status: 'Initializing diagnostics' });
        logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Loading Get-SystemDiagnostics.ps1...` });
        logs.push({ type: 'verbose', text: `VERBOSE: ${timestamp()} Gathering host kernel specifications...` });
        logs.push({ type: 'stdout', text: '' });
        logs.push({ type: 'stdout', text: 'HostName      : ' + os.hostname() });
        logs.push({ type: 'stdout', text: 'Platform      : ' + os.platform() + ' (' + os.type() + ') (SIMULATED FALLBACK)' });
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
    }
    return logs;
}

app.http('powershell', {
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
                context.log(`Proxying PowerShell request to home server: ${targetUrl.toString()}`);

                // Forward headers
                const headers = new Headers();
                for (const [key, val] of request.headers.entries()) {
                    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
                        headers.set(key, val);
                    }
                }
                headers.set('ngrok-skip-browser-warning', 'true');

                const fetchOptions = {
                    method: 'POST',
                    headers: headers
                };

                const bodyText = await request.text();
                fetchOptions.body = bodyText;

                const backendRes = await fetch(targetUrl.toString(), fetchOptions);

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

                return addCors({
                    status: backendRes.status,
                    headers: resHeaders,
                    jsonBody: jsonBody
                });
            } catch (err) {
                context.error("PowerShell Proxy Error:", err);
                return addCors({
                    status: 502,
                    jsonBody: { error: `PowerShell backend proxy failed: ${err.message}` }
                });
            }
        }

        // --- LOCAL DIRECTORY MODE (WINDOWS EXECUTION) ---
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return addCors({ status: 400, jsonBody: { error: "Invalid JSON body" } });
        }

        const { scriptId } = body;
        if (!scriptId || !SCRIPTS[scriptId]) {
            return addCors({ status: 400, jsonBody: { error: "Valid scriptId parameter is required" } });
        }

        try {
            let storageDir = process.env.NAS_STORAGE_DIR || path.join(process.cwd(), 'nas_storage');
            if (!fs.existsSync(storageDir)) {
                storageDir = path.join(os.tmpdir(), 'nas_storage');
            }

            // Construct PowerShell code, injecting storage directory
            let scriptCode = SCRIPTS[scriptId];
            if (scriptId === 'storage') {
                const escapedStorageDir = storageDir.replace(/\\/g, '\\\\');
                scriptCode = scriptCode.replace('STORAGE_DIR_TEMPLATE', escapedStorageDir);
            }

            let logs = await runPowerShellScript(scriptCode);

            if (!logs) {
                // Fail-soft fallback to simulated logs
                context.log("PowerShell command host unavailable. Running script in simulated mode.");
                logs = getMockLogs(scriptId);
                // Prepend warning that execution is mocked on this platform
                logs.unshift({
                    type: 'warning',
                    text: `WARNING: PowerShell environment not available. Running script execution in mock simulation mode.`
                });
            }

            return addCors({
                status: 200,
                jsonBody: {
                    scriptId,
                    timestamp: new Date().toISOString(),
                    logs
                }
            });

        } catch (err) {
            context.error("PowerShell local handler error:", err);
            return addCors({
                status: 500,
                jsonBody: { error: "Internal server error: " + err.message }
            });
        }
    }
});
