import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, LogOut, Loader2, ArrowUpDown, ArrowUp, Eye, EyeOff, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import NotesButton from "@/components/admin/NotesButton";
import lostInTime01 from "@/assets/lost_in_time_01.png";
import lostInTime02 from "@/assets/lost_in_time_02.png";
import lostInTime03 from "@/assets/lost_in_time_03.png";
import { useNavButtons } from "@/hooks/useNavButtons";
import { useSectionContent } from "@/hooks/useSectionContent";
import ButtonsSection from "@/components/admin/ButtonsSection";
import ContentSection from "@/components/admin/ContentSection";
import Main2Section from "@/components/admin/Main2Section";
import SocialSection from "@/components/admin/SocialSection";

interface BackgroundItem {
  id: string;
  section: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const SECTIONS = ["main", "main2", "portfolio", "shop"] as const;

const AdminMain = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("main");
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [confirmBg, setConfirmBg] = useState<{ action: string; id: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const libraryFileRef = useRef<HTMLInputElement>(null);
  const logosFileRef = useRef<HTMLInputElement>(null);
  const { buttons: navButtons, updateButton, swapOrder, addButton, deleteButton } = useNavButtons();
  const { get: getContent, getDuration, update: updateContent, updateDuration } = useSectionContent();

  // Reorderable MAIN tab sections
  const MAIN_SECTION_KEYS = ["buttons", "content", "social", "music", "backgrounds", "logos", "library"] as const;
  type MainSectionKey = typeof MAIN_SECTION_KEYS[number];
  const MAIN_SECTION_LABELS: Record<MainSectionKey, string> = {
    buttons: "Buttons",
    content: "Section Content",
    social: "Social",
    music: "Site Music",
    backgrounds: "Active Backgrounds",
    logos: "Logos",
    library: "Library",
  };

  const [mainSectionOrder, setMainSectionOrder] = useState<MainSectionKey[]>(() => {
    try {
      const saved = localStorage.getItem("admin_main_section_order");
      if (saved) {
        const parsed = JSON.parse(saved) as MainSectionKey[];
        const valid = parsed.filter((k) => MAIN_SECTION_KEYS.includes(k));
        const missing = MAIN_SECTION_KEYS.filter((k) => !valid.includes(k));
        return [...valid, ...missing];
      }
    } catch {}
    return [...MAIN_SECTION_KEYS];
  });

  const [collapsedSections, setCollapsedSections] = useState<Set<MainSectionKey>>(() => {
    try {
      const saved = localStorage.getItem("admin_main_collapsed_sections");
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  const toggleSectionCollapse = (key: MainSectionKey) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem("admin_main_collapsed_sections", JSON.stringify([...next]));
      return next;
    });
  };

  const moveMainSection = (key: MainSectionKey, dir: -1 | 1) => {
    setMainSectionOrder((prev) => {
      const idx = prev.indexOf(key);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      localStorage.setItem("admin_main_section_order", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && isAdmin) fetchBackgrounds();
  }, [loading, user, isAdmin]);

  const fetchBackgrounds = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("page_backgrounds")
      .select("*")
      .order("sort_order");
    if (!error && data) setBackgrounds(data);
    setFetching(false);
  };

  const uploadToSection = async (file: File, section: string) => {
    setUploading(true);
    setUploadProgress(0);
    const ext = file.name.split(".").pop();
    const path = `backgrounds/${Date.now()}.${ext}`;

    // Use XMLHttpRequest for progress tracking
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const uploaded = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener("load", () => resolve(xhr.status >= 200 && xhr.status < 300));
      xhr.addEventListener("error", () => resolve(false));
      xhr.open("POST", `${supabaseUrl}/storage/v1/object/portfolio-images/${path}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.send(file);
    });

    if (!uploaded) {
      toast.error("Upload failed");
      setUploading(false);
      setUploadProgress(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(path);

    const maxOrder = backgrounds
      .filter((b) => b.section === section)
      .reduce((m, b) => Math.max(m, b.sort_order), -1);

    const { error: insertError } = await supabase
      .from("page_backgrounds")
      .insert({ section, image_url: urlData.publicUrl, sort_order: maxOrder + 1 });

    if (insertError) {
      toast.error("Failed to save");
    } else {
      toast.success("Added");
      fetchBackgrounds();
    }
    setUploading(false);
    setUploadProgress(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadToSection(file, activeSection);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadToSection(file, "library");
    if (libraryFileRef.current) libraryFileRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("page_backgrounds").delete().eq("id", id);
    if (!error) {
      setBackgrounds((prev) => prev.filter((b) => b.id !== id));
      toast.success("Deleted");
    }
  };

  // Swap: active image goes to library, library image takes active's section + sort_order
  const handleSwap = async (libraryId: string) => {
    if (!swapTarget) return;
    const activeItem = backgrounds.find((b) => b.id === swapTarget);
    const libraryItem = backgrounds.find((b) => b.id === libraryId);
    if (!activeItem || !libraryItem) return;

    const { error: e1 } = await supabase
      .from("page_backgrounds")
      .update({ section: "library", sort_order: 0 })
      .eq("id", swapTarget);

    const { error: e2 } = await supabase
      .from("page_backgrounds")
      .update({ section: activeItem.section, sort_order: activeItem.sort_order })
      .eq("id", libraryId);

    if (!e1 && !e2) {
      toast.success("Swapped");
      fetchBackgrounds();
    } else {
      toast.error("Swap failed");
    }
    setSwapTarget(null);
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  const sectionItems = backgrounds.filter((b) => b.section === activeSection);
  const libraryItems = backgrounds.filter((b) => b.section === "library");
  const logoItems = backgrounds.filter((b) => b.section === "main_logos");

  const handleLogosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadToSection(file, "main_logos");
    if (logosFileRef.current) logosFileRef.current.value = "";
  };

  const renderActiveBackgrounds = () => (
    <>
      <div className="flex items-center justify-between mb-4 mt-2">
        <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
          Active backgrounds — {activeSection} section
          {swapTarget && (
            <span className="ml-3 text-primary">← Now click a Library image to swap</span>
          )}
        </p>
        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Upload{uploadProgress !== null && ` ${uploadProgress}%`}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {fetching ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(sectionItems.length > 0
            ? sectionItems.map((item) => ({ src: item.image_url, id: item.id, isDefault: false }))
            : activeSection === "main"
              ? [lostInTime01, lostInTime02, lostInTime03].map((src, i) => ({ src, id: `default-${i}`, isDefault: true }))
              : []
          ).map((item) => (
            <div key={item.id} className={`group relative border aspect-video overflow-hidden transition-all ${swapTarget === item.id ? "border-primary ring-2 ring-primary/30" : "border-border"} ${!item.isDefault && backgrounds.find(b => b.id === item.id)?.is_active === false ? "opacity-40" : ""}`}>
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(item.src) ? (
                <video src={item.src} muted className="w-full h-full object-cover" />
              ) : (
                <img src={item.src} alt="Background" className="w-full h-full object-cover" />
              )}
              {item.isDefault && <span className="absolute bottom-2 left-2 text-[9px] font-display tracking-widest uppercase text-foreground/60 bg-background/70 px-1.5 py-0.5">Default</span>}
              {!item.isDefault && (
                <>
                  <button onClick={() => setSwapTarget(swapTarget === item.id ? null : item.id)} title="Swap" className={`absolute top-2 left-2 p-1 transition-opacity ${swapTarget === item.id ? "bg-primary text-primary-foreground opacity-100" : "bg-background/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"}`}><ArrowUpDown size={14} /></button>
                  {confirmBg?.action === "toggle" && confirmBg.id === item.id ? (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/90 px-1 py-0.5">
                      <button onClick={async () => { const bg = backgrounds.find(b => b.id === item.id); if (!bg) return; const { error } = await supabase.from("page_backgrounds").update({ is_active: !bg.is_active }).eq("id", item.id); if (!error) { setBackgrounds(prev => prev.map(b => b.id === item.id ? { ...b, is_active: !b.is_active } : b)); toast.success(bg.is_active ? "Hidden" : "Visible"); } setConfirmBg(null); }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"><Check size={9} /> YES</button>
                      <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"><X size={9} /> NO</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmBg({ action: "toggle", id: item.id })} className={`absolute bottom-2 left-2 p-1 transition-opacity ${backgrounds.find(b => b.id === item.id)?.is_active === false ? "bg-background/80 text-muted-foreground/40 opacity-100" : "bg-background/80 text-foreground opacity-0 group-hover:opacity-100"}`}>
                      {backgrounds.find(b => b.id === item.id)?.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                  {confirmBg?.action === "delete" && confirmBg.id === item.id ? (
                    <span className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 px-1 py-0.5">
                      <button onClick={() => { handleDelete(item.id); setConfirmBg(null); }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"><Check size={9} /> YES</button>
                      <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"><X size={9} /> NO</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmBg({ action: "delete", id: item.id })} className="absolute top-2 right-2 p-1 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                  )}
                </>
              )}
            </div>
          ))}
          {sectionItems.length === 0 && activeSection !== "main" && (
            <p className="text-muted-foreground text-sm col-span-full text-center py-8">No backgrounds yet. Upload one to get started.</p>
          )}
        </div>
      )}
    </>
  );

  const renderLogosSection = () => (
    <div className="border-t border-border pt-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">Logos — main section</p>
        <div className="flex items-center gap-3">
          {confirmBg?.action === "logo_fade_toggle" ? (
            <span className="flex items-center gap-1 bg-background/90 px-1 py-0.5">
              <button onClick={async () => { const current = getContent("logo_fade_enabled"); const newVal = current === "true" ? "false" : "true"; await updateContent("logo_fade_enabled", newVal); toast.success(newVal === "true" ? "Fade ON" : "Fade OFF"); setConfirmBg(null); }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"><Check size={9} /> YES</button>
              <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"><X size={9} /> NO</button>
            </span>
          ) : (
            <button onClick={() => setConfirmBg({ action: "logo_fade_toggle", id: "fade" })} className={`px-3 py-1.5 border text-xs font-display tracking-[0.2em] uppercase transition-colors ${getContent("logo_fade_enabled") === "true" ? "border-foreground text-foreground bg-foreground/10" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"}`}>
              Fade {getContent("logo_fade_enabled") === "true" ? "ON" : "OFF"}
            </button>
          )}
          {getContent("logo_fade_enabled") === "true" && (
            <div className="flex items-center gap-1.5">
              <input type="number" min={1} max={120} defaultValue={getContent("logo_fade_seconds") || "6"} className="w-14 px-2 py-1.5 border border-border bg-background text-foreground text-xs font-display tracking-widest text-center" onBlur={async (e) => { const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 6)); e.target.value = String(val); await updateContent("logo_fade_seconds", String(val)); toast.success(`Fade: ${val}s`); }} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
              <span className="text-[9px] text-muted-foreground font-display tracking-widest uppercase">sec</span>
            </div>
          )}
          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload{uploadProgress !== null && ` ${uploadProgress}%`}
            <input ref={logosFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogosUpload} disabled={uploading} />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {logoItems.map((item) => (
          <div key={item.id} className={`group relative border aspect-video overflow-hidden transition-all ${item.is_active === false ? "opacity-40" : ""} border-border`}>
            <img src={item.image_url} alt="Logo" className="w-full h-full object-contain bg-background/50" />
            {confirmBg?.action === "logo_toggle" && confirmBg.id === item.id ? (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/90 px-1 py-0.5">
                <button onClick={async () => { const { error } = await supabase.from("page_backgrounds").update({ is_active: !item.is_active }).eq("id", item.id); if (!error) { setBackgrounds(prev => prev.map(b => b.id === item.id ? { ...b, is_active: !b.is_active } : b)); toast.success(item.is_active ? "Hidden" : "Visible"); } setConfirmBg(null); }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"><Check size={9} /> YES</button>
                <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"><X size={9} /> NO</button>
              </span>
            ) : (
              <button onClick={() => setConfirmBg({ action: "logo_toggle", id: item.id })} className={`absolute bottom-2 left-2 p-1 transition-opacity ${item.is_active === false ? "bg-background/80 text-muted-foreground/40 opacity-100" : "bg-background/80 text-foreground opacity-0 group-hover:opacity-100"}`}>
                {item.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            {confirmBg?.action === "logo_delete" && confirmBg.id === item.id ? (
              <span className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 px-1 py-0.5">
                <button onClick={() => { handleDelete(item.id); setConfirmBg(null); }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"><Check size={9} /> YES</button>
                <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"><X size={9} /> NO</button>
              </span>
            ) : (
              <button onClick={() => setConfirmBg({ action: "logo_delete", id: item.id })} className="absolute top-2 right-2 p-1 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
            )}
          </div>
        ))}
        {logoItems.length === 0 && <p className="text-muted-foreground text-sm col-span-full text-center py-8">No logos yet. Upload one to get started.</p>}
      </div>
    </div>
  );

  const renderLibrarySection = () => (
    <div className="border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">Library</p>
        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Add to Library{uploadProgress !== null && ` ${uploadProgress}%`}
          <input ref={libraryFileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleLibraryUpload} disabled={uploading} />
        </label>
      </div>
      {libraryItems.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Library is empty. Upload images here to swap them with active backgrounds later.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {libraryItems.map((item) => (
            <div key={item.id} className={`group relative border aspect-video overflow-hidden transition-all ${swapTarget ? "border-primary/40 cursor-pointer hover:ring-2 hover:ring-primary/30" : "border-border"}`} onClick={swapTarget ? () => handleSwap(item.id) : undefined}>
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(item.image_url) ? (
                <video src={item.image_url} muted className="w-full h-full object-cover" />
              ) : (
                <img src={item.image_url} alt="Library" className="w-full h-full object-cover" />
              )}
              {swapTarget && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-display tracking-widest uppercase text-primary bg-background/90 px-2 py-1">↑ Replace</span>
                </div>
              )}
              {!swapTarget && (
                confirmBg?.action === "lib_delete" && confirmBg.id === item.id ? (
                  <span className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 px-1 py-0.5">
                    <button onClick={() => { handleDelete(item.id); setConfirmBg(null); }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"><Check size={9} /> YES</button>
                    <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors"><X size={9} /> NO</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmBg({ action: "lib_delete", id: item.id })} className="absolute top-2 right-2 p-1 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-sm tracking-[0.3em] uppercase">Main Page CMS</h1>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => navigate("/admin")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Portfolio CMS
          </button>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => navigate("/admin/secret-door")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Secret Door
          </button>
        </div>
        <div className="flex items-center gap-4">
          {user && <NotesButton userId={user.id} />}
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
          >
            ← SITE
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
          >
            <LogOut size={10} /> LOGOUT
          </button>
        </div>
      </header>

      {/* Section tabs */}
      <div className="flex items-center gap-1 px-4 sm:px-8 py-3 border-b border-border">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveSection(s); setSwapTarget(null); }}
            className={`px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase transition-colors ${
              activeSection === s
                ? "border border-foreground text-foreground"
                : "border border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-6">
        {activeSection === "shop" ? (
          <div className="py-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-muted-foreground font-display tracking-[0.3em] uppercase">Shop Page</p>
              {confirmBg?.action === "shop_toggle" ? (
                <span className="flex items-center gap-1 bg-background/90 px-1 py-0.5">
                  <button onClick={async () => {
                    const current = getContent("shop_visible");
                    const newVal = current === "true" ? "false" : "true";
                    await updateContent("shop_visible", newVal);
                    toast.success(newVal === "true" ? "Shop visible" : "Shop hidden");
                    setConfirmBg(null);
                  }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors">
                    <Check size={9} /> YES
                  </button>
                  <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors">
                    <X size={9} /> NO
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmBg({ action: "shop_toggle", id: "shop" })}
                  className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-display tracking-[0.2em] uppercase transition-colors ${
                    getContent("shop_visible") === "true"
                      ? "border-foreground text-foreground bg-foreground/10"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {getContent("shop_visible") === "true" ? <Eye size={14} /> : <EyeOff size={14} />}
                  {getContent("shop_visible") === "true" ? "Visible" : "Hidden"}
                </button>
              )}
            </div>
            <div className="border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground/60">Shop page content settings will be available here.</p>
              <a href="/shop" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-xs text-muted-foreground hover:text-foreground font-display tracking-[0.2em] uppercase underline underline-offset-4 transition-colors">
                Preview Shop Page →
              </a>
            </div>
          </div>
        ) : activeSection === "main2" ? (
          <Main2Section get={getContent} update={updateContent} />
        ) : (
          <>
            {activeSection === "main" && mainSectionOrder.map((sectionKey, idx) => {
              const renderWrapper = (label: string, children: React.ReactNode) => (
                <div key={sectionKey} className="relative">
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveMainSection(sectionKey, -1)}
                        disabled={idx === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveMainSection(sectionKey, 1)}
                        disabled={idx === mainSectionOrder.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 font-display tracking-[0.3em] uppercase">{label}</span>
                  </div>
                  {children}
                </div>
              );

              switch (sectionKey) {
                case "buttons":
                  return renderWrapper(MAIN_SECTION_LABELS[sectionKey],
                    <ButtonsSection
                      buttons={navButtons}
                      onUpdate={updateButton}
                      onSwapOrder={swapOrder}
                      onAdd={addButton}
                      onDelete={deleteButton}
                    />
                  );
                case "content":
                  return renderWrapper(MAIN_SECTION_LABELS[sectionKey],
                    <ContentSection get={getContent} getDuration={getDuration} update={updateContent} updateDuration={updateDuration} />
                  );
                case "social":
                  return renderWrapper(MAIN_SECTION_LABELS[sectionKey], <SocialSection />);
                case "music":
                  return renderWrapper(MAIN_SECTION_LABELS[sectionKey],
                    <div className="border-t border-border pt-4 pb-2 flex items-center gap-3">
                      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
                        Site Music
                      </p>
                      {confirmBg?.action === "music_toggle" ? (
                        <span className="flex items-center gap-1 bg-background/90 px-1 py-0.5">
                          <button onClick={async () => {
                            const current = getContent("site_music_enabled");
                            const newVal = current === "false" ? "true" : "false";
                            await updateContent("site_music_enabled", newVal);
                            toast.success(newVal === "true" ? "Music ON" : "Music OFF");
                            setConfirmBg(null);
                          }} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors">
                            <Check size={9} /> YES
                          </button>
                          <button onClick={() => setConfirmBg(null)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors">
                            <X size={9} /> NO
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmBg({ action: "music_toggle", id: "music" })}
                          className={`px-3 py-1.5 border text-xs font-display tracking-[0.2em] uppercase transition-colors ${
                            getContent("site_music_enabled") !== "false"
                              ? "border-foreground text-foreground bg-foreground/10"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                          }`}
                        >
                          {getContent("site_music_enabled") !== "false" ? "ON" : "OFF"}
                        </button>
                      )}
                    </div>
                  );
                case "backgrounds":
                  return renderWrapper(MAIN_SECTION_LABELS[sectionKey], renderActiveBackgrounds());
                case "logos":
                  return renderWrapper(MAIN_SECTION_LABELS[sectionKey], renderLogosSection());
                case "library":
                  return renderWrapper(MAIN_SECTION_LABELS[sectionKey], renderLibrarySection());
                default:
                  return null;
              }
            })}
            {activeSection !== "main" && (
              <>
                <ButtonsSection
                  buttons={navButtons}
                  onUpdate={updateButton}
                  onSwapOrder={swapOrder}
                  onAdd={addButton}
                  onDelete={deleteButton}
                />
                <ContentSection get={getContent} getDuration={getDuration} update={updateContent} updateDuration={updateDuration} />
              </>
            )}
          </>
        )}

        {/* For non-main tabs, show backgrounds and library inline */}
        {activeSection !== "main" && activeSection !== "main2" && (
          <>
            {renderActiveBackgrounds()}
            {renderLibrarySection()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMain;
