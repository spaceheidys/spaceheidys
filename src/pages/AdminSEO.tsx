import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAllSeo, type SeoSetting } from "@/hooks/useSeo";
import { toast } from "sonner";
import { Loader2, Upload, X, Check } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
  default: "Default (fallback for all pages)",
  home: "Home (/)",
  gallery: "Gallery (/gallery)",
  shop: "Shop (/shop)",
};

const RECOMMENDED_W = 1200;
const RECOMMENDED_H = 630;

const AdminSEO = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items, loading, refetch } = useAllSeo();
  const [drafts, setDrafts] = useState<Record<string, SeoSetting>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast.error("Admin access required");
      navigate("/");
    }
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    const map: Record<string, SeoSetting> = {};
    items.forEach((it) => (map[it.id] = { ...it }));
    setDrafts(map);
  }, [items]);

  const updateDraft = (id: string, patch: Partial<SeoSetting>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const isDirty = (it: SeoSetting) => {
    const draft = drafts[it.id];
    if (!draft) return false;
    return (
      draft.title !== it.title ||
      draft.description !== it.description ||
      draft.og_image_url !== it.og_image_url
    );
  };

  const save = async (it: SeoSetting) => {
    const draft = drafts[it.id];
    if (!draft) return;
    setSaving(it.id);
    const { error } = await supabase
      .from("seo_settings")
      .update({
        title: draft.title,
        description: draft.description,
        og_image_url: draft.og_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", it.id);
    setSaving(null);
    if (error) {
      toast.error("Save failed");
    } else {
      toast.success(`${PAGE_LABELS[it.page_key] ?? it.page_key} saved`);
      refetch();
    }
  };

  const handleUpload = async (it: SeoSetting, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setUploading(it.id);
    const ext = file.name.split(".").pop();
    const path = `seo/${it.page_key}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("portfolio-images")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(null);
      toast.error("Upload failed");
      return;
    }
    const { data } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    updateDraft(it.id, { og_image_url: data.publicUrl });
    setUploading(null);
    toast.success("Image uploaded — don't forget to save");
  };

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
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => navigate("/admin/main")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Main Page CMS
          </button>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => navigate("/admin")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Portfolio CMS
          </button>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => navigate("/admin/secret-door")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Secret Door
          </button>
          <span className="text-muted-foreground/40">|</span>
          <h1 className="font-display text-sm tracking-[0.3em] uppercase">SEO</h1>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => navigate("/admin/shop")}
            className="font-display text-sm tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Shop
          </button>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
        >
          ← SITE
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="border border-border p-4 text-xs text-muted-foreground font-body leading-relaxed">
          <p>
            <span className="text-foreground font-display tracking-widest uppercase text-[10px]">Tips</span>
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Title: keep under 60 characters.</li>
            <li>Description: keep under 160 characters.</li>
            <li>Preview image: recommended {RECOMMENDED_W}×{RECOMMENDED_H}px (max 5MB).</li>
            <li>"Default" is used as fallback whenever a page has empty fields.</li>
            <li>Social platforms cache previews — use Facebook/Twitter debuggers to refresh.</li>
          </ul>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
          </div>
        ) : (
          items.map((it) => {
            const draft = drafts[it.id] ?? it;
            const dirty = isDirty(it);
            return (
              <section
                key={it.id}
                className="border border-border p-4 space-y-3"
              >
                <h2 className="font-display text-xs tracking-[0.3em] uppercase text-foreground">
                  {PAGE_LABELS[it.page_key] ?? it.page_key}
                </h2>

                <div>
                  <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">
                    Title ({draft.title.length}/60)
                  </label>
                  <input
                    value={draft.title}
                    onChange={(e) => updateDraft(it.id, { title: e.target.value })}
                    maxLength={120}
                    className="w-full bg-transparent border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">
                    Description ({draft.description.length}/160)
                  </label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => updateDraft(it.id, { description: e.target.value })}
                    maxLength={300}
                    rows={2}
                    className="w-full bg-transparent border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">
                    Preview Image (OG)
                  </label>
                  {draft.og_image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={draft.og_image_url}
                        alt="OG preview"
                        className="max-w-xs border border-border"
                      />
                      <button
                        onClick={() => updateDraft(it.id, { og_image_url: "" })}
                        className="absolute top-1 right-1 w-6 h-6 bg-background/90 border border-border flex items-center justify-center hover:text-foreground"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic mb-1">
                      No image — falling back to default.
                    </p>
                  )}
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-border text-[10px] font-display tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 cursor-pointer transition-colors">
                      {uploading === it.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      {uploading === it.id ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading === it.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(it, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>

                {dirty && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => updateDraft(it.id, { ...it })}
                      className="flex items-center gap-1 px-3 py-1 text-[10px] font-display tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={10} /> Discard
                    </button>
                    <button
                      onClick={() => save(it)}
                      disabled={saving === it.id}
                      className="flex items-center gap-1 px-3 py-1 text-[10px] font-display tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                    >
                      {saving === it.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Check size={10} />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
};

export default AdminSEO;