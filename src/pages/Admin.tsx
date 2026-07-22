import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Images, LogOut, Loader2, Check, X, ChevronLeft, ChevronRight, Eye, EyeOff, FileCode, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, Move, FolderInput, Edit2, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input as UIInput } from "@/components/ui/input";
import { Textarea as UITextarea } from "@/components/ui/textarea";
import { Label as UILabel } from "@/components/ui/label";
import { Button as UIButton } from "@/components/ui/button";
import AdminTopNav from "@/components/admin/AdminTopNav";
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
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SortableImageCard from "@/components/admin/SortableImageCard";
import ShareSection from "@/components/admin/ShareSection";
import SkillsSection from "@/components/admin/SkillsSection";
import { useSectionContent } from "@/hooks/useSectionContent";
import { useGallerySubs } from "@/hooks/useGallerySubs";
import { Plus } from "lucide-react";
// Collapsed-group tile: dedicated sortable so folders can be dragged/reordered
// even when the expand overlay is on top of the card.
interface CollapsedGroupTileProps {
  id: string;
  title: string;
  imageUrl: string;
  groupCount: number;
  folderVisible: boolean;
  onExpand: () => void;
  onAddImage: () => void;
  onToggleVisibility: () => void;
  onRename: () => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onFileChange: (f: File) => void;
}

const CollapsedGroupTile = ({
  id, title, imageUrl, groupCount, folderVisible,
  onExpand, onAddImage, onToggleVisibility, onRename,
  fileInputRef, onFileChange,
}: CollapsedGroupTileProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-[3/4] border border-border overflow-hidden bg-muted/10"
    >
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" draggable={false} />
      )}
      <button
        onClick={onExpand}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer hover:bg-black/30 transition-colors"
      >
        {title && (
          <span className="text-[11px] font-display tracking-widest text-white uppercase mb-1 px-3 text-center line-clamp-2">
            {title}
          </span>
        )}
        <span className="text-[9px] font-display tracking-widest text-white/60 uppercase mb-1">
          GROUP · {groupCount} IMG
        </span>
        <ChevronDown size={16} className="text-white/70" />
        <span className="text-[9px] font-display tracking-widest text-white/50 mt-0.5">
          EXPAND
        </span>
      </button>
      {/* Drag handle – above overlay */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-40 p-1 bg-black/70 hover:bg-black/90 rounded cursor-grab active:cursor-grabbing"
        title="Drag to reorder folder"
      >
        <Move size={12} className="text-white/80" />
      </div>
      {/* Folder action buttons */}
      <div className="absolute top-1 right-1 z-40 flex flex-col gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onAddImage(); }}
          className="p-1 rounded bg-black/70 hover:bg-black/90 text-white/80 hover:text-white transition-colors"
          title="Add image to folder"
        >
          <ImagePlus size={12} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await onFileChange(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="p-1 rounded bg-black/70 hover:bg-black/90 text-white/80 hover:text-white transition-colors"
          title={folderVisible ? "Hide folder from gallery" : "Show folder in gallery"}
        >
          {folderVisible ? <Eye size={12} /> : <EyeOff size={12} className="text-destructive/80" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRename(); }}
          className="p-1 rounded bg-black/70 hover:bg-black/90 text-white/80 hover:text-white transition-colors"
          title="Rename folder / edit info"
        >
          <Edit2 size={12} />
        </button>
      </div>
    </div>
  );
};

const PORTFOLIO_SECTION_KEYS = ["gallery", "projects", "skills", "archive", "share"];

import type { SectionSetting } from "@/hooks/useSectionSettings";

interface SortableSectionTabProps {
  sec: SectionSetting;
  isActive: boolean;
  isVisible: boolean;
  isEditing: boolean;
  editLabel: string;
  editLabelJp: string;
  onSelect: () => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onLabelChange: (v: string) => void;
  onLabelJpChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const SortableSectionTab = ({ sec, isActive, isVisible, isEditing, editLabel, editLabelJp, onSelect, onToggle, onStartEdit, onLabelChange, onLabelJpChange, onSaveEdit, onCancelEdit }: SortableSectionTabProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.section });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [showConfirm, setShowConfirm] = useState(false);

  const isDirty = isEditing && (editLabel !== sec.label || editLabelJp !== sec.label_jp);

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-0">
      <button
        {...attributes}
        {...listeners}
        className="px-1 py-1.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <Move size={10} />
      </button>
      {isEditing ? (
        <div className="flex items-center gap-1 px-2 py-0.5 border border-foreground">
          <input
            value={editLabel}
            onChange={(e) => { onLabelChange(e.target.value); setShowConfirm(false); }}
            className="w-16 bg-transparent text-xs font-display tracking-wider uppercase outline-none text-foreground"
            placeholder="EN"
            autoFocus
          />
          <input
            value={editLabelJp}
            onChange={(e) => { onLabelJpChange(e.target.value); setShowConfirm(false); }}
            className="w-16 bg-transparent text-xs font-display outline-none text-foreground"
            placeholder="JP"
          />
          {showConfirm ? (
            <>
              <button
                onClick={() => { onSaveEdit(); setShowConfirm(false); }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Check size={9} /> YES
              </button>
              <button
                onClick={() => { onCancelEdit(); setShowConfirm(false); }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={9} /> NO
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { if (isDirty) { setShowConfirm(true); } else { onCancelEdit(); } }}
                className="text-foreground hover:text-foreground/80"
                title={isDirty ? "Save changes" : "Close"}
              >
                <Check size={10} />
              </button>
              <button onClick={onCancelEdit} className="text-muted-foreground hover:text-foreground"><X size={10} /></button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={onSelect}
          onDoubleClick={onStartEdit}
          className={`text-xs font-display tracking-[0.2em] uppercase px-3 py-1.5 border-y border-l transition-colors ${
            isActive ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"
          }`}
          title="Double-click to rename"
        >
          {sec.label || sec.section}
        </button>
      )}
      <button
        onClick={onToggle}
        className={`px-1.5 py-1.5 border transition-colors ${
          isActive ? "border-foreground" : "border-border"
        } ${isVisible ? "text-foreground/60 hover:text-foreground" : "text-muted-foreground/30 hover:text-muted-foreground"}`}
        title={isVisible ? `Hide ${sec.section} on site` : `Show ${sec.section} on site`}
      >
        {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
      </button>
    </div>
  );
};

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

const SkillsDescriptionBox = ({ getContent, updateContent }: { getContent: (k: string) => string; updateContent: (k: string, v: string) => Promise<void> }) => {
  const [draft, setDraft] = useState(getContent("skills_description"));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(getContent("skills_description"));
    setDirty(false);
  }, [getContent("skills_description")]);

  const save = async () => {
    await updateContent("skills_description", draft);
    setDirty(false);
    toast.success("Skills description saved");
  };

  const cancel = () => {
    setDraft(getContent("skills_description"));
    setDirty(false);
  };

  return (
    <div className="border-t border-border pt-4 mt-4 max-w-lg">
      <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground mb-2">
        Description
      </p>
      <textarea
        value={draft}
        onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
        placeholder="Add description text below skills..."
        rows={4}
        className="w-full p-3 bg-transparent border border-border text-sm font-body text-foreground resize-y outline-none focus:border-foreground transition-colors"
      />
      {dirty && (
        <div className="flex gap-2 mt-2 justify-end">
          <button
            onClick={save}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            <Check size={10} /> YES
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={10} /> NO
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Gallery Sub-Tabs with add/delete ──────────────────────────────────────────
import type { GallerySub } from "@/hooks/useGallerySubs";

const GallerySubTabs = ({
  subs,
  activeSub,
  onSelect,
  onSave,
}: {
  subs: GallerySub[];
  activeSub: string;
  onSelect: (sub: string) => void;
  onSave: (subs: GallerySub[]) => Promise<void>;
}) => {
  const [adding, setAdding] = useState(false);
  const [newEn, setNewEn] = useState("");
  const [newJp, setNewJp] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdd = async () => {
    const label = newEn.trim().toUpperCase();
    if (!label) return;
    if (subs.some((s) => s.en === label)) {
      toast.error("Already exists");
      return;
    }
    await onSave([...subs, { en: label, jp: newJp.trim() || label }]);
    onSelect(label);
    setNewEn("");
    setNewJp("");
    setAdding(false);
    toast.success(`${label} added`);
  };

  const handleDelete = async (en: string) => {
    const updated = subs.filter((s) => s.en !== en);
    await onSave(updated);
    if (activeSub === en && updated.length > 0) onSelect(updated[0].en);
    setConfirmDelete(null);
    toast.success(`${en} removed`);
  };

  return (
    <div className="flex gap-2 mb-6 flex-wrap items-center">
      {subs.map((sub) => (
        <div key={sub.en} className="relative group">
          <button
            onClick={() => onSelect(sub.en)}
            className={`text-[10px] font-display tracking-[0.2em] uppercase px-2 py-1 border transition-colors ${
              activeSub === sub.en
                ? "border-foreground/60 text-foreground/80"
                : "border-border text-muted-foreground hover:text-foreground/60"
            }`}
          >
            {sub.en}
          </button>
          {confirmDelete === sub.en ? (
            <span className="absolute -top-5 left-0 flex items-center gap-0.5 bg-background border border-border px-1 z-10">
              <button onClick={() => handleDelete(sub.en)} className="text-[9px] text-red-400 hover:text-red-300 font-display tracking-wider">YES</button>
              <span className="text-muted-foreground/30 text-[9px]">/</span>
              <button onClick={() => setConfirmDelete(null)} className="text-[9px] text-muted-foreground hover:text-foreground font-display tracking-wider">NO</button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(sub.en)}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-background border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title={`Delete ${sub.en}`}
            >
              <X size={8} className="text-muted-foreground" />
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-1">
          <input
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            placeholder="EN"
            className="w-16 bg-transparent border border-border px-1.5 py-0.5 text-[10px] font-display tracking-wider uppercase outline-none text-foreground"
            autoFocus
          />
          <input
            value={newJp}
            onChange={(e) => setNewJp(e.target.value)}
            placeholder="JP"
            className="w-16 bg-transparent border border-border px-1.5 py-0.5 text-[10px] font-jp outline-none text-foreground"
          />
          <button onClick={handleAdd} className="text-foreground/60 hover:text-foreground"><Check size={12} /></button>
          <button onClick={() => { setAdding(false); setNewEn(""); setNewJp(""); }} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-6 h-6 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors flex items-center justify-center"
          title="Add subcategory"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
};

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { visibility, sections, toggle: toggleSection, updateLabel, reorder } = useSectionSettings();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLabelJp, setEditLabelJp] = useState("");
  const { get: getContent, update: updateContent } = useSectionContent();
  const { subs: gallerySubs, save: saveGallerySubs } = useGallerySubs();
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupDescription, setGroupDescription] = useState("");
  const [cmsPageSize, setCmsPageSize] = useState<number>(() => {
    const v = parseInt(localStorage.getItem("admin_cms_page_size") || "12", 10);
    return [12, 24, 36].includes(v) ? v : 12;
  });
  const CMS_ITEMS_PER_PAGE = cmsPageSize;

  // Blocks: each block is either a single (non-group) item or a whole group.
  // Blocks preserve the first-appearance order of their items so groups
  // always stay contiguous, even after cross-item reorders.
  const blocks = useMemo(() => {
    const seen = new Set<string>();
    const b: { key: string; groupId: string | null; items: PortfolioItem[] }[] = [];
    items.forEach((it) => {
      if (it.group_id) {
        if (seen.has(it.group_id)) return;
        seen.add(it.group_id);
        const groupItems = items.filter((i) => i.group_id === it.group_id);
        b.push({ key: `g:${it.group_id}`, groupId: it.group_id, items: groupItems });
      } else {
        b.push({ key: `i:${it.id}`, groupId: null, items: [it] });
      }
    });
    return b;
  }, [items]);

  const displayItems = useMemo(() => {
    const list: { item: PortfolioItem; isGroupHeader: boolean; groupCount: number; isCollapsed: boolean }[] = [];
    blocks.forEach((blk) => {
      if (blk.groupId && collapsedGroups.has(blk.groupId)) {
        list.push({
          item: blk.items[0],
          isGroupHeader: true,
          groupCount: blk.items.length,
          isCollapsed: true,
        });
      } else {
        blk.items.forEach((it, idx) => {
          list.push({
            item: it,
            isGroupHeader: !!blk.groupId && idx === 0,
            groupCount: blk.items.length,
            isCollapsed: false,
          });
        });
      }
    });
    return list;
  }, [blocks, collapsedGroups]);

  const totalCmsPages = Math.max(1, Math.ceil(displayItems.length / CMS_ITEMS_PER_PAGE));
  const paginatedDisplayItems = displayItems.slice(cmsPage * CMS_ITEMS_PER_PAGE, (cmsPage + 1) * CMS_ITEMS_PER_PAGE);

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

  useEffect(() => {
    if (cmsPage > totalCmsPages - 1) setCmsPage(totalCmsPages - 1);
  }, [cmsPage, totalCmsPages]);

  const uploadFiles = async (files: File[], grouped: boolean, groupDesc?: string) => {
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
      if (groupId && groupDesc && groupDesc.trim()) {
        insertData.description = groupDesc.trim();
      }

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
    await uploadFiles(Array.from(files), true, groupDescription);
    setGroupDescription("");
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

  const handleVisibilityChange = async (id: string, visible: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_visible: visible } as any : i)));
    await supabase.from("portfolio_items").update({ is_visible: visible } as any).eq("id", id);
  };

  // Group-level actions
  const handleGroupAddImage = async (groupId: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Not an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Exceeds 5MB"); return; }
    setUploading(true);
    const sample = items.find((i) => i.group_id === groupId);
    const ext = file.name.split(".").pop();
    const path = `${activeSection}/${sample?.subsection || activeSub || "general"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const insertData: any = {
      section: sample?.section || activeSection,
      subsection: sample?.subsection ?? (activeSection === "gallery" ? activeSub : null),
      title: file.name.replace(/\.[^.]+$/, ""),
      image_url: urlData.publicUrl,
      sort_order: items.length,
      created_by: user?.id,
      group_id: groupId,
      description: (sample as any)?.description ?? null,
    };
    const { error } = await supabase.from("portfolio_items").insert(insertData);
    setUploading(false);
    if (error) toast.error("Add failed");
    else { toast.success("Added to folder"); fetchItems(); }
  };

  const handleGroupToggleVisibility = async (groupId: string) => {
    const groupItems = items.filter((i) => i.group_id === groupId);
    const anyVisible = groupItems.some((i) => (i as any).is_visible !== false);
    const newVisible = !anyVisible;
    setItems((prev) => prev.map((i) => i.group_id === groupId ? ({ ...i, is_visible: newVisible } as any) : i));
    const { error } = await supabase.from("portfolio_items").update({ is_visible: newVisible } as any).eq("group_id", groupId);
    if (error) toast.error("Update failed");
    else toast.success(newVisible ? "Folder shown" : "Folder hidden");
  };

  // Renames the folder title for all group members. Per-image "About Project"
  // (description) is intentionally NOT touched here — that field is per image.
  const handleGroupRename = async (groupId: string, title: string, tags: string[], project_date: string, description: string) => {
    const { error } = await supabase.from("portfolio_items").update({ title, tags, project_date, description } as any).eq("group_id", groupId);
    if (error) { toast.error("Rename failed"); return; }
    setItems((prev) => prev.map((i) => i.group_id === groupId ? ({ ...i, title, tags, project_date, description } as any) : i));
    toast.success("Folder updated");
  };

  const [renameGroup, setRenameGroup] = useState<{ groupId: string; title: string; tags: string; project_date: string; description: string } | null>(null);

  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const handleNotesChange = (id: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } as any : i)));
    if (notesTimers.current[id]) clearTimeout(notesTimers.current[id]);
    notesTimers.current[id] = setTimeout(async () => {
      await supabase.from("portfolio_items").update({ notes } as any).eq("id", id);
    }, 400);
  };
  const groupAddFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeItem = items.find((i) => i.id === active.id);
    const overItem = items.find((i) => i.id === over.id);
    if (!activeItem || !overItem) return;

    const activeGid = activeItem.group_id ?? null;
    const overGid = overItem.group_id ?? null;

    let reordered: PortfolioItem[];

    if (activeGid && activeGid === overGid) {
      // Reorder inside same expanded group only
      const groupItems = items.filter((i) => i.group_id === activeGid);
      const oldIdx = groupItems.findIndex((i) => i.id === active.id);
      const newIdx = groupItems.findIndex((i) => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const newGroupItems = arrayMove(groupItems, oldIdx, newIdx);
      const newBlocks = blocks.map((b) =>
        b.groupId === activeGid ? { ...b, items: newGroupItems } : b
      );
      reordered = newBlocks.flatMap((b) => b.items);
    } else {
      // Move whole block (single item or whole group) among blocks
      const activeKey = activeGid ? `g:${activeGid}` : `i:${activeItem.id}`;
      const overKey = overGid ? `g:${overGid}` : `i:${overItem.id}`;
      const oldIdx = blocks.findIndex((b) => b.key === activeKey);
      const newIdx = blocks.findIndex((b) => b.key === overKey);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
      const newBlocks = arrayMove(blocks, oldIdx, newIdx);
      reordered = newBlocks.flatMap((b) => b.items);
    }

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
      <AdminTopNav
        current="portfolio"
        userId={user?.id}
        rightExtra={
          <>
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
            <span className="text-muted-foreground text-xs font-display tracking-wider hidden md:block">
              {user.email}
            </span>
            <button
              onClick={() => { signOut(); navigate("/"); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </>
        }
      />

      <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto">
        {/* Section tabs - draggable */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const filtered = sections.filter((s) => PORTFOLIO_SECTION_KEYS.includes(s.section));
            const oldIdx = filtered.findIndex((s) => s.section === active.id);
            const newIdx = filtered.findIndex((s) => s.section === over.id);
            if (oldIdx === -1 || newIdx === -1) return;
            const reordered = arrayMove(filtered, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: i }));
            reorder(reordered);
          }}
        >
          <SortableContext items={sections.filter((s) => PORTFOLIO_SECTION_KEYS.includes(s.section)).map((s) => s.section)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              {sections.filter((s) => PORTFOLIO_SECTION_KEYS.includes(s.section)).map((sec) => (
                <SortableSectionTab
                  key={sec.section}
                  sec={sec}
                  isActive={activeSection === sec.section}
                  isVisible={visibility[sec.section as keyof typeof visibility] ?? true}
                  isEditing={editingSection === sec.section}
                  editLabel={editLabel}
                  editLabelJp={editLabelJp}
                  onSelect={() => { setActiveSection(sec.section); if (sec.section === "gallery") setActiveSub("VECTOR"); }}
                  onToggle={() => toggleSection(sec.section as any)}
                  onStartEdit={() => { setEditingSection(sec.section); setEditLabel(sec.label); setEditLabelJp(sec.label_jp); }}
                  onLabelChange={setEditLabel}
                  onLabelJpChange={setEditLabelJp}
                  onSaveEdit={() => { updateLabel(sec.section, editLabel, editLabelJp); setEditingSection(null); toast.success("Label updated"); }}
                  onCancelEdit={() => setEditingSection(null)}
                />
              ))}

            </div>
          </SortableContext>
        </DndContext>

        {activeSection === "share" && <ShareSection />}

        {/* SKILLS section */}
        {activeSection === "skills" && (
          <>
            <SkillsSection />
            <SkillsDescriptionBox getContent={getContent} updateContent={updateContent} />
          </>
        )}

        {/* Gallery sub-tabs */}
        {activeSection === "gallery" && (
          <GallerySubTabs
            subs={gallerySubs}
            activeSub={activeSub}
            onSelect={setActiveSub}
            onSave={saveGallerySubs}
          />
        )}

        {/* Upload area */}
        {activeSection !== "share" && activeSection !== "skills" && (<div className="flex flex-col gap-2 mb-6">
        <div className="flex gap-3">
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
        </div>
        <textarea
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          placeholder="Optional description applied to all images in the new group…"
          rows={2}
          className="w-full bg-transparent text-xs font-display tracking-wider text-foreground placeholder:text-muted-foreground/50 outline-none border border-dashed border-border focus:border-foreground/40 transition-colors resize-y px-2 py-1.5"
        />
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
                    const pageIds = paginatedDisplayItems.map(({ item }) => item.id);
                    const allSelected = pageIds.every(id => selectedIds.has(id));
                    const next = new Set(selectedIds);
                    pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
                    setSelectedIds(next);
                  }}
                  className="text-[10px] font-display tracking-[0.15em] uppercase px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  {paginatedDisplayItems.every(({ item }) => selectedIds.has(item.id)) ? "DESELECT ALL" : "SELECT ALL"}
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
            {/* Collapse/Expand all groups toggle */}
            {(() => {
              const groupIds = [...new Set(items.filter(i => i.group_id).map(i => i.group_id!))];
              const allCollapsed = groupIds.length > 0 && groupIds.every(gid => collapsedGroups.has(gid));
              return (
                <div className="flex items-center gap-2 mb-3">
                  {groupIds.length > 0 && (<button
                    onClick={() => {
                      if (allCollapsed) {
                        setCollapsedGroups(new Set());
                      } else {
                        setCollapsedGroups(new Set(groupIds));
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] font-display tracking-[0.15em] uppercase px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    {allCollapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                    {allCollapsed ? "EXPAND ALL GROUPS" : "COLLAPSE ALL GROUPS"}
                  </button>)}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-display tracking-[0.15em] uppercase text-muted-foreground">Per page:</span>
                    {[12, 24, 36].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setCmsPageSize(n);
                          setCmsPage(0);
                          localStorage.setItem("admin_cms_page_size", String(n));
                        }}
                        className={`text-[10px] font-display tracking-[0.15em] uppercase px-2 py-1 border transition-colors ${
                          cmsPageSize === n
                            ? "border-foreground text-foreground"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {paginatedDisplayItems.map(({ item, isGroupHeader, groupCount, isCollapsed }) => {
                    if (isCollapsed && isGroupHeader) {
                      const gid = item.group_id!;
                      const groupItemsAll = items.filter(i => i.group_id === gid);
                      const folderVisible = groupItemsAll.some(i => (i as any).is_visible !== false);
                      return (
                        <CollapsedGroupTile
                          key={item.id}
                          id={item.id}
                          title={item.title}
                          imageUrl={item.image_url}
                          groupCount={groupCount}
                          folderVisible={folderVisible}
                          onExpand={() => {
                            const next = new Set(collapsedGroups);
                            next.delete(gid);
                            setCollapsedGroups(next);
                          }}
                          onAddImage={() => groupAddFileRefs.current[gid]?.click()}
                          onToggleVisibility={() => handleGroupToggleVisibility(gid)}
                          onRename={() => {
                            const sample = groupItemsAll[0] as any;
                            setRenameGroup({
                              groupId: gid,
                              title: sample?.title || "",
                              tags: Array.isArray(sample?.tags) ? sample.tags.join(", ") : "",
                              project_date: sample?.project_date || "",
                              description: sample?.description || "",
                            });
                          }}
                          fileInputRef={(el) => { groupAddFileRefs.current[gid] = el; }}
                          onFileChange={(f) => handleGroupAddImage(gid, f)}
                        />
                      );
                    }
                    return (
                      <div key={item.id} className="relative">
                        {/* Group header collapse button (when expanded) */}
                        {isGroupHeader && !isCollapsed && groupCount > 1 && (
                          <button
                            onClick={() => {
                              const next = new Set(collapsedGroups);
                              next.add(item.group_id!);
                              setCollapsedGroups(next);
                            }}
                            className="absolute top-1 left-1 z-20 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 text-white/80 hover:text-white transition-colors"
                            title="Collapse group"
                          >
                            <ChevronUp size={10} />
                            <span className="text-[8px] font-display tracking-widest">
                              {groupCount}
                            </span>
                          </button>
                        )}
                        {bulkSelectMode && (
                          <div
                            onClick={() => {
                              const next = new Set(selectedIds);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
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
                          notes={(item as any).notes}
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
                          onNotesChange={(n) => handleNotesChange(item.id, n)}
                          onTagsChange={(tags) => handleTagsChange(item.id, tags)}
                          onProjectDateChange={(date) => handleProjectDateChange(item.id, date)}
                          is_visible={(item as any).is_visible !== false}
                          onVisibilityChange={(visible) => handleVisibilityChange(item.id, visible)}
                          onImageReplace={async (newUrl) => {
                            const { error } = await supabase.from("portfolio_items").update({ image_url: newUrl }).eq("id", item.id);
                            if (!error) {
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, image_url: newUrl } : i));
                            }
                          }}
                          onMoveToGroup={async (targetGroupId, targetSection, targetSub) => {
                            const updateData: any = { group_id: targetGroupId };
                            if (targetSection) updateData.section = targetSection;
                            if (targetSection === "gallery") updateData.subsection = targetSub ?? null;
                            const { error } = await supabase.from("portfolio_items").update(updateData).eq("id", item.id);
                            if (error) {
                              toast.error("Move failed");
                            } else {
                              toast.success(targetGroupId ? "Moved to group" : "Removed from group");
                              fetchItems();
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {/* CMS Pagination */}
            {items.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-6 pb-4">
                <button
                  type="button"
                  aria-label="Previous CMS page"
                  title="Previous page"
                  onClick={() => setCmsPage((p) => Math.max(0, p - 1))}
                  disabled={cmsPage === 0}
                  className="flex h-8 w-8 items-center justify-center border border-border bg-secondary/70 text-foreground hover:border-foreground hover:bg-muted disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-secondary/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <span className="min-w-16 text-center text-[11px] font-display tracking-widest text-foreground">
                  {cmsPage + 1} / {totalCmsPages}
                </span>
                <button
                  type="button"
                  aria-label="Next CMS page"
                  title="Next page"
                  onClick={() => setCmsPage((p) => Math.min(totalCmsPages - 1, p + 1))}
                  disabled={cmsPage >= totalCmsPages - 1}
                  className="flex h-8 w-8 items-center justify-center border border-border bg-secondary/70 text-foreground hover:border-foreground hover:bg-muted disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-secondary/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </>
        ))}
      </div>

      {/* Rename folder / group info dialog */}
      <Dialog open={!!renameGroup} onOpenChange={(o) => { if (!o) setRenameGroup(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
            <DialogDescription>Applies to every image in this folder. Per-image "Notes" is edited separately on each image.</DialogDescription>
          </DialogHeader>
          {renameGroup && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <UILabel htmlFor="rename-title">Title</UILabel>
                <UIInput
                  id="rename-title"
                  value={renameGroup.title}
                  onChange={(e) => setRenameGroup({ ...renameGroup, title: e.target.value })}
                  placeholder="Folder title"
                />
              </div>
              <div className="grid gap-2">
                <UILabel htmlFor="rename-date">Date / Year</UILabel>
                <UIInput
                  id="rename-date"
                  value={renameGroup.project_date}
                  onChange={(e) => setRenameGroup({ ...renameGroup, project_date: e.target.value })}
                  placeholder="e.g. 2024"
                />
              </div>
              <div className="grid gap-2">
                <UILabel htmlFor="rename-tags">Tags (comma separated)</UILabel>
                <UIInput
                  id="rename-tags"
                  value={renameGroup.tags}
                  onChange={(e) => setRenameGroup({ ...renameGroup, tags: e.target.value })}
                  placeholder="tag1, tag2..."
                />
              </div>
              <div className="grid gap-2">
                <UILabel htmlFor="rename-desc">About Project</UILabel>
                <UITextarea
                  id="rename-desc"
                  value={renameGroup.description}
                  onChange={(e) => setRenameGroup({ ...renameGroup, description: e.target.value })}
                  rows={4}
                  placeholder="Project description shared by all images in this folder…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <UIButton variant="outline" onClick={() => setRenameGroup(null)}>Cancel</UIButton>
            <UIButton
              onClick={async () => {
                if (!renameGroup) return;
                const tagsArr = renameGroup.tags.split(",").map((t) => t.trim()).filter(Boolean);
                await handleGroupRename(renameGroup.groupId, renameGroup.title.trim(), tagsArr, renameGroup.project_date.trim(), renameGroup.description.trim());
                setRenameGroup(null);
              }}
            >Save</UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Admin;
