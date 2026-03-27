import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, Square, Upload, Loader2, Check, X, Volume2, VolumeX } from "lucide-react";

interface SoundItem {
  key: string;
  label: string;
  defaultPath: string;
  muteKey: string;
}

const SOUNDS: SoundItem[] = [
  { key: "audio_main_music", label: "Main Music", defaultPath: "/audio/main_buddhist.mp3", muteKey: "audio_main_music_muted" },
  { key: "audio_bell_sound", label: "Bell Sound", defaultPath: "/audio/bell-sounds.mp3", muteKey: "audio_bell_sound_muted" },
  { key: "audio_flipcard_sound", label: "Flip Card Sound", defaultPath: "/audio/flipcard_sound.mp3", muteKey: "audio_flipcard_sound_muted" },
  { key: "audio_secret_door", label: "Secret Door Music", defaultPath: "/audio/Cyberpunk_secret_door.mp3", muteKey: "audio_secret_door_muted" },
];

interface Props {
  getContent: (key: string) => string;
  updateContent: (key: string, value: string) => Promise<void>;
  siteMusicOn: boolean;
  onToggleMusic: () => void;
  confirmingToggle: boolean;
  onConfirmToggle: () => void;
  onCancelToggle: () => void;
}

const SoundConfigSection = ({
  getContent, updateContent,
  siteMusicOn, onToggleMusic, confirmingToggle, onConfirmToggle, onCancelToggle,
}: Props) => {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ key: string; file: File } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingKey = useRef<string | null>(null);

  const getUrl = (item: SoundItem) => {
    const custom = getContent(item.key);
    return custom || item.defaultPath;
  };

  const isMuted = (item: SoundItem) => getContent(item.muteKey) === "true";
  const isCustom = (item: SoundItem) => !!getContent(item.key);

  const toggleMute = async (item: SoundItem) => {
    const newVal = isMuted(item) ? "" : "true";
    await updateContent(item.muteKey, newVal);
    toast.success(newVal ? `${item.label} muted` : `${item.label} unmuted`);
  };

  const playPreview = (item: SoundItem) => {
    if (playingKey === item.key) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingKey(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(getUrl(item));
    audio.onended = () => setPlayingKey(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingKey(item.key);
  };

  const triggerUpload = (key: string) => {
    pendingKey.current = key;
    fileRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = pendingKey.current;
    if (!file || !key) return;
    if (!file.type.startsWith("audio/")) { toast.error("Audio files only"); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("Max 15MB"); return; }
    setPendingFile({ key, file });
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    const { key, file } = pendingFile;
    setUploading(key);
    const ext = file.name.split(".").pop();
    const path = `audio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(null); setPendingFile(null); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    await updateContent(key, urlData.publicUrl);
    toast.success("Sound replaced");
    setUploading(null);
    setConfirmReplace(null);
    setPendingFile(null);
  };

  const cancelUpload = () => {
    setPendingFile(null);
  };

  const resetToDefault = async (item: SoundItem) => {
    await updateContent(item.key, "");
    toast.success("Reset to default");
    setConfirmReplace(null);
  };

  return (
    <div className="space-y-3 border-t border-border pt-4 pb-2">
      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />

      {/* Global toggle */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">Site Music</p>
        {confirmingToggle ? (
          <span className="flex items-center gap-1">
            <button onClick={onConfirmToggle} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"><Check size={9} /> YES</button>
            <button onClick={onCancelToggle} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"><X size={9} /> NO</button>
          </span>
        ) : (
          <button onClick={onToggleMusic} className={`px-3 py-1.5 border text-xs font-display tracking-[0.2em] uppercase transition-colors ${siteMusicOn ? "border-foreground text-foreground bg-foreground/10" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"}`}>
            {siteMusicOn ? "ON" : "OFF"}
          </button>
        )}
      </div>

      {/* Sound list */}
      <div className="space-y-1.5">
        {SOUNDS.map((item) => {
          const muted = isMuted(item);
          return (
            <div key={item.key} className="space-y-1">
              <div className={`group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors ${muted ? "opacity-40" : ""}`}>
                {/* Mute toggle */}
                <button
                  onClick={() => toggleMute(item)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>

                {/* Play/Stop */}
                <button
                  onClick={() => playPreview(item)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  title={playingKey === item.key ? "Stop" : "Play"}
                >
                  {playingKey === item.key ? <Square size={11} /> : <Play size={11} />}
                </button>

                {/* Label */}
                <span className="text-xs font-display tracking-wider text-foreground/80 flex-1">
                  {item.label}
                </span>

                {/* Custom badge */}
                {isCustom(item) && (
                  <span className="text-[8px] font-display tracking-wider text-yellow-400 uppercase">custom</span>
                )}

                {/* Replace / Reset */}
                {confirmReplace === item.key ? (
                  <span className="flex items-center gap-1">
                    <button
                      onClick={() => triggerUpload(item.key)}
                      className="text-[8px] font-display tracking-wider text-foreground/70 hover:text-foreground transition-colors border border-border px-1.5 py-0.5"
                    >
                      UPLOAD
                    </button>
                    {isCustom(item) && (
                      <button
                        onClick={() => resetToDefault(item)}
                        className="text-[8px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors border border-border px-1.5 py-0.5"
                      >
                        DEFAULT
                      </button>
                    )}
                    <button onClick={() => setConfirmReplace(null)} className="text-muted-foreground hover:text-foreground"><X size={9} /></button>
                  </span>
                ) : uploading === item.key ? (
                  <Loader2 size={11} className="animate-spin text-muted-foreground" />
                ) : (
                  <button
                    onClick={() => setConfirmReplace(item.key)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                    title="Replace sound"
                  >
                    <Upload size={11} />
                  </button>
                )}
              </div>

              {/* Upload confirmation YES/NO */}
              {pendingFile?.key === item.key && (
                <div className="flex items-center gap-2 ml-6 px-2 py-1 border border-border/50 bg-muted/20 rounded">
                  <span className="text-[9px] font-display tracking-widest text-muted-foreground truncate flex-1">
                    Replace with "{pendingFile.file.name}"?
                  </span>
                  <button
                    onClick={confirmUpload}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Check size={9} /> YES
                  </button>
                  <button
                    onClick={cancelUpload}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground transition-colors"
                  >
                    <X size={9} /> NO
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SoundConfigSection;
