import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, Plus, Loader2, Upload, Check, X } from "lucide-react";
import { invalidateSocialLinksCache } from "@/hooks/useSocialLinks";

interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon_url: string;
  is_visible: boolean;
  sort_order: number;
}

/* ── Preset icon SVGs ───────────────────────────────────────────── */
const PRESET_ICONS: { key: string; label: string; svg: string }[] = [
  { key: "behance", label: "Behance", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.68.767-.63.17-1.3.254-2.006.254H0V4.51h6.938v-.007zm-.588 5.395c.595 0 1.082-.14 1.46-.41.38-.27.57-.71.57-1.31 0-.34-.057-.62-.173-.84-.12-.22-.28-.39-.49-.52-.21-.13-.45-.21-.73-.26-.28-.04-.57-.06-.88-.06H3.34v3.4h3.01zm.164 5.673c.34 0 .65-.03.93-.1.29-.07.54-.18.75-.33.21-.15.375-.35.49-.61.12-.26.175-.59.175-.99 0-.79-.22-1.36-.66-1.7-.44-.34-1.02-.51-1.74-.51H3.34v4.24h3.174zm11.15-2.032c.195.94.648 1.41 1.35 1.41.46 0 .84-.14 1.15-.41.3-.28.48-.58.55-.92h2.43c-.38 1.18-.97 2.03-1.77 2.56-.81.52-1.78.78-2.92.78-.81 0-1.53-.13-2.17-.38-.63-.25-1.17-.6-1.6-1.05-.43-.45-.76-1-.99-1.63-.23-.63-.34-1.32-.34-2.07 0-.72.12-1.4.36-2.03.24-.62.57-1.16 1.01-1.61.44-.45.97-.8 1.6-1.06.62-.25 1.31-.38 2.06-.38.84 0 1.58.16 2.22.47.63.31 1.16.74 1.57 1.28.41.54.71 1.17.9 1.88.18.71.24 1.46.17 2.25h-6.84c0 .76.16 1.32.35 1.68zm.602-3.312c-.1-.49-.27-.9-.52-1.23-.25-.33-.62-.5-1.1-.5-.33 0-.61.06-.84.18-.22.12-.41.28-.55.47-.14.2-.24.42-.3.65-.06.24-.09.47-.09.69h3.41c-.01-.09-.01-.18-.01-.23zM15.5 6.5h4.5v1.1H15.5z"/></svg>` },
  { key: "linkedin", label: "LinkedIn", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` },
  { key: "twitter", label: "X (Twitter)", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
  { key: "instagram", label: "Instagram", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>` },
  { key: "twitch", label: "Twitch", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>` },
  { key: "telegram", label: "Telegram", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>` },
  { key: "dribbble", label: "Dribbble", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.816zm-11.62-2.073c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.827-1.74C7.29 13.334 2.51 13.2 2.096 13.18l-.007.822c0 2.43.867 4.66 2.297 6.375zm-2.19-7.925c.42.013 4.512.054 9.36-1.29-.37-.66-.765-1.308-1.175-1.943-4.814 1.44-9.536 1.39-9.99 1.375l-.002.8c0 .38.023.753.065 1.12l1.742-.062zm12.26-1.62c.42.705.826 1.43 1.2 2.163 3.593-.45 7.168.27 7.53.35-.016-2.557-.967-4.9-2.573-6.698-1.11 1.49-3.605 3.712-6.157 4.185zm.956-5.49c2.62 1.82 4.39 4.638 4.785 7.876.14-.03.28-.06.42-.09-.038-3.53-2.01-6.61-4.794-8.45-.134.217-.274.43-.41.664z"/></svg>` },
  { key: "facebook", label: "Facebook", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>` },
];

const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/* ── Confirm buttons ────────────────────────────────────────────── */
function ConfirmButtons({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <button onClick={onYes} className="flex items-center gap-0.5 px-2 py-0.5 border border-foreground text-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors">
        <Check size={9} /> YES
      </button>
      <button onClick={onNo} className="flex items-center gap-0.5 px-2 py-0.5 border border-border text-muted-foreground text-[9px] font-display tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors">
        <X size={9} /> NO
      </button>
    </span>
  );
}

/* ── Icon Picker ────────────────────────────────────────────────── */
const IconPicker = ({ onSelect, onClose, currentUrl }: { onSelect: (url: string) => void; onClose: () => void; currentUrl: string }) => (
  <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-border shadow-lg p-2 flex flex-wrap gap-1.5 w-48">
    {PRESET_ICONS.map((p) => {
      const dataUrl = svgToDataUrl(p.svg);
      const active = currentUrl === dataUrl;
      return (
        <button key={p.key} onClick={() => { onSelect(dataUrl); onClose(); }} title={p.label}
          className={`w-8 h-8 flex items-center justify-center border transition-colors rounded-sm relative ${active ? "border-foreground/60 bg-foreground/10" : "border-border hover:border-foreground/40 hover:bg-foreground/5"}`}>
          <img src={dataUrl} alt={p.label} className="w-4 h-4 object-contain invert opacity-70" />
          {active && <Check size={8} className="absolute bottom-0.5 right-0.5 text-foreground" />}
        </button>
      );
    })}
    <div className="w-full border-t border-border/50 pt-1.5 mt-0.5">
      <label className="w-full flex items-center gap-1.5 text-[9px] font-display tracking-widest text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
        <Upload size={9} /> UPLOAD CUSTOM
        <input type="file" accept="image/*,.svg" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const ev = new CustomEvent("icon-upload-request", { detail: f, bubbles: true });
            e.target.dispatchEvent(ev);
          }
          onClose();
        }} />
      </label>
    </div>
  </div>
);

/* ── Single social link row ─────────────────────────────────────── */
const SocialRow = ({
  link, onUpdate, onDelete, onIconUpload, uploadingId,
}: {
  link: SocialLink;
  onUpdate: (id: string, fields: Partial<SocialLink>) => void;
  onDelete: (id: string) => void;
  onIconUpload: (id: string, file: File) => void;
  uploadingId: string | null;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmVis, setConfirmVis] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const handlePickerRef = (el: HTMLDivElement | null) => {
    (pickerRef as any).current = el;
    if (!el) return;
    el.addEventListener("icon-upload-request", (e: any) => {
      onIconUpload(link.id, e.detail);
    });
  };

  return (
    <div className="border border-border bg-background flex items-center gap-2 px-3 py-2.5">
      {/* Icon picker */}
      <div className="relative shrink-0" ref={handlePickerRef}>
        <button onClick={() => setPickerOpen(v => !v)}
          className="w-7 h-7 flex items-center justify-center border border-dashed border-border hover:border-foreground/40 transition-colors rounded-sm overflow-hidden"
          title="Choose icon">
          {uploadingId === link.id ? (
            <Loader2 size={12} className="animate-spin text-muted-foreground" />
          ) : link.icon_url ? (
            <img src={link.icon_url} alt={link.label} className="w-4 h-4 object-contain" style={{ filter: "invert(1)" }} />
          ) : (
            <Upload size={10} className="text-muted-foreground/40" />
          )}
        </button>
        {pickerOpen && <IconPicker currentUrl={link.icon_url} onSelect={(url) => onUpdate(link.id, { icon_url: url })} onClose={() => setPickerOpen(false)} />}
      </div>

      {/* Visibility */}
      {confirmVis ? (
        <ConfirmButtons
          onYes={() => { onUpdate(link.id, { is_visible: !link.is_visible }); setConfirmVis(false); }}
          onNo={() => setConfirmVis(false)}
        />
      ) : (
        <button onClick={() => setConfirmVis(true)} className="shrink-0" title={link.is_visible ? "Visible" : "Hidden"}>
          {link.is_visible
            ? <Eye size={12} className="text-foreground/40 hover:text-foreground transition-colors" />
            : <EyeOff size={12} className="text-muted-foreground/20 hover:text-muted-foreground transition-colors" />}
        </button>
      )}

      {/* Label */}
      <input type="text" value={link.label} onChange={(e) => onUpdate(link.id, { label: e.target.value })}
        placeholder="Label"
        className="w-20 bg-transparent text-xs font-display tracking-wider text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-transparent focus:border-border transition-colors shrink-0" />

      {/* URL */}
      <input type="text" value={link.url} onChange={(e) => onUpdate(link.id, { url: e.target.value })}
        placeholder="https://..."
        className="flex-1 bg-transparent text-xs font-display tracking-wider text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-transparent focus:border-border transition-colors min-w-0" />

      {/* Delete */}
      {confirmDelete ? (
        <ConfirmButtons onYes={() => { onDelete(link.id); setConfirmDelete(false); }} onNo={() => setConfirmDelete(false)} />
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="shrink-0 text-muted-foreground/30 hover:text-destructive transition-colors">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

/* ── Main SocialSection ─────────────────────────────────────────── */
const SocialSection = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [originalLinks, setOriginalLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmAdd, setConfirmAdd] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    const { data } = await supabase.from("social_links").select("id, label, url, icon_url, is_visible, sort_order").eq("link_type", "social").order("sort_order");
    if (data) {
      const d = data as SocialLink[];
      setLinks(d);
      setOriginalLinks(JSON.parse(JSON.stringify(d)));
      setDeletedIds([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const hasChanges = JSON.stringify(links) !== JSON.stringify(originalLinks) || deletedIds.length > 0;

  const handleUpdate = (id: string, fields: Partial<SocialLink>) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...fields } : l));
  };

  const handleDelete = (id: string) => {
    if (originalLinks.find(o => o.id === id)) setDeletedIds(prev => [...prev, id]);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const handleIconUpload = async (id: string, file: File) => {
    setUploadingId(id);
    const ext = file.name.split(".").pop();
    const path = `social/${id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploadingId(null); return; }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    handleUpdate(id, { icon_url: urlData.publicUrl });
    setUploadingId(null);
  };

  const addNew = () => {
    const maxOrder = links.reduce((m, l) => Math.max(m, l.sort_order), -1);
    const newLink: SocialLink = {
      id: crypto.randomUUID(),
      label: "",
      url: "",
      icon_url: "",
      is_visible: true,
      sort_order: maxOrder + 1,
    };
    setLinks(prev => [...prev, newLink]);
    setConfirmAdd(false);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Delete removed
      for (const id of deletedIds) {
        await supabase.from("social_links").delete().eq("id", id);
      }
      // Upsert remaining
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const row = { label: l.label || "Link", url: l.url, icon_url: l.icon_url, is_visible: l.is_visible, sort_order: i };
        if (originalLinks.find(o => o.id === l.id)) {
          await supabase.from("social_links").update({ ...row, updated_at: new Date().toISOString() }).eq("id", l.id);
        } else {
          await supabase.from("social_links").insert({ ...row, share_url_template: "" });
        }
      }
      invalidateSocialLinksCache();
      toast.success("Saved");
      await fetchLinks();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
    setConfirmSave(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={16} /></div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
        Social links — Main page hero
      </p>

      <div className="space-y-1.5">
        {links.map(link => (
          <SocialRow key={link.id} link={link} onUpdate={handleUpdate} onDelete={handleDelete} onIconUpload={handleIconUpload} uploadingId={uploadingId} />
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Add */}
        {confirmAdd ? (
          <span className="flex items-center gap-1 text-xs font-display tracking-[0.2em] uppercase">
            Add? <ConfirmButtons onYes={addNew} onNo={() => setConfirmAdd(false)} />
          </span>
        ) : (
          <button onClick={() => setConfirmAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-xs font-display tracking-[0.2em] uppercase">
            <Plus size={12} /> Add
          </button>
        )}

        {/* Save */}
        {hasChanges && (
          confirmSave ? (
            <span className="flex items-center gap-1 text-xs font-display tracking-[0.2em] uppercase">
              Save? <ConfirmButtons onYes={saveAll} onNo={() => setConfirmSave(false)} />
            </span>
          ) : (
            <button onClick={() => setConfirmSave(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-foreground text-foreground text-xs font-display tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition-colors">
              {saving ? <Loader2 size={12} className="animate-spin" /> : "Save changes"}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default SocialSection;
