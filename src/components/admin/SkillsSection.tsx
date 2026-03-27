import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, GripVertical, Eye, EyeOff } from "lucide-react";
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

interface Skill {
  id: string;
  name: string;
  icon_url: string;
  sort_order: number;
  is_visible: boolean;
}

const SortableSkillRow = ({
  skill,
  onNameChange,
  onToggleVisible,
  onDelete,
  onIconUpload,
  uploading,
}: {
  skill: Skill;
  onNameChange: (id: string, name: string) => void;
  onToggleVisible: (id: string) => void;
  onDelete: (id: string) => void;
  onIconUpload: (id: string, file: File) => void;
  uploading: string | null;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border border-border px-3 py-2 group"
    >
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
        <GripVertical size={14} />
      </div>

      {/* Icon preview + upload */}
      <label className="shrink-0 w-10 h-10 border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors overflow-hidden">
        {uploading === skill.id ? (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        ) : skill.icon_url ? (
          <img src={skill.icon_url} alt={skill.name} className="w-full h-full object-contain p-0.5" />
        ) : (
          <Upload size={12} className="text-muted-foreground/40" />
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onIconUpload(skill.id, file);
            e.target.value = "";
          }}
        />
      </label>

      {/* Name */}
      <input
        type="text"
        value={skill.name}
        onChange={(e) => onNameChange(skill.id, e.target.value)}
        placeholder="Skill name…"
        className="flex-1 bg-transparent text-xs font-display tracking-widest text-foreground placeholder:text-muted-foreground/40 outline-none"
      />

      {/* Visibility toggle */}
      <button
        onClick={() => onToggleVisible(skill.id)}
        className={`transition-colors ${skill.is_visible ? "text-foreground/60 hover:text-foreground" : "text-muted-foreground/30 hover:text-muted-foreground"}`}
      >
        {skill.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { onDelete(skill.id); setConfirmDelete(false); }}
            className="text-[9px] font-display tracking-widest text-destructive hover:text-destructive/80"
          >
            YES
          </button>
          <span className="text-muted-foreground/30 text-[9px]">/</span>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-[9px] font-display tracking-widest text-muted-foreground hover:text-foreground"
          >
            NO
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-muted-foreground/40 hover:text-destructive transition-colors"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

const SkillsSection = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const nameTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchSkills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Failed to load skills");
    } else {
      setSkills((data as Skill[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAdd = async () => {
    const { data, error } = await supabase
      .from("skills")
      .insert({ name: "", icon_url: "", sort_order: skills.length })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add skill");
    } else if (data) {
      setSkills((prev) => [...prev, data as Skill]);
    }
  };

  const handleNameChange = (id: string, name: string) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    if (nameTimers.current[id]) clearTimeout(nameTimers.current[id]);
    nameTimers.current[id] = setTimeout(async () => {
      await supabase.from("skills").update({ name }).eq("id", id);
    }, 400);
  };

  const handleToggleVisible = async (id: string) => {
    const skill = skills.find((s) => s.id === id);
    if (!skill) return;
    const newVal = !skill.is_visible;
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, is_visible: newVal } : s)));
    await supabase.from("skills").update({ is_visible: newVal }).eq("id", id);
  };

  const handleDelete = async (id: string) => {
    const skill = skills.find((s) => s.id === id);
    // Delete icon from storage if exists
    if (skill?.icon_url) {
      try {
        const match = skill.icon_url.match(/portfolio-images\/(.+)$/);
        if (match) {
          await supabase.storage.from("portfolio-images").remove([match[1]]);
        }
      } catch {}
    }
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
    } else {
      setSkills((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleIconUpload = async (id: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Icon must be under 2MB");
      return;
    }
    setUploadingId(id);
    const ext = file.name.split(".").pop();
    const fileName = `skills/icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Upload failed");
      setUploadingId(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(fileName);

    await supabase.from("skills").update({ icon_url: urlData.publicUrl }).eq("id", id);
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, icon_url: urlData.publicUrl } : s))
    );
    setUploadingId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = skills.findIndex((s) => s.id === active.id);
    const newIndex = skills.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(skills, oldIndex, newIndex);
    setSkills(reordered);

    const updates = reordered.map((s, idx) =>
      supabase.from("skills").update({ sort_order: idx }).eq("id", s.id)
    );
    await Promise.all(updates);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center mb-4">
        <span className="text-[10px] font-display tracking-widest text-muted-foreground uppercase">
          {skills.length} skill{skills.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <SortableSkillRow
                key={skill.id}
                skill={skill}
                onNameChange={handleNameChange}
                onToggleVisible={handleToggleVisible}
                onDelete={handleDelete}
                onIconUpload={handleIconUpload}
                uploading={uploadingId}
              />
            ))}
            <button
              onClick={handleAdd}
              className="flex items-center justify-center border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors text-[10px] font-display tracking-[0.2em] uppercase px-6 py-2"
            >
              + ADD SKILL
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SkillsSection;
