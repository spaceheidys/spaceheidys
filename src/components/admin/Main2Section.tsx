import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Trash2 } from "lucide-react";

interface Main2SectionProps {
  get: (key: string) => string;
  update: (key: string, content: string) => Promise<void>;
}

const Main2Section = ({ get, update }: Main2SectionProps) => {
  const [wisdomText, setWisdomText] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWisdomText(get("cards_wisdom"));
    setFrontImage(get("card_front_image"));
    setBackImage(get("card_back_image"));
  }, [get]);

  const handleSave = async () => {
    await update("cards_wisdom", wisdomText);
    toast.success("Saved");
  };

  const handleImageUpload = async (file: File, key: string) => {
    setUploading(key);
    const ext = file.name.split(".").pop();
    const path = `cards/${key}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    await update(key, url);
    if (key === "card_front_image") setFrontImage(url);
    else setBackImage(url);
    toast.success("Image updated");
    setUploading(null);
  };

  const handleClear = async (key: string) => {
    await update(key, "");
    if (key === "card_front_image") setFrontImage("");
    else setBackImage("");
    toast.success("Reset to default");
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

      {/* Card images */}
      <div className="grid grid-cols-2 gap-6">
        {/* Front */}
        <CardImageUpload
          label="Card front"
          imageUrl={frontImage}
          uploading={uploading === "card_front_image"}
          inputRef={frontRef}
          onUpload={(f) => handleImageUpload(f, "card_front_image")}
          onClear={() => handleClear("card_front_image")}
        />
        {/* Back */}
        <CardImageUpload
          label="Card back"
          imageUrl={backImage}
          uploading={uploading === "card_back_image"}
          inputRef={backRef}
          onUpload={(f) => handleImageUpload(f, "card_back_image")}
          onClear={() => handleClear("card_back_image")}
        />
      </div>
    </div>
  );
};

function CardImageUpload({
  label,
  imageUrl,
  uploading,
  inputRef,
  onUpload,
  onClear,
}: {
  label: string;
  imageUrl: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground font-display tracking-widest uppercase">
        {label}
      </label>
      <div className="relative group border border-border aspect-[2/3] overflow-hidden bg-muted/10">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs font-display tracking-widest uppercase">
            Default
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
          <label className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={uploading}
            />
          </label>
          {imageUrl && (
            <button
              onClick={onClear}
              className="p-2 border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Main2Section;
