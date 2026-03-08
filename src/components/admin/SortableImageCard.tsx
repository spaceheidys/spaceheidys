import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, Move, ZoomIn, ZoomOut, AlignLeft, AlignCenter, AlignRight, Link, Check, X, RefreshCw, Edit2 } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SortableImageCardProps {
  id: string;
  title: string;
  image_url: string;
  image_offset_x: number;
  image_offset_y: number;
  image_zoom: number;
  text_align: string;
  group_id?: string | null;
  project_url?: string | null;
  description?: string;
  tags?: string[];
  project_date?: string;
  showProjectUrl?: boolean;
  onDelete: () => void;
  onPositionChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  onTitleChange: (title: string) => void;
  onTextAlignChange: (align: string) => void;
  onProjectUrlChange?: (url: string) => void;
  onDescriptionChange?: (desc: string) => void;
  onTagsChange?: (tags: string[]) => void;
  onProjectDateChange?: (date: string) => void;
}

const GROUP_COLORS = [
  "hsl(340, 80%, 55%)", "hsl(200, 80%, 55%)", "hsl(120, 60%, 45%)",
  "hsl(40, 90%, 55%)", "hsl(280, 70%, 55%)", "hsl(20, 85%, 55%)",
  "hsl(170, 70%, 45%)", "hsl(310, 70%, 55%)",
];

const groupColorMap = new Map<string, string>();
let colorIdx = 0;
const getGroupColor = (groupId: string): string => {
  if (!groupColorMap.has(groupId)) {
    groupColorMap.set(groupId, GROUP_COLORS[colorIdx % GROUP_COLORS.length]);
    colorIdx++;
  }
  return groupColorMap.get(groupId)!;
};

const SortableImageCard = ({
  id,
  title,
  image_url,
  image_offset_x,
  image_offset_y,
  image_zoom,
  text_align,
  group_id,
  project_url,
  description,
  tags,
  project_date,
  showProjectUrl,
  onDelete,
  onPositionChange,
  onZoomChange,
  onTitleChange,
  onTextAlignChange,
  onProjectUrlChange,
  onDescriptionChange,
  onTagsChange,
  onProjectDateChange,
}: SortableImageCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isPanning, setIsPanning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteUrl, setConfirmDeleteUrl] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editUrl, setEditUrl] = useState(project_url || "");
  const [confirmUrlChange, setConfirmUrlChange] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState(description || "");
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
  const groupColor = group_id ? getGroupColor(group_id) : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(groupColor ? { borderColor: groupColor, borderWidth: "2px" } : {}),
      }}
      className={`relative group aspect-square bg-secondary border overflow-hidden ${
        isDragging ? "border-foreground/50 shadow-lg" : groupColor ? "" : "border-border"
      }`}
    >
      <div ref={containerRef} className="w-full h-full overflow-hidden">
        {image_url ? (
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
        ) : project_url ? (
          <div className="w-full h-full overflow-hidden relative bg-black">
            <iframe
              src={project_url}
              title={title}
              className="absolute origin-top-left pointer-events-none"
              style={{
                width: "1200px",
                height: "1600px",
                transform: "scale(0.15)",
                transformOrigin: "top left",
              }}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 gap-1">
            <Link size={20} className="text-muted-foreground/30" />
            <span className="text-[8px] text-muted-foreground/40 font-display tracking-widest uppercase">
              No image
            </span>
          </div>
        )}
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
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1 flex items-center gap-1">
        <div className="flex-1 min-w-0">
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
        {/* Text align toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const cycle = { left: "center", center: "right", right: "left" } as Record<string, string>;
            onTextAlignChange(cycle[text_align] || "center");
          }}
          className="shrink-0 p-0.5 rounded hover:bg-foreground/10 transition-colors"
          title={`Align: ${text_align}`}
        >
          {text_align === "center" ? (
            <AlignCenter size={10} className="text-foreground/50" />
          ) : text_align === "right" ? (
            <AlignRight size={10} className="text-foreground/50" />
          ) : (
            <AlignLeft size={10} className="text-foreground/50" />
          )}
        </button>
      </div>

      {/* Project fields overlay – URL, Description, Tags, Date */}
      {showProjectUrl && (
        <div className="absolute bottom-[24px] left-0 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1.5 py-1 space-y-0.5">
          {/* URL + Change URL button */}
          <div className="flex items-center gap-1">
            <Link size={8} className="text-foreground/40 shrink-0" />
            {isEditingUrl ? (
              <input
                autoFocus
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                onBlur={() => {
                  setIsEditingUrl(false);
                  if (editUrl !== (project_url || "")) onProjectUrlChange?.(editUrl.trim());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") { setEditUrl(project_url || ""); setIsEditingUrl(false); }
                }}
                placeholder="https://..."
                className="w-full bg-transparent text-[8px] text-foreground/70 font-display tracking-wider outline-none border-b border-foreground/20 placeholder:text-foreground/20"
              />
            ) : (
              <span
                onClick={(e) => { e.stopPropagation(); setIsEditingUrl(true); setEditUrl(project_url || ""); }}
                className="block text-[8px] text-foreground/40 font-display tracking-wider truncate cursor-text hover:text-foreground/70 transition-colors flex-1 min-w-0"
              >
                {project_url || "Set URL…"}
              </span>
            )}
            {/* Change / Delete URL buttons with confirmation */}
            {project_url && !isEditingUrl && (
              confirmUrlChange ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[7px] text-foreground/40 mr-0.5">Edit?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmUrlChange(false);
                      setIsEditingUrl(true);
                      setEditUrl(project_url || "");
                    }}
                    className="p-0.5 rounded bg-primary/60 hover:bg-primary/80 transition-colors"
                    title="Yes, change URL"
                  >
                    <Check size={8} className="text-primary-foreground" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmUrlChange(false); }}
                    className="p-0.5 rounded bg-muted/60 hover:bg-muted/80 transition-colors"
                    title="Cancel"
                  >
                    <X size={8} className="text-foreground" />
                  </button>
                </div>
              ) : confirmDeleteUrl ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[7px] text-destructive/70 mr-0.5">Delete?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteUrl(false);
                      onProjectUrlChange?.("");
                      setEditUrl("");
                    }}
                    className="p-0.5 rounded bg-destructive/60 hover:bg-destructive/80 transition-colors"
                    title="Yes, delete URL"
                  >
                    <Check size={8} className="text-destructive-foreground" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteUrl(false); }}
                    className="p-0.5 rounded bg-muted/60 hover:bg-muted/80 transition-colors"
                    title="Cancel"
                  >
                    <X size={8} className="text-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmUrlChange(true); }}
                    className="p-0.5 rounded hover:bg-foreground/10 transition-colors"
                    title="Change URL"
                  >
                    <RefreshCw size={8} className="text-foreground/40 hover:text-foreground/70" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteUrl(true); }}
                    className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
                    title="Delete URL"
                  >
                    <Trash2 size={8} className="text-foreground/40 hover:text-destructive/70" />
                  </button>
                </div>
              )
            )}
          </div>
          {/* Description */}
          {isEditingDesc ? (
            <textarea
              autoFocus
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={() => {
                setIsEditingDesc(false);
                if (editDesc !== (description || "")) onDescriptionChange?.(editDesc.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setEditDesc(description || ""); setIsEditingDesc(false); }
              }}
              placeholder="Description…"
              rows={2}
              className="w-full bg-transparent text-[7px] text-foreground/70 font-display tracking-wider outline-none border-b border-foreground/15 placeholder:text-foreground/20 resize-none"
            />
          ) : (
            <span
              onClick={(e) => { e.stopPropagation(); setIsEditingDesc(true); setEditDesc(description || ""); }}
              className="block text-[7px] text-foreground/40 font-display tracking-wider truncate cursor-text hover:text-foreground/70 transition-colors"
            >
              {description || "Add description…"}
            </span>
          )}
          {/* Tags & Date */}
          <div className="flex gap-1">
            <input
              type="text"
              value={(tags || []).join(", ")}
              onChange={(e) => {
                const newTags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                onTagsChange?.(newTags);
              }}
              placeholder="Tags…"
              className="flex-1 bg-transparent text-[7px] text-foreground/50 font-display tracking-wider outline-none border-b border-foreground/10 placeholder:text-foreground/15"
              onClick={(e) => e.stopPropagation()}
            />
            <input
              type="text"
              value={project_date || ""}
              onChange={(e) => onProjectDateChange?.(e.target.value)}
              placeholder="Year"
              className="w-10 bg-transparent text-[7px] text-foreground/50 font-display tracking-wider outline-none border-b border-foreground/10 placeholder:text-foreground/15 text-right"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SortableImageCard;
