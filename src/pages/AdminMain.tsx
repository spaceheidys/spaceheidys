import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, LogOut, Loader2 } from "lucide-react";
import lostInTime01 from "@/assets/lost_in_time_01.png";
import lostInTime02 from "@/assets/lost_in_time_02.png";
import lostInTime03 from "@/assets/lost_in_time_03.png";

interface BackgroundItem {
  id: string;
  section: string;
  image_url: string;
  sort_order: number;
}

const SECTIONS = ["main", "portfolio"] as const;

const AdminMain = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("main");
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && isAdmin) fetchBackgrounds();
  }, [loading, user, isAdmin]);

  const fetchBackgrounds = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("page_backgrounds")
      .select("*")
      .order("sort_order");
    if (!error && data) setBackgrounds(data);
    setFetching(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `backgrounds/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(path, file);
    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(path);

    const maxOrder = backgrounds
      .filter((b) => b.section === activeSection)
      .reduce((m, b) => Math.max(m, b.sort_order), -1);

    const { error: insertError } = await supabase
      .from("page_backgrounds")
      .insert({ section: activeSection, image_url: urlData.publicUrl, sort_order: maxOrder + 1 });

    if (insertError) {
      toast.error("Failed to save");
    } else {
      toast.success("Background added");
      fetchBackgrounds();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("page_backgrounds").delete().eq("id", id);
    if (!error) {
      setBackgrounds((prev) => prev.filter((b) => b.id !== id));
      toast.success("Deleted");
    }
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  const sectionItems = backgrounds.filter((b) => b.section === activeSection);

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-sm tracking-[0.3em] uppercase">Main Page CMS</h1>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => navigate("/admin")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Portfolio CMS
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
          >
            ← SITE
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
          >
            <LogOut size={10} /> LOGOUT
          </button>
        </div>
      </header>

      {/* Section tabs */}
      <div className="flex items-center gap-1 px-4 sm:px-8 py-3 border-b border-border">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase transition-colors ${
              activeSection === s
                ? "border border-foreground text-foreground"
                : "border border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
            Background images for {activeSection} section
          </p>
          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer text-xs font-display tracking-[0.2em] uppercase">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : sectionItems.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">
            No backgrounds yet. Upload one to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sectionItems.map((item) => (
              <div key={item.id} className="group relative border border-border aspect-video overflow-hidden">
                <img
                  src={item.image_url}
                  alt="Background"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMain;
