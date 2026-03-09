import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, GripVertical, Trash2, Plus, Loader2, Upload } from "lucide-react";
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
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon_url: string;
  is_visible: boolean;
  sort_order: number;
}

interface SortableRowProps {
  link: SocialLink;
  onVisibilityToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onLabelChange: (id: string, val: string) => void;
  onUrlChange: (id: string, val: string) => void;
  onIconUpload: (id: string, file: File) => void;
  uploadingId: string | null;
}

const SortableRow = ({
  link,
  onVisibilityToggle,
  onDelete,
  onLabelChange,
  onUrlChange,
  onIconUpload,
  uploadingId,
}: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 border border-border bg-background group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <GripVertical size={14} />
      </button>

      {/* Icon preview + upload */}
      <label className="relative shrink-0 cursor-pointer w-7 h-7 flex items-center justify-center border border-dashed border-border hover:border-foreground/40 transition-colors overflow-hidden rounded-sm">
        {uploadingId === link.id ? (
          <Loader2 size={12} className="animate-spin text-muted-foreground" />
        ) : link.icon_url ? (
          <img src={link.icon_url} alt={link.label} className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
        ) : (
          <Upload size={10} className="text-muted-foreground/40" />
        )}
        <input
          type="file"
          accept="image/*,.svg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onIconUpload(link.id, f);
            e.target.value = "";
          }}
        />
      </label>

      {/* Label */}
      <input
        type="text"
        value={link.label}
        onChange={(e) => onLabelChange(link.id, e.target.value)}
        placeholder="Label"
        className="w-24 bg-transparent text-xs font-display tracking-wider text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-transparent focus:border-border transition-colors"
      />

      {/* URL */}
      <input
        type="text"
        value={link.url}
        onChange={(e) => onUrlChange(link.id, e.target.value)}
        placeholder="https://..."
        className="flex-1 bg-transparent text-xs font-display tracking-wider text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-transparent focus:border-border transition-colors min-w-0"
      />

      {/* Visibility toggle */}
      <button
        onClick={() => onVisibilityToggle(link.id)}
        className="shrink-0 transition-colors"
        title={link.is_visible ? "Hide" : "Show"}
      >
        {link.is_visible
          ? <Eye size={13} className="text-foreground/50 hover:text-foreground" />
          : <EyeOff size={13} className="text-muted-foreground/30 hover:text-muted-foreground" />
        }
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(link.id)}
        className="shrink-0 text-muted-foreground/30 hover:text-destructive transition-colors"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

const ShareSection = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const labelTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const urlTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Failed to load social links");
    else setLinks((data as SocialLink[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleVisibilityToggle = async (id: string) => {
    const link = links.find((l) => l.id === id);
    if (!link) return;
    const newVal = !link.is_visible;
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, is_visible: newVal } : l));
    const { error } = await supabase.from("social_links").update({ is_visible: newVal }).eq("id", id);
    if (error) { toast.error("Failed to update visibility"); fetchLinks(); }
  };

  const handleDelete = async (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); fetchLinks(); }
    else toast.success("Deleted");
  };

  const handleLabelChange = (id: string, val: string) => {
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, label: val } : l));
    if (labelTimers.current[id]) clearTimeout(labelTimers.current[id]);
    labelTimers.current[id] = setTimeout(() => {
      supabase.from("social_links").update({ label: val }).eq("id", id);
    }, 500);
  };

  const handleUrlChange = (id: string, val: string) => {
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, url: val } : l));
    if (urlTimers.current[id]) clearTimeout(urlTimers.current[id]);
    urlTimers.current[id] = setTimeout(() => {
      supabase.from("social_links").update({ url: val }).eq("id", id);
    }, 500);
  };

  const handleIconUpload = async (id: string, file: File) => {
    setUploadingId(id);
    const ext = file.name.split(".").pop();
    const fileName = `social_network/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file, { contentType: file.type });
    if (upErr) {
      toast.error("Icon upload failed");
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);
    const { error } = await supabase.from("social_links").update({ icon_url: urlData.publicUrl }).eq("id", id);
    if (error) toast.error("Failed to save icon");
    else {
      setLinks((prev) => prev.map((l) => l.id === id ? { ...l, icon_url: urlData.publicUrl } : l));
      toast.success("Icon updated");
    }
    setUploadingId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = links.findIndex((l) => l.id === active.id);
    const newIdx = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIdx, newIdx);
    setLinks(reordered);
    const updates = reordered.map((l, idx) =>
      supabase.from("social_links").update({ sort_order: idx }).eq("id", l.id)
    );
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) toast.error("Failed to save order");
  };

  const handleAddNew = async () => {
    const maxOrder = links.reduce((m, l) => Math.max(m, l.sort_order), -1);
    const { data, error } = await supabase
      .from("social_links")
      .insert({ label: "New Link", url: "", icon_url: "", is_visible: true, sort_order: maxOrder + 1 })
      .select()
      .single();
    if (error) toast.error("Failed to add link");
    else { setLinks((prev) => [...prev, data as SocialLink]); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-4 uppercase">
        Drag to reorder · Click eye to show/hide · Click icon area to replace
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {links.map((link) => (
              <SortableRow
                key={link.id}
                link={link}
                onVisibilityToggle={handleVisibilityToggle}
                onDelete={handleDelete}
                onLabelChange={handleLabelChange}
                onUrlChange={handleUrlChange}
                onIconUpload={handleIconUpload}
                uploadingId={uploadingId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAddNew}
        className="mt-4 flex items-center gap-2 text-[10px] font-display tracking-[0.2em] uppercase px-3 py-2 border border-dashed border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors w-full justify-center"
      >
        <Plus size={11} />
        ADD LINK
      </button>
    </div>
  );
};

export default ShareSection;
