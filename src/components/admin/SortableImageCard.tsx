import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, Move, ZoomIn, ZoomOut, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { Check, X } from "lucide-react";

interface SortableImageCardProps {
  id: string;
  title: string;
  image_url: string;
  image_offset_x: number;
  image_offset_y: number;
  image_zoom: number;
  text_align: string;
  onDelete: () => void;
  onPositionChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  onTitleChange: (title: string) => void;
  onTextAlignChange: (align: string) => void;
}

const SortableImageCard = ({
  id,
  title,
  image_url,
  image_offset_x,
  image_offset_y,
  image_zoom,
  text_align,
  onDelete,
  onPositionChange,
  onZoomChange,
  onTitleChange,
  onTextAlignChange,
}: SortableImageCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isPanning, setIsPanning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
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

  const scale = image_zoom;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-square bg-secondary border overflow-hidden ${
        isDragging ? "border-foreground/50 shadow-lg" : "border-border"
      }`}
    >
      <div ref={containerRef} className="w-full h-full overflow-hidden">
        <img
          src={image_url}
          alt={title}
          className="w-full h-full object-cover pointer-events-none origin-center"
          style={{
            objectPosition: `${image_offset_x}% ${image_offset_y}%`,
            transform: `scale(${scale})`,
          }}
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

      {/* Zoom slider – top center */}
      <div
        className="absolute top-1 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <ZoomOut size={10} className="text-foreground/60 shrink-0" />
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={image_zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="w-14 h-1 appearance-none bg-foreground/20 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground/70"
        />
        <ZoomIn size={10} className="text-foreground/60 shrink-0" />
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
        {confirmDelete ? (
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="p-1.5 rounded bg-destructive/80 hover:bg-destructive transition-colors"
            >
              <Check size={14} className="text-destructive-foreground" />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded bg-muted/80 hover:bg-muted transition-colors"
            >
              <X size={14} className="text-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-destructive hover:text-destructive/80 transition-colors pointer-events-auto"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Title area below image */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
        {isEditingTitle ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              if (editTitle.trim() && editTitle !== title) onTitleChange(editTitle.trim());
              else setEditTitle(title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.currentTarget.blur(); }
              if (e.key === "Escape") { setEditTitle(title); setIsEditingTitle(false); }
            }}
            className="w-full bg-transparent text-[9px] text-foreground/80 font-display tracking-wider outline-none border-b border-foreground/30"
          />
        ) : (
          <span
            onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); setEditTitle(title); }}
            className="block text-[9px] text-foreground/50 font-display tracking-wider truncate cursor-text hover:text-foreground/80 transition-colors"
            title="Click to rename"
          >
            {title}
          </span>
        )}
      </div>
    </div>
  );
};

export default SortableImageCard;
