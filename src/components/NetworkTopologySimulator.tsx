import { useState, useEffect, useRef } from "react";
import { Network, Play, Shield, ShieldAlert, ShieldCheck, Terminal, ToggleLeft, ToggleRight, Info } from "lucide-react";

interface Node {
  id: string;
  name: string;
  ip: string;
  x: number;
  y: number;
  type: "internet" | "firewall" | "switch" | "server" | "workstation";
  description: string;
}

interface Connection {
  from: string;
  to: string;
}

const NODES: Node[] = [
  { id: "internet", name: "Internet Gateway", ip: "8.8.8.8", x: 300, y: 35, type: "internet", description: "Public WAN gateway and external DNS hosts." },
  { id: "firewall", name: "Core Firewall", ip: "192.168.1.1", x: 300, y: 105, type: "firewall", description: "Handles NAT, port filtering, and firewall rules." },
  { id: "switch", name: "Core Switch", ip: "192.168.1.2", x: 300, y: 175, type: "switch", description: "Layer 2 Managed Switch routing VLAN 10 and VLAN 20." },
  { id: "dc", name: "Domain Controller (DC-01)", ip: "192.168.1.10", x: 130, y: 140, type: "server", description: "Active Directory Domain Controller (AD DS), DNS, and GPOs." },
  { id: "nas", name: "Personal NAS", ip: "192.168.1.50", x: 130, y: 210, type: "server", description: "Network Attached Storage holding backups and guest uploads." },
  { id: "ws1", name: "Workstation 1 (VLAN 10)", ip: "192.168.10.15", x: 470, y: 140, type: "workstation", description: "Administrative client host on VLAN 10." },
  { id: "ws2", name: "Workstation 2 (VLAN 20)", ip: "192.168.20.22", x: 470, y: 210, type: "workstation", description: "Staff client host on VLAN 20." },
];

const CONNECTIONS: Connection[] = [
  { from: "internet", to: "firewall" },
  { from: "firewall", to: "switch" },
  { from: "switch", to: "dc" },
  { from: "switch", to: "nas" },
  { from: "switch", to: "ws1" },
  { from: "switch", to: "ws2" },
];

export default function NetworkTopologySimulator() {
  const [source, setSource] = useState<string>("ws1");
  const [destination, setDestination] = useState<string>("internet");
  const [diagnosticTool, setDiagnosticTool] = useState<"ping" | "traceroute" | "http" | "portscan">("ping");
  
  // Security Sandbox Toggles
  const [icmpBlock, setIcmpBlock] = useState<boolean>(false);
  const [vlanIsolate, setVlanIsolate] = useState<boolean>(false);
  const [webBlock, setWebBlock] = useState<boolean>(false);
  const [ipsActive, setIpsActive] = useState<boolean>(true);

  // Animation States
  const [animationPath, setAnimationPath] = useState<string>("");
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [packetColor, setPacketColor] = useState<string>("#00ffcc");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "info" | "warning" | "success" | "danger"; text: string } | null>(null);

  // Terminal States
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Network Topology & Security Diagnostics Console v1.0",
    "Select a source, destination, tool, and configure firewall rules above.",
    "Click 'Run Diagnostic' to analyze packets routing through the topology.",
    ""
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Compute the hop path between nodes
  const getRoutePath = (srcId: string, destId: string) => {
    // Basic route mapping for this specific layout
    const pathNodes: Node[] = [];
    const srcNode = NODES.find(n => n.id === srcId)!;
    const destNode = NODES.find(n => n.id === destId)!;

    pathNodes.push(srcNode);

    // If source is a workstation or internal server and dest is another internal server
    if (srcId !== "internet" && destId !== "internet") {
      // Internal communication goes via the Switch
      const switchNode = NODES.find(n => n.id === "switch")!;
      pathNodes.push(switchNode);
      pathNodes.push(destNode);
    } else {
      // Traffic to/from Internet must pass through Switch -> Firewall -> Internet
      const switchNode = NODES.find(n => n.id === "switch")!;
      const firewallNode = NODES.find(n => n.id === "firewall")!;
      if (srcId === "internet") {
        pathNodes.push(firewallNode);
        pathNodes.push(switchNode);
      } else {
        pathNodes.push(switchNode);
        pathNodes.push(firewallNode);
      }
      pathNodes.push(destNode);
    }

    return pathNodes;
  };

  const runDiagnostic = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAlertMessage(null);

    const hops = getRoutePath(source, destination);
    
    // Evaluate rules and decide where the path stops/fails
    let isBlocked = false;
    let blockReason = "";
    let blockIndex = hops.length; // Defaults to completing the path

    // 1. VLAN Isolation Rule (Blocks Workstation 2 from internal servers)
    if (vlanIsolate) {
      if (
        (source === "ws2" && (destination === "dc" || destination === "nas")) ||
        (destination === "ws2" && (source === "dc" || source === "nas"))
      ) {
        isBlocked = true;
        blockIndex = 1; // Blocked at Core Switch
        blockReason = "VLAN Isolation Active: VLAN 20 is isolated from VLAN 10 management servers.";
      }
    }

    // 2. ICMP Block Rule (Blocks pings to/from Internet or external zones)
    if (icmpBlock && diagnosticTool === "ping") {
      if (source === "internet" || destination === "internet") {
        isBlocked = true;
        blockIndex = hops.findIndex(n => n.id === "firewall");
        blockReason = "Firewall Rule Drop: ICMP Echo Requests (Ping) are dropped by Core Firewall policy.";
      }
    }

    // 3. Port Filtering Web Block (Blocks HTTP Port 80/443)
    if (webBlock && diagnosticTool === "http") {
      if (source === "internet" || destination === "internet") {
        isBlocked = true;
        blockIndex = hops.findIndex(n => n.id === "firewall");
        blockReason = "Firewall Access Control: HTTP/HTTPS traffic (Port 80/443) is blocked by active Web ACL.";
      }
    }

    // 4. IPS Rule (Blocks external Port Scan attacks)
    if (diagnosticTool === "portscan" && source === "internet") {
      if (ipsActive) {
        isBlocked = true;
        blockIndex = hops.findIndex(n => n.id === "firewall");
        blockReason = "Intrusion Prevention Alert: TCP SYN Port Scan detected from public IP. Connection rejected.";
      } else {
        blockReason = "Security Concern: Public port scan completed. Unprotected ports were queried on core assets.";
      }
    }

    // Build the SVG path string
    const activeHops = hops.slice(0, blockIndex + 1);
    const pathD = activeHops.map((node, idx) => `${idx === 0 ? "M" : "L"} ${node.x},${node.y}`).join(" ");
    
    setAnimationPath(pathD);
    setPacketColor(isBlocked ? "#ff4d4d" : "#00ffcc");
    setAnimationKey(prev => prev + 1);

    // Terminal Logging Logic
    const srcNode = NODES.find(n => n.id === source)!;
    const destNode = NODES.find(n => n.id === destination)!;
    const timestamp = new Date().toLocaleTimeString();

    setTerminalLogs(prev => [
      ...prev,
      `[${timestamp}] Executing ${diagnosticTool.toUpperCase()} from ${srcNode.name} (${srcNode.ip}) to ${destNode.name} (${destNode.ip})...`
    ]);

    // Handle Packet End Animation Timeout
    const animationDuration = activeHops.length * 500; // 500ms per hop
    setTimeout(() => {
      setIsAnimating(false);

      if (isBlocked) {
        setAlertMessage({ type: "danger", text: blockReason });
        setTerminalLogs(prev => [
          ...prev,
          `[*] Packet dropped at ${hops[blockIndex].name} (${hops[blockIndex].ip}).`,
          `[-] Connection Error: Request timed out.`,
          `[-] Diagnostic Failure: 100% packet loss.`,
          ""
        ]);
      } else {
        if (blockReason) {
          // Warning state (e.g. unprotected portscan)
          setAlertMessage({ type: "warning", text: blockReason });
        } else {
          setAlertMessage({ type: "success", text: `Success: Connection verified between hosts.` });
        }
        
        // Print tool specific success logs
        if (diagnosticTool === "ping") {
          setTerminalLogs(prev => [
            ...prev,
            `[+] Reply from ${destNode.ip}: bytes=32 time=2ms TTL=64`,
            `[+] Reply from ${destNode.ip}: bytes=32 time=1ms TTL=64`,
            `[+] Ping complete: Packets Sent = 2, Received = 2, Lost = 0 (0% loss).`,
            ""
          ]);
        } else if (diagnosticTool === "traceroute") {
          const hopLines = activeHops.map((node, i) => ` ${i + 1}    <1ms    <1ms    <1ms    ${node.name} [${node.ip}]`);
          setTerminalLogs(prev => [
            ...prev,
            `[+] Tracing route to ${destNode.name} [${destNode.ip}] over a maximum of 30 hops:`,
            ...hopLines,
            `[+] Trace complete.`,
            ""
          ]);
        } else if (diagnosticTool === "http") {
          setTerminalLogs(prev => [
            ...prev,
            `[+] Sending HTTP GET request to http://${destNode.ip}/index.html`,
            `[+] Received HTTP/1.1 200 OK (Content-Length: 1405 bytes)`,
            `[+] Connection verified on Port 80.`,
            ""
          ]);
        } else if (diagnosticTool === "portscan") {
          setTerminalLogs(prev => [
            ...prev,
            `[+] Initiating TCP SYN scan on target ${destNode.ip}:`,
            `[+] Port 53 (DNS)     : OPEN`,
            `[+] Port 80 (HTTP)    : OPEN`,
            `[+] Port 135 (RPC)    : OPEN`,
            `[+] Port 445 (SMB)    : OPEN`,
            `[+] Scan finished: Target host is responsive.`,
            ""
          ]);
        }
      }
    }, animationDuration);
  };

  const getIconForType = (type: Node["type"]) => {
    switch (type) {
      case "internet": return "🌍";
      case "firewall": return "🧱";
      case "switch": return "🔌";
      case "server": return "🖥️";
      case "workstation": return "💻";
    }
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 items-stretch">
      
      {/* 1. Vis Canvas Column */}
      <div className="xl:w-[50%] flex flex-col border border-border/50 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden h-[460px] xl:h-[540px]">
        {/* Header Tab */}
        <div className="border-b border-border/40 bg-muted/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={16} className="text-primary" />
            <span className="font-mono text-xs font-bold text-foreground">Interactive Network Canvas</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
            Live SVG Links
          </span>
        </div>

        {/* SVG Canvas Container */}
        <div className="flex-1 bg-muted/5 relative overflow-hidden flex items-center justify-center p-4">
          <svg className="w-full h-full max-w-[500px] max-h-[300px] xl:max-h-[380px] overflow-visible" viewBox="0 0 600 250">
            {/* Draw connection lines */}
            {CONNECTIONS.map((conn, idx) => {
              const fromNode = NODES.find(n => n.id === conn.from)!;
              const toNode = NODES.find(n => n.id === conn.to)!;
              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Dynamic Packet Animation */}
            {animationPath && (
              <g key={animationKey}>
                {/* Hidden path for animation motion */}
                <path id="temp-anim-path" d={animationPath} fill="none" stroke="transparent" />
                
                {/* Glowing Packet Circle */}
                <circle r="6" fill={packetColor} className="shadow-lg filter drop-shadow-[0_0_8px_rgba(0,255,200,0.8)]">
                  <animateMotion
                    dur={`${(animationPath.match(/[L]/g) || []).length * 0.5}s`}
                    repeatCount="1"
                    fill="freeze"
                  >
                    <mpath href="#temp-anim-path" />
                  </animateMotion>
                </circle>
              </g>
            )}

            {/* Draw Node Objects */}
            {NODES.map((node) => {
              const isSelectedSource = source === node.id;
              const isSelectedDest = destination === node.id;
              
              let ringColor = "stroke-border/50";
              let glowColor = "";
              if (isSelectedSource) {
                ringColor = "stroke-primary";
                glowColor = "drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.5)]";
              } else if (isSelectedDest) {
                ringColor = "stroke-green-500";
                glowColor = "drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]";
              }

              return (
                <g key={node.id} className="cursor-help group">
                  {/* Outer circle layout */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="22"
                    fill="rgba(15, 23, 42, 0.85)"
                    strokeWidth="2"
                    className={`transition-all duration-300 ${ringColor} ${glowColor}`}
                  />
                  {/* Icon label */}
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize="18"
                    className="select-none"
                  >
                    {getIconForType(node.type)}
                  </text>

                  {/* Label background */}
                  <rect
                    x={node.x - 55}
                    y={node.y + 26}
                    width="110"
                    height="14"
                    rx="3"
                    fill="rgba(15, 23, 42, 0.75)"
                    className="stroke-border/30 stroke-[0.5px]"
                  />
                  
                  {/* Text label */}
                  <text
                    x={node.x}
                    y={node.y + 36}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.name.length > 18 ? node.name.substring(0, 15) + "..." : node.name}
                  </text>

                  {/* IP Address Label */}
                  <text
                    x={node.x}
                    y={node.y - 28}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    {node.ip}
                  </text>

                  {/* Tooltip on hover */}
                  <title>{`${node.name} (${node.ip})\n---\n${node.description}`}</title>
                </g>
              );
            })}
          </svg>

          {/* Quick Stats Panel Overlay */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 border border-border/40 rounded-lg p-2.5 flex items-center gap-3 text-[11px] font-mono leading-relaxed backdrop-blur-sm">
            <Info size={14} className="text-primary flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">VLAN Subnets:</span>{" "}
              <span className="text-foreground font-semibold">VLAN 10</span> (192.168.10.0/24) |{" "}
              <span className="text-foreground font-semibold">VLAN 20</span> (192.168.20.0/24) |{" "}
              <span className="text-foreground font-semibold">LAN</span> (192.168.1.0/24)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls and Terminal Logs Column */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Controls Card */}
        <div className="border border-border/50 rounded-xl bg-card/60 backdrop-blur-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Shield size={16} className="text-primary" /> Security Rules & Diagnostics
            </h3>
            <div className="flex items-center gap-1">
              {ipsActive ? <ShieldCheck size={14} className="text-green-500" /> : <ShieldAlert size={14} className="text-amber-500" />}
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{ipsActive ? "IPS Locked" : "IPS Off"}</span>
            </div>
          </div>

          {/* Sandbox Toggle switches */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <button
              onClick={() => setIcmpBlock(!icmpBlock)}
              className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors"
            >
              <span>Block ICMP (Ping)</span>
              {icmpBlock ? <ToggleRight className="text-primary" size={20} /> : <ToggleLeft className="text-muted-foreground" size={20} />}
            </button>
            
            <button
              onClick={() => setVlanIsolate(!vlanIsolate)}
              className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors"
            >
              <span>Isolate VLAN 20</span>
              {vlanIsolate ? <ToggleRight className="text-primary" size={20} /> : <ToggleLeft className="text-muted-foreground" size={20} />}
            </button>

            <button
              onClick={() => setWebBlock(!webBlock)}
              className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors"
            >
              <span>Block HTTP (Web)</span>
              {webBlock ? <ToggleRight className="text-primary" size={20} /> : <ToggleLeft className="text-muted-foreground" size={20} />}
            </button>

            <button
              onClick={() => setIpsActive(!ipsActive)}
              className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors"
            >
              <span>Intrusion Prevention</span>
              {ipsActive ? <ToggleRight className="text-primary" size={20} /> : <ToggleLeft className="text-muted-foreground" size={20} />}
            </button>
          </div>

          {/* Diagnostics config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Source Host</label>
              <select
                disabled={isAnimating}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-muted border border-border/50 rounded px-2 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              >
                {NODES.filter(n => n.id !== "firewall" && n.id !== "switch").map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Destination Host</label>
              <select
                disabled={isAnimating}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-muted border border-border/50 rounded px-2 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              >
                {NODES.filter(n => n.id !== "firewall" && n.id !== "switch" && n.id !== source).map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Diagnostic Tool</label>
              <select
                disabled={isAnimating}
                value={diagnosticTool}
                onChange={(e) => setDiagnosticTool(e.target.value as any)}
                className="w-full bg-muted border border-border/50 rounded px-2 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              >
                <option value="ping">Ping (ICMP Echo)</option>
                <option value="traceroute">Traceroute (TTL Probe)</option>
                <option value="http">HTTP Request (Port 80)</option>
                <option value="portscan">Port Scan (TCP SYN)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {/* Status alerts */}
            <div className="flex-1 mr-4 min-h-6">
              {alertMessage && (
                <div className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold leading-snug border ${
                  alertMessage.type === "success" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                  alertMessage.type === "danger" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  alertMessage.type === "warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}>
                  {alertMessage.text}
                </div>
              )}
            </div>

            <button
              disabled={isAnimating || source === destination}
              onClick={runDiagnostic}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity active:scale-[0.98] text-xs font-bold shadow-md disabled:opacity-50"
            >
              <Play size={12} fill="currentColor" /> Run Diagnostic
            </button>
          </div>
        </div>

        {/* Diagnostic logs console */}
        <div className="flex-1 flex flex-col border border-border/50 rounded-xl overflow-hidden shadow-lg bg-[#0d1117] text-[#c9d1d9] h-[220px] xl:h-[260px]">
          <div className="bg-[#161b22] px-4 py-2 flex items-center justify-between border-b border-border/20 select-none">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-primary" />
              <span className="font-mono text-xs font-semibold text-slate-300">Diagnostic Outputs Logs</span>
            </div>
            <button
              onClick={() => setTerminalLogs(["Console cleared. waiting for diagnostics..."])}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground hover:underline transition-all"
            >
              Clear Logs
            </button>
          </div>

          <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto leading-relaxed select-text space-y-1">
            {terminalLogs.map((log, idx) => {
              let colorClass = "text-slate-300";
              if (log.startsWith("[+]")) colorClass = "text-emerald-400 font-semibold";
              else if (log.startsWith("[-]")) colorClass = "text-rose-400";
              else if (log.startsWith("[*]")) colorClass = "text-amber-400";
              else if (log.startsWith("Console cleared") || log.startsWith("Select a source")) colorClass = "text-muted-foreground italic";

              return (
                <div key={idx} className={colorClass}>
                  {log}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>

    </div>
  );
}
