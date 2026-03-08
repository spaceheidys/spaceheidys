import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PortfolioMenuKey } from "./PortfolioMenu";

const ITEMS_PER_PAGE_MOBILE = 6;
const ITEMS_PER_PAGE_DESKTOP = 9;

interface PortfolioItem {
  id: string;
  label: string;
  image_url?: string;
  group_id?: string | null;
  project_url?: string | null;
}

/** A display entry: either a single image or a group (first image as thumbnail, all URLs stored) */
interface GalleryEntry {
  id: string;
  label: string;
  image_url?: string;
  groupImages?: string[];
  project_url?: string | null;
}

const makeItems = (count: number): PortfolioItem[] =>
  Array.from({ length: count }, (_, i) => ({ id: String(i + 1), label: String(i + 1).padStart(2, "0") }));

const defaultSectionItems: Record<PortfolioMenuKey, PortfolioItem[]> = {
  gallery: makeItems(6),
  projects: makeItems(16),
  skills: makeItems(16),
  archive: makeItems(8),
};

const defaultGallerySubItems: Record<string, PortfolioItem[]> = {
  VECTOR: makeItems(16),
  DIGITAL: makeItems(16),
  AI: makeItems(16),
  SKETCHES: makeItems(16),
};

interface PortfolioGalleryProps {
  sectionKey?: PortfolioMenuKey;
  gallerySub?: string | null;
  onPageInfo?: (current: number, total: number) => void;
}

const PortfolioGallery = ({ sectionKey = "gallery", gallerySub, onPageInfo }: PortfolioGalleryProps) => {
  const isMobile = useIsMobile();
  const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;
  const [dbItems, setDbItems] = useState<PortfolioItem[] | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<GalleryEntry | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchItems = async () => {
      let query = supabase
        .from("portfolio_items")
        .select("id, title, image_url, sort_order, group_id, project_url")
        .eq("section", sectionKey)
        .order("sort_order", { ascending: true });

      if (sectionKey === "gallery" && gallerySub) {
        query = query.eq("subsection", gallerySub);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setDbItems(
          data.map((d: any) => ({
            id: d.id,
            label: d.title || "",
            image_url: d.image_url,
            group_id: d.group_id || null,
            project_url: d.project_url || null,
          }))
        );
      } else {
        setDbItems(null);
      }
    };
    fetchItems();
  }, [sectionKey, gallerySub]);

  const rawItems =
    dbItems ??
    (sectionKey === "gallery" && gallerySub && defaultGallerySubItems[gallerySub]
      ? defaultGallerySubItems[gallerySub]
      : defaultSectionItems[sectionKey] || defaultSectionItems.gallery);

  // Collapse groups into single entries
  const entries: GalleryEntry[] = useMemo(() => {
    const result: GalleryEntry[] = [];
    const seenGroups = new Set<string>();

    for (const item of rawItems) {
      if (item.group_id) {
        if (seenGroups.has(item.group_id)) continue;
        seenGroups.add(item.group_id);
        const groupItems = rawItems.filter((i) => i.group_id === item.group_id);
        result.push({
          id: item.id,
          label: item.label,
          image_url: item.image_url,
          groupImages: groupItems.map((g) => g.image_url!).filter(Boolean),
          project_url: item.project_url,
        });
      } else {
        result.push({
          id: item.id,
          label: item.label,
          image_url: item.image_url,
          project_url: item.project_url,
        });
      }
    }
    return result;
  }, [rawItems]);

  const navigableEntries = useMemo(() => entries.filter((i) => !!i.image_url), [entries]);

  const openLightbox = (entry: GalleryEntry) => {
    if (!entry.image_url) return;
    const idx = navigableEntries.findIndex((n) => n.id === entry.id);
    setSelectedEntry(entry);
    setSelectedIndex(idx);
  };

  const goLightbox = (dir: -1 | 1) => {
    const newIdx = selectedIndex + dir;
    if (newIdx < 0 || newIdx >= navigableEntries.length) return;
    setSelectedEntry(navigableEntries[newIdx]);
    setSelectedIndex(newIdx);
  };

  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const [page, setPage] = useState(0);
  const hasPagination = totalPages > 1;

  useEffect(() => {
    setPage(0);
  }, [sectionKey, gallerySub]);

  useEffect(() => {
    onPageInfo?.(page + 1, totalPages);
  }, [page, totalPages, onPageInfo]);

  const pageItems = entries.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const isGroup = selectedEntry && selectedEntry.groupImages && selectedEntry.groupImages.length > 1;
  const isProject = selectedEntry && selectedEntry.project_url;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {hasPagination && (
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[calc(100%+8px)] z-10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors duration-300"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6 sm:w-[40px] sm:h-[40px]" />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${sectionKey}-${gallerySub}-${page}`}
          className="w-full h-full grid grid-cols-2 sm:grid-cols-3 gap-2 p-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {pageItems.map((item, i) => (
            <motion.div
              key={item.id}
              className="aspect-square bg-white/5 border border-white/10 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white/20 transition-colors duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              onClick={() => openLightbox(item)}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <span className="text-white/40 text-[9px] sm:text-[10px] tracking-widest font-display uppercase">
                  {item.label}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {hasPagination && (
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+8px)] z-10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors duration-300"
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6 sm:w-[40px] sm:h-[40px]" />
        </button>
      )}

      {/* Lightbox overlay */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedEntry(null)}
          >
            {/* Navigation arrows – only for non-group entries */}
            {!isGroup && selectedIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(-1); }}
                className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[60] text-white/40 hover:text-white transition-colors duration-200"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            )}
            {!isGroup && selectedIndex < navigableEntries.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(1); }}
                className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[60] text-white/40 hover:text-white transition-colors duration-200"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            )}

            <motion.div
              key={selectedEntry.id}
              className={`relative ${isProject ? "w-[90vw] h-[85vh] sm:w-[80vw]" : isGroup ? "max-w-[85vw] sm:max-w-[75vw] max-h-[90vh] overflow-y-auto" : "max-w-[80vw] sm:max-w-[75vw] max-h-[85vh]"}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-1 right-1 z-10 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200 sticky"
                style={{ position: "sticky", top: 4, float: "right" }}
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>

              {isProject ? (
                <iframe
                  src={selectedEntry.project_url!}
                  title={selectedEntry.label}
                  className="w-full h-full rounded-md border border-white/10"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              ) : isGroup ? (
                <div className="flex flex-col gap-3">
                  {selectedEntry.groupImages!.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${selectedEntry.label} ${idx + 1}`}
                      className="w-full object-contain rounded-md"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={selectedEntry.image_url}
                  alt={selectedEntry.label}
                  className="max-w-[80vw] sm:max-w-[75vw] max-h-[85vh] object-contain rounded-md cursor-pointer"
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

export default PortfolioGallery;
