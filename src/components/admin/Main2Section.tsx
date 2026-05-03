import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Trash2, Check, X, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import taroBackside from "@/assets/Taro_backside.png";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Main2SectionProps {
  get: (key: string) => string;
  update: (key: string, content: string) => Promise<void>;
}

/** Inline YES / NO confirmation button pair */
function ConfirmButtons({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <button
        onClick={onYes}
        className="flex items-center gap-0.5 px-2 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"
      >
        <Check size={9} /> YES
      </button>
      <button
        onClick={onNo}
        className="flex items-center gap-0.5 px-2 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"
      >
        <X size={9} /> NO
      </button>
    </span>
  );
}

const Main2Section = ({ get, update }: Main2SectionProps) => {
  const [wisdomText, setWisdomText] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [frontImages, setFrontImages] = useState<{url: string; text: string}[]>([]);
  const [backImage, setBackImage] = useState("");
  const [backImages, setBackImages] = useState<{url: string; weight: number}[]>([]);
  const [bgType, setBgType] = useState("polygon");
  const [bgVideo, setBgVideo] = useState("");
  const [bgWallpaper, setBgWallpaper] = useState("");
  const [bgOpacity, setBgOpacity] = useState(40);
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; key: string } | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("admin_main2_collapsed");
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });
  const frontRef = useRef<HTMLInputElement>(null);
  const frontMultiRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const backMultiRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const wallpaperRef = useRef<HTMLInputElement>(null);

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("admin_main2_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all keys present
        const defaults = ["text", "cards", "card_images"];
        const valid = parsed.filter((k: string) => defaults.includes(k));
        defaults.forEach(k => { if (!valid.includes(k)) valid.push(k); });
        return valid;
      }
    } catch {}
    return ["text", "cards", "card_images"];
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        const next = arrayMove(prev, oldIndex, newIndex);
        localStorage.setItem("admin_main2_order", JSON.stringify(next));
        return next;
      });
    }
  };

  const toggleCollapse = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem("admin_main2_collapsed", JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    setWisdomText(get("cards_wisdom"));
    setFrontImage(get("card_front_image"));
    try {
      const parsed = JSON.parse(get("card_front_images") || "[]");
      if (Array.isArray(parsed)) {
        // Support legacy string[] format
        setFrontImages(parsed.map((item: any) => typeof item === "string" ? { url: item, text: "" } : item));
      }
    } catch { setFrontImages([]); }
    setBackImage(get("card_back_image"));
    try {
      const parsed = JSON.parse(get("card_back_images") || "[]");
      if (Array.isArray(parsed)) {
        setBackImages(parsed.map((item: any) => typeof item === "string" ? { url: item, weight: 1 } : { url: item.url, weight: Number(item.weight) || 1 }));
      }
    } catch { setBackImages([]); }
    setBgType(get("card_bg_type") || "polygon");
    setBgVideo(get("card_bg_video"));
    setBgWallpaper(get("card_bg_wallpaper"));
    setBgOpacity(parseInt(get("card_bg_video_opacity") || "40", 10));
  }, [get]);

  const handleSave = async () => {
    await update("cards_wisdom", wisdomText);
    toast.success("Saved");
  };

  const handleImageUpload = async (file: File, key: string) => {
    setUploading(key);
    const ext = file.name.split(".").pop();
    const path = `cards/${key}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    await update(key, url);
    if (key === "card_front_image") setFrontImage(url);
    else if (key === "card_back_image") setBackImage(url);
    toast.success("Image updated");
    setUploading(null);
  };

  const handleAddFrontImage = async (file: File) => {
    setUploading("card_front_images");
    const ext = file.name.split(".").pop();
    const path = `cards/front_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    const updated = [...frontImages, { url, text: "" }];
    setFrontImages(updated);
    await update("card_front_images", JSON.stringify(updated));
    toast.success("Front image added");
    setUploading(null);
  };

  const handleRemoveFrontImage = async (index: number) => {
    const updated = frontImages.filter((_, i) => i !== index);
    setFrontImages(updated);
    await update("card_front_images", JSON.stringify(updated));
    toast.success("Image removed");
  };

  const handleUpdateFrontImageText = async (index: number, text: string) => {
    const updated = frontImages.map((item, i) => i === index ? { ...item, text } : item);
    setFrontImages(updated);
    await update("card_front_images", JSON.stringify(updated));
  };

  const handleAddBackImage = async (file: File) => {
    setUploading("card_back_images");
    const ext = file.name.split(".").pop();
    const path = `cards/back_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    const updated = [...backImages, { url, weight: 1 }];
    setBackImages(updated);
    await update("card_back_images", JSON.stringify(updated));
    toast.success("Back image added");
    setUploading(null);
  };

  const handleRemoveBackImage = async (index: number) => {
    const updated = backImages.filter((_, i) => i !== index);
    setBackImages(updated);
    await update("card_back_images", JSON.stringify(updated));
    toast.success("Image removed");
  };

  const handleUpdateBackImageWeight = async (index: number, weight: number) => {
    const updated = backImages.map((item, i) => i === index ? { ...item, weight } : item);
    setBackImages(updated);
    await update("card_back_images", JSON.stringify(updated));
  };

  const handleVideoUpload = async (file: File) => {
    setUploading("card_bg_video");
    const ext = file.name.split(".").pop();
    const path = `cards/bg_video_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    await update("card_bg_video", url);
    setBgVideo(url);
    toast.success("Video uploaded");
    setUploading(null);
  };

  const handleClear = async (key: string) => {
    await update(key, "");
    if (key === "card_front_image") setFrontImage("");
    else if (key === "card_back_image") setBackImage("");
    else if (key === "card_bg_video") setBgVideo("");
    else if (key === "card_bg_wallpaper") setBgWallpaper("");
    toast.success("Reset to default");
  };

  const handleWallpaperUpload = async (file: File) => {
    setUploading("card_bg_wallpaper");
    const ext = file.name.split(".").pop();
    const path = `cards/bg_wallpaper_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    await update("card_bg_wallpaper", url);
    setBgWallpaper(url);
    toast.success("Wallpaper uploaded");
    setUploading(null);
  };

  const handleBgTypeChange = async (type: string) => {
    setBgType(type);
    await update("card_bg_type", type);
    const labels: Record<string, string> = { polygon: "Polygon background active", video: "Video background active", wallpaper: "Wallpaper background active" };
    toast.success(labels[type] || "Background updated");
  };

  // Helper: request confirmation for an action
  const askConfirm = (action: string) => setConfirm(action);
  const cancelConfirm = () => { setConfirm(null); setPendingFile(null); if (pendingPreviewUrl) { URL.revokeObjectURL(pendingPreviewUrl); setPendingPreviewUrl(null); } };

  const executeConfirm = async () => {
    if (!confirm) return;
    if (confirm === "save_wisdom") await handleSave();
    else if (confirm === "bg_polygon") await handleBgTypeChange("polygon");
    else if (confirm === "bg_video") await handleBgTypeChange("video");
    else if (confirm === "clear_card_front_image") await handleClear("card_front_image");
    else if (confirm === "clear_card_back_image") await handleClear("card_back_image");
    else if (confirm === "clear_card_bg_video") await handleClear("card_bg_video");
    else if (confirm === "bg_wallpaper") await handleBgTypeChange("wallpaper");
    else if (confirm === "upload_card_bg_wallpaper" && pendingFile) await handleWallpaperUpload(pendingFile.file);
    else if (confirm === "clear_card_bg_wallpaper") await handleClear("card_bg_wallpaper");
    else if (confirm === "upload_card_front_image" && pendingFile) await handleImageUpload(pendingFile.file, "card_front_image");
    else if (confirm === "upload_card_back_image" && pendingFile) await handleImageUpload(pendingFile.file, "card_back_image");
    else if (confirm === "upload_card_bg_video" && pendingFile) await handleVideoUpload(pendingFile.file);
    else if (confirm === "upload_card_front_multi" && pendingFile) await handleAddFrontImage(pendingFile.file);
    else if (confirm === "upload_card_back_multi" && pendingFile) await handleAddBackImage(pendingFile.file);
    else if (confirm?.startsWith("remove_front_")) {
      const idx = parseInt(confirm.replace("remove_front_", ""), 10);
      if (!isNaN(idx)) await handleRemoveFrontImage(idx);
    }
    else if (confirm?.startsWith("remove_back_")) {
      const idx = parseInt(confirm.replace("remove_back_", ""), 10);
      if (!isNaN(idx)) await handleRemoveBackImage(idx);
    }
    setConfirm(null);
    setPendingFile(null);
    if (pendingPreviewUrl) { URL.revokeObjectURL(pendingPreviewUrl); setPendingPreviewUrl(null); }
  };

  const handleFileSelect = (file: File, key: string, uploadKey: string) => {
    setPendingFile({ file, key });
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    if (file.type.startsWith("image/")) {
      setPendingPreviewUrl(URL.createObjectURL(file));
    } else {
      setPendingPreviewUrl(null);
    }
    askConfirm(uploadKey);
  };

  const sectionLabels: Record<string, string> = {
    text: "Text above cards",
    cards: "Cards — Background",
    card_images: "Card Images",
  };

  const sectionContent: Record<string, React.ReactNode> = {
    text: (
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={wisdomText}
            onChange={(e) => setWisdomText(e.target.value)}
            placeholder="The cards know what the mind has forgotten"
            className="flex-1 bg-transparent border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-colors"
          />
          {confirm === "save_wisdom" ? (
            <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
          ) : (
            <button
              onClick={() => askConfirm("save_wisdom")}
              className="px-4 py-2 border border-border text-xs font-display tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </div>
    ),
    cards: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {confirm === "bg_polygon" ? (
            <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase border border-foreground text-foreground">
              Polygon? <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
            </span>
          ) : (
            <button
              onClick={() => bgType !== "polygon" ? askConfirm("bg_polygon") : undefined}
              className={`px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase transition-colors border ${
                bgType === "polygon"
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Polygon
            </button>
          )}
          {confirm === "bg_video" ? (
            <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase border border-foreground text-foreground">
              Video? <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
            </span>
          ) : (
            <button
              onClick={() => bgType !== "video" ? askConfirm("bg_video") : undefined}
              className={`px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase transition-colors border ${
                bgType === "video"
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Video
            </button>
          )}
          {confirm === "bg_wallpaper" ? (
            <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase border border-foreground text-foreground">
              Wallpaper? <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
            </span>
          ) : (
            <button
              onClick={() => bgType !== "wallpaper" ? askConfirm("bg_wallpaper") : undefined}
              className={`px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase transition-colors border ${
                bgType === "wallpaper"
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Wallpaper
            </button>
          )}
        </div>

        {bgType === "wallpaper" && (
          <div className="space-y-2">
            {bgWallpaper ? (
              <div className="relative group border border-border aspect-video overflow-hidden">
                <img src={bgWallpaper} alt="Wallpaper" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                  {confirm === "upload_card_bg_wallpaper" ? (
                    <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                  ) : (
                    <label className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer">
                      {uploading === "card_bg_wallpaper" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      <input
                        ref={wallpaperRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelect(f, "card_bg_wallpaper", "upload_card_bg_wallpaper");
                          if (wallpaperRef.current) wallpaperRef.current.value = "";
                        }}
                        disabled={!!uploading}
                      />
                    </label>
                  )}
                  {confirm === "clear_card_bg_wallpaper" ? (
                    <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                  ) : (
                    <button
                      onClick={() => askConfirm("clear_card_bg_wallpaper")}
                      className="p-2 border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {confirm === "upload_card_bg_wallpaper" ? (
                  <div className="flex items-center justify-center gap-2 border border-dashed border-foreground aspect-video text-foreground">
                    <span className="text-xs font-display tracking-[0.2em] uppercase">Upload?</span>
                    <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-border aspect-video cursor-pointer text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                    {uploading === "card_bg_wallpaper" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span className="text-xs font-display tracking-[0.2em] uppercase">Upload image</span>
                    <input
                      ref={wallpaperRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f, "card_bg_wallpaper", "upload_card_bg_wallpaper");
                        if (wallpaperRef.current) wallpaperRef.current.value = "";
                      }}
                      disabled={!!uploading}
                    />
                  </label>
                )}
              </>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-muted-foreground font-display tracking-widest uppercase shrink-0">Opacity</span>
              <input type="range" min="5" max="100" step="5" value={bgOpacity}
                onChange={(e) => setBgOpacity(parseInt(e.target.value, 10))}
                onMouseUp={() => update("card_bg_video_opacity", String(bgOpacity))}
                onTouchEnd={() => update("card_bg_video_opacity", String(bgOpacity))}
                className="flex-1 h-1 appearance-none bg-border rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
              />
              <span className="text-[10px] text-muted-foreground font-display w-8 text-right">{bgOpacity}%</span>
            </div>
          </div>
        )}

        {bgType === "video" && (
          <div className="space-y-2">
            {bgVideo ? (
              <div className="relative group border border-border aspect-video overflow-hidden">
                <video src={bgVideo} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                  {confirm === "upload_card_bg_video" ? (
                    <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                  ) : (
                    <label className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer">
                      {uploading === "card_bg_video" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      <input
                        ref={videoRef}
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelect(f, "card_bg_video", "upload_card_bg_video");
                          if (videoRef.current) videoRef.current.value = "";
                        }}
                        disabled={!!uploading}
                      />
                    </label>
                  )}
                  {confirm === "clear_card_bg_video" ? (
                    <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                  ) : (
                    <button
                      onClick={() => askConfirm("clear_card_bg_video")}
                      className="p-2 border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {confirm === "upload_card_bg_video" ? (
                  <div className="flex items-center justify-center gap-2 border border-dashed border-foreground aspect-video text-foreground">
                    <span className="text-xs font-display tracking-[0.2em] uppercase">Upload?</span>
                    <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-border aspect-video cursor-pointer text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                    {uploading === "card_bg_video" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span className="text-xs font-display tracking-[0.2em] uppercase">Upload MP4 / WebM</span>
                    <input
                      ref={videoRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f, "card_bg_video", "upload_card_bg_video");
                        if (videoRef.current) videoRef.current.value = "";
                      }}
                      disabled={!!uploading}
                    />
                  </label>
                )}
              </>
            )}
            <p className="text-[10px] text-muted-foreground/50 font-display tracking-wider">
              MP4 (H.264) or WebM recommended. Keep under 10 MB for fast loading.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-muted-foreground font-display tracking-widest uppercase shrink-0">Opacity</span>
              <input type="range" min="5" max="100" step="5" value={bgOpacity}
                onChange={(e) => setBgOpacity(parseInt(e.target.value, 10))}
                onMouseUp={() => update("card_bg_video_opacity", String(bgOpacity))}
                onTouchEnd={() => update("card_bg_video_opacity", String(bgOpacity))}
                className="flex-1 h-1 appearance-none bg-border rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
              />
              <span className="text-[10px] text-muted-foreground font-display w-8 text-right">{bgOpacity}%</span>
            </div>
          </div>
        )}
      </div>
    ),
    card_images: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6 max-w-[320px]">
          <CardImageUpload
            label="Card front (default)"
            imageUrl={frontImage}
            defaultImage={null}
            uploading={uploading === "card_front_image"}
            inputRef={frontRef}
            onUpload={(f) => handleFileSelect(f, "card_front_image", "upload_card_front_image")}
            onClear={() => askConfirm("clear_card_front_image")}
            confirmAction={confirm}
            confirmKey="card_front_image"
            onConfirmYes={executeConfirm}
            onConfirmNo={cancelConfirm}
            pendingPreview={pendingFile?.key === "card_front_image" ? pendingPreviewUrl : null}
          />
          <CardImageUpload
            label="Card back"
            imageUrl={backImage}
            defaultImage={taroBackside}
            uploading={uploading === "card_back_image"}
            inputRef={backRef}
            onUpload={(f) => handleFileSelect(f, "card_back_image", "upload_card_back_image")}
            onClear={() => askConfirm("clear_card_back_image")}
            confirmAction={confirm}
            confirmKey="card_back_image"
            onConfirmYes={executeConfirm}
            onConfirmNo={cancelConfirm}
            pendingPreview={pendingFile?.key === "card_back_image" ? pendingPreviewUrl : null}
          />
        </div>

        {/* Multiple front images — cycle on each flip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-display tracking-widest uppercase">
              Front images — rotate on flip ({frontImages.length})
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-display tracking-wider">
            Each time the card is flipped back to front, a different image is shown in sequence.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {frontImages.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="relative group border border-border aspect-[2/3] overflow-hidden bg-muted/10">
                  <img src={item.url} alt={`Front ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                    {confirm === `remove_front_${i}` ? (
                      <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                    ) : (
                      <button
                        onClick={() => askConfirm(`remove_front_${i}`)}
                        className="p-1.5 border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <span className="absolute bottom-0.5 right-1 text-[8px] text-muted-foreground/60 font-display">{i + 1}</span>
                </div>
                <input
                  type="text"
                  value={item.text || ""}
                  onChange={(e) => handleUpdateFrontImageText(i, e.target.value)}
                  placeholder="Text above card..."
                  className="w-full bg-transparent border border-border px-1.5 py-1 text-[9px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            ))}
            {/* Add new */}
            <div className="border border-dashed border-border aspect-[2/3] overflow-hidden">
              {confirm === "upload_card_front_multi" && pendingPreviewUrl ? (
                <div className="relative w-full h-full">
                  <img src={pendingPreviewUrl} alt="Preview" className="w-full h-full object-cover ring-2 ring-primary/50" />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <ConfirmButtons onYes={executeConfirm} onNo={cancelConfirm} />
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-muted-foreground/40 hover:text-muted-foreground hover:border-foreground transition-colors">
                  {uploading === "card_front_images" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span className="text-[8px] font-display tracking-wider mt-1">ADD</span>
                  <input
                    ref={frontMultiRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f, "card_front_multi", "upload_card_front_multi");
                      if (frontMultiRef.current) frontMultiRef.current.value = "";
                    }}
                    disabled={!!uploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
        Second Section — Card Area
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          {sectionOrder.map((key) => (
            <SortableSection
              key={key}
              id={key}
              label={sectionLabels[key]}
              collapsed={collapsedSections.has(key)}
              onToggle={() => toggleCollapse(key)}
            >
              {sectionContent[key]}
            </SortableSection>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

function SortableSection({ id, label, collapsed, onToggle, children }: {
  id: string;
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          <GripVertical size={10} />
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 font-display tracking-[0.3em] uppercase hover:text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          {label}
        </button>
      </div>
      {!collapsed && <div className="mt-2">{children}</div>}
    </div>
  );
}

function CardImageUpload({
  label,
  imageUrl,
  defaultImage,
  uploading,
  inputRef,
  onUpload,
  onClear,
  confirmAction,
  confirmKey,
  onConfirmYes,
  onConfirmNo,
  pendingPreview,
}: {
  label: string;
  imageUrl: string;
  defaultImage?: string | null;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onUpload: (file: File) => void;
  onClear: () => void;
  confirmAction: string | null;
  confirmKey: string;
  onConfirmYes: () => void;
  onConfirmNo: () => void;
  pendingPreview?: string | null;
}) {
  const showUploadConfirm = confirmAction === `upload_${confirmKey}`;
  const showClearConfirm = confirmAction === `clear_${confirmKey}`;

  const displayImage = showUploadConfirm && pendingPreview ? pendingPreview : (imageUrl || defaultImage || "");

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground font-display tracking-widest uppercase">
        {label}
      </label>
      <div className="relative group border border-border aspect-[2/3] overflow-hidden bg-muted/10">
        {displayImage ? (
          <img src={displayImage} alt={label} className={`w-full h-full object-cover ${showUploadConfirm && pendingPreview ? "ring-2 ring-primary/50" : ""}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs font-display tracking-widest uppercase">
            Default
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
          {showUploadConfirm ? (
            <ConfirmButtons onYes={onConfirmYes} onNo={onConfirmNo} />
          ) : (
            <label className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={uploading}
              />
            </label>
          )}
          {imageUrl && !showUploadConfirm && (
            showClearConfirm ? (
              <ConfirmButtons onYes={onConfirmYes} onNo={onConfirmNo} />
            ) : (
              <button
                onClick={onClear}
                className="p-2 border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )
          )}
        </div>
        {showUploadConfirm && pendingPreview && (
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-[8px] font-display tracking-wider text-foreground bg-background/80 px-1.5 py-0.5 rounded">NEW IMAGE</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Main2Section;
