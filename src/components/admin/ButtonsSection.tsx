import { useState } from "react";
import { Eye, EyeOff, ArrowUp, ArrowDown, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { NavButton } from "@/hooks/useNavButtons";

interface ButtonsSectionProps {
  buttons: NavButton[];
  onUpdate: (id: string, updates: Partial<Pick<NavButton, "label" | "label_jp" | "is_visible">>) => Promise<void>;
  onSwapOrder: (idA: string, idB: string) => Promise<void>;
}

const ButtonsSection = ({ buttons, onUpdate, onSwapOrder }: ButtonsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLabelJp, setEditLabelJp] = useState("");

  const startEdit = (btn: NavButton) => {
    setEditingId(btn.id);
    setEditLabel(btn.label);
    setEditLabelJp(btn.label_jp);
  };

  const saveEdit = async (id: string) => {
    await onUpdate(id, { label: editLabel, label_jp: editLabelJp });
    setEditingId(null);
    toast.success("Label updated");
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="border-t border-border pt-6">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase mb-4">
        Buttons
      </p>
      <div className="flex flex-col gap-2 max-w-lg">
        {buttons.map((btn, i) => (
          <div
            key={btn.id}
            className="flex items-center gap-3 border border-border px-3 py-2.5 group"
          >
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                disabled={i === 0}
                onClick={() => onSwapOrder(btn.id, buttons[i - 1].id)}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              >
                <ArrowUp size={12} />
              </button>
              <button
                disabled={i === buttons.length - 1}
                onClick={() => onSwapOrder(btn.id, buttons[i + 1].id)}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              >
                <ArrowDown size={12} />
              </button>
            </div>

            {/* Label */}
            {editingId === btn.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  value={editLabelJp}
                  onChange={(e) => setEditLabelJp(e.target.value)}
                  className="bg-transparent border-b border-muted-foreground/40 text-xs font-jp w-20 outline-none focus:border-foreground"
                  placeholder="JP"
                />
                <span className="text-muted-foreground/40">/</span>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-transparent border-b border-muted-foreground/40 text-xs font-display tracking-[0.2em] uppercase flex-1 outline-none focus:border-foreground"
                  placeholder="EN"
                />
                <button onClick={() => saveEdit(btn.id)} className="text-foreground hover:text-primary">
                  <Check size={14} />
                </button>
                <button onClick={cancelEdit} className="text-muted-foreground hover:text-destructive">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-jp text-muted-foreground truncate">{btn.label_jp}</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-xs font-display tracking-[0.2em] uppercase truncate">{btn.label}</span>
                <button
                  onClick={() => startEdit(btn)}
                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}

            {/* Visibility toggle */}
            <button
              onClick={() => onUpdate(btn.id, { is_visible: !btn.is_visible })}
              className={`transition-colors ${btn.is_visible ? "text-foreground" : "text-muted-foreground/40"}`}
              title={btn.is_visible ? "Visible" : "Hidden"}
            >
              {btn.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ButtonsSection;
