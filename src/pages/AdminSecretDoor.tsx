import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Loader2, Upload, Trash2, Check, X, Download, Volume2, VolumeX, Eye, EyeOff, ArrowLeft, Code2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminTopNav from "@/components/admin/AdminTopNav";

interface SecretDoorSettings {
  id: string;
  timer_seconds: number;
  background_url: string | null;
  music_enabled: boolean;
  impulse_speed: number;
  impulse_color: string;
  impulse_enabled: boolean;
  impulse_mode: "smooth" | "linear" | "pulse";
}

interface SecretDoorFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  sort_order: number;
}

interface QuadrantRow {
  id: string;
  html_content: string | null;
  file_name: string | null;
}

const QUAD_LABELS: Record<string, string> = {
  tl: "01 — Top Left",
  tr: "02 — Top Right",
  bl: "03 — Bottom Left",
  br: "04 — Bottom Right",
};

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
  const [showCode, setShowCode] = useState(false);

  const [draftImpulseSpeed, setDraftImpulseSpeed] = useState(4);
  const [draftImpulseColor, setDraftImpulseColor] = useState("#ffffff");
  const [impulseDirty, setImpulseDirty] = useState(false);

  // Quadrants
  const [quadrants, setQuadrants] = useState<Record<string, QuadrantRow>>({});
  const [editingQuadrant, setEditingQuadrant] = useState<string | null>(null);
  const [draftHtml, setDraftHtml] = useState("");
  const [draftFileName, setDraftFileName] = useState<string | null>(null);
  const [quadDirty, setQuadDirty] = useState(false);
  const [quadSaving, setQuadSaving] = useState(false);
  const quadFileInputRef = useRef<HTMLInputElement>(null);

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
    const [settingsRes, filesRes, quadRes] = await Promise.all([
      supabase.from("secret_door_settings" as any).select("id, timer_seconds, background_url, music_enabled, impulse_speed, impulse_color, impulse_enabled, impulse_mode").limit(1).single(),
      supabase.from("secret_door_files" as any).select("*").order("sort_order"),
      supabase.from("secret_door_quadrants" as any).select("id, html_content, file_name"),
    ]);
    if (settingsRes.data) {
      const s = settingsRes.data as any as SecretDoorSettings;
      setSettings(s);
      setDraftCode("");
      setDraftTimer(s.timer_seconds);
      setDraftImpulseSpeed(Number(s.impulse_speed ?? 4));
      setDraftImpulseColor(s.impulse_color ?? "#ffffff");
      setImpulseDirty(false);
    }
    if (filesRes.data) {
      setFiles(filesRes.data as any as SecretDoorFile[]);
    }
    if (quadRes.data) {
      const map: Record<string, QuadrantRow> = {};
      (quadRes.data as any[]).forEach((q) => { map[q.id] = q; });
      setQuadrants(map);
    }
    setFetching(false);
  };

  const saveCode = async () => {
    if (!settings) return;
    const { error } = await supabase.rpc("set_secret_door_code" as any, { _new_code: draftCode } as any);
    if (error) {
      toast.error(error.message || "Failed to save code");
    } else {
      toast.success("Secret code updated");
      setDraftCode("");
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

  const saveImpulse = async () => {
    if (!settings) return;
    const speed = Math.max(0.5, Math.min(20, Number(draftImpulseSpeed) || 4));
    const color = /^#([0-9a-fA-F]{6})$/.test(draftImpulseColor) ? draftImpulseColor : "#ffffff";
    const { error } = await supabase
      .from("secret_door_settings" as any)
      .update({ impulse_speed: speed, impulse_color: color, updated_at: new Date().toISOString() } as any)
      .eq("id", settings.id);
    if (error) toast.error("Failed to save impulse");
    else {
      toast.success("Impulse updated");
      setSettings((s) => s ? { ...s, impulse_speed: speed, impulse_color: color } : s);
      setImpulseDirty(false);
    }
  };

  const uploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `bg-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("secret-door-private").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploading(false); return; }
    // Store the storage reference URL (private bucket, not publicly accessible)
    const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/secret-door-private/${path}`;
    const { error } = await supabase
      .from("secret_door_settings" as any)
      .update({ background_url: storageUrl, updated_at: new Date().toISOString() } as any)
      .eq("id", settings.id);
    if (error) toast.error("Failed to save");
    else {
      toast.success("Background updated");
      setSettings((s) => s ? { ...s, background_url: storageUrl } : s);
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
    const path = `files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("secret-door-private").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploading(false); return; }
    // Store the storage path (not a public URL) since the bucket is private
    const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/secret-door-private/${path}`;
    const { error } = await supabase
      .from("secret_door_files" as any)
      .insert({ file_name: file.name, file_url: storageUrl, file_size: file.size, sort_order: files.length } as any);
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

  const openQuadrantEditor = (id: string) => {
    const q = quadrants[id];
    setEditingQuadrant(id);
    setDraftHtml(q?.html_content ?? "");
    setDraftFileName(q?.file_name ?? null);
    setQuadDirty(false);
  };

  const closeQuadrantEditor = () => {
    if (quadDirty && !window.confirm("Discard unsaved changes?")) return;
    setEditingQuadrant(null);
    setDraftHtml("");
    setDraftFileName(null);
    setQuadDirty(false);
    if (quadFileInputRef.current) quadFileInputRef.current.value = "";
  };

  const onUploadQuadrantHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      toast.error("Only .html files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max .html size is 5MB");
      return;
    }
    const text = await file.text();
    setDraftHtml(text);
    setDraftFileName(file.name);
    setQuadDirty(true);
  };

  const saveQuadrant = async () => {
    if (!editingQuadrant) return;
    setQuadSaving(true);
    const { error } = await supabase
      .from("secret_door_quadrants" as any)
      .update({ html_content: draftHtml, file_name: draftFileName, updated_at: new Date().toISOString() } as any)
      .eq("id", editingQuadrant);
    setQuadSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Quadrant updated");
    setQuadrants((prev) => ({
      ...prev,
      [editingQuadrant]: { id: editingQuadrant, html_content: draftHtml, file_name: draftFileName },
    }));
    setQuadDirty(false);
  };

  const clearQuadrant = async () => {
    if (!editingQuadrant) return;
    if (!window.confirm("Remove HTML content from this quadrant?")) return;
    setDraftHtml("");
    setDraftFileName(null);
    setQuadDirty(true);
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
      <AdminTopNav
        current="secret-door"
        userId={user?.id}
        rightExtra={
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        }
      />

      <div className="px-4 sm:px-8 py-6 max-w-3xl mx-auto space-y-8">
        {/* SECRET CODE */}
        <section className="border border-border p-4 space-y-3">
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
            Secret Code (Password)
          </p>
          <div className="flex items-center gap-2 max-w-xs">
            <input
              type={showCode ? "text" : "password"}
              value={draftCode}
              onChange={(e) => { setDraftCode(e.target.value); setCodeDirty(e.target.value.length > 0); }}
              className="w-full p-2 bg-transparent border border-border text-sm font-body text-foreground outline-none focus:border-foreground transition-colors"
              placeholder="Enter new code"
            />
            <button
              onClick={() => setShowCode(!showCode)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCode ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            Min 8 characters, must include a letter and a number. Code is hashed and cannot be retrieved — only replaced.
          </p>
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
                onClick={() => { setConfirmCodeSave(false); setDraftCode(""); setCodeDirty(false); }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={10} /> NO
              </button>
            </div>
          )}
        </section>
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

        {/* IMPULSE — speed & color */}
        <section className="border border-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
              Quadrant Impulse (Perimeter Animation)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">
                {settings?.impulse_enabled ? "ON" : "OFF"}
              </span>
              <Switch
                checked={settings?.impulse_enabled ?? true}
                onCheckedChange={async (checked) => {
                  if (!settings) return;
                  const { error } = await supabase
                    .from("secret_door_settings" as any)
                    .update({ impulse_enabled: checked, updated_at: new Date().toISOString() } as any)
                    .eq("id", settings.id);
                  if (!error) {
                    setSettings((s) => s ? { ...s, impulse_enabled: checked } : s);
                    toast.success(checked ? "Impulse enabled" : "Impulse disabled");
                  } else {
                    toast.error("Failed to update");
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">Behavior</span>
            <div className="flex flex-wrap gap-2">
              {(["smooth", "linear", "pulse"] as const).map((mode) => {
                const active = settings?.impulse_mode === mode;
                return (
                  <button
                    key={mode}
                    onClick={async () => {
                      if (!settings || active) return;
                      const { error } = await supabase
                        .from("secret_door_settings" as any)
                        .update({ impulse_mode: mode, updated_at: new Date().toISOString() } as any)
                        .eq("id", settings.id);
                      if (!error) {
                        setSettings((s) => s ? { ...s, impulse_mode: mode } : s);
                        toast.success(`Mode: ${mode}`);
                      } else toast.error("Failed to update");
                    }}
                    className={`px-3 py-1.5 text-[10px] font-display tracking-[0.2em] uppercase border transition-colors ${
                      active
                        ? "border-foreground text-foreground bg-foreground/10"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              <strong>smooth</strong>: eases in/out at every corner. <strong>linear</strong>: constant speed.
              <strong> pulse</strong>: linear motion with breathing scale & opacity.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">Speed (sec / loop)</span>
              <input
                type="number"
                step="0.5"
                min={0.5}
                max={20}
                value={draftImpulseSpeed}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setDraftImpulseSpeed(v);
                  setImpulseDirty(v !== settings?.impulse_speed || draftImpulseColor !== settings?.impulse_color);
                }}
                className="w-24 p-2 bg-transparent border border-border text-sm font-body text-foreground outline-none focus:border-foreground transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draftImpulseColor}
                  onChange={(e) => {
                    setDraftImpulseColor(e.target.value);
                    setImpulseDirty(e.target.value !== settings?.impulse_color || draftImpulseSpeed !== settings?.impulse_speed);
                  }}
                  className="w-10 h-10 bg-transparent border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={draftImpulseColor}
                  onChange={(e) => {
                    setDraftImpulseColor(e.target.value);
                    setImpulseDirty(e.target.value !== settings?.impulse_color || draftImpulseSpeed !== settings?.impulse_speed);
                  }}
                  className="w-28 p-2 bg-transparent border border-border text-sm font-body text-foreground outline-none focus:border-foreground transition-colors"
                />
              </div>
            </label>
          </div>
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            Higher seconds = slower. Impulse eases in/out at every corner automatically.
          </p>
          {impulseDirty && (
            <div className="flex items-center gap-2">
              <button
                onClick={saveImpulse}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Check size={10} /> YES
              </button>
              <button
                onClick={() => {
                  setDraftImpulseSpeed(Number(settings?.impulse_speed ?? 4));
                  setDraftImpulseColor(settings?.impulse_color ?? "#ffffff");
                  setImpulseDirty(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={10} /> NO
              </button>
            </div>
          )}
        </section>

        {/* BACKGROUND (image) */}
        <section className="border border-border p-4 space-y-3">
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
            Secret Door Background Image
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

        {/* MUSIC ON/OFF */}
        <section className="border border-border p-4 space-y-3">
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
            Secret Door Music (VOL)
          </p>
          <div className="flex items-center gap-3">
            {settings?.music_enabled ? <Volume2 size={16} className="text-foreground" /> : <VolumeX size={16} className="text-muted-foreground" />}
            <Switch
              checked={settings?.music_enabled ?? true}
              onCheckedChange={async (checked) => {
                if (!settings) return;
                const { error } = await supabase
                  .from("secret_door_settings" as any)
                  .update({ music_enabled: checked, updated_at: new Date().toISOString() } as any)
                  .eq("id", settings.id);
                if (!error) {
                  setSettings((s) => s ? { ...s, music_enabled: checked } : s);
                  toast.success(checked ? "Music ON" : "Music OFF");
                }
              }}
            />
            <span className="text-xs text-muted-foreground">{settings?.music_enabled ? "ON" : "OFF"}</span>
          </div>
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

        {/* SECRET ROOM QUADRANTS */}
        <section className="border border-border p-4 space-y-4">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
              Secret Room — Quadrants
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Upload an interactive .html page per quadrant. It will play inside a sandboxed frame when a visitor opens that quadrant.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "tl", label: "01 — Top Left" },
              { id: "tr", label: "02 — Top Right" },
              { id: "bl", label: "03 — Bottom Left" },
              { id: "br", label: "04 — Bottom Right" },
            ].map((q) => (
              <div
                key={q.id}
                className="border border-border aspect-video p-3 flex flex-col justify-between hover:border-foreground/60 transition-colors"
              >
                <p className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
                  {q.label}
                </p>
                <div className="flex-1 flex items-center justify-center">
                  {quadrants[q.id]?.html_content ? (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <Code2 size={14} className="text-foreground/60" />
                      <span className="text-[9px] font-display tracking-[0.2em] uppercase text-muted-foreground truncate max-w-[140px]">
                        {quadrants[q.id]?.file_name || "HTML loaded"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-display tracking-[0.3em] text-muted-foreground/40">
                      EMPTY
                    </span>
                  )}
                </div>
                <button
                  onClick={() => openQuadrantEditor(q.id)}
                  className="self-end px-2 py-1 text-[10px] font-display tracking-[0.2em] uppercase border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* QUADRANT EDIT OVERLAY */}
      {editingQuadrant && (
        <div
          className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm"
          style={{ padding: 40 }}
        >
          <div className="relative h-full w-full border border-border bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
              <button
                onClick={closeQuadrantEditor}
                className="flex items-center gap-2 text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <p className="text-[10px] font-display tracking-[0.3em] uppercase text-foreground">
                Edit Quadrant — {QUAD_LABELS[editingQuadrant]}
              </p>
              <div className="flex items-center gap-2">
                {draftHtml && (
                  <button
                    onClick={clearQuadrant}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-[0.2em] uppercase border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                  >
                    <Trash2 size={10} /> Clear
                  </button>
                )}
                <button
                  onClick={saveQuadrant}
                  disabled={!quadDirty || quadSaving}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-display tracking-[0.2em] uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {quadSaving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Save
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              {/* Left: source / upload */}
              <div className="flex flex-col border-r border-border min-h-0">
                <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border shrink-0">
                  <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
                    HTML Source {draftFileName ? `· ${draftFileName}` : ""}
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-[10px] font-display tracking-[0.2em] uppercase">
                    <Upload size={10} /> Upload .html
                    <input
                      ref={quadFileInputRef}
                      type="file"
                      accept=".html,.htm,text/html"
                      className="hidden"
                      onChange={onUploadQuadrantHtml}
                    />
                  </label>
                </div>
                <textarea
                  value={draftHtml}
                  onChange={(e) => { setDraftHtml(e.target.value); setQuadDirty(true); }}
                  placeholder="<!doctype html>&#10;<html>…</html>"
                  spellCheck={false}
                  className="flex-1 w-full p-3 bg-transparent text-xs font-mono text-foreground outline-none resize-none"
                />
              </div>

              {/* Right: preview */}
              <div className="flex flex-col min-h-0">
                <div className="px-4 py-2 border-b border-border shrink-0">
                  <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
                    Live Preview (sandboxed)
                  </span>
                </div>
                <div className="flex-1 bg-background overflow-hidden">
                  {draftHtml ? (
                    <iframe
                      title="Quadrant Preview"
                      srcDoc={draftHtml}
                      sandbox="allow-scripts allow-pointer-lock"
                      className="w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-[10px] font-display tracking-[0.3em] text-muted-foreground/50">
                        EMPTY — Upload an .html file or paste source on the left
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecretDoor;
