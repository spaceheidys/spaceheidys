import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Move, Eye, EyeOff, Loader2 } from "lucide-react";
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
import { useCapabilities, type Capability } from "@/hooks/useCapabilities";

const Row = ({
  item,
  index,
  onLabelChange,
  onToggle,
  onDelete,
}: {
  item: Capability;
  index: number;
  onLabelChange: (id: string, label: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 border border-border px-3 py-2">
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
        <Move size={14} />
      </div>
      <span className="text-[10px] font-display tracking-widest text-muted-foreground w-6">
        {String(index + 1).padStart(2, "0")}
      </span>
      <input
        type="text"
        value={item.label}
        onChange={(e) => onLabelChange(item.id, e.target.value)}
        placeholder="Capability…"
        className="flex-1 bg-transparent text-xs font-body text-foreground placeholder:text-muted-foreground/40 outline-none"
      />
      <button
        onClick={() => onToggle(item.id)}
        className={item.is_visible ? "text-foreground/60 hover:text-foreground" : "text-muted-foreground/30 hover:text-muted-foreground"}
      >
        {item.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>
      {confirmDelete ? (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => { onDelete(item.id); setConfirmDelete(false); }} className="text-[9px] font-display tracking-widest text-destructive">YES</button>
          <span className="text-muted-foreground/30 text-[9px]">/</span>
          <button onClick={() => setConfirmDelete(false)} className="text-[9px] font-display tracking-widest text-muted-foreground hover:text-foreground">NO</button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

const CapabilitiesSection = () => {
  const { items, setItems, loading } = useCapabilities();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleAdd = async () => {
    const { data, error } = await supabase
      .from("capabilities")
      .insert({ label: "", sort_order: items.length })
      .select()
      .single();
    if (error) toast.error("Failed to add");
    else if (data) setItems((prev) => [...prev, data as Capability]);
  };

  const handleLabelChange = (id: string, label: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, label } : i)));
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(async () => {
      await supabase.from("capabilities").update({ label }).eq("id", id);
    }, 400);
  };

  const handleToggle = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = !item.is_visible;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_visible: next } : i)));
    await supabase.from("capabilities").update({ is_visible: next }).eq("id", id);
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from("capabilities").delete().eq("id", id);
    if (error) toast.error("Delete failed");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    await Promise.all(
      reordered.map((i, idx) => supabase.from("capabilities").update({ sort_order: idx }).eq("id", i.id))
    );
  };

  return (
    <div className="border-t border-border pt-6 mt-6">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase mb-4">
        About — Capabilities
      </p>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 max-w-lg">
              {items.map((item, idx) => (
                <Row
                  key={item.id}
                  item={item}
                  index={idx}
                  onLabelChange={handleLabelChange}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
              <button
                onClick={handleAdd}
                className="border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors text-[10px] font-display tracking-[0.2em] uppercase px-6 py-2"
              >
                + ADD CAPABILITY
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default CapabilitiesSection;
