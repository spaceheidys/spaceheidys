import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";

interface SortableImageCardProps {
  id: string;
  title: string;
  image_url: string;
  onDelete: () => void;
}

const SortableImageCard = ({ id, title, image_url, onDelete }: SortableImageCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-square bg-secondary border overflow-hidden ${
        isDragging ? "border-foreground/50 shadow-lg" : "border-border"
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} className="text-foreground/70" />
      </div>

      <img
        src={image_url}
        alt={title}
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={onDelete}
          className="text-destructive hover:text-destructive/80 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <span className="absolute bottom-1 left-1 text-[8px] text-foreground/40 font-display tracking-wider truncate max-w-[90%]">
        {title}
      </span>
    </div>
  );
};

export default SortableImageCard;
