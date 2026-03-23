import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";

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
  const [backImage, setBackImage] = useState("");
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
  const backRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const wallpaperRef = useRef<HTMLInputElement>(null);

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
    setBackImage(get("card_back_image"));
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
  const cancelConfirm = () => { setConfirm(null); setPendingFile(null); };

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
    setConfirm(null);
    setPendingFile(null);
  };

  const handleFileSelect = (file: File, key: string, uploadKey: string) => {
    setPendingFile({ file, key });
    askConfirm(uploadKey);
  };

  const renderCollapsible = (key: string, label: string, children: React.ReactNode) => (
    <div>
      <button
        onClick={() => toggleCollapse(key)}
        className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 font-display tracking-[0.3em] uppercase hover:text-muted-foreground transition-colors mb-2"
      >
        {collapsedSections.has(key) ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
        {label}
      </button>
      {!collapsedSections.has(key) && children}
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
        Second Section — Card Area
      </p>

      {renderCollapsible("text", "Text above cards",
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
      )}

      {renderCollapsible("cards", "Cards — Background",
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
      )}

      {renderCollapsible("card_images", "Card Images",
        <div className="grid grid-cols-2 gap-6 max-w-[320px]">
          <CardImageUpload
            label="Card front"
            imageUrl={frontImage}
            uploading={uploading === "card_front_image"}
            inputRef={frontRef}
            onUpload={(f) => handleFileSelect(f, "card_front_image", "upload_card_front_image")}
            onClear={() => askConfirm("clear_card_front_image")}
            confirmAction={confirm}
            confirmKey="card_front_image"
            onConfirmYes={executeConfirm}
            onConfirmNo={cancelConfirm}
          />
          <CardImageUpload
            label="Card back"
            imageUrl={backImage}
            uploading={uploading === "card_back_image"}
            inputRef={backRef}
            onUpload={(f) => handleFileSelect(f, "card_back_image", "upload_card_back_image")}
            onClear={() => askConfirm("clear_card_back_image")}
            confirmAction={confirm}
            confirmKey="card_back_image"
            onConfirmYes={executeConfirm}
            onConfirmNo={cancelConfirm}
          />
        </div>
      )}
    </div>
  );
};

function CardImageUpload({
  label,
  imageUrl,
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

  const displayImage = showUploadConfirm && pendingPreview ? pendingPreview : imageUrl;

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
