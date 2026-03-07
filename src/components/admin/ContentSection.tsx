import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ContentSectionProps {
  get: (key: string) => string;
  update: (key: string, content: string) => Promise<void>;
}

const FIELDS = [
  { key: "about", label: "About Text" },
  { key: "contact_title", label: "Contact — Title" },
  { key: "contact_body", label: "Contact — Body" },
  { key: "contact_email", label: "Contact — Email" },
  { key: "footer", label: "Footer" },
];

const ContentSection = ({ get, update }: ContentSectionProps) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(get(key));
  };

  const save = async () => {
    if (!editingKey) return;
    await update(editingKey, editValue);
    setEditingKey(null);
    toast.success("Content updated");
  };

  const cancel = () => setEditingKey(null);

  return (
    <div className="border-t border-border pt-6">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase mb-4">
        Section Content
      </p>
      <div className="flex flex-col gap-3 max-w-lg">
        {FIELDS.map((field) => (
          <div key={field.key} className="border border-border px-3 py-2.5 group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
                {field.label}
              </span>
              {editingKey !== field.key && (
                <button
                  onClick={() => startEdit(field.key)}
                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
            {editingKey === field.key ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={field.key === "about" || field.key === "contact_body" ? 4 : 1}
                  className="bg-transparent border border-muted-foreground/30 text-xs font-body w-full outline-none focus:border-foreground p-2 resize-y"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={save} className="text-foreground hover:text-primary">
                    <Check size={14} />
                  </button>
                  <button onClick={cancel} className="text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-foreground/80 font-body leading-relaxed line-clamp-3">
                {get(field.key) || <span className="italic text-muted-foreground">Empty</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentSection;
