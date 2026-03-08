import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Main2SectionProps {
  get: (key: string) => string;
  update: (key: string, content: string) => Promise<void>;
}

const Main2Section = ({ get, update }: Main2SectionProps) => {
  const [wisdomText, setWisdomText] = useState("");

  useEffect(() => {
    setWisdomText(get("cards_wisdom"));
  }, [get]);

  const handleSave = async () => {
    await update("cards_wisdom", wisdomText);
    toast.success("Saved");
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
        Second Section — Card Area
      </p>

      {/* Wisdom text above cards */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-display tracking-widest uppercase">
          Text above cards
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={wisdomText}
            onChange={(e) => setWisdomText(e.target.value)}
            placeholder="The cards know what the mind has forgotten"
            className="flex-1 bg-transparent border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-colors"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-border text-xs font-display tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Main2Section;
