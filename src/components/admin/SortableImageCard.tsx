import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, Move } from "lucide-react";
import { useRef, useState, useCallback } from "react";

interface SortableImageCardProps {
  id: string;
  title: string;
  image_url: string;
  image_offset_x: number;
  image_offset_y: number;
  onDelete: () => void;
  onPositionChange: (x: number, y: number) => void;
}

const SortableImageCard = ({
  id,
  title,
  image_url,
  image_offset_x,
  image_offset_y,
  onDelete,
  onPositionChange,
}: SortableImageCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  const handlePanStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, ox: image_offset_x, oy: image_offset_y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [image_offset_x, image_offset_y]
  );

  const handlePanMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning || !panStart.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - panStart.current.x) / rect.width) * -100;
      const dy = ((e.clientY - panStart.current.y) / rect.height) * -100;
      const nx = Math.max(0, Math.min(100, panStart.current.ox + dx));
      const ny = Math.max(0, Math.min(100, panStart.current.oy + dy));
      onPositionChange(nx, ny);
    },
    [isPanning, onPositionChange]
  );

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-square bg-secondary border overflow-hidden ${
        isDragging ? "border-foreground/50 shadow-lg" : "border-border"
      }`}
    >
      <div ref={containerRef} className="w-full h-full">
        <img
          src={image_url}
          alt={title}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: `${image_offset_x}% ${image_offset_y}%` }}
          loading="lazy"
        />
      </div>

      {/* Drag handle – top left */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} className="text-foreground/70" />
      </div>

      {/* Pan handle – top right */}
      <div
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
        onPointerCancel={handlePanEnd}
        className={`absolute top-1 right-1 z-10 p-1 rounded transition-opacity touch-none ${
          isPanning
            ? "opacity-100 bg-primary/70"
            : "opacity-0 group-hover:opacity-100 bg-black/50 cursor-move"
        }`}
      >
        <Move size={14} className="text-foreground/70" />
      </div>

      {/* Delete overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <button
          onClick={onDelete}
          className="text-destructive hover:text-destructive/80 transition-colors pointer-events-auto"
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
