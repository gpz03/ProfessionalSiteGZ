import { useState, useEffect, useRef } from "react";
import { HardDrive, Upload, Download, Trash2, Loader2, RefreshCw, Shield, AlertCircle, FileText, FileImage, FileCode, FileVideo, FileAudio, File } from "lucide-react";
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
  const [limit, setLimit] = useState<number>(1024 * 1024 * 1024); // 1GB Guest Limit
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Guest mode fetch (no Authorization header)
      const res = await fetch(getApiUrl("/api/nas"));
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setFiles(data.files || []);
      setTotalSize(data.totalSize || 0);
      setLimit(data.limit || 1024 * 1024 * 1024);
    } catch (err: any) {
      setError(err.message || "Failed to load guest files.");
    } finally {
      setLoading(false);
    }
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

    if (file.size > 1024 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Guest uploads are limited to a maximum file size of 1GB.",
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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(getApiUrl("/api/nas"), {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed with status ${res.status}`);
      }

      toast({
        title: "Success",
        description: `Successfully uploaded "${file.name}" to Guest Sandbox`,
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
    try {
      const res = await fetch(getApiUrl(`/api/nas?file=${encodeURIComponent(fileName)}`));
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
    if (!confirm(`Are you sure you want to delete "${fileName}" from the Guest Sandbox?`)) return;

    try {
      const res = await fetch(getApiUrl(`/api/nas?file=${encodeURIComponent(fileName)}`), {
        method: "DELETE"
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

  const guestQuotaPercent = limit > 0 ? (totalSize / limit) * 100 : 0;

  return (
    <div className="mt-8 border border-border rounded-xl bg-card overflow-hidden shadow-lg">
      <div className="flex items-center justify-between bg-muted/50 p-4 border-b border-border flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HardDrive size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground tracking-tight">Live NAS Cloud Storage</h3>
          
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border bg-primary/10 border-primary/20 text-primary">
            <Shield size={10} />
            Guest Sandbox Mode (1GB Quota)
          </span>
        </div>

        <button 
          onClick={() => fetchFiles()} 
          disabled={loading}
          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 border border-border/40"
          title="Refresh Files"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-6">
        {/* Storage Quota Bar */}
        <div className="mb-6 bg-muted/20 border border-border/50 rounded-lg p-4">
          <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mb-2">
            <span>NAS Storage Capacity</span>
            <span className="font-mono">
              {formatBytes(totalSize)} / {formatBytes(limit)} used
            </span>
          </div>
          
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/30">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                guestQuotaPercent > 90 ? "bg-destructive" : guestQuotaPercent > 60 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(guestQuotaPercent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Shared Public Sandbox: Files uploaded in Guest Mode are visible to all visitors and share a collective 1GB quota. Files are saved in a transient partition.
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
              Maximum upload file size: 1GB
            </p>
          </button>
        </div>

        {/* File Index */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Public Guest Files</h4>

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
              <p className="text-xs font-semibold">Guest Sandbox empty</p>
              <p className="text-[10px] mt-0.5">Upload a file to test the cloud storage system.</p>
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
