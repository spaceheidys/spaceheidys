import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2 } from "lucide-react";
import AdminTopNav from "@/components/admin/AdminTopNav";
import { useSectionContent } from "@/hooks/useSectionContent";

const BG_KEY = "lvlup_bg";
const RADIO_KEY = "lvlup_radio_url";
const RADIO_META_KEY = "lvlup_radio_meta_url";
const RADIO_VOL_KEY = "lvlup_radio_volume";

const AdminMainLvlup = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { get, update, loading: contentLoading } = useSectionContent();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [radioUrl, setRadioUrl] = useState("");
  const [radioMeta, setRadioMeta] = useState("");
  const [radioVol, setRadioVol] = useState(20);

  useEffect(() => {
    if (contentLoading) return;
    setRadioUrl(get(RADIO_KEY));
    setRadioMeta(get(RADIO_META_KEY));
    setRadioVol(Number(get(RADIO_VOL_KEY)) || 20);
  }, [contentLoading]);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [loading, user, navigate]);

  const bg = get(BG_KEY);
  const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(bg);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `lvlup/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    await update(BG_KEY, data.publicUrl);
    setUploading(false);
    toast.success("Background updated");
  };

  const handleClear = async () => {
    await update(BG_KEY, "");
    toast.success("Background cleared");
  };

  if (loading || contentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">
          Access denied
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminTopNav current="lvlup" userId={user?.id} />

      <main className="px-3 sm:px-8 py-8 max-w-3xl mx-auto">
        <section className="border border-border p-4 sm:p-6">
          <h2 className="font-display text-[11px] tracking-[0.3em] uppercase text-foreground mb-4">
            Background
          </h2>

          <div className="aspect-video w-full border border-border bg-muted/20 overflow-hidden flex items-center justify-center mb-4">
            {bg ? (
              isVideo ? (
                <video src={bg} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <img src={bg} alt="LVLUP background preview" className="w-full h-full object-cover" />
              )
            ) : (
              <span className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">
                No background
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {bg ? "Replace" : "Upload"}
            </button>
            {bg && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
        </section>

        <section className="border border-border p-4 sm:p-6 mt-6">
          <h2 className="font-display text-[11px] tracking-[0.3em] uppercase text-foreground mb-4">
            Radio
          </h2>

          <label className="block font-display text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
            Stream URL
          </label>
          <input
            value={radioUrl}
            onChange={(e) => setRadioUrl(e.target.value)}
            placeholder="https://stream.example.com/live.mp3"
            className="w-full bg-transparent border border-border px-3 py-2 text-xs text-foreground mb-4 outline-none focus:border-foreground"
          />

          <label className="block font-display text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
            Now-playing URL (optional, JSON)
          </label>
          <input
            value={radioMeta}
            onChange={(e) => setRadioMeta(e.target.value)}
            placeholder="https://stream.example.com/status-json.xsl"
            className="w-full bg-transparent border border-border px-3 py-2 text-xs text-foreground mb-4 outline-none focus:border-foreground"
          />

          <label className="block font-display text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Volume — {radioVol}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={radioVol}
            onChange={(e) => setRadioVol(Number(e.target.value))}
            className="w-full mb-4 accent-foreground"
          />

          <button
            onClick={async () => {
              await update(RADIO_KEY, radioUrl.trim());
              await update(RADIO_META_KEY, radioMeta.trim());
              await update(RADIO_VOL_KEY, String(radioVol));
              toast.success("Radio settings saved");
            }}
            className="border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-foreground hover:bg-muted transition-colors"
          >
            Save
          </button>
        </section>
      </main>
    </div>
  );
};

export default AdminMainLvlup;
