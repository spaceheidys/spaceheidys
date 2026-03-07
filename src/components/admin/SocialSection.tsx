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
  onUpdate: (id: string, updates: Partial<Pick<SocialLink, "label" | "url" | "icon_url" | "is_visible">>) => Promise<any>;
  onSwapOrder: (idA: string, idB: string) => Promise<void>;
  onAdd: (label: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

const SocialSection = ({ links, onUpdate, onSwapOrder, onAdd, onDelete }: SocialSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const startEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setEditLabel(link.label);
    setEditUrl(link.url);
  };

  const saveEdit = async (id: string) => {
    await onUpdate(id, { label: editLabel, url: editUrl });
    setEditingId(null);
    toast.success("Social link updated");
  };

  const handleIconUpload = async (id: string, file: File) => {
    setUploadingId(id);
    const ext = file.name.split(".").pop();
    const path = `social-icons/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(path, file);
    if (uploadError) {
      toast.error("Upload failed");
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    await onUpdate(id, { icon_url: urlData.publicUrl });
    setUploadingId(null);
    toast.success("Icon updated");
  };

  return (
    <div className="border-t border-border pt-6 mt-6">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase mb-4">
        Social Links
      </p>
      <div className="flex flex-col gap-2 max-w-xl">
        {links.map((link, i) => (
          <div
            key={link.id}
            className={`flex items-center gap-3 border border-border px-3 py-2.5 group ${!link.is_visible ? "opacity-40" : ""}`}
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <button disabled={i === 0} onClick={() => onSwapOrder(link.id, links[i - 1].id)} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                <ArrowUp size={12} />
              </button>
              <button disabled={i === links.length - 1} onClick={() => onSwapOrder(link.id, links[i + 1].id)} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                <ArrowDown size={12} />
              </button>
            </div>

            {/* Icon preview + upload */}
            <div className="relative w-8 h-8 flex items-center justify-center border border-border bg-background shrink-0 cursor-pointer"
              onClick={() => fileRefs.current[link.id]?.click()}
              title="Click to upload icon"
            >
              {uploadingId === link.id ? (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              ) : link.icon_url ? (
                <img src={link.icon_url} alt={link.label} className="w-5 h-5 object-contain invert" />
              ) : (
                <Upload size={12} className="text-muted-foreground" />
              )}
              <input
                ref={(el) => { fileRefs.current[link.id] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleIconUpload(link.id, file);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Label + URL editing */}
            {editingId === link.id ? (
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-transparent border-b border-muted-foreground/40 text-xs font-display tracking-[0.2em] uppercase outline-none focus:border-foreground"
                  placeholder="Label (e.g. Behance)"
                />
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="bg-transparent border-b border-muted-foreground/40 text-xs text-muted-foreground outline-none focus:border-foreground"
                  placeholder="https://..."
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(link.id)}
                />
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-display tracking-[0.2em] uppercase truncate">{link.label}</span>
                <span className="text-[10px] text-muted-foreground truncate">{link.url || "No URL"}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              {editingId === link.id ? (
                <>
                  <button onClick={() => saveEdit(link.id)} className="text-foreground hover:text-primary">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button onClick={() => startEdit(link)} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <AlertDialogDescription>This will permanently remove this social link.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { onDelete(link.id); toast.success("Social link deleted"); }}>Yes</AlertDialogAction>
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

const AddNewSocialRow = ({ onAdd }: { onAdd: (label: string) => Promise<any> }) => {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = async () => {
    if (!newLabel.trim()) { toast.error("Label is required"); return; }
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
        <Plus size={12} /> Add New Social Link
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
      <button onClick={handleAdd} className="text-foreground hover:text-primary"><Check size={14} /></button>
      <button onClick={() => { setAdding(false); setNewLabel(""); }} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
    </div>
  );
};

export default SocialSection;
