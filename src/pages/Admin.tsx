import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Images, LogOut, Loader2, Check, X, ChevronLeft, ChevronRight, StickyNote, Eye, EyeOff, FileCode, Trash2, CheckSquare, Square } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotesPanel from "@/components/admin/NotesPanel";
import { useSectionSettings } from "@/hooks/useSectionSettings";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableImageCard from "@/components/admin/SortableImageCard";
import ShareSection from "@/components/admin/ShareSection";
import SkillsSection from "@/components/admin/SkillsSection";
import { useSectionContent } from "@/hooks/useSectionContent";

const SECTIONS = ["gallery", "projects", "skills", "archive"] as const;
const GALLERY_SUBS = ["VECTOR", "DIGITAL", "AI", "SKETCHES"];
const SPECIAL_TABS = ["share"] as const;

interface PortfolioItem {
  id: string;
  section: string;
  subsection: string | null;
  title: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  group_id?: string | null;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { visibility, toggle: toggleSection } = useSectionSettings();
  const { get: getContent, update: updateContent, loading: contentLoading } = useSectionContent();
  const navigate = useNavigate();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("gallery");
  const [activeSub, setActiveSub] = useState<string>("VECTOR");
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmSave, setConfirmSave] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [cmsPage, setCmsPage] = useState(0);
  const CMS_ITEMS_PER_PAGE = 12;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error("You don't have admin access");
      navigate("/");
    }
  }, [loading, user, isAdmin, navigate]);

  const fetchItems = async () => {
    setFetching(true);
    let query = supabase
      .from("portfolio_items")
      .select("*")
      .eq("section", activeSection)
      .order("sort_order", { ascending: true });

    if (activeSection === "gallery") {
      query = query.eq("subsection", activeSub);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load items");
    } else {
      setItems((data as PortfolioItem[]) || []);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (user && isAdmin) fetchItems();
    setCmsPage(0);
  }, [activeSection, activeSub, user, isAdmin]);

  const uploadFiles = async (files: File[], grouped: boolean) => {
    setUploading(true);
    const uploadedItems: PortfolioItem[] = [];
    const groupId = grouped ? crypto.randomUUID() : null;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const fileName = `${activeSection}/${activeSub || "general"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(fileName);

      const insertData: any = {
        section: activeSection,
        subsection: activeSection === "gallery" ? activeSub : null,
        title: file.name.replace(/\.[^.]+$/, ""),
        image_url: urlData.publicUrl,
        sort_order: items.length + uploadedItems.length,
        created_by: user?.id,
      };
      if (groupId) insertData.group_id = groupId;

      const { data, error } = await supabase
        .from("portfolio_items")
        .insert(insertData)
        .select()
        .single();

      if (!error && data) {
        uploadedItems.push(data as PortfolioItem);
      }
    }

    if (uploadedItems.length > 0) {
      toast.success(`Uploaded ${uploadedItems.length} image(s)${grouped ? " as group" : ""}`);
      fetchItems();
    }
    setUploading(false);
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles([files[0]], false);
    e.target.value = "";
  };

  const handleGroupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length < 2) {
      toast.error("Select at least 2 images for a group");
      e.target.value = "";
      return;
    }
    await uploadFiles(Array.from(files), true);
    e.target.value = "";
  };

  const handleDelete = async (item: PortfolioItem) => {
    if (item.image_url) {
      try {
        const url = new URL(item.image_url);
        const pathParts = url.pathname.split("/storage/v1/object/public/portfolio-images/");
        const filePath = pathParts[1];
        if (filePath) {
          await supabase.storage.from("portfolio-images").remove([filePath]);
        }
      } catch {
        // image_url might not be a valid storage URL, skip cleanup
      }
    }

    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Deleted");
      fetchItems();
    }
  };

  const positionTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handlePositionChange = (id: string, x: number, y: number) => {
    // Optimistic local update
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, image_offset_x: x, image_offset_y: y } as any : i)));

    // Debounced DB persist
    if (positionTimers.current[id]) clearTimeout(positionTimers.current[id]);
    positionTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ image_offset_x: x, image_offset_y: y } as any).eq("id", id);
    }, 400);
  };

  const zoomTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleZoomChange = (id: string, zoom: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, image_zoom: zoom } as any : i)));
    if (zoomTimers.current[id]) clearTimeout(zoomTimers.current[id]);
    zoomTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ image_zoom: zoom } as any).eq("id", id);
    }, 400);
  };

  const titleTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleTitleChange = (id: string, title: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, title } : i)));
    if (titleTimers.current[id]) clearTimeout(titleTimers.current[id]);
    titleTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ title }).eq("id", id);
    }, 400);
  };

  const handleTextAlignChange = (id: string, align: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, text_align: align } as any : i)));
    supabase.from("portfolio_items").update({ text_align: align } as any).eq("id", id);
  };

  const descTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleDescriptionChange = (id: string, desc: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, description: desc } as any : i)));
    if (descTimers.current[id]) clearTimeout(descTimers.current[id]);
    descTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ description: desc } as any).eq("id", id);
    }, 400);
  };

  const projectUrlTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleProjectUrlChange = (id: string, url: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, project_url: url } as any : i)));
    if (projectUrlTimers.current[id]) clearTimeout(projectUrlTimers.current[id]);
    projectUrlTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ project_url: url || null } as any).eq("id", id);
    }, 400);
  };

  const tagsTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleTagsChange = (id: string, tags: string[]) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, tags } as any : i)));
    if (tagsTimers.current[id]) clearTimeout(tagsTimers.current[id]);
    tagsTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ tags } as any).eq("id", id);
    }, 600);
  };

  const dateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleProjectDateChange = (id: string, date: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, project_date: date } as any : i)));
    if (dateTimers.current[id]) clearTimeout(dateTimers.current[id]);
    dateTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ project_date: date } as any).eq("id", id);
    }, 600);
  };

  const handleHtmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      toast.error("Only .html files are accepted");
      e.target.value = "";
      return;
    }
    setUploading(true);
    const fileName = `projects/html/${Date.now()}-${Math.random().toString(36).slice(2)}.html`;
    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file, { contentType: "text/html" });
    if (uploadError) {
      toast.error("HTML upload failed");
    } else {
      const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);
      // Copy URL to clipboard and notify
      navigator.clipboard.writeText(urlData.publicUrl).catch(() => {});
      toast.success("HTML uploaded! URL copied to clipboard. Paste it into a card's URL field.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    // Optimistic update
    setItems(reordered);

    // Persist new sort orders
    const updates = reordered.map((item, idx) =>
      supabase.from("portfolio_items").update({ sort_order: idx }).eq("id", item.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      toast.error("Failed to save order");
      fetchItems();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-foreground/40 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/main")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Main Page CMS
          </button>
          <span className="text-muted-foreground/40">|</span>
          <h1 className="font-display text-sm tracking-[0.3em] uppercase">Portfolio CMS</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
          >
            ← SITE
          </button>

          {confirmSave ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setConfirmSave(false); window.location.reload(); }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Check size={10} /> YES
              </button>
              <button
                onClick={() => setConfirmSave(false)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={10} /> NO
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmSave(true)}
              className="px-2 py-1 text-[10px] font-display tracking-[0.2em] uppercase border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              SAVE
            </button>
          )}

          <span className="text-muted-foreground text-xs font-display tracking-wider hidden sm:block">
            {user.email}
          </span>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto">
        {/* Section tabs */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          {SECTIONS.map((s) => (
            <div key={s} className="flex items-center gap-0">
              <button
                onClick={() => { setActiveSection(s); setActiveSub("VECTOR"); }}
                className={`text-xs font-display tracking-[0.2em] uppercase px-3 py-1.5 border-y border-l transition-colors ${
                  activeSection === s
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
              <button
                onClick={() => toggleSection(s as any)}
                className={`px-1.5 py-1.5 border transition-colors ${
                  activeSection === s ? "border-foreground" : "border-border"
                } ${visibility[s as keyof typeof visibility] ? "text-foreground/60 hover:text-foreground" : "text-muted-foreground/30 hover:text-muted-foreground"}`}
                title={visibility[s as keyof typeof visibility] ? `Hide ${s} on site` : `Show ${s} on site`}
              >
                {visibility[s as keyof typeof visibility] ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
            </div>
          ))}

          {/* SHARE tab */}
          <button
            onClick={() => setActiveSection("share")}
            className={`text-xs font-display tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors ${
              activeSection === "share"
                ? "border-foreground text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            SHARE
          </button>

          <div className="ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs font-display tracking-[0.2em] uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                  <StickyNote size={12} />
                  NOTES
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-4 border-border bg-background">
                {user && <NotesPanel userId={user.id} />}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {activeSection === "share" && <ShareSection />}

        {/* SKILLS section */}
        {activeSection === "skills" && <SkillsSection />}

        {/* Gallery sub-tabs */}
        {activeSection === "gallery" && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {GALLERY_SUBS.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={`text-[10px] font-display tracking-[0.2em] uppercase px-2 py-1 border transition-colors ${
                  activeSub === sub
                    ? "border-foreground/60 text-foreground/80"
                    : "border-border text-muted-foreground hover:text-foreground/60"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Upload area */}
        {activeSection !== "share" && activeSection !== "skills" && (<div className="flex gap-3 mb-6">
          <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border hover:border-foreground/30 transition-colors py-6 cursor-pointer">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs font-display tracking-widest text-muted-foreground">
              {uploading ? "UPLOADING..." : "UPLOAD IMAGE"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleSingleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border hover:border-foreground/30 transition-colors py-6 cursor-pointer">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Images className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs font-display tracking-widest text-muted-foreground">
              {uploading ? "UPLOADING..." : "UPLOAD GROUP"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGroupUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {activeSection === "projects" && (
            <div className="flex-1 flex flex-col gap-2 border border-dashed border-border hover:border-foreground/30 transition-colors py-3 px-3">
              <div className="flex items-center gap-2">
                <input
                  id="project-name-input"
                  type="text"
                  placeholder="Project name…"
                  className="flex-1 bg-transparent text-xs font-display tracking-widest text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-border focus:border-foreground/40 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  id="project-url-input"
                  type="text"
                  placeholder="Paste project URL…"
                  className="flex-1 bg-transparent text-xs font-display tracking-widest text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
              {/* Description textarea + .txt upload */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-display tracking-widest text-muted-foreground uppercase">Description</span>
                  <label className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="w-3 h-3" />
                    <span className="text-[9px] font-display tracking-widest" id="project-txt-label">LOAD .TXT</span>
                    <input
                      id="project-txt-input"
                      type="file"
                      accept=".txt,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target?.result as string;
                          const ta = document.getElementById("project-desc-input") as HTMLTextAreaElement;
                          if (ta) ta.value = text;
                          const label = document.getElementById("project-txt-label");
                          if (label) label.textContent = file.name;
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>
                <textarea
                  id="project-desc-input"
                  placeholder="Project description…"
                  rows={3}
                  className="w-full bg-transparent text-xs font-display tracking-wider text-foreground placeholder:text-muted-foreground/50 outline-none border border-border focus:border-foreground/40 transition-colors resize-y px-2 py-1.5 rounded-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="w-3 h-3" />
                  <span className="text-[10px] font-display tracking-widest" id="project-thumb-label">
                    THUMBNAIL (optional)
                  </span>
                  <input
                    id="project-thumb-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const label = document.getElementById("project-thumb-label");
                      if (label) label.textContent = file ? file.name : "THUMBNAIL (optional)";
                    }}
                  />
                </label>
                <button
                  className="ml-auto text-[10px] font-display tracking-[0.2em] uppercase px-3 py-1 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  disabled={uploading}
                  onClick={async () => {
                    const nameInput = document.getElementById("project-name-input") as HTMLInputElement;
                    const urlInput = document.getElementById("project-url-input") as HTMLInputElement;
                    const thumbInput = document.getElementById("project-thumb-input") as HTMLInputElement;
                    const descInput = document.getElementById("project-desc-input") as HTMLTextAreaElement;
                    const txtInput = document.getElementById("project-txt-input") as HTMLInputElement;
                    const url = urlInput?.value.trim();
                    const projectName = nameInput?.value.trim();
                    const desc = descInput?.value.trim() || "";
                    if (!url && !projectName) { toast.error("Enter a project name or URL"); return; }

                    setUploading(true);
                    let imageUrl = "";

                    // Upload thumbnail if provided
                    const thumbFile = thumbInput?.files?.[0];
                    if (thumbFile) {
                      const ext = thumbFile.name.split(".").pop();
                      const fileName = `projects/thumbs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                      const { error: upErr } = await supabase.storage.from("portfolio-images").upload(fileName, thumbFile);
                      if (upErr) {
                        toast.error("Thumbnail upload failed");
                        setUploading(false);
                        return;
                      }
                      const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);
                      imageUrl = urlData.publicUrl;
                    }

                    const insertData: any = {
                      section: "projects",
                      subsection: null,
                      title: projectName || url.replace(/^https?:\/\//, "").split("/")[0],
                      image_url: imageUrl,
                      sort_order: items.length,
                      created_by: user?.id,
                      project_url: url || null,
                      description: desc,
                    };
                    const { error } = await supabase.from("portfolio_items").insert(insertData);
                    if (error) {
                      toast.error("Failed to add project");
                    } else {
                      toast.success("Project added!");
                      if (nameInput) nameInput.value = "";
                      urlInput.value = "";
                      if (descInput) descInput.value = "";
                      if (thumbInput) thumbInput.value = "";
                      if (txtInput) txtInput.value = "";
                      const label = document.getElementById("project-thumb-label");
                      if (label) label.textContent = "THUMBNAIL (optional)";
                      const txtLabel = document.getElementById("project-txt-label");
                      if (txtLabel) txtLabel.textContent = "LOAD .TXT";
                      fetchItems();
                    }
                    setUploading(false);
                  }}
                >
                  {uploading ? "ADDING..." : "ADD PROJECT"}
                </button>
              </div>
            </div>
          )}
        </div>)}

        {/* Bulk select toolbar */}
        {activeSection !== "share" && activeSection !== "skills" && items.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                setBulkSelectMode(!bulkSelectMode);
                setSelectedIds(new Set());
                setConfirmBulkDelete(false);
              }}
              className={`text-[10px] font-display tracking-[0.15em] uppercase px-2 py-1 border transition-colors ${
                bulkSelectMode
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {bulkSelectMode ? "CANCEL SELECT" : "SELECT"}
            </button>
            {bulkSelectMode && (
              <>
                <button
                  onClick={() => {
                    const pageIds = items.slice(cmsPage * CMS_ITEMS_PER_PAGE, (cmsPage + 1) * CMS_ITEMS_PER_PAGE).map(i => i.id);
                    const allSelected = pageIds.every(id => selectedIds.has(id));
                    const next = new Set(selectedIds);
                    pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
                    setSelectedIds(next);
                  }}
                  className="text-[10px] font-display tracking-[0.15em] uppercase px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  {items.slice(cmsPage * CMS_ITEMS_PER_PAGE, (cmsPage + 1) * CMS_ITEMS_PER_PAGE).every(i => selectedIds.has(i.id)) ? "DESELECT ALL" : "SELECT ALL"}
                </button>
                {selectedIds.size > 0 && (
                  confirmBulkDelete ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] text-destructive font-display tracking-widest">
                        Delete {selectedIds.size}?
                      </span>
                      <button
                        onClick={async () => {
                          const ids = Array.from(selectedIds);
                          // Delete associated storage files
                          const toDelete = items.filter(i => ids.includes(i.id) && i.image_url);
                          const storagePaths = toDelete
                            .map(i => {
                              const match = i.image_url.match(/portfolio-images\/(.+)$/);
                              return match ? match[1] : null;
                            })
                            .filter(Boolean) as string[];
                          if (storagePaths.length > 0) {
                            await supabase.storage.from("portfolio-images").remove(storagePaths);
                          }
                          const { error } = await supabase.from("portfolio_items").delete().in("id", ids);
                          if (error) {
                            toast.error("Failed to delete items");
                          } else {
                            toast.success(`Deleted ${ids.length} items`);
                            setSelectedIds(new Set());
                            setBulkSelectMode(false);
                            setConfirmBulkDelete(false);
                            fetchItems();
                          }
                        }}
                        className="p-1 rounded bg-destructive/80 hover:bg-destructive transition-colors"
                      >
                        <Check size={12} className="text-destructive-foreground" />
                      </button>
                      <button
                        onClick={() => setConfirmBulkDelete(false)}
                        className="p-1 rounded bg-muted/80 hover:bg-muted transition-colors"
                      >
                        <X size={12} className="text-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmBulkDelete(true)}
                      className="ml-auto flex items-center gap-1 text-[10px] font-display tracking-[0.15em] uppercase px-2 py-1 border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={10} />
                      DELETE ({selectedIds.size})
                    </button>
                  )
                )}
              </>
            )}
          </div>
        )}

        {/* Items grid */}
        {activeSection !== "share" && activeSection !== "skills" && (fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-12 font-display tracking-wider">
            No images in this section yet
          </p>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {items
                    .slice(cmsPage * CMS_ITEMS_PER_PAGE, (cmsPage + 1) * CMS_ITEMS_PER_PAGE)
                    .map((item) => (
                    <div key={item.id} className="relative">
                      {bulkSelectMode && (
                        <div
                          onClick={() => {
                            const next = new Set(selectedIds);
                            next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                            setSelectedIds(next);
                          }}
                          className="absolute inset-0 z-30 cursor-pointer flex items-center justify-center"
                        >
                          <div className={`absolute inset-0 transition-colors ${selectedIds.has(item.id) ? 'bg-primary/20' : 'bg-black/30 hover:bg-black/10'}`} />
                          <div className="absolute top-1 right-1 p-0.5 rounded bg-black/60">
                            {selectedIds.has(item.id) ? (
                              <CheckSquare size={16} className="text-primary" />
                            ) : (
                              <Square size={16} className="text-foreground/40" />
                            )}
                          </div>
                        </div>
                      )}
                      <SortableImageCard
                        id={item.id}
                        title={item.title}
                        image_url={item.image_url}
                        image_offset_x={(item as any).image_offset_x ?? 50}
                        image_offset_y={(item as any).image_offset_y ?? 50}
                        image_zoom={(item as any).image_zoom ?? 1}
                        text_align={(item as any).text_align ?? 'left'}
                        group_id={item.group_id}
                        project_url={(item as any).project_url}
                        description={(item as any).description}
                        tags={(item as any).tags}
                        project_date={(item as any).project_date}
                        showProjectUrl={activeSection === "projects"}
                        onDelete={() => handleDelete(item)}
                        onPositionChange={(x, y) => handlePositionChange(item.id, x, y)}
                        onZoomChange={(zoom) => handleZoomChange(item.id, zoom)}
                        onTitleChange={(title) => handleTitleChange(item.id, title)}
                        onTextAlignChange={(align) => handleTextAlignChange(item.id, align)}
                        onProjectUrlChange={(url) => handleProjectUrlChange(item.id, url)}
                        onDescriptionChange={(desc) => handleDescriptionChange(item.id, desc)}
                        onTagsChange={(tags) => handleTagsChange(item.id, tags)}
                        onProjectDateChange={(date) => handleProjectDateChange(item.id, date)}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* CMS Pagination */}
            {items.length > CMS_ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCmsPage((p) => Math.max(0, p - 1))}
                  disabled={cmsPage === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-display tracking-widest text-muted-foreground">
                  {cmsPage + 1} / {Math.ceil(items.length / CMS_ITEMS_PER_PAGE)}
                </span>
                <button
                  onClick={() => setCmsPage((p) => Math.min(Math.ceil(items.length / CMS_ITEMS_PER_PAGE) - 1, p + 1))}
                  disabled={cmsPage >= Math.ceil(items.length / CMS_ITEMS_PER_PAGE) - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ))}
      </div>

    </div>
  );
};

export default Admin;
