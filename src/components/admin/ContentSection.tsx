import { useState } from "react";
import { Pencil, Check, X, Eye, EyeOff, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSectionSettings, SectionVisibility } from "@/hooks/useSectionSettings";

interface ContentSectionProps {
  get: (key: string) => string;
  getDuration: (key: string) => number | null;
  update: (key: string, content: string) => Promise<void>;
  updateDuration: (key: string, duration: number | null) => Promise<void>;
}

const FIELDS = [
  { key: "about", label: "About Text" },
  { key: "contact_title", label: "Contact — Title" },
  { key: "contact_body", label: "Contact — Body" },
  { key: "contact_email", label: "Contact — Email" },
  { key: "footer", label: "Footer Text" },
];

const DURATION_OPTIONS = [
  { value: null, label: "Always" },
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 15, label: "15s" },
  { value: 20, label: "20s" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
];

const ContentSection = ({ get, getDuration, update, updateDuration }: ContentSectionProps) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { visibility, toggle } = useSectionSettings();

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
        {FIELDS.map((field) => {
          const isVisible = visibility[field.key as keyof SectionVisibility] ?? true;
          const duration = getDuration(field.key);
          return (
            <div key={field.key} className={`border border-border px-3 py-2.5 group transition-opacity ${!isVisible ? "opacity-40" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
                  {field.label}
                </span>
                <div className="flex items-center gap-2">
                  {/* Duration selector */}
                  <div className="flex items-center gap-1">
                    <Clock size={10} className="text-muted-foreground" />
                    <select
                      value={duration === null ? "always" : String(duration)}
                      onChange={async (e) => {
                        const val = e.target.value === "always" ? null : parseInt(e.target.value);
                        await updateDuration(field.key, val);
                        toast.success(`Duration set to ${val === null ? "always" : val + "s"}`);
                      }}
                      className="bg-transparent text-[10px] font-display tracking-widest text-muted-foreground hover:text-foreground outline-none cursor-pointer border-none appearance-none pr-2"
                      style={{ WebkitAppearance: "none" }}
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value === null ? "always" : String(opt.value)}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => toggle(field.key as keyof SectionVisibility)}
                    className="text-muted-foreground hover:text-foreground transition-opacity"
                    title={isVisible ? "Hide on site" : "Show on site"}
                  >
                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  {editingKey !== field.key && (
                    <button
                      onClick={() => startEdit(field.key)}
                      className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
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
          );
        })}
      </div>
    </div>
  );
};

export default ContentSection;
