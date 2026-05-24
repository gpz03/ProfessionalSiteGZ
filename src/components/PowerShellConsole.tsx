import { useState, useEffect, useRef } from "react";
import { Terminal, Play, FileCode, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface LogLine {
  type: "stdout" | "warning" | "error" | "progress" | "verbose" | "success";
  text?: string;
  percent?: number;
  status?: string;
}

const SCRIPTS_DB = {
  diagnostics: {
    title: "Get-SystemDiagnostics.ps1",
    description: "Queries CPU, OS version, RAM allocation, and active network interfaces on the host server.",
    code: `Write-Progress -Activity "Initializing diagnostics" -PercentComplete 10
Write-Verbose "Loading Get-SystemDiagnostics.ps1..."
Write-Verbose "Gathering host kernel specifications..."

Get-ComputerInfo | Select-Object CsName, OsName, OsVersion, OsArchitecture, CsProcessors

Write-Progress -Activity "Auditing memory" -PercentComplete 50
Write-Verbose "Calculating RAM allocations..."

Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory

Write-Progress -Activity "Querying network interfaces" -PercentComplete 80
Write-Verbose "Scanning active network interfaces..."

Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress, InterfaceAlias

Write-Progress -Activity "Complete" -PercentComplete 100
Write-Output "[SUCCESS] Host system diagnostics audit completed successfully."`
  },
  storage: {
    title: "Audit-StorageQuota.ps1",
    description: "Audits NAS file capacities, displays files inside the guest sandbox, and checks the 1GB quota limit.",
    code: `Write-Progress -Activity "Accessing storage mount" -PercentComplete 10
Write-Verbose "Loading Audit-StorageQuota.ps1..."

$StorageDir = "C:\\nas_storage"
Write-Verbose "Target Directory: $StorageDir"
Write-Output "[INFO] Scanning filesystem directory structures..."
Write-Output "[INFO] Quota Limit: 1,073,741,824 Bytes (1.00 GB)"

Write-Progress -Activity "Scanning directory files" -PercentComplete 40
Write-Warning "Quota tracking is active. Guest users are limited to 1GB capacity."

$Files = Get-ChildItem -Path "$StorageDir\\public" -File
Write-Verbose "Counting files..."
Write-Output "Found $($Files.Count) active files in guest sandbox partition."
$Files | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

Write-Progress -Activity "Computing quota thresholds" -PercentComplete 80
$TotalSize = ($Files | Measure-Object -Property Length -Sum).Sum
Write-Output "[CAPACITY ANALYSIS]"
Write-Output "Total Used  : $($TotalSize / 1MB) MB ($(($TotalSize / 1GB)*100)% of guest quota)"
Write-Output "Remaining   : $((1GB - $TotalSize) / 1MB) MB"

Write-Progress -Activity "Complete" -PercentComplete 100
Write-Output "[SUCCESS] File quota integrity audit completed. No orphaned handles found."`
  },
  ad_audit: {
    title: "Audit-ActiveDirectory.ps1",
    description: "Queries active AD domain controller accounts, verifies core services status, and lists GPOs.",
    code: `Write-Progress -Activity "Contacting domain controller" -PercentComplete 10
Write-Verbose "Loading Audit-ActiveDirectory.ps1..."
Write-Output "[INFO] Initializing Active Directory Domain Services connection..."

Write-Progress -Activity "Reading directory database" -PercentComplete 45
Write-Warning "Domain Controller 'DC-ZOLA-01' is running in hybrid Azure AD mode."
Write-Verbose "Auditing Active Directory Users database..."

Get-ADUser -Filter * -Properties Description | Select-Object Name, Enabled, Description

Write-Progress -Activity "Checking core service logs" -PercentComplete 75
Write-Verbose "Auditing running Domain Services..."

Get-Service -Name "NTDS", "DNS", "DHCPServer", "Kdc" | Select-Object Name, Status, DisplayName

Write-Progress -Activity "Evaluating group policies" -PercentComplete 90
Write-Verbose "Checking Group Policy Objects (GPOs)..."

Get-GPO -All | Select-Object DisplayName, Status, LinkPath

Write-Progress -Activity "Complete" -PercentComplete 100
Write-Output "[SUCCESS] Active Directory security and status audit completed successfully."`
  }
};

type ScriptKey = keyof typeof SCRIPTS_DB;

export default function PowerShellConsole() {
  const [selectedScript, setSelectedScript] = useState<ScriptKey>("diagnostics");
  const [terminalLines, setTerminalLines] = useState<LogLine[]>([
    { type: "stdout", text: "Windows PowerShell" },
    { type: "stdout", text: "Copyright (C) Microsoft Corporation. All rights reserved." },
    { type: "stdout", text: "" },
    { type: "stdout", text: "PS C:\\Users\\Administrator> # Select a script from the panel and click 'Run Script' to execute." }
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ percent: number; status: string } | null>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const executeScript = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress({ percent: 5, status: "Establishing secure API tunnel..." });
    
    // Clear terminal or print start message
    setTerminalLines(prev => [
      ...prev,
      { type: "stdout", text: "" },
      { type: "stdout", text: `PS C:\\Users\\Administrator> .\\${SCRIPTS_DB[selectedScript].title}` }
    ]);

    try {
      const response = await fetch(getApiUrl("/api/powershell"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: selectedScript })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rawLogs: LogLine[] = data.logs || [];
      
      // Simulate real-time streaming output using sequential timeouts
      let currentDelay = 0;
      for (let i = 0; i < rawLogs.length; i++) {
        const log = rawLogs[i];
        
        // Progress updates happen instantly on progress bar, and don't take terminal line space directly
        if (log.type === "progress") {
          setTimeout(() => {
            setProgress({
              percent: log.percent || 100,
              status: log.status || "Executing..."
            });
          }, currentDelay);
          // Small delay for progress steps
          currentDelay += 300;
          continue;
        }

        // Add line to terminal with a delay
        setTimeout(() => {
          setTerminalLines(prev => [...prev, log]);
        }, currentDelay);

        // Adjust delay based on line length or type
        currentDelay += log.type === "verbose" ? 250 : 150;
      }

      // Finish execution
      setTimeout(() => {
        setIsRunning(false);
        setProgress(null);
        setTerminalLines(prev => [
          ...prev,
          { type: "stdout", text: "" },
          { type: "stdout", text: "PS C:\\Users\\Administrator>" }
        ]);
      }, currentDelay + 200);

    } catch (err: any) {
      console.error(err);
      setIsRunning(false);
      setProgress(null);
      setTerminalLines(prev => [
        ...prev,
        { type: "error", text: `Error connecting to execution host: ${err.message || err}` },
        { type: "stdout", text: "PS C:\\Users\\Administrator>" }
      ]);
    }
  };

  const clearConsole = () => {
    setTerminalLines([
      { type: "stdout", text: "Windows PowerShell" },
      { type: "stdout", text: "Copyright (C) Microsoft Corporation. All rights reserved." },
      { type: "stdout", text: "" },
      { type: "stdout", text: "PS C:\\Users\\Administrator>" }
    ]);
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 items-stretch">
      {/* Script Panel / Code Viewer */}
      <div className="xl:w-[42%] flex flex-col border border-border/50 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
        {/* Header Tab */}
        <div className="border-b border-border/40 bg-muted/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-primary" />
            <span className="font-mono text-xs font-bold text-foreground">Scripts Repository</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
            Read-Only
          </span>
        </div>

        {/* Script Selection Cards */}
        <div className="p-4 flex flex-col gap-2 border-b border-border/30 bg-muted/10">
          {(Object.keys(SCRIPTS_DB) as ScriptKey[]).map((key) => {
            const isSelected = selectedScript === key;
            return (
              <button
                key={key}
                disabled={isRunning}
                onClick={() => setSelectedScript(key)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                  isSelected
                    ? "bg-primary/10 border-primary/40 shadow-sm"
                    : "bg-transparent border-border/40 hover:border-border-hover/80 hover:bg-muted/10 disabled:opacity-50"
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Terminal size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-mono font-bold text-foreground truncate">
                    {SCRIPTS_DB[key].title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {SCRIPTS_DB[key].description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Code Viewer */}
        <div className="flex-1 flex flex-col bg-muted/5">
          <div className="bg-muted/10 px-4 py-2 border-b border-border/20 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">Preview: {SCRIPTS_DB[selectedScript].title}</span>
          </div>
          <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-foreground/80 overflow-y-auto max-h-[250px] xl:max-h-none xl:h-[220px]">
            <pre className="whitespace-pre-wrap select-all">
              {SCRIPTS_DB[selectedScript].code.split("\n").map((line, idx) => {
                let colorClass = "text-foreground/80";
                if (line.startsWith("Write-Progress")) colorClass = "text-cyan-400";
                else if (line.startsWith("Write-Verbose")) colorClass = "text-slate-400";
                else if (line.startsWith("Write-Warning")) colorClass = "text-yellow-400/90";
                else if (line.startsWith("Write-Output") || line.startsWith('Write-Host')) colorClass = "text-emerald-400";
                else if (line.startsWith("#")) colorClass = "text-muted-foreground italic";
                return (
                  <div key={idx} className={`${colorClass} hover:bg-muted/20 px-1 rounded transition-colors`}>
                    <span className="text-muted-foreground/40 select-none mr-3 inline-block w-4 text-right">
                      {idx + 1}
                    </span>
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>

      {/* Terminal Widget */}
      <div className="flex-1 flex flex-col border border-border/50 rounded-xl overflow-hidden shadow-2xl bg-[#012456] text-white">
        {/* Terminal Header */}
        <div className="bg-[#001735] px-4 py-2.5 flex items-center justify-between border-b border-[#012456]/40 select-none">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-primary-foreground/70" />
            <span className="font-mono text-xs font-bold text-slate-300">Administrator: Windows PowerShell</span>
          </div>
          {/* Mock Windows Controls */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 hover:bg-slate-500 transition-colors" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 hover:bg-slate-500 transition-colors" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors" />
          </div>
        </div>

        {/* Powershell Progress Bar overlay */}
        {progress && (
          <div className="bg-[#00204d] px-4 py-2 border-b border-[#001735] font-mono text-xs select-none">
            <div className="text-[#00ffff] font-bold">
              Configuring Lab: {progress.status}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-3 bg-[#01142f] rounded border border-[#0080ff] overflow-hidden p-[1px]">
                <div
                  className="h-full bg-[#00ffff] transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="text-[#00ffff] font-bold w-8 text-right">{progress.percent}%</span>
            </div>
          </div>
        )}

        {/* Console Screen */}
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto h-[320px] xl:h-[400px] leading-relaxed select-text space-y-1">
          {terminalLines.map((line, idx) => {
            let colorClass = "text-slate-100";
            let prefix = "";

            if (line.type === "warning") {
              colorClass = "text-[#eedc82] font-semibold";
            } else if (line.type === "error") {
              colorClass = "text-[#ff6347] font-semibold";
            } else if (line.type === "verbose") {
              colorClass = "text-[#00ffff]/80";
            } else if (line.type === "success") {
              colorClass = "text-[#00ff00] font-bold";
            }

            return (
              <div key={idx} className={colorClass}>
                {line.text}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>

        {/* Console Footer / Trigger Button */}
        <div className="bg-[#001735] px-4 py-3 flex items-center justify-between border-t border-[#012456]/40">
          <button
            disabled={isRunning}
            onClick={clearConsole}
            className="px-3 py-1.5 rounded border border-slate-700 hover:border-slate-500 bg-[#012456] hover:bg-[#002e6e] text-slate-300 hover:text-white transition-all text-[11px] font-semibold font-mono disabled:opacity-50"
          >
            Clear Screen
          </button>
          
          <button
            disabled={isRunning}
            onClick={executeScript}
            className="flex items-center gap-1.5 px-5 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all text-xs font-bold shadow-md disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                Run Script
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
