import { useState, useEffect, useRef } from "react";
import { HardDrive, Upload, Download, Trash2, Loader2, RefreshCw, Key, Shield, ShieldCheck, AlertCircle, FileText, FileImage, FileCode, FileVideo, FileAudio, File } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface NasFile {
  name: string;
  size: number;
  uploadedAt: string;
}

export default function NasExplorer() {
  const { toast } = useToast();
  const [files, setFiles] = useState<NasFile[]>([]);
  const [totalSize, setTotalSize] = useState<number>(0);
  const [limit, setLimit] = useState<number>(1024 * 1024 * 1024); // Default 1GB
  const [mode, setMode] = useState<"guest" | "owner">("guest");
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState<string>("");
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if admin key exists in localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("nas_admin_key");
    if (savedKey) {
      setIsUnlocked(true);
    }
    fetchFiles(savedKey || undefined);
  }, []);

  const fetchFiles = async (keyOverride?: string) => {
    setLoading(true);
    setError(null);
    const key = keyOverride !== undefined ? keyOverride : (localStorage.getItem("nas_admin_key") || "");
    try {
      const headers: Record<string, string> = {};
      if (key) {
        headers["Authorization"] = `Bearer ${key}`;
      }

      const res = await fetch(getApiUrl("/api/nas"), { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Key is invalid, clear it
          localStorage.removeItem("nas_admin_key");
          setIsUnlocked(false);
          throw new Error("Invalid access key. Reverted to Guest Mode.");
        }
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setFiles(data.files || []);
      setTotalSize(data.totalSize || 0);
      setLimit(data.limit || 0);
      setMode(data.mode || "guest");
      if (key && data.mode === "owner") {
        setIsUnlocked(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load NAS files.");
      // If error contains credentials issue, fallback to guest fetch
      if (key) {
        localStorage.removeItem("nas_admin_key");
        setIsUnlocked(false);
        fetchFiles("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) return;

    localStorage.setItem("nas_admin_key", adminKeyInput.trim());
    await fetchFiles(adminKeyInput.trim());
    setAdminKeyInput("");
    setShowAdminPanel(false);
    
    toast({
      title: "Authentication",
      description: "Successfully authenticated. Storage quota limits lifted.",
    });
  };

  const handleLock = () => {
    localStorage.removeItem("nas_admin_key");
    setIsUnlocked(false);
    setMode("guest");
    fetchFiles("");
    toast({
      title: "Locked",
      description: "Returned to guest mode. 1GB quota re-applied.",
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const style = "text-primary mr-2.5 h-4 w-4 flex-shrink-0";
    if (!ext) return <File className={style} />;
    
    const imageTypes = ["jpg", "jpeg", "png", "gif", "svg", "webp"];
    const textTypes = ["txt", "md", "json", "pdf", "docx", "doc"];
    const codeTypes = ["js", "jsx", "ts", "tsx", "html", "css", "py", "sh", "ps1"];
    const videoTypes = ["mp4", "mkv", "avi", "mov"];
    const audioTypes = ["mp3", "wav", "flac", "ogg"];

    if (imageTypes.includes(ext)) return <FileImage className={style} />;
    if (textTypes.includes(ext)) return <FileText className={style} />;
    if (codeTypes.includes(ext)) return <FileCode className={style} />;
    if (videoTypes.includes(ext)) return <FileVideo className={style} />;
    if (audioTypes.includes(ext)) return <FileAudio className={style} />;
    return <File className={style} />;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = localStorage.getItem("nas_admin_key");

    // Client-side validation for guests
    if (!key) {
      if (file.size > 1024 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Guests are limited to a maximum file size of 1GB.",
        });
        return;
      }
      if (totalSize + file.size > limit) {
        toast({
          variant: "destructive",
          title: "Quota Exceeded",
          description: "This upload exceeds the guest total storage limit of 1GB.",
        });
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      if (key) {
        headers["Authorization"] = `Bearer ${key}`;
      }

      const res = await fetch(getApiUrl("/api/nas"), {
        method: "POST",
        headers,
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed with status ${res.status}`);
      }

      toast({
        title: "Success",
        description: `Successfully uploaded "${file.name}"`,
      });

      fetchFiles();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "An error occurred during upload.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (fileName: string) => {
    const key = localStorage.getItem("nas_admin_key");
    try {
      const headers: Record<string, string> = {};
      if (key) {
        headers["Authorization"] = `Bearer ${key}`;
      }

      const res = await fetch(getApiUrl(`/api/nas?file=${encodeURIComponent(fileName)}`), {
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to download: ${res.statusText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: err.message || "Could not retrieve the file.",
      });
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    const key = localStorage.getItem("nas_admin_key");
    try {
      const headers: Record<string, string> = {};
      if (key) {
        headers["Authorization"] = `Bearer ${key}`;
      }

      const res = await fetch(getApiUrl(`/api/nas?file=${encodeURIComponent(fileName)}`), {
        method: "DELETE",
        headers
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed with status ${res.status}`);
      }

      toast({
        title: "Deleted",
        description: `Deleted "${fileName}" successfully.`,
      });

      fetchFiles();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "Failed to remove the file.",
      });
    }
  };

  // Quota percentage for guests
  const guestQuotaPercent = limit > 0 ? (totalSize / limit) * 100 : 0;

  return (
    <div className="mt-8 border border-border rounded-xl bg-card overflow-hidden shadow-lg">
      <div className="flex items-center justify-between bg-muted/50 p-4 border-b border-border flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HardDrive size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground tracking-tight">Live NAS Cloud Storage</h3>
          
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
            mode === "owner" 
              ? "bg-green-500/10 border-green-500/20 text-green-500" 
              : "bg-primary/10 border-primary/20 text-primary"
          }`}>
            {mode === "owner" ? <ShieldCheck size={10} /> : <Shield size={10} />}
            {mode === "owner" ? "Owner Mode (Permanent)" : "Guest Mode (1GB Quota)"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <button
              onClick={handleLock}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all"
              title="Lock Admin Access"
            >
              <Key size={12} />
              Lock
            </button>
          ) : (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/80 transition-all"
            >
              <Key size={12} />
              {showAdminPanel ? "Close" : "Unlock Admin"}
            </button>
          )}

          <button 
            onClick={() => fetchFiles()} 
            disabled={loading}
            className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 border border-border/40"
            title="Refresh Files"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {showAdminPanel && !isUnlocked && (
        <form onSubmit={handleUnlock} className="p-4 bg-muted/40 border-b border-border flex gap-2 items-center">
          <Key size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            type="password"
            placeholder="Enter Owner Access Key..."
            value={adminKeyInput}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            className="flex-1 text-sm bg-card border border-border rounded px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button 
            type="submit"
            className="text-xs px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/90 transition-all"
          >
            Verify
          </button>
        </form>
      )}

      <div className="p-6">
        {/* Storage Quota Bar */}
        <div className="mb-6 bg-muted/20 border border-border/50 rounded-lg p-4">
          <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mb-2">
            <span>NAS Storage Capacity</span>
            <span className="font-mono">
              {formatBytes(totalSize)} {mode === "owner" ? "used" : `/ ${formatBytes(limit)} used`}
            </span>
          </div>
          
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/30">
            {mode === "owner" ? (
              <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
            ) : (
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  guestQuotaPercent > 90 ? "bg-destructive" : guestQuotaPercent > 60 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(guestQuotaPercent, 100)}%` }}
              />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            {mode === "owner" 
              ? "Persistent Owner Drive unlocked: Storage capacity limit disabled. Files are stored privately and permanently on your home server's NAS partition." 
              : "Shared Public Sandbox: Files uploaded in Guest Mode are visible to all visitors and share a collective 1GB quota. Files are saved in a transient partition and can be deleted by any visitor."}
          </p>
        </div>

        {/* File Drag/Click Target */}
        <div className="mb-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="w-full py-8 border border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/10 rounded-lg flex flex-col items-center justify-center transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-primary mb-3" />
            ) : (
              <Upload size={32} className="text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            )}
            <p className="text-sm font-bold text-foreground">
              {uploading ? "Uploading file..." : "Select File to Upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "owner" ? "No file size limit" : "Maximum upload file size: 1GB"}
            </p>
          </button>
        </div>

        {/* File Index */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Stored Files</h4>

          {loading && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 size={24} className="animate-spin mb-2 text-primary" />
              <p className="text-xs">Scanning storage partition...</p>
            </div>
          ) : error && files.length === 0 ? (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="text-xs font-medium">{error}</span>
            </div>
          ) : files.length === 0 ? (
            <div className="py-12 border border-border/50 border-dashed rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground">
              <HardDrive size={24} className="mb-2 opacity-50" />
              <p className="text-xs font-semibold">NAS Storage empty</p>
              <p className="text-[10px] mt-0.5">Upload a file to start using the system.</p>
            </div>
          ) : (
            <div className="border border-border/60 rounded-lg overflow-x-auto bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="p-3">File Name</th>
                    <th className="p-3 w-28">Size</th>
                    <th className="p-3 w-40">Uploaded At</th>
                    <th className="p-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {files.map((file) => (
                    <tr key={file.name} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-medium text-foreground flex items-center min-w-0">
                        {getFileIcon(file.name)}
                        <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md font-medium" title={file.name}>
                          {file.name}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{formatBytes(file.size)}</td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {new Date(file.uploadedAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-right flex justify-end gap-1.5">
                        <button
                          onClick={() => handleDownload(file.name)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                          title="Download File"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(file.name)}
                          className="p-1.5 rounded hover:bg-muted text-destructive hover:bg-destructive/10 transition-colors border border-border/40"
                          title="Delete File"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
