import { useState, useRef } from "react";
import { Eye, EyeOff, ArrowUp, ArrowDown, Pencil, Check, X, Plus, Trash2, Upload, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SocialLink } from "@/hooks/useSocialLinks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SocialSectionProps {
  links: SocialLink[];
  onUpdate: (id: string, updates: Partial<Pick<SocialLink, "label" | "url" | "icon_url" | "is_visible">>) => Promise<void>;
  onSwapOrder: (idA: string, idB: string) => Promise<void>;
  onAdd: (label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const SocialSection = ({ links, onUpdate, onSwapOrder, onAdd, onDelete }: SocialSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<Pick<SocialLink, "label" | "url">>>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const startEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setEditLabel(pendingChanges[link.id]?.label ?? link.label);
    setEditUrl(pendingChanges[link.id]?.url ?? link.url);
  };

  const confirmEdit = (id: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [id]: { label: editLabel, url: editUrl },
    }));
    setEditingId(null);
    toast.info("Change staged — click Save to apply");
  };

  const cancelEdit = () => setEditingId(null);

  const handleIconUpload = async (id: string, file: File) => {
    setUploadingId(id);
    const ext = file.name.split(".").pop();
    const path = `social/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    await onUpdate(id, { icon_url: urlData.publicUrl });
    toast.success("Icon updated");
    setUploadingId(null);
  };

  const hasPending = Object.keys(pendingChanges).length > 0;

  const saveAll = async () => {
    for (const [id, changes] of Object.entries(pendingChanges)) {
      await onUpdate(id, changes);
    }
    setPendingChanges({});
    toast.success("Social links saved");
  };

  const getDisplayLabel = (link: SocialLink) => pendingChanges[link.id]?.label ?? link.label;
  const getDisplayUrl = (link: SocialLink) => pendingChanges[link.id]?.url ?? link.url;

  return (
    <div className="border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
          Social
        </p>
        {hasPending && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-display tracking-[0.2em] uppercase">
                <Save size={12} /> Save
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save social link changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will apply all pending changes to the social links on your site.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No</AlertDialogCancel>
                <AlertDialogAction onClick={saveAll}>Yes</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex flex-col gap-2 max-w-lg">
        {links.map((link, i) => (
          <div
            key={link.id}
            className={`flex items-center gap-3 border border-border px-3 py-2.5 group ${pendingChanges[link.id] ? "border-primary/40" : ""}`}
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <button
                disabled={i === 0}
                onClick={() => onSwapOrder(link.id, links[i - 1].id)}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              >
                <ArrowUp size={12} />
              </button>
              <button
                disabled={i === links.length - 1}
                onClick={() => onSwapOrder(link.id, links[i + 1].id)}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              >
                <ArrowDown size={12} />
              </button>
            </div>

            {/* Icon preview + upload */}
            <div className="relative w-7 h-7 flex-shrink-0 border border-border flex items-center justify-center overflow-hidden">
              {link.icon_url ? (
                <img src={link.icon_url} alt={link.label} className="w-full h-full object-contain" />
              ) : (
                <span className="text-[8px] text-muted-foreground">—</span>
              )}
              <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-background/60 flex items-center justify-center transition-opacity">
                {uploadingId === link.id ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Upload size={10} className="text-foreground" />
                )}
                <input
                  ref={(el) => { fileRefs.current[link.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleIconUpload(link.id, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {/* Label + URL */}
            {editingId === link.id ? (
              <div className="flex flex-col gap-1.5 flex-1">
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-transparent border-b border-muted-foreground/40 text-xs font-display tracking-[0.2em] uppercase outline-none focus:border-foreground"
                  placeholder="Label"
                  autoFocus
                />
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="bg-transparent border-b border-muted-foreground/40 text-xs font-body outline-none focus:border-foreground"
                  placeholder="https://..."
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit(link.id)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-xs font-display tracking-[0.2em] uppercase truncate">
                  {getDisplayLabel(link)}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {getDisplayUrl(link) || "No URL"}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              {editingId === link.id ? (
                <>
                  <button onClick={() => confirmEdit(link.id)} className="text-foreground hover:text-primary">
                    <Check size={14} />
                  </button>
                  <button onClick={cancelEdit} className="text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEdit(link)}
                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil size={12} />
                </button>
              )}

              <button
                onClick={() => onUpdate(link.id, { is_visible: !link.is_visible })}
                className={`transition-colors ${link.is_visible ? "text-foreground" : "text-muted-foreground/40"}`}
              >
                {link.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{link.label}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this social link.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { onDelete(link.id); toast.success("Link deleted"); }}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {/* Add new */}
        <AddNewSocialRow onAdd={onAdd} />
      </div>
    </div>
  );
};

const AddNewSocialRow = ({ onAdd }: { onAdd: (label: string) => Promise<void> }) => {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    await onAdd(newLabel.trim());
    setNewLabel("");
    setAdding(false);
    toast.success("Social link added");
  };

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-xs font-display tracking-[0.2em] uppercase"
      >
        <Plus size={12} /> Add New Social
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-border px-3 py-2.5">
      <input
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        className="bg-transparent border-b border-muted-foreground/40 text-xs font-display tracking-[0.2em] uppercase flex-1 outline-none focus:border-foreground"
        placeholder="Label (e.g. Twitter)"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button onClick={handleAdd} className="text-foreground hover:text-primary">
        <Check size={14} />
      </button>
      <button onClick={() => { setAdding(false); setNewLabel(""); }} className="text-muted-foreground hover:text-destructive">
        <X size={14} />
      </button>
    </div>
  );
};

export default SocialSection;
