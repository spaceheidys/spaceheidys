import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Image as ImageIcon, Sliders, ChevronDown, ChevronUp } from "lucide-react";

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
  const liveChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const ch = supabase.channel("cube_faces_live", { config: { broadcast: { self: false } } });
    ch.subscribe();
    liveChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, []);

  const broadcastLive = (id: number, patch: Partial<CubeFace>) => {
    liveChannelRef.current?.send({ type: "broadcast", event: "face_preview", payload: { id, patch } });
  };

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
                  <div
                    className="shrink-0 w-24 h-24 border border-border overflow-hidden bg-black relative cursor-move touch-none select-none"
                    onPointerDown={(e) => {
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startVX = face.image_x ?? 0;
                      const startVY = face.image_y ?? 0;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      let pending: { x: number; y: number } | null = null;
                      let rafId: number | null = null;
                      const flush = () => {
                        rafId = null;
                        if (!pending) return;
                        const { x, y } = pending;
                        broadcastLive(face.id, { image_x: x, image_y: y });
                        persist(face.id, { image_x: x, image_y: y }, true);
                      };
                      const move = (ev: PointerEvent) => {
                        const dx = (ev.clientX - startX) / rect.width;
                        const dy = (ev.clientY - startY) / rect.height;
                        const nx = Math.max(-1, Math.min(1, startVX - dx * 2));
                        const ny = Math.max(-1, Math.min(1, startVY - dy * 2));
                        // 1) instant admin preview
                        updateLocal(face.id, { image_x: nx, image_y: ny });
                        // 2) throttle network broadcast + save
                        pending = { x: nx, y: ny };
                        if (rafId == null) rafId = requestAnimationFrame(flush);
                      };
                      const up = () => {
                        window.removeEventListener("pointermove", move);
                        window.removeEventListener("pointerup", up);
                        if (rafId != null) cancelAnimationFrame(rafId);
                        if (pending) {
                          broadcastLive(face.id, { image_x: pending.x, image_y: pending.y });
                          persist(face.id, { image_x: pending.x, image_y: pending.y }, true);
                        }
                      };
                      window.addEventListener("pointermove", move);
                      window.addEventListener("pointerup", up);
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      const cur = face.image_scale ?? 1;
                      const next = Math.max(0.5, Math.min(3, cur - e.deltaY * 0.002));
                      updateLocal(face.id, { image_scale: next });
                      broadcastLive(face.id, { image_scale: next });
                      persist(face.id, { image_scale: next }, true);
                    }}
                  >
                    <img
                      src={face.image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{
                        objectPosition: `${50 + (face.image_x ?? 0) * 50}% ${50 + (face.image_y ?? 0) * 50}%`,
                        transform: `scale(${face.image_scale ?? 1})`,
                      }}
                      draggable={false}
                    />
                    <span className="absolute bottom-1 left-1 text-[8px] font-display tracking-widest uppercase text-white/60 pointer-events-none">Drag · Scroll</span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 gap-2">
                    <label className="text-[9px] font-display tracking-widest uppercase text-muted-foreground/60 flex items-center gap-2">
                      <span className="w-10">Zoom</span>
                      <input type="range" min={0.5} max={3} step={0.05} value={face.image_scale} className="flex-1"
                        onChange={(e) => { const v = parseFloat(e.target.value); updateLocal(face.id, { image_scale: v }); broadcastLive(face.id, { image_scale: v }); persist(face.id, { image_scale: v }, true); }} />
                      <span className="w-8 text-right tabular-nums">{(face.image_scale ?? 1).toFixed(2)}</span>
                    </label>
                    <label className="text-[9px] font-display tracking-widest uppercase text-muted-foreground/60 flex items-center gap-2">
                      <span className="w-10">X</span>
                      <input type="range" min={-1} max={1} step={0.05} value={face.image_x} className="flex-1"
                        onChange={(e) => { const v = parseFloat(e.target.value); updateLocal(face.id, { image_x: v }); broadcastLive(face.id, { image_x: v }); persist(face.id, { image_x: v }, true); }} />
                      <span className="w-8 text-right tabular-nums">{(face.image_x ?? 0).toFixed(2)}</span>
                    </label>
                    <label className="text-[9px] font-display tracking-widest uppercase text-muted-foreground/60 flex items-center gap-2">
                      <span className="w-10">Y</span>
                      <input type="range" min={-1} max={1} step={0.05} value={face.image_y} className="flex-1"
                        onChange={(e) => { const v = parseFloat(e.target.value); updateLocal(face.id, { image_y: v }); broadcastLive(face.id, { image_y: v }); persist(face.id, { image_y: v }, true); }} />
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