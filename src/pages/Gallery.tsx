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

const Gallery = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedEntry, setSelectedEntry] = useState<GalleryEntry | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
            onClick={() => navigate("/")}
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
        {selectedEntry && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedEntry(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {!isGroup && selectedIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(-1); }}
                className="fixed left-3 sm:left-8 top-1/2 -translate-y-1/2 z-[60] text-foreground/30 hover:text-foreground transition-colors duration-200"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            )}
            {!isGroup && selectedIndex < navigableEntries.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(1); }}
                className="fixed right-3 sm:right-8 top-1/2 -translate-y-1/2 z-[60] text-foreground/30 hover:text-foreground transition-colors duration-200"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            )}

            <motion.div
              key={selectedEntry.id}
              className={`relative ${isGroup ? "max-w-[85vw] sm:max-w-[75vw] max-h-[90vh] overflow-y-auto" : "max-w-[85vw] sm:max-w-[80vw] max-h-[90vh]"}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-background/50 border border-border/40 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-background/80 transition-colors duration-200"
                style={{ position: "sticky", top: 8, float: "right" }}
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>

              {isGroup ? (
                <div className="flex flex-col gap-3">
                  {selectedEntry.groupImages!.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${selectedEntry.title} ${idx + 1}`}
                      className="w-full object-contain"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={selectedEntry.image_url}
                  alt={selectedEntry.title}
                  className="max-w-[85vw] sm:max-w-[80vw] max-h-[90vh] object-contain cursor-pointer"
                  onClick={() => setSelectedEntry(null)}
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
