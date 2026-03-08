import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, LogOut, Loader2, ArrowUpDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import lostInTime01 from "@/assets/lost_in_time_01.png";
import lostInTime02 from "@/assets/lost_in_time_02.png";
import lostInTime03 from "@/assets/lost_in_time_03.png";
import { useNavButtons } from "@/hooks/useNavButtons";
import { useSectionContent } from "@/hooks/useSectionContent";
import ButtonsSection from "@/components/admin/ButtonsSection";
import ContentSection from "@/components/admin/ContentSection";
import Main2Section from "@/components/admin/Main2Section";

interface BackgroundItem {
  id: string;
  section: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const SECTIONS = ["main", "main2", "portfolio"] as const;

const AdminMain = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("main");
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [swapTarget, setSwapTarget] = useState<string | null>(null); // id of active image being swapped
  const fileRef = useRef<HTMLInputElement>(null);
  const libraryFileRef = useRef<HTMLInputElement>(null);
  const { buttons: navButtons, updateButton, swapOrder, addButton, deleteButton } = useNavButtons();
  const { get: getContent, getDuration, update: updateContent, updateDuration } = useSectionContent();

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
    const ext = file.name.split(".").pop();
    const path = `backgrounds/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(path, file);
    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
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
      toast.success("Image added");
      fetchBackgrounds();
    }
    setUploading(false);
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
        </div>
        <div className="flex items-center gap-4">
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
        {activeSection === "main2" ? (
          <Main2Section get={getContent} update={updateContent} />
        ) : (
          <>
            {/* Buttons section — at top */}
            <ButtonsSection
              buttons={navButtons}
              onUpdate={updateButton}
              onSwapOrder={swapOrder}
              onAdd={addButton}
              onDelete={deleteButton}
            />

            {/* Section content editing */}
            <ContentSection get={getContent} getDuration={getDuration} update={updateContent} updateDuration={updateDuration} />
          </>
        )}

        {/* Active backgrounds */}
        <div className="flex items-center justify-between mb-4 mt-6">
          <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
            Active backgrounds — {activeSection} section
            {swapTarget && (
              <span className="ml-3 text-primary">← Now click a Library image to swap</span>
            )}
          </p>
          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
              {(sectionItems.length > 0
                ? sectionItems.map((item) => ({ src: item.image_url, id: item.id, isDefault: false }))
                : activeSection === "main"
                  ? [lostInTime01, lostInTime02, lostInTime03].map((src, i) => ({ src, id: `default-${i}`, isDefault: true }))
                  : []
              ).map((item) => (
                <div
                  key={item.id}
                  className={`group relative border aspect-video overflow-hidden transition-all ${
                    swapTarget === item.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border"
                  } ${!item.isDefault && backgrounds.find(b => b.id === item.id)?.is_active === false ? "opacity-40" : ""}`}
                >
                  <img src={item.src} alt="Background" className="w-full h-full object-cover" />
                  {item.isDefault && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-display tracking-widest uppercase text-foreground/60 bg-background/70 px-1.5 py-0.5">
                      Default
                    </span>
                  )}
                  {!item.isDefault && (
                    <>
                      {/* Swap button — top left */}
                      <button
                        onClick={() => setSwapTarget(swapTarget === item.id ? null : item.id)}
                        title="Click to swap with a Library image"
                        className={`absolute top-2 left-2 p-1 transition-opacity ${
                          swapTarget === item.id
                            ? "bg-primary text-primary-foreground opacity-100"
                            : "bg-background/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <ArrowUpDown size={14} />
                      </button>
                      {/* Visibility toggle — bottom left */}
                      <button
                        onClick={async () => {
                          const bg = backgrounds.find(b => b.id === item.id);
                          if (!bg) return;
                          const { error } = await supabase
                            .from("page_backgrounds")
                            .update({ is_active: !bg.is_active })
                            .eq("id", item.id);
                          if (!error) {
                            setBackgrounds(prev => prev.map(b => b.id === item.id ? { ...b, is_active: !b.is_active } : b));
                            toast.success(bg.is_active ? "Hidden" : "Visible");
                          }
                        }}
                        title={backgrounds.find(b => b.id === item.id)?.is_active ? "Hide from site" : "Show on site"}
                        className={`absolute bottom-2 left-2 p-1 transition-opacity ${
                          backgrounds.find(b => b.id === item.id)?.is_active === false
                            ? "bg-background/80 text-muted-foreground/40 opacity-100"
                            : "bg-background/80 text-foreground opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {backgrounds.find(b => b.id === item.id)?.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      {/* Delete button — top right */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="absolute top-2 right-2 p-1 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {sectionItems.length === 0 && activeSection === "portfolio" && (
                <p className="text-muted-foreground text-sm col-span-full text-center py-8">
                  No backgrounds yet. Upload one to get started.
                </p>
              )}
            </div>

            {/* Library section */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
                  Library
                </p>
                <label className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  Add to Library
                  <input
                    ref={libraryFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLibraryUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {libraryItems.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Library is empty. Upload images here to swap them with active backgrounds later.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {libraryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`group relative border aspect-video overflow-hidden transition-all ${
                        swapTarget
                          ? "border-primary/40 cursor-pointer hover:ring-2 hover:ring-primary/30"
                          : "border-border"
                      }`}
                      onClick={swapTarget ? () => handleSwap(item.id) : undefined}
                    >
                      <img src={item.image_url} alt="Library" className="w-full h-full object-cover" />
                      {swapTarget && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-display tracking-widest uppercase text-primary bg-background/90 px-2 py-1">
                            ↑ Replace
                          </span>
                        </div>
                      )}
                      {/* Delete from library */}
                      {!swapTarget && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="absolute top-2 right-2 p-1 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMain;
