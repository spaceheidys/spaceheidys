import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Sliders, ChevronDown, ChevronUp } from "lucide-react";

const ICON_KEYS = ["none", "star", "heart", "sparkles", "sun", "moon", "cloud", "zap"] as const;
const FACE_LABELS = ["01 · Front", "02 · Right", "03 · Back", "04 · Left", "05 · Top", "06 · Bottom"];

interface CubeFace {
  id: number;
  title: string;
  text: string;
  icon: string;
  image_url: string | null;
  image_scale: number;
  image_x: number;
  image_y: number;
}

const CubeFacesSection = () => {
  const [faces, setFaces] = useState<CubeFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [adjustOpen, setAdjustOpen] = useState<Record<number, boolean>>({});
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const fetchFaces = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("cube_faces").select("*").order("id");
    if (error) toast.error("Failed to load cube faces");
    else setFaces((data as CubeFace[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchFaces(); }, []);

  const updateLocal = (id: number, patch: Partial<CubeFace>) => {
    setFaces((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const persist = (id: number, patch: Partial<CubeFace>, debounce = false) => {
    const run = async () => {
      const { error } = await supabase.from("cube_faces").update(patch).eq("id", id);
      if (error) toast.error("Save failed");
    };
    if (debounce) {
      if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
      saveTimers.current[id] = setTimeout(run, 400);
    } else run();
  };

  const handleUpload = async (id: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingId(id);
    const ext = file.name.split(".").pop();
    const path = `cube/${id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploadingId(null); return; }
    const { data } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    updateLocal(id, { image_url: data.publicUrl });
    await persist(id, { image_url: data.publicUrl });
    setUploadingId(null);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {faces.map((face) => (
        <div key={face.id} className="border border-border p-4 space-y-3">
          <p className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">{FACE_LABELS[face.id]}</p>

          <div className="flex gap-3">
            <label className="relative shrink-0 w-24 h-24 border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/40 overflow-hidden bg-background">
              {uploadingId === face.id ? (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              ) : face.image_url ? (
                <img
                  src={face.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: `${50 + (face.image_x ?? 0) * 50}% ${50 + (face.image_y ?? 0) * 50}%`,
                    transform: `scale(${face.image_scale ?? 1})`,
                  }}
                />
              ) : (
                <Upload size={14} className="text-muted-foreground/40" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (f) handleUpload(face.id, f); e.target.value = "";
              }} />
            </label>
            <div className="flex-1 space-y-2">
              <input
                value={face.title}
                onChange={(e) => { updateLocal(face.id, { title: e.target.value }); persist(face.id, { title: e.target.value }, true); }}
                placeholder="Title"
                className="w-full bg-transparent border border-border px-2 py-1.5 text-xs font-display tracking-widest outline-none focus:border-foreground"
              />
              <textarea
                value={face.text}
                onChange={(e) => { updateLocal(face.id, { text: e.target.value }); persist(face.id, { text: e.target.value }, true); }}
                placeholder="Text"
                rows={2}
                className="w-full bg-transparent border border-border px-2 py-1.5 text-xs outline-none focus:border-foreground resize-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-display tracking-widest uppercase text-muted-foreground/60">Icon</p>
            <div className="flex flex-wrap gap-1">
              {ICON_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => { updateLocal(face.id, { icon: k }); persist(face.id, { icon: k }); }}
                  className={`px-2 py-1 text-[9px] font-display tracking-[0.15em] uppercase border transition-colors ${face.icon === k ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {face.image_url && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setAdjustOpen((s) => ({ ...s, [face.id]: !s[face.id] }))}
                  className="inline-flex items-center gap-1.5 text-[9px] font-display tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Sliders size={10} /> Adjust image
                  {adjustOpen[face.id] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                <button
                  onClick={() => { updateLocal(face.id, { image_url: null }); persist(face.id, { image_url: null }); }}
                  className="inline-flex items-center gap-1.5 text-[9px] font-display tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={10} /> Remove
                </button>
              </div>

              {adjustOpen[face.id] && (
                <div className="flex gap-3 pt-2 border-t border-border">
                  {/* Live preview as it appears on a cube face */}
                  <div className="shrink-0 w-24 h-24 border border-border overflow-hidden bg-black relative">
                    <img
                      src={face.image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        objectPosition: `${50 + (face.image_x ?? 0) * 50}% ${50 + (face.image_y ?? 0) * 50}%`,
                        transform: `scale(${face.image_scale ?? 1})`,
                      }}
                    />
                    <span className="absolute bottom-1 left-1 text-[8px] font-display tracking-widest uppercase text-white/60">Live</span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 gap-2">
                    <label className="text-[9px] font-display tracking-widest uppercase text-muted-foreground/60 flex items-center gap-2">
                      <span className="w-10">Zoom</span>
                      <input type="range" min={0.5} max={3} step={0.05} value={face.image_scale} className="flex-1"
                        onChange={(e) => { const v = parseFloat(e.target.value); updateLocal(face.id, { image_scale: v }); persist(face.id, { image_scale: v }, true); }} />
                      <span className="w-8 text-right tabular-nums">{(face.image_scale ?? 1).toFixed(2)}</span>
                    </label>
                    <label className="text-[9px] font-display tracking-widest uppercase text-muted-foreground/60 flex items-center gap-2">
                      <span className="w-10">X</span>
                      <input type="range" min={-1} max={1} step={0.05} value={face.image_x} className="flex-1"
                        onChange={(e) => { const v = parseFloat(e.target.value); updateLocal(face.id, { image_x: v }); persist(face.id, { image_x: v }, true); }} />
                      <span className="w-8 text-right tabular-nums">{(face.image_x ?? 0).toFixed(2)}</span>
                    </label>
                    <label className="text-[9px] font-display tracking-widest uppercase text-muted-foreground/60 flex items-center gap-2">
                      <span className="w-10">Y</span>
                      <input type="range" min={-1} max={1} step={0.05} value={face.image_y} className="flex-1"
                        onChange={(e) => { const v = parseFloat(e.target.value); updateLocal(face.id, { image_y: v }); persist(face.id, { image_y: v }, true); }} />
                      <span className="w-8 text-right tabular-nums">{(face.image_y ?? 0).toFixed(2)}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CubeFacesSection;