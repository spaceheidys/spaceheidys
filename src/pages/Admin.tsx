import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Trash2, Upload, LogOut, Loader2 } from "lucide-react";

const SECTIONS = ["gallery", "projects", "skills", "archive"] as const;
const GALLERY_SUBS = ["VECTOR", "DIGITAL", "AI", "SKETCHES"];

interface PortfolioItem {
  id: string;
  section: string;
  subsection: string | null;
  title: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("gallery");
  const [activeSub, setActiveSub] = useState<string>("VECTOR");
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
  }, [activeSection, activeSub, user, isAdmin]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedItems: PortfolioItem[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
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

      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({
          section: activeSection,
          subsection: activeSection === "gallery" ? activeSub : null,
          title: file.name.replace(/\.[^.]+$/, ""),
          image_url: urlData.publicUrl,
          sort_order: items.length + uploadedItems.length,
          created_by: user?.id,
        })
        .select()
        .single();

      if (!error && data) {
        uploadedItems.push(data as PortfolioItem);
      }
    }

    if (uploadedItems.length > 0) {
      toast.success(`Uploaded ${uploadedItems.length} image(s)`);
      fetchItems();
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (item: PortfolioItem) => {
    // Extract path from URL
    const url = new URL(item.image_url);
    const pathParts = url.pathname.split("/storage/v1/object/public/portfolio-images/");
    const filePath = pathParts[1];

    if (filePath) {
      await supabase.storage.from("portfolio-images").remove([filePath]);
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
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <h1 className="font-display text-sm tracking-[0.3em] uppercase">Portfolio CMS</h1>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-xs font-display tracking-wider hidden sm:block">
            {user.email}
          </span>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto">
        {/* Section tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setActiveSection(s); setActiveSub("VECTOR"); }}
              className={`text-xs font-display tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors ${
                activeSection === s
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Gallery sub-tabs */}
        {activeSection === "gallery" && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {GALLERY_SUBS.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={`text-[10px] font-display tracking-[0.2em] uppercase px-2 py-1 border transition-colors ${
                  activeSub === sub
                    ? "border-foreground/60 text-foreground/80"
                    : "border-border text-muted-foreground hover:text-foreground/60"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Upload area */}
        <label className="flex items-center justify-center gap-2 border border-dashed border-border hover:border-foreground/30 transition-colors py-6 mb-6 cursor-pointer">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-xs font-display tracking-widest text-muted-foreground">
            {uploading ? "UPLOADING..." : "UPLOAD IMAGES"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>

        {/* Items grid */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-12 font-display tracking-wider">
            No images in this section yet
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  className="relative group aspect-square bg-secondary border border-border overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 text-[8px] text-white/50 font-display tracking-wider truncate max-w-[90%]">
                    {item.title}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="px-4 sm:px-8 pb-8">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground text-xs tracking-widest hover:text-foreground transition-colors font-display"
        >
          ← BACK TO SITE
        </button>
      </div>
    </div>
  );
};

export default Admin;
