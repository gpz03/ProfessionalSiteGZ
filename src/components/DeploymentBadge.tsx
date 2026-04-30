import { useState, useEffect } from "react";
import { Cloud, GitCommit, Clock, Server } from "lucide-react";

export default function DeploymentBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hostingProvider = import.meta.env.VITE_HOSTING_PROVIDER;
  const buildTime = import.meta.env.VITE_BUILD_TIME;
  const gitCommit = import.meta.env.VITE_GIT_COMMIT;

  useEffect(() => {
    // Only show if the environment variables from the Azure build are present
    if (hostingProvider && buildTime) {
      setIsVisible(true);
    }
  }, [hostingProvider, buildTime]);

  if (!isVisible) return null;

  const formattedDate = new Date(buildTime).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans">
      <div 
        className={`bg-card/95 backdrop-blur shadow-lg border border-border rounded-xl overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-72' : 'w-12 cursor-pointer hover:border-primary/50 hover:shadow-primary/5'}`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {/* Collapsed State (Just Icon) */}
        {!isExpanded && (
          <div className="h-12 w-12 flex items-center justify-center text-primary" title="View Deployment Status">
            <Cloud size={20} className="animate-pulse duration-3000" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-green-500 rounded-full border-2 border-card" />
          </div>
        )}

        {/* Expanded State */}
        {isExpanded && (
          <div className="p-4 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 1L1 11M1 1L11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            
            <div className="flex items-center gap-2 mb-3 border-b border-border/50 pb-2">
              <Cloud size={16} className="text-primary" />
              <h4 className="font-semibold text-sm text-foreground tracking-tight">Live Deployment</h4>
              <div className="flex items-center gap-1.5 ml-auto mr-4 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Active
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs">
                <Server size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground font-medium mb-0.5">Host</p>
                  <p className="text-foreground">{hostingProvider}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <Clock size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground font-medium mb-0.5">Last Deployed</p>
                  <p className="text-foreground">{formattedDate}</p>
                </div>
              </div>

              {gitCommit && gitCommit !== "Unknown" && (
                <div className="flex items-start gap-2.5 text-xs">
                  <GitCommit size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground font-medium mb-0.5">Commit</p>
                    <p className="font-mono text-primary bg-primary/5 px-1 py-0.5 rounded inline-block border border-primary/10">
                      {gitCommit}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-2 border-t border-border/50 text-[10px] text-muted-foreground text-center font-medium">
              Deployed via GitHub Actions CI/CD
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
