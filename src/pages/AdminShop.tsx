import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, X, Check, Eye, EyeOff, Upload, GripVertical, Pencil,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Category = "prints" | "merch";

interface ShopItem {
  id: string;
  category: Category;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  main_image: string | null;
  images: string[];
  sort_order: number;
  visible: boolean;
}

const CATEGORY_LABELS: Record<Category, string> = {
  prints: "Prints & Originals",
  merch: "Merch",
};

const SortableRow = ({
  item,
  onEdit,
  onToggleVisible,
  onDelete,
}: {
  item: ShopItem;
  onEdit: (it: ShopItem) => void;
  onToggleVisible: (it: ShopItem) => void;
  onDelete: (it: ShopItem) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border border-border p-2 bg-background"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      <div className="w-12 h-12 bg-muted border border-border shrink-0 overflow-hidden">
        {item.main_image ? (
          <img src={item.main_image} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground/40 font-display uppercase">N/A</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-display tracking-wider uppercase text-foreground truncate">{item.title || <span className="text-muted-foreground/40">(untitled)</span>}</p>
        <p className="text-[10px] text-muted-foreground font-body">
          {item.price !== null ? `${item.currency} ${Number(item.price).toFixed(2)}` : "—"}
        </p>
      </div>
      <button
        onClick={() => onToggleVisible(item)}
        className={`p-1.5 border border-border ${item.visible ? "text-foreground" : "text-muted-foreground/40"}`}
        title={item.visible ? "Hide" : "Show"}
      >
        {item.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 border border-border text-muted-foreground hover:text-foreground"
        title="Edit"
      >
        <Pencil size={12} />
      </button>
      {confirmDel ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { onDelete(item); setConfirmDel(false); }}
            className="px-2 py-1 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background"
          >YES</button>
          <button
            onClick={() => setConfirmDel(false)}
            className="px-2 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground"
          >NO</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDel(true)}
          className="p-1.5 border border-border text-muted-foreground hover:text-foreground"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

const ItemEditor = ({
  item,
  onClose,
  onSaved,
}: {
  item: ShopItem;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [draft, setDraft] = useState<ShopItem>(item);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Image only");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return null;
    }
    const ext = file.name.split(".").pop();
    const path = `shop/${draft.category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      return null;
    }
    return supabase.storage.from("portfolio-images").getPublicUrl(path).data.publicUrl;
  };

  const handleMainUpload = async (file: File) => {
    setUploading(true);
    const url = await upload(file);
    setUploading(false);
    if (url) setDraft({ ...draft, main_image: url });
  };

  const handleGalleryUpload = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const u = await upload(f);
      if (u) urls.push(u);
    }
    setUploading(false);
    if (urls.length > 0) setDraft({ ...draft, images: [...draft.images, ...urls] });
  };

  const removeGalleryImage = (idx: number) => {
    setDraft({ ...draft, images: draft.images.filter((_, i) => i !== idx) });
  };

  const save = async () => {
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      category: draft.category,
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      price: draft.price === null || isNaN(Number(draft.price)) ? null : Number(draft.price),
      currency: draft.currency,
      main_image: draft.main_image,
      images: draft.images,
      visible: draft.visible,
    };
    let error;
    if (item.id === "__new__") {
      const { error: e } = await supabase
        .from("shop_items")
        .insert({ ...payload, sort_order: Math.floor(Date.now() / 1000) });
      error = e;
    } else {
      const { error: e } = await supabase
        .from("shop_items")
        .update(payload)
        .eq("id", item.id);
      error = e;
    }
    setSaving(false);
    if (error) {
      toast.error("Save failed");
    } else {
      toast.success("Saved");
      onSaved();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display tracking-[0.3em] uppercase text-foreground">
            {item.id === "__new__" ? "New item" : "Edit item"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        <div>
          <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">Category</label>
          <div className="flex gap-2">
            {(["prints", "merch"] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => setDraft({ ...draft, category: c })}
                className={`text-[10px] font-display tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                  draft.category === c ? "border-foreground text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">Title</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={120}
            className="w-full bg-transparent border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground"
          />
        </div>

        <div>
          <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">Description</label>
          <textarea
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={4}
            maxLength={2000}
            className="w-full bg-transparent border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.price ?? ""}
              onChange={(e) => setDraft({ ...draft, price: e.target.value === "" ? null : Number(e.target.value) })}
              className="w-full bg-transparent border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">Currency</label>
            <select
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              className="w-full bg-background border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">Main image</label>
          {draft.main_image ? (
            <div className="relative inline-block">
              <img src={draft.main_image} alt="main" className="w-32 h-32 object-cover border border-border" />
              <button
                onClick={() => setDraft({ ...draft, main_image: null })}
                className="absolute -top-2 -right-2 w-6 h-6 bg-background border border-border flex items-center justify-center text-foreground"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-border text-[10px] font-display tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 cursor-pointer">
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleMainUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">
            Additional images ({draft.images.length})
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {draft.images.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`img-${i}`} className="w-16 h-16 object-cover border border-border" />
                <button
                  onClick={() => removeGalleryImage(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border flex items-center justify-center text-foreground"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-border text-[10px] font-display tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 cursor-pointer">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Add images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="visible"
            checked={draft.visible}
            onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
            className="accent-foreground"
          />
          <label htmlFor="visible" className="text-[10px] font-display tracking-widest uppercase text-muted-foreground">
            Visible on site
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground"
          >
            <X size={10} /> Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminShop = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShopItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("prints");
  const [shopVisible, setShopVisible] = useState<boolean>(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast.error("Admin access required");
      navigate("/");
    }
  }, [authLoading, user, isAdmin, navigate]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_items")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (!error && data) setItems(data as ShopItem[]);
    setLoading(false);
  };

  const fetchVisibility = async () => {
    const { data } = await supabase
      .from("section_content")
      .select("content")
      .eq("key", "shop_visible")
      .maybeSingle();
    setShopVisible(data?.content === "true");
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchItems();
      fetchVisibility();
    }
  }, [user, isAdmin]);

  const toggleShopVisibility = async () => {
    const newVal = !shopVisible;
    const { data: existing } = await supabase
      .from("section_content")
      .select("id")
      .eq("key", "shop_visible")
      .maybeSingle();
    if (existing) {
      await supabase
        .from("section_content")
        .update({ content: String(newVal), updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("section_content")
        .insert({ key: "shop_visible", content: String(newVal) });
    }
    setShopVisible(newVal);
    toast.success(newVal ? "Shop is now public" : "Shop is hidden");
  };

  const toggleItemVisible = async (item: ShopItem) => {
    const { error } = await supabase
      .from("shop_items")
      .update({ visible: !item.visible })
      .eq("id", item.id);
    if (error) {
      toast.error("Update failed");
    } else {
      fetchItems();
    }
  };

  const deleteItem = async (item: ShopItem) => {
    const { error } = await supabase.from("shop_items").delete().eq("id", item.id);
    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Deleted");
      fetchItems();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const filtered = items.filter((i) => i.category === activeCategory);
    const oldIndex = filtered.findIndex((i) => i.id === active.id);
    const newIndex = filtered.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filtered, oldIndex, newIndex);

    // Optimistic update
    const others = items.filter((i) => i.category !== activeCategory);
    const updated = [...others, ...reordered.map((it, i) => ({ ...it, sort_order: i }))];
    setItems(updated);

    // Persist
    await Promise.all(
      reordered.map((it, i) =>
        supabase.from("shop_items").update({ sort_order: i }).eq("id", it.id)
      )
    );
  };

  const filtered = items.filter((i) => i.category === activeCategory);

  const newItem = (): ShopItem => ({
    id: "__new__",
    category: activeCategory,
    title: "",
    description: "",
    price: null,
    currency: "EUR",
    main_image: null,
    images: [],
    sort_order: 0,
    visible: true,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-foreground/40 animate-spin" />
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => navigate("/admin/main")} className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground">Main Page CMS</button>
          <span className="text-muted-foreground/40">|</span>
          <button onClick={() => navigate("/admin")} className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground">Portfolio CMS</button>
          <span className="text-muted-foreground/40">|</span>
          <button onClick={() => navigate("/admin/secret-door")} className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground">Secret Door</button>
          <span className="text-muted-foreground/40">|</span>
          <button onClick={() => navigate("/admin/seo")} className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground">SEO</button>
          <span className="text-muted-foreground/40">|</span>
          <h1 className="font-display text-sm tracking-[0.3em] uppercase">Shop</h1>
        </div>
        <button onClick={() => navigate("/")} className="text-muted-foreground text-[10px] tracking-widest hover:text-foreground font-display uppercase">← SITE</button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border border-border p-3">
          <div>
            <p className="text-[10px] font-display tracking-widest uppercase text-muted-foreground">Public visibility</p>
            <p className="text-xs text-foreground mt-1">{shopVisible ? "Shop is visible to visitors" : "Shop is hidden from visitors"}</p>
          </div>
          <button
            onClick={toggleShopVisibility}
            className={`flex items-center gap-2 px-3 py-1.5 border text-[10px] font-display tracking-widest uppercase transition-colors ${
              shopVisible
                ? "border-foreground text-foreground hover:bg-foreground hover:text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {shopVisible ? <><Eye size={12} /> Public</> : <><EyeOff size={12} /> Hidden</>}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            {(["prints", "merch"] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`text-[10px] font-display tracking-[0.3em] uppercase px-3 py-1.5 border transition-colors ${
                  activeCategory === c ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {CATEGORY_LABELS[c]} ({items.filter((i) => i.category === c).length})
              </button>
            ))}
          </div>
          <button
            onClick={() => setEditing(newItem())}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-display tracking-widest uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background"
          >
            <Plus size={12} /> Add item
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-foreground/40 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs font-display tracking-[0.2em] uppercase text-muted-foreground/60 py-12">
            No items in this category yet
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {filtered.map((it) => (
                  <SortableRow
                    key={it.id}
                    item={it}
                    onEdit={setEditing}
                    onToggleVisible={toggleItemVisible}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {editing && (
        <ItemEditor item={editing} onClose={() => setEditing(null)} onSaved={fetchItems} />
      )}
    </div>
  );
};

export default AdminShop;