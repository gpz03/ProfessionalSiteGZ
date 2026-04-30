import { useState } from "react";
import { Server, Activity, ArrowRight, Loader2 } from "lucide-react";

export default function AzurePlayground() {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ping");
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || "Failed to connect to Azure Backend. (Are you running locally without the Azure Functions Core Tools?)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center gap-2 bg-muted/50 p-4 border-b border-border">
        <Server size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">Interactive Azure API Playground</h3>
      </div>
      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-6">
          Click the button below to send a live HTTP request to the serverless backend function deployed on Azure.
        </p>
        
        <button
          onClick={handlePing}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed mb-6"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
          Ping Azure Backend <ArrowRight size={16} />
        </button>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-mono whitespace-pre-wrap">
            {error}
          </div>
        )}

        {response && (
          <div className="relative">
            <div className="absolute top-0 right-0 bg-muted/80 text-muted-foreground text-[10px] px-2 py-1 rounded-bl-lg rounded-tr-lg font-mono border-l border-b border-border">
              HTTP 200 OK
            </div>
            <pre className="p-4 bg-muted border border-border text-foreground rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
