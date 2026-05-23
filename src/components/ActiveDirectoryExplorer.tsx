import { useState, useEffect } from "react";
import { Server, Users, Cpu, Layers, Activity, Radio, RefreshCw, Loader2, AlertCircle, Search, Terminal } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SystemInfo {
  hostname: string;
  platform: string;
  type: string;
  release: string;
  uptime: number;
  arch: string;
  cpuModel: string;
  totalMemory: number;
  freeMemory: number;
}

interface AdUser {
  Name: string;
  Enabled: boolean;
  Description: string;
}

interface AdService {
  Name: string;
  DisplayName: string;
  Status: string;
}

interface NetworkInfo {
  IPAddress: string;
  InterfaceAlias: string;
}

interface AdData {
  system: SystemInfo;
  users: AdUser[];
  services: AdService[];
  network: NetworkInfo[];
}

export default function ActiveDirectoryExplorer() {
  const { toast } = useToast();
  const [data, setData] = useState<AdData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"system" | "users" | "services" | "network">("system");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("/api/ad"));
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const jsonData = await res.json();
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }
      setData(jsonData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch directory statistics.");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const filteredUsers = data?.users.filter(user => 
    user.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.Description && user.Description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const filteredServices = data?.services.filter(service => 
    service.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.DisplayName && service.DisplayName.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="mt-8 border border-border rounded-xl bg-card overflow-hidden shadow-lg">
      <div className="flex items-center justify-between bg-muted/50 p-4 border-b border-border flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground tracking-tight">Live OS & Active Directory Query Utility</h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase">
            Live Host Connection
          </span>
        </div>
        <button 
          onClick={fetchSystemData} 
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 border border-border/40"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-6">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-4 text-primary" />
            <p className="text-sm font-medium">Executing system query...</p>
            <p className="text-xs mt-1">Retrieving user accounts and running services from host OS</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-lg flex flex-col items-center text-center">
            <AlertCircle size={32} className="text-destructive mb-3" />
            <h4 className="text-sm font-bold text-destructive mb-2">Query Failed</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {error}
              <br /><br />
              Ensure the Azure Function backend is running and has access to execute local shell queries (PowerShell on Windows, cat/ps on Linux).
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Tabs */}
            <div className="flex border-b border-border/60 overflow-x-auto gap-2">
              <button
                onClick={() => { setActiveTab("system"); setSearchQuery(""); }}
                className={`pb-2.5 px-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                  activeTab === "system" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5"><Server size={14} /> System Info</span>
              </button>
              <button
                onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
                className={`pb-2.5 px-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                  activeTab === "users" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5"><Users size={14} /> Local Users</span>
              </button>
              <button
                onClick={() => { setActiveTab("services"); setSearchQuery(""); }}
                className={`pb-2.5 px-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                  activeTab === "services" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5"><Layers size={14} /> Active Services</span>
              </button>
              <button
                onClick={() => { setActiveTab("network"); setSearchQuery(""); }}
                className={`pb-2.5 px-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                  activeTab === "network" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5"><Radio size={14} /> Network IPs</span>
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === "system" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border/60 bg-muted/10 space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1 flex items-center gap-1">
                    <Activity size={12} className="text-primary" /> OS Environment
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <span className="text-muted-foreground">Hostname:</span>
                    <span className="text-foreground text-right truncate">{data.system.hostname}</span>
                    
                    <span className="text-muted-foreground">OS Platform:</span>
                    <span className="text-foreground text-right capitalize">{data.system.platform} ({data.system.type})</span>
                    
                    <span className="text-muted-foreground">Release version:</span>
                    <span className="text-foreground text-right truncate">{data.system.release}</span>
                    
                    <span className="text-muted-foreground">Server Uptime:</span>
                    <span className="text-foreground text-right">{formatUptime(data.system.uptime)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border/60 bg-muted/10 space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1 flex items-center gap-1">
                    <Cpu size={12} className="text-primary" /> Hardware & Resource Monitor
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <span className="text-muted-foreground">Processor Architecture:</span>
                    <span className="text-foreground text-right uppercase">{data.system.arch}</span>

                    <span className="text-muted-foreground">CPU Model:</span>
                    <span className="text-foreground text-right truncate text-[10px]" title={data.system.cpuModel}>
                      {data.system.cpuModel}
                    </span>

                    <span className="text-muted-foreground">Physical Memory:</span>
                    <span className="text-foreground text-right">{formatBytes(data.system.totalMemory)}</span>

                    <span className="text-muted-foreground">Memory Free:</span>
                    <span className="text-foreground text-right text-green-500">
                      {formatBytes(data.system.freeMemory)} ({((data.system.freeMemory / data.system.totalMemory) * 100).toFixed(1)}% Free)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter user accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs bg-muted/20 placeholder:text-muted-foreground text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="border border-border/60 rounded-lg overflow-hidden bg-card">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                        <th className="p-3">User Name</th>
                        <th className="p-3 w-32">Status</th>
                        <th className="p-3">Description / System Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground italic">No matching users found.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, i) => (
                          <tr key={i} className="hover:bg-muted/5 transition-colors">
                            <td className="p-3 font-semibold text-foreground">{user.Name}</td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                                user.Enabled 
                                  ? "bg-green-500/10 border-green-500/20 text-green-500" 
                                  : "bg-destructive/10 border-destructive/20 text-destructive"
                              }`}>
                                {user.Enabled ? "ENABLED" : "DISABLED"}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground max-w-xs sm:max-w-md truncate" title={user.Description}>
                              {user.Description || "Local Account"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "services" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter active running services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs bg-muted/20 placeholder:text-muted-foreground text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="border border-border/60 rounded-lg overflow-hidden bg-card">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                        <th className="p-3">Service Name</th>
                        <th className="p-3">Display Name / Process ID</th>
                        <th className="p-3 w-32">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredServices.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground italic">No matching running services found.</td>
                        </tr>
                      ) : (
                        filteredServices.map((service, i) => (
                          <tr key={i} className="hover:bg-muted/5 transition-colors">
                            <td className="p-3 font-semibold text-foreground">{service.Name}</td>
                            <td className="p-3 text-muted-foreground max-w-xs sm:max-w-md truncate" title={service.DisplayName}>
                              {service.DisplayName || "System Process"}
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 border border-green-500/20 text-green-500">
                                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                {service.Status || "Running"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "network" && (
              <div className="border border-border/60 rounded-lg overflow-hidden bg-card">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                      <th className="p-3">IP Address (IPv4)</th>
                      <th className="p-3">Network Interface Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.network.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-muted-foreground italic">No external interfaces detected.</td>
                      </tr>
                    ) : (
                      data.network.map((net, i) => (
                        <tr key={i} className="hover:bg-muted/5 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{net.IPAddress}</td>
                          <td className="p-3 text-muted-foreground">{net.InterfaceAlias}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center border-t border-border/40 text-[10px] text-muted-foreground">
              <span>Data fetched live from operating system using child_process audits</span>
              <span>Architecture: {data.system.arch} | Platform: {data.system.platform}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
