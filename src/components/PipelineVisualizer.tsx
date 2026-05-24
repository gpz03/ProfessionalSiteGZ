import { useState, useEffect } from "react";
import { GitBranch, GitCommit, Play, CheckCircle2, Clock, Loader2, Send, AlertTriangle, RefreshCw, Terminal, ExternalLink } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface GuestbookEntry {
  name: string;
  message: string;
  timestamp: string;
}

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  run_number: number;
  created_at: string;
  message: string;
}

export default function PipelineVisualizer() {
  const { toast } = useToast();
  
  // Guestbook states
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [signing, setSigning] = useState<boolean>(false);
  const [fetchingEntries, setFetchingEntries] = useState<boolean>(true);
  
  // Pipeline tracking states
  const [latestRun, setLatestRun] = useState<WorkflowRun | null>(null);
  const [trackingPipeline, setTrackingPipeline] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<"trigger" | "build" | "deploy" | "idle">("idle");
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const repoOwner = "gpz03";
  const repoName = "ProfessionalSiteGZ";

  useEffect(() => {
    fetchGuestbook();
    fetchLatestWorkflowRun();
    
    // Periodically poll for latest workflow status
    const interval = setInterval(() => {
      fetchLatestWorkflowRun();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Poll workflow run when tracking is active
  useEffect(() => {
    if (!trackingPipeline) return;

    const pipelineInterval = setInterval(async () => {
      const run = await fetchLatestWorkflowRun();
      if (run) {
        // Map status to visual stages
        if (run.status === "completed") {
          setTrackingPipeline(false);
          setActiveJob("idle");
          setPipelineProgress(100);
          
          const success = run.conclusion === "success";
          setConsoleLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Pipeline completed with conclusion: ${run.conclusion?.toUpperCase()}`,
            success ? `[SYSTEM] SUCCESS: Deployed static assets to edge CDN.` : `[SYSTEM] ERROR: Build failed. Check GitHub Logs.`
          ]);
          
          if (success) {
            toast({
              title: "CI/CD Pipeline Successful!",
              description: "Your guestbook signature has been successfully compiled and deployed to GitHub Pages!",
            });
            fetchGuestbook(); // Refresh guestbook to pull the new file
          } else {
            toast({
              variant: "destructive",
              title: "Pipeline Failed",
              description: "The deployment build failed on GitHub. Please check logs.",
            });
          }
        } else if (run.status === "in_progress") {
          setPipelineProgress(50);
          setActiveJob("build");
          setConsoleLogs(prev => {
            if (prev.length < 5) {
              return [
                ...prev,
                `[${new Date().toLocaleTimeString()}] Job: install dependencies...`,
                `[${new Date().toLocaleTimeString()}] Job: running Vite production compiler...`
              ];
            }
            return prev;
          });
        } else {
          // Queued
          setPipelineProgress(20);
          setActiveJob("trigger");
        }
      }
    }, 8000);

    return () => clearInterval(pipelineInterval);
  }, [trackingPipeline]);

  const fetchGuestbook = async () => {
    setFetchingEntries(true);
    try {
      const res = await fetch(getApiUrl("/api/guestbook"));
      if (res.ok) {
        const data = await res.json();
        setEntries(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch guestbook:", e);
    } finally {
      setFetchingEntries(false);
    }
  };

  const fetchLatestWorkflowRun = async (): Promise<WorkflowRun | null> => {
    try {
      // Fetch public workflow runs from GitHub API
      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=1`);
      if (res.ok) {
        const data = await res.json();
        const run = data.workflow_runs?.[0];
        if (run) {
          const runInfo: WorkflowRun = {
            id: run.id,
            status: run.status,
            conclusion: run.conclusion,
            html_url: run.html_url,
            run_number: run.run_number,
            created_at: run.created_at,
            message: run.head_commit?.message || "No commit message"
          };
          setLatestRun(runInfo);
          return runInfo;
        }
      }
    } catch (e) {
      console.error("Failed to query GitHub API:", e);
    }
    return null;
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSigning(true);
    setConsoleLogs([
      `[${new Date().toLocaleTimeString()}] Initializing guestbook signature submit...`,
      `[${new Date().toLocaleTimeString()}] Staging file update in API...`
    ]);

    try {
      const res = await fetch(getApiUrl("/api/guestbook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      
      setName("");
      setMessage("");

      toast({
        title: "Signature staged!",
        description: data.pipelineTriggered 
          ? "GitHub Actions workflow triggered. Launching pipeline tracker..." 
          : "Signature added locally (Dev Mode).",
      });

      if (data.pipelineTriggered) {
        setTrackingPipeline(true);
        setActiveJob("trigger");
        setPipelineProgress(10);
        setConsoleLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Commit pushed. Triggering SWA / GitHub Action workflow...`,
          `[${new Date().toLocaleTimeString()}] Pipeline status: QUEUED (Run #${(latestRun?.run_number || 0) + 1})`
        ]);
      } else {
        // Dev Mode - update list immediately
        fetchGuestbook();
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.message || "Failed to submit signature.",
      });
      setConsoleLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`
      ]);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 border border-border rounded-xl bg-card overflow-hidden shadow-lg">
      {/* Left Column: Guestbook Form & Live Messages (7 cols) */}
      <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-border">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground tracking-tight">Continuous Deployment Guestbook</h3>
        </div>

        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          Sign this guestbook to test the **live CI/CD pipeline**. Your signature commits directly to a JSON file in the GitHub repository, which triggers a GitHub Actions build to recompile the React app and deploy it.
        </p>

        {/* Guestbook Form */}
        <form onSubmit={handleSign} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                maxLength={50}
                required
                disabled={signing || trackingPipeline}
                placeholder="E.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-muted/20 border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Short Message
              </label>
              <input
                type="text"
                maxLength={250}
                required
                disabled={signing || trackingPipeline}
                placeholder="E.g. Awesome AD Home Lab setup!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs bg-muted/20 border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={signing || trackingPipeline || !name.trim() || !message.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Commit Signature & Deploy
          </button>
        </form>

        {/* Live Messages List */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Live Guestbook Signatures</h4>
          {fetchingEntries ? (
            <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Fetching signatures...</span>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 border border-dashed border-border/60 rounded text-center">
              No signatures yet. Be the first to commit a signature!
            </p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {[...entries].reverse().map((entry, index) => (
                <div key={index} className="p-3 rounded-lg border border-border/50 bg-muted/10 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground">{entry.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{entry.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: CI/CD Pipeline Visualizer & Terminal (5 cols) */}
      <div className="lg:col-span-5 p-6 bg-muted/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CI/CD Pipeline Monitor</h4>
            {latestRun && (
              <span className="text-[10px] font-mono text-muted-foreground">
                Run #{latestRun.run_number}
              </span>
            )}
          </div>

          {/* Pipeline Visual Node Graph */}
          <div className="space-y-6 mb-6">
            {/* Stage 1: Trigger / Commit */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full border ${
                activeJob === "trigger" 
                  ? "bg-primary/20 border-primary text-primary animate-pulse" 
                  : trackingPipeline || latestRun?.status === "in_progress"
                    ? "bg-green-500/20 border-green-500 text-green-500"
                    : "bg-muted border-border text-muted-foreground"
              }`}>
                <GitCommit size={16} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">GitHub Push / Webhook</p>
                <p className="text-[10px] text-muted-foreground">Triggered on commit</p>
              </div>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-6 bg-border/80 ml-4 -my-4" />

            {/* Stage 2: Compilation & Build */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full border ${
                activeJob === "build" 
                  ? "bg-primary/20 border-primary text-primary animate-spin-slow" 
                  : latestRun?.status === "completed" && latestRun?.conclusion === "success"
                    ? "bg-green-500/20 border-green-500 text-green-500"
                    : activeJob === "deploy"
                      ? "bg-green-500/20 border-green-500 text-green-500"
                      : "bg-muted border-border text-muted-foreground"
              }`}>
                <Play size={16} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">GitHub Actions Compiler</p>
                <p className="text-[10px] text-muted-foreground">NPM install & Vite compilation</p>
              </div>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-6 bg-border/80 ml-4 -my-4" />

            {/* Stage 3: Deployment */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full border ${
                activeJob === "deploy" 
                  ? "bg-primary/20 border-primary text-primary animate-pulse" 
                  : latestRun?.status === "completed" && latestRun?.conclusion === "success"
                    ? "bg-green-500/20 border-green-500 text-green-500"
                    : "bg-muted border-border text-muted-foreground"
              }`}>
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">GitHub Pages / Edge Deploy</p>
                <p className="text-[10px] text-muted-foreground">Asset sync to global CDN</p>
              </div>
            </div>
          </div>

          {/* Active Status Badge */}
          {latestRun && (
            <div className="p-3 rounded bg-card border border-border/80 text-xs space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Workflow Status:</span>
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  latestRun.status === "in_progress" 
                    ? "bg-primary/10 text-primary animate-pulse border border-primary/20" 
                    : latestRun.conclusion === "success"
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}>
                  {latestRun.status === "in_progress" ? "BUILDING" : latestRun.conclusion || latestRun.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                <span>Latest Commit:</span>
                <span className="truncate max-w-[150px] font-semibold text-foreground" title={latestRun.message}>
                  {latestRun.message}
                </span>
              </div>

              {latestRun.status === "in_progress" && (
                <div className="pt-1">
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full animate-pulse transition-all duration-300"
                      style={{ width: `${pipelineProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terminal Logs */}
        <div className="flex-1 flex flex-col min-h-[140px] max-h-[160px] bg-black rounded-lg border border-border/80 p-3 font-mono text-[10px] overflow-hidden">
          <div className="flex items-center gap-1.5 text-muted-foreground border-b border-border/40 pb-1.5 mb-1.5 flex-shrink-0">
            <Terminal size={10} />
            <span>CD Build Terminal Console</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-green-400 select-none pr-1">
            {consoleLogs.length === 0 ? (
              <span className="text-muted-foreground/60 italic">Console idle. Submit guestbook signature to run pipeline logs.</span>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className="leading-tight break-all">{log}</div>
              ))
            )}
          </div>
        </div>

        {latestRun && (
          <a
            href={latestRun.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline"
          >
            Verify Actions Build on GitHub <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
}
