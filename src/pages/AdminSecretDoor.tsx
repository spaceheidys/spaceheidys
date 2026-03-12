import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Loader2, Upload, Trash2, Check, X, Download, Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SecretDoorSettings {
  id: string;
  secret_code: string;
  timer_seconds: number;
  background_url: string | null;
}

interface SecretDoorFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  sort_order: number;
}

const AdminSecretDoor = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<SecretDoorSettings | null>(null);
  const [files, setFiles] = useState<SecretDoorFile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Editable fields
  const [draftCode, setDraftCode] = useState("");
  const [draftTimer, setDraftTimer] = useState(60);
  const [codeDirty, setCodeDirty] = useState(false);
  const [timerDirty, setTimerDirty] = useState(false);

  // Confirm states
  const [confirmCodeSave, setConfirmCodeSave] = useState(false);
  const [confirmBgDelete, setConfirmBgDelete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error("You don't have admin access");
      navigate("/");
    }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAll();
    }
  }, [user, isAdmin]);

  const fetchAll = async () => {
    setFetching(true);
    const [settingsRes, filesRes] = await Promise.all([
      supabase.from("secret_door_settings" as any).select("*").limit(1).single(),
      supabase.from("secret_door_files" as any).select("*").order("sort_order"),
    ]);
    if (settingsRes.data) {
      const s = settingsRes.data as any as SecretDoorSettings;
      setSettings(s);
      setDraftCode(s.secret_code);
      setDraftTimer(s.timer_seconds);
    }
    if (filesRes.data) {
      setFiles(filesRes.data as any as SecretDoorFile[]);
    }
    setFetching(false);
  };

  const saveCode = async () => {
    if (!settings) return;
    const { error } = await supabase
      .from("secret_door_settings" as any)
      .update({ secret_code: draftCode, updated_at: new Date().toISOString() } as any)
      .eq("id", settings.id);
    if (error) toast.error("Failed to save code");
    else {
      toast.success("Secret code updated");
      setSettings((s) => s ? { ...s, secret_code: draftCode } : s);
      setCodeDirty(false);
      setConfirmCodeSave(false);
    }
  };

  const saveTimer = async () => {
    if (!settings) return;
    const val = Math.max(10, Math.min(300, draftTimer));
    const { error } = await supabase
      .from("secret_door_settings" as any)
      .update({ timer_seconds: val, updated_at: new Date().toISOString() } as any)
      .eq("id", settings.id);
    if (error) toast.error("Failed to save timer");
    else {
      toast.success("Timer updated");
      setSettings((s) => s ? { ...s, timer_seconds: val } : s);
      setDraftTimer(val);
      setTimerDirty(false);
    }
  };

  const uploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `secret-door/bg-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const { error } = await supabase
      .from("secret_door_settings" as any)
      .update({ background_url: urlData.publicUrl, updated_at: new Date().toISOString() } as any)
      .eq("id", settings.id);
    if (error) toast.error("Failed to save");
    else {
      toast.success("Background updated");
      setSettings((s) => s ? { ...s, background_url: urlData.publicUrl } : s);
    }
    setUploading(false);
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  const removeBackground = async () => {
    if (!settings) return;
    const { error } = await supabase
      .from("secret_door_settings" as any)
      .update({ background_url: null, updated_at: new Date().toISOString() } as any)
      .eq("id", settings.id);
    if (!error) {
      toast.success("Background removed");
      setSettings((s) => s ? { ...s, background_url: null } : s);
    }
    setConfirmBgDelete(false);
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Max file size is 50MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `secret-door/files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const { error } = await supabase
      .from("secret_door_files" as any)
      .insert({ file_name: file.name, file_url: urlData.publicUrl, file_size: file.size, sort_order: files.length } as any);
    if (error) toast.error("Failed to save file");
    else {
      toast.success("File uploaded");
      fetchAll();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteFile = async (id: string) => {
    const { error } = await supabase.from("secret_door_files" as any).delete().eq("id", id);
    if (!error) {
      setFiles((f) => f.filter((x) => x.id !== id));
      toast.success("File deleted");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/main")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Main Page CMS
          </button>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => navigate("/admin")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Portfolio CMS
          </button>
          <span className="text-muted-foreground/40">|</span>
          <h1 className="font-display text-sm tracking-[0.3em] uppercase">Secret Door</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
          >
            ← SITE
          </button>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-8 py-6 max-w-3xl mx-auto space-y-8">
        {/* SECRET CODE */}
        <section className="border border-border p-4 space-y-3">
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
            Secret Code (Password)
          </p>
          <input
            type="text"
            value={draftCode}
            onChange={(e) => { setDraftCode(e.target.value); setCodeDirty(e.target.value !== settings?.secret_code); }}
            className="w-full max-w-xs p-2 bg-transparent border border-border text-sm font-body text-foreground outline-none focus:border-foreground transition-colors"
          />
          {codeDirty && !confirmCodeSave && (
            <button
              onClick={() => setConfirmCodeSave(true)}
              className="px-3 py-1 text-[10px] font-display tracking-[0.2em] uppercase border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              SAVE
            </button>
          )}
          {confirmCodeSave && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display tracking-widest text-muted-foreground">Change password?</span>
              <button
                onClick={saveCode}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Check size={10} /> YES
              </button>
              <button
                onClick={() => { setConfirmCodeSave(false); setDraftCode(settings?.secret_code || ""); setCodeDirty(false); }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={10} /> NO
              </button>
            </div>
          )}
        </section>

        {/* TIMER */}
        <section className="border border-border p-4 space-y-3">
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
            Timer Duration (seconds)
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={10}
              max={300}
              value={draftTimer}
              onChange={(e) => { setDraftTimer(parseInt(e.target.value) || 10); setTimerDirty(parseInt(e.target.value) !== settings?.timer_seconds); }}
              className="w-24 p-2 bg-transparent border border-border text-sm font-body text-foreground outline-none focus:border-foreground transition-colors"
            />
            <span className="text-xs text-muted-foreground">sec (10–300)</span>
          </div>
          {timerDirty && (
            <div className="flex items-center gap-2">
              <button
                onClick={saveTimer}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Check size={10} /> YES
              </button>
              <button
                onClick={() => { setDraftTimer(settings?.timer_seconds || 60); setTimerDirty(false); }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={10} /> NO
              </button>
            </div>
          )}
        </section>

        {/* BACKGROUND */}
        <section className="border border-border p-4 space-y-3">
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
            Secret Door Background
          </p>
          {settings?.background_url ? (
            <div className="relative w-full max-w-md aspect-video border border-border overflow-hidden group">
              <img src={settings.background_url} alt="Secret Door BG" className="w-full h-full object-cover" />
              {!confirmBgDelete ? (
                <button
                  onClick={() => setConfirmBgDelete(true)}
                  className="absolute top-2 right-2 p-1 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={removeBackground}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest bg-background/90 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Check size={10} /> YES
                  </button>
                  <button
                    onClick={() => setConfirmBgDelete(false)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest bg-background/90 border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={10} /> NO
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60">No background set (default black overlay)</p>
          )}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {settings?.background_url ? "Change" : "Upload"}
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadBackground}
              disabled={uploading}
            />
          </label>
        </section>

        {/* DOWNLOADS GALLERY */}
        <section className="border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
              Downloads Gallery (Secret Room files)
            </p>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Upload File
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={uploadFile}
                disabled={uploading}
              />
            </label>
          </div>

          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-4 text-center">
              No files yet. Upload files that will be available for download in the Secret Room.
            </p>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center justify-between border border-border p-2 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Download size={14} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">{f.file_name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(f.file_size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFile(f.id)}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminSecretDoor;
