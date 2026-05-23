import { useState, useEffect } from "react";
import { Server, Activity, HardDrive, Cpu, Loader2, Play, Square, AlertCircle, RefreshCw } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface ProxmoxVM {
  vmid: number;
  name: string;
  status: string;
  uptime: number;
  cpu: number;
  maxcpu: number;
  maxmem: number;
}

interface ProxmoxNode {
  name: string;
  uptime: number;
  cpu: number;
  memory: { used: number; total: number };
  disk: { used: number; total: number };
}

interface ProxmoxData {
  timestamp: string;
  node: ProxmoxNode;
  vms: ProxmoxVM[];
}

export default function ProxmoxLabViewer() {
  const [data, setData] = useState<ProxmoxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProxmoxData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("/api/proxmox"));
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("Proxmox API credentials not configured in Azure.");
        }
        throw new Error(`Server responded with status ${res.status}`);
      }
      const jsonData = await res.json();
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }
      setData(jsonData);
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProxmoxData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="mt-8 border border-border rounded-xl bg-card overflow-hidden shadow-lg">
      <div className="flex items-center justify-between bg-muted/50 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground tracking-tight">Live Proxmox Datacenter</h3>
        </div>
        <button 
          onClick={fetchProxmoxData} 
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-6">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-4 text-primary" />
            <p className="text-sm font-medium">Connecting to secure tunnel...</p>
            <p className="text-xs mt-1">Fetching live hypervisor stats</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-lg flex flex-col items-center text-center">
            <AlertCircle size={32} className="text-destructive mb-3" />
            <h4 className="text-sm font-bold text-destructive mb-2">Connection Failed</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {error}
              <br /><br />
              If you are the administrator, ensure your Cloudflare Tunnel is active and your Azure Static Web Apps environment variables (PROXMOX_URL, PROXMOX_TOKEN_ID, PROXMOX_SECRET) are configured.
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Host Node Stats */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-primary" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Host Node: {data.node.name}</h4>
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  ONLINE
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">CPU Usage</p>
                  <p className="text-xl font-mono text-foreground">{(data.node.cpu * 100).toFixed(1)}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">RAM Usage</p>
                  <p className="text-xl font-mono text-foreground">
                    {((data.node.memory.used / data.node.memory.total) * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatBytes(data.node.memory.used)} / {formatBytes(data.node.memory.total)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Root Disk</p>
                  <p className="text-xl font-mono text-foreground">
                    {((data.node.disk.used / data.node.disk.total) * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatBytes(data.node.disk.used)} / {formatBytes(data.node.disk.total)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Uptime</p>
                  <p className="text-xl font-mono text-foreground">{formatUptime(data.node.uptime)}</p>
                </div>
              </div>
            </div>

            {/* Virtual Machines */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HardDrive size={16} className="text-primary" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Virtual Machines</h4>
              </div>
              
              <div className="space-y-3">
                {data.vms.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No VMs found on this node.</p>
                ) : (
                  data.vms.map(vm => (
                    <div key={vm.vmid} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/60 bg-card hover:border-primary/30 transition-colors gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${vm.status === 'running' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {vm.status === 'running' ? <Play size={16} /> : <Square size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{vm.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">VMID: {vm.vmid}</p>
                        </div>
                      </div>
                      
                      {vm.status === 'running' ? (
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">CPU</span>
                            <span className="font-mono text-foreground">{(vm.cpu * 100).toFixed(1)}% of {vm.maxcpu}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">RAM</span>
                            <span className="font-mono text-foreground">{formatBytes(vm.maxmem)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Uptime</span>
                            <span className="font-mono text-foreground">{formatUptime(vm.uptime)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          Stopped
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="pt-2 flex justify-between items-center border-t border-border/40">
              <p className="text-[10px] text-muted-foreground">
                Data securely fetched via Azure Serverless & Cloudflare Tunnel
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                Last updated: {new Date(data.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
