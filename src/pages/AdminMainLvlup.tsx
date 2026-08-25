import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Play, Pause, Volume2, VolumeX, Music } from "lucide-react";
import AdminTopNav from "@/components/admin/AdminTopNav";
import { useSectionContent } from "@/hooks/useSectionContent";
import { normalizeStreamUrl } from "@/components/LvlupRadio";

const BG_KEY = "lvlup_bg";

interface BgSectionProps {
  storageKey: string;
  title: string;
  get: (key: string) => string;
  update: (key: string, content: string) => Promise<void>;
}

const BgSection = ({ storageKey, title, get, update }: BgSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const bg = get(storageKey);
  const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(bg);

  const audioOnKey = `${storageKey}_audio_on`;
  const audioUrlKey = `${storageKey}_audio_url`;
  const audioOn = get(audioOnKey) === "1";
  const audioUrl = get(audioUrlKey);

  useEffect(() => {
    return () => {
      previewRef.current?.pause();
      previewRef.current = null;
    };
  }, []);

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
    await update(storageKey, data.publicUrl);
    setUploading(false);
    toast.success("Background updated");
  };

  const handleClear = async () => {
    await update(storageKey, "");
    toast.success("Background cleared");
  };

  const handleAudioUpload = async (file: File) => {
    setAudioUploading(true);
    const path = `lvlup/audio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      setAudioUploading(false);
      return;
    }
    const { data } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    await update(audioUrlKey, data.publicUrl);
    await update(audioOnKey, "1");
    setAudioUploading(false);
    toast.success("Music uploaded and enabled");
  };

  const toggleAudioPreview = () => {
    const src = normalizeStreamUrl(audioUrl);
    if (!src) {
      toast.error("Upload music or set a stream URL first");
      return;
    }
    let audio = previewRef.current;
    if (!audio || audio.src !== src) {
      audio?.pause();
      audio = new Audio(src);
      audio.loop = true;
      audio.onplay = () => setPreviewPlaying(true);
      audio.onpause = () => setPreviewPlaying(false);
      previewRef.current = audio;
    }
    if (audio.paused) {
      audio.play().catch(() => toast.error("Cannot play this audio"));
    } else {
      audio.pause();
    }
  };

  return (
    <section className="border border-border p-4 sm:p-6">
      <h2 className="font-display text-[11px] tracking-[0.3em] uppercase text-foreground mb-4">
        {title}
      </h2>

      <div className="aspect-video w-full border border-border bg-muted/20 overflow-hidden flex items-center justify-center mb-4">
        {bg ? (
          isVideo ? (
            <video src={bg} className="w-full h-full object-cover" autoPlay loop muted playsInline />
          ) : (
            <img src={bg} alt={`${title} preview`} className="w-full h-full object-cover" />
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
          accept="image/*,video/*,.gif,.webp,.mp4,.webm,.mov,.ogg"
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

      <p className="mt-3 font-display text-[9px] tracking-widest uppercase text-muted-foreground/60">
        Supported: images (jpg, png, gif, webp) and video (mp4, webm, mov, ogg)
      </p>

      {/* Per-screen audio: uploaded music file or stream URL, toggled on/off */}
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">
            Audio (music or stream)
          </span>
          <button
            onClick={() => update(audioOnKey, audioOn ? "0" : "1")}
            className={`border px-3 py-1 font-display text-[10px] tracking-widest uppercase transition-colors ${
              audioOn
                ? "border-foreground text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {audioOn ? "On" : "Off"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*,.mp3,.ogg,.wav,.m4a,.aac,.flac"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAudioUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => audioInputRef.current?.click()}
            disabled={audioUploading}
            className="flex items-center gap-2 border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {audioUploading ? <Loader2 size={12} className="animate-spin" /> : <Music size={12} />}
            Upload music
          </button>
          <button
            onClick={toggleAudioPreview}
            className="flex items-center gap-2 border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-foreground hover:bg-muted transition-colors"
          >
            {previewPlaying ? <Pause size={12} /> : <Play size={12} />}
            {previewPlaying ? "Stop" : "Preview"}
          </button>
          {audioUrl && (
            <button
              onClick={async () => {
                previewRef.current?.pause();
                await update(audioUrlKey, "");
                toast.success("Audio cleared");
              }}
              className="flex items-center gap-2 border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>

        <label className="block space-y-1">
          <span className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">
            Stream URL (radio) — used if no music file is uploaded
          </span>
          <input
            key={audioUrl}
            defaultValue={audioUrl}
            onBlur={(e) => update(audioUrlKey, e.target.value.trim())}
            className="w-full bg-transparent border border-border px-3 py-2 text-xs text-foreground outline-none focus:border-foreground"
            placeholder="https://ice1.somafm.com/dronezone-128-mp3"
          />
        </label>
      </div>
    </section>
  );
};

const AdminMainLvlup = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { get, update, loading: contentLoading } = useSectionContent();
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(false);

  const radioUrl = get("lvlup_radio_url");
  const radioVolume = Number(get("lvlup_radio_volume") || 15);

  useEffect(() => {
    return () => {
      previewRef.current?.pause();
      previewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (previewRef.current) previewRef.current.muted = previewMuted;
  }, [previewMuted]);

  const togglePreview = () => {
    const src = normalizeStreamUrl(radioUrl);
    if (!src) {
      toast.error("Set a stream URL first");
      return;
    }
    let audio = previewRef.current;
    if (!audio || audio.src !== src) {
      audio?.pause();
      audio = new Audio(src);
      audio.volume = Math.max(0, Math.min(100, radioVolume)) / 100;
      audio.muted = previewMuted;
      audio.onplay = () => setPreviewPlaying(true);
      audio.onpause = () => setPreviewPlaying(false);
      previewRef.current = audio;
    }
    if (audio.paused) {
      audio.volume = Math.max(0, Math.min(100, radioVolume)) / 100;
      audio.play().catch(() => toast.error("Cannot play this stream"));
    } else {
      audio.pause();
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [loading, user, navigate]);

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

      <main className="px-3 sm:px-8 py-8 max-w-3xl mx-auto space-y-6">
        <BgSection storageKey={BG_KEY} title="Background" get={get} update={update} />
        <BgSection storageKey="lvlup_sub1_bg" title="Screen 1 Background (top-right arrow)" get={get} update={update} />
        <BgSection storageKey="lvlup_sub2_bg" title="Screen 2 Background (bottom-right arrow)" get={get} update={update} />

        <section className="border border-border p-4 sm:p-6 space-y-4">
          <h2 className="font-display text-[11px] tracking-[0.3em] uppercase text-foreground">
            Radio
          </h2>

          <label className="block space-y-1">
            <span className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">
              Stream URL (direct audio stream, e.g. https://ice1.somafm.com/dronezone-128-mp3)
            </span>
            <input
              defaultValue={get("lvlup_radio_url")}
              onBlur={(e) => update("lvlup_radio_url", e.target.value.trim())}
              className="w-full bg-transparent border border-border px-3 py-2 text-xs text-foreground outline-none focus:border-foreground"
              placeholder="https://ice1.somafm.com/dronezone-128-mp3"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">
              Now playing URL (optional, JSON)
            </span>
            <input
              defaultValue={get("lvlup_radio_meta_url")}
              onBlur={(e) => update("lvlup_radio_meta_url", e.target.value.trim())}
              className="w-full bg-transparent border border-border px-3 py-2 text-xs text-foreground outline-none focus:border-foreground"
              placeholder="https://somafm.com/songs/dronezone.json"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePreview}
              className="flex items-center gap-2 border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-foreground hover:bg-muted transition-colors"
            >
              {previewPlaying ? <Pause size={12} /> : <Play size={12} />}
              {previewPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => setPreviewMuted((m) => !m)}
              className="flex items-center gap-2 border border-border px-3 py-2 font-display text-[10px] tracking-widest uppercase text-foreground hover:bg-muted transition-colors"
            >
              {previewMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              {previewMuted ? "Unmute" : "Mute"}
            </button>
          </div>

          <label className="block space-y-1">
            <span className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">
              Volume: {get("lvlup_radio_volume") || 15}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={Number(get("lvlup_radio_volume") || 15)}
              onChange={(e) => update("lvlup_radio_volume", e.target.value)}
              className="w-full"
            />
          </label>
        </section>
      </main>
    </div>
  );
};

export default AdminMainLvlup;
