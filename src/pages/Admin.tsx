import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, LogOut, Loader2, Check, X } from "lucide-react";
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

const SECTIONS = ["gallery", "projects", "skills", "archive"] as const;
const GALLERY_SUBS = ["VECTOR", "DIGITAL", "AI", "SKETCHES"];

interface PortfolioItem {
  id: string;
  section: string;
  subsection: string | null;
  title: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("gallery");
  const [activeSub, setActiveSub] = useState<string>("VECTOR");
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmSave, setConfirmSave] = useState(false);

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
  }, [activeSection, activeSub, user, isAdmin]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedItems: PortfolioItem[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
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

      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({
          section: activeSection,
          subsection: activeSection === "gallery" ? activeSub : null,
          title: file.name.replace(/\.[^.]+$/, ""),
          image_url: urlData.publicUrl,
          sort_order: items.length + uploadedItems.length,
          created_by: user?.id,
        })
        .select()
        .single();

      if (!error && data) {
        uploadedItems.push(data as PortfolioItem);
      }
    }

    if (uploadedItems.length > 0) {
      toast.success(`Uploaded ${uploadedItems.length} image(s)`);
      fetchItems();
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (item: PortfolioItem) => {
    const url = new URL(item.image_url);
    const pathParts = url.pathname.split("/storage/v1/object/public/portfolio-images/");
    const filePath = pathParts[1];

    if (filePath) {
      await supabase.storage.from("portfolio-images").remove([filePath]);
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
        <h1 className="font-display text-sm tracking-[0.3em] uppercase">Portfolio CMS</h1>
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
        <div className="flex gap-2 mb-4 flex-wrap">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setActiveSection(s); setActiveSub("VECTOR"); }}
              className={`text-xs font-display tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors ${
                activeSection === s
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

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
        <label className="flex items-center justify-center gap-2 border border-dashed border-border hover:border-foreground/30 transition-colors py-6 mb-6 cursor-pointer">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-xs font-display tracking-widest text-muted-foreground">
            {uploading ? "UPLOADING..." : "UPLOAD IMAGES"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>

        {/* Items grid */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-12 font-display tracking-wider">
            No images in this section yet
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((item) => (
                  <SortableImageCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    image_url={item.image_url}
                    image_offset_x={(item as any).image_offset_x ?? 50}
                    image_offset_y={(item as any).image_offset_y ?? 50}
                    image_zoom={(item as any).image_zoom ?? 1}
                    onDelete={() => handleDelete(item)}
                    onPositionChange={(x, y) => handlePositionChange(item.id, x, y)}
                    onZoomChange={(zoom) => handleZoomChange(item.id, zoom)}
                    onTitleChange={(title) => handleTitleChange(item.id, title)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

    </div>
  );
};

export default Admin;
