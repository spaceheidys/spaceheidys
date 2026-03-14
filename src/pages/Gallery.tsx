import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Heart, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useSocialLinks, buildShareUrl } from "@/hooks/useSocialLinks";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  subsection: string | null;
  group_id: string | null;
}

interface GalleryEntry {
  id: string;
  title: string;
  image_url: string;
  subsection: string | null;
  groupImages?: string[];
}

const TABS = ["ALL", "VECTOR", "DIGITAL", "AI", "SKETCHES"] as const;
const SWIPE_THRESHOLD = 50;

// ─── PlatformIcon ──────────────────────────────────────────────────────────────
const PlatformIcon = ({ label }: { label: string }) => {
  const l = label.toLowerCase();
  if (l.includes("x") || l.includes("twitter"))
    return <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (l.includes("facebook"))
    return <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  if (l.includes("telegram"))
    return <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
  return <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
};

// ─── ShareBar ──────────────────────────────────────────────────────────────────
const ShareBar = ({ shareUrl, title, compact = false }: { shareUrl: string; title: string; compact?: boolean }) => {
  const { links } = useSocialLinks();
  const shareLinks = links.filter((l) => l.share_url_template);
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard", { style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" } });
  };
  if (shareLinks.length === 0 && !shareUrl) return null;
  return (
    <TooltipProvider delayDuration={300}>
      <div className={`flex items-center ${compact ? "gap-1.5" : "gap-3"}`}>
        {shareLinks.map((link) => (
          <Tooltip key={link.id}>
            <TooltipTrigger asChild>
              <a
                href={buildShareUrl(link.share_url_template, shareUrl, title)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`${compact ? "w-6 h-6" : "w-7 h-7"} flex items-center justify-center border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-colors rounded-sm shrink-0`}
              >
                {link.icon_url ? (
                  <img src={link.icon_url} alt={link.label} className="w-3.5 h-3.5 object-contain invert opacity-60 hover:opacity-100 transition-opacity" />
                ) : (
                  <PlatformIcon label={link.label} />
                )}
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] tracking-widest font-display uppercase bg-card border-border text-foreground">{link.label}</TooltipContent>
          </Tooltip>
        ))}
        {shareLinks.length > 0 && <div className="w-[1px] h-4 bg-white/10" />}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className={`${compact ? "w-6 h-6" : "w-7 h-7"} flex items-center justify-center border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-colors rounded-sm shrink-0`}>
              <Copy className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] tracking-widest font-display uppercase bg-card border-border text-foreground">Copy Link</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

const Gallery = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedEntry, setSelectedEntry] = useState<GalleryEntry | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { toggle, isFavorite } = useFavorites();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("portfolio_items")
        .select("id, title, image_url, subsection, group_id")
        .eq("section", "gallery")
        .order("sort_order", { ascending: true });

      if (data) {
        setItems(
          data.map((d: any) => ({
            id: d.id,
            title: d.title || "",
            image_url: d.image_url,
            subsection: d.subsection,
            group_id: d.group_id || null,
          }))
        );
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return items;
    return items.filter((i) => i.subsection === activeTab);
  }, [items, activeTab]);

  // Collapse groups
  const entries: GalleryEntry[] = useMemo(() => {
    const result: GalleryEntry[] = [];
    const seenGroups = new Set<string>();

    for (const item of filtered) {
      if (item.group_id) {
        if (seenGroups.has(item.group_id)) continue;
        seenGroups.add(item.group_id);
        const groupItems = filtered.filter((i) => i.group_id === item.group_id);
        result.push({
          id: item.id,
          title: item.title,
          image_url: item.image_url,
          subsection: item.subsection,
          groupImages: groupItems.map((g) => g.image_url).filter(Boolean),
        });
      } else {
        result.push({
          id: item.id,
          title: item.title,
          image_url: item.image_url,
          subsection: item.subsection,
        });
      }
    }
    return result;
  }, [filtered]);

  const navigableEntries = useMemo(() => entries.filter((e) => !!e.image_url), [entries]);

  const openLightbox = (entry: GalleryEntry) => {
    if (!entry.image_url) return;
    const idx = navigableEntries.findIndex((n) => n.id === entry.id);
    setSelectedEntry(entry);
    setSelectedIndex(idx);
  };

  const goLightbox = useCallback((dir: -1 | 1) => {
    const newIdx = selectedIndex + dir;
    if (newIdx < 0 || newIdx >= navigableEntries.length) return;
    setSelectedEntry(navigableEntries[newIdx]);
    setSelectedIndex(newIdx);
  }, [selectedIndex, navigableEntries]);

  const isGroup = selectedEntry?.groupImages && selectedEntry.groupImages.length > 1;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || isGroup) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    goLightbox(delta > 0 ? 1 : -1);
  }, [goLightbox, isGroup]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-[10px] tracking-[0.3em] uppercase font-display">Return</span>
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <span className="font-jp text-xs tracking-widest text-foreground/70">ギャラリー</span>
            <span className="text-[10px] tracking-[0.4em] uppercase font-display text-foreground/50">Gallery</span>
          </div>

          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Filter tabs */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pb-3 flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-display whitespace-nowrap transition-all duration-300 pb-1 border-b ${
                activeTab === tab
                  ? "text-foreground border-foreground/60"
                  : "text-muted-foreground border-transparent hover:text-foreground/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </motion.header>

      {/* Masonry grid */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {entries.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-32 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-xs tracking-[0.2em] uppercase font-display">No works yet</span>
            <span className="font-jp text-[10px] mt-1 text-muted-foreground/60">作品はまだありません</span>
          </motion.div>
        ) : (
          <motion.div
            className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                className="break-inside-avoid mb-3 sm:mb-4 group cursor-pointer relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.4 }}
                onClick={() => openLightbox(entry)}
              >
                <div className="relative overflow-hidden border border-border/20 hover:border-border/50 transition-all duration-500">
                  <img
                    src={entry.image_url}
                    alt={entry.title}
                    className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    loading="lazy"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors duration-500 flex items-end p-3 opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col gap-0.5">
                      {entry.title && (
                        <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-display text-foreground/90">
                          {entry.title}
                        </span>
                      )}
                      {entry.subsection && (
                        <span className="text-[8px] tracking-widest text-foreground/50 font-display uppercase">
                          {entry.subsection}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Group indicator */}
                  {entry.groupImages && entry.groupImages.length > 1 && (
                    <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm border border-border/40 px-1.5 py-0.5 text-[8px] tracking-widest text-foreground/70 font-display">
                      {entry.groupImages.length} IMG
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-6 text-center">
        <span className="text-[9px] tracking-widest text-muted-foreground/40 font-display">
          © 2018 - 2026 Spaceheidys. All rights reserved.
        </span>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedEntry && (() => {
          const shareUrl = `${window.location.origin}/gallery?id=${selectedEntry.id}`;
          return (
          <motion.div
            className={`fixed inset-0 z-50 flex ${isGroup ? "items-start overflow-y-auto" : "items-center overflow-hidden"} justify-center pt-14 sm:pt-4 pb-24 sm:pb-20 bg-black/80 backdrop-blur-sm cursor-pointer`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedEntry(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation arrows — desktop only */}
            {!isGroup && selectedIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(-1); }}
                className="hidden sm:flex fixed left-6 top-1/2 -translate-y-1/2 z-[60] text-white/40 hover:text-white transition-colors duration-200"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
            )}
            {!isGroup && selectedIndex < navigableEntries.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(1); }}
                className="hidden sm:flex fixed right-6 top-1/2 -translate-y-1/2 z-[60] text-white/40 hover:text-white transition-colors duration-200"
                aria-label="Next image"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            )}

            <motion.div
              key={selectedEntry.id}
              className={`relative my-auto ${isGroup ? "max-w-[90vw] sm:max-w-[75vw] max-h-[80vh] overflow-y-auto" : "max-w-[90vw] sm:max-w-[75vw] max-h-[85vh]"}`}
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.75, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Back button */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedEntry(null); }}
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/10 border border-white/15 text-white/50 hover:text-white hover:bg-white/20 hover:border-white/30 transition-colors duration-200 text-[9px] font-display tracking-[0.2em] uppercase"
                aria-label="Back"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {isGroup ? (
                <div className="flex flex-col gap-3">
                  {selectedEntry.groupImages!.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${selectedEntry.title} ${idx + 1}`}
                      className="w-full object-contain rounded-md"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ))}
                  {/* Bottom bar */}
                  <div className="flex items-center justify-center gap-3 py-2">
                    <ShareBar shareUrl={shareUrl} title={selectedEntry.title} compact />
                    <div className="w-[1px] h-4 bg-white/10" />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(selectedEntry.id); }}
                      className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200"
                      aria-label={isFavorite(selectedEntry.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(selectedEntry.id) ? "fill-white" : ""}`} />
                    </button>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200"
                      aria-label="Close preview"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 max-h-[calc(100vh-8rem)]">
                  <img
                    src={selectedEntry.image_url}
                    alt={selectedEntry.title}
                    className="max-w-[80vw] sm:max-w-[75vw] max-h-[calc(100vh-12rem)] object-contain rounded-md cursor-pointer"
                    onClick={() => setSelectedEntry(null)}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  {/* Bottom bar */}
                  <div className="flex items-center justify-center gap-3 pt-2 flex-shrink-0">
                    <ShareBar shareUrl={shareUrl} title={selectedEntry.title} compact />
                    <div className="w-[1px] h-4 bg-white/10" />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(selectedEntry.id); }}
                      className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200"
                      aria-label={isFavorite(selectedEntry.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(selectedEntry.id) ? "fill-white" : ""}`} />
                    </button>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200"
                      aria-label="Close preview"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
