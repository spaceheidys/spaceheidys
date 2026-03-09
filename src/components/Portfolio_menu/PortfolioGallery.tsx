import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ExternalLink, Share2, Heart, Copy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import type { PortfolioMenuKey } from "./PortfolioMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ITEMS_PER_PAGE_MOBILE = 6;
const ITEMS_PER_PAGE_DESKTOP = 9;

interface PortfolioItem {
  id: string;
  label: string;
  image_url?: string;
  group_id?: string | null;
  project_url?: string | null;
  description?: string;
  tags?: string[];
  project_date?: string;
}

/** A display entry: either a single image or a group (first image as thumbnail, all URLs stored) */
interface GalleryEntry {
  id: string;
  label: string;
  image_url?: string;
  groupImages?: string[];
  project_url?: string | null;
  description?: string;
  tags?: string[];
  project_date?: string;
}

const makeItems = (count: number): PortfolioItem[] =>
  Array.from({ length: count }, (_, i) => ({ id: String(i + 1), label: String(i + 1).padStart(2, "0") }));

const defaultSectionItems: Partial<Record<PortfolioMenuKey, PortfolioItem[]>> = {
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
  const { favorites, toggle, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchItems = async () => {
      if (sectionKey === "favorites") {
        // Fetch all favorited items across sections
        const favIds = Array.from(favorites);
        if (favIds.length === 0) {
          setDbItems([]);
          return;
        }
        const { data } = await supabase
          .from("portfolio_items")
          .select("id, title, image_url, sort_order, group_id, project_url, description, tags, project_date, section")
          .in("id", favIds)
          .order("sort_order", { ascending: true });
        if (data && data.length > 0) {
          setDbItems(
            data.map((d: any) => ({
              id: d.id,
              label: d.title || "",
              image_url: d.image_url,
              group_id: d.group_id || null,
              project_url: d.project_url || null,
              description: d.description || "",
              tags: d.tags || [],
              project_date: d.project_date || "",
            }))
          );
        } else {
          setDbItems([]);
        }
        return;
      }

      let query = supabase
        .from("portfolio_items")
        .select("id, title, image_url, sort_order, group_id, project_url, description, tags, project_date")
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
            description: d.description || "",
            tags: d.tags || [],
            project_date: d.project_date || "",
          }))
        );
      } else {
        setDbItems(null);
      }
    };
    fetchItems();
  }, [sectionKey, gallerySub, favorites]);

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
          description: item.description,
          tags: item.tags,
          project_date: item.project_date,
        });
      } else {
        result.push({
          id: item.id,
          label: item.label,
          image_url: item.image_url,
          project_url: item.project_url,
          description: item.description,
          tags: item.tags,
          project_date: item.project_date,
        });
      }
    }
    return result;
  }, [rawItems]);

  const navigableEntries = useMemo(() => entries.filter((i) => !!i.image_url || !!i.project_url), [entries]);

  const openLightbox = (entry: GalleryEntry) => {
    if (!entry.image_url && !entry.project_url) return;
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors duration-300 -ml-5 sm:-translate-x-[calc(100%+8px)] sm:ml-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5 sm:w-[40px] sm:h-[40px]" />
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
              ) : item.project_url ? (
                <div className="w-full h-full overflow-hidden relative bg-black">
                  <iframe
                    src={item.project_url}
                    title={item.label}
                    className="absolute origin-top-left pointer-events-none"
                    style={{ width: "1200px", height: "900px", transform: "scale(0.14)", transformOrigin: "top left" }}
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                  />
                </div>
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
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors duration-300 -mr-5 sm:translate-x-[calc(100%+8px)] sm:mr-0"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5 sm:w-[40px] sm:h-[40px]" />
        </button>
      )}

      {/* Lightbox overlay */}
      <AnimatePresence mode="wait">
        {selectedEntry && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedEntry(null)}
          >
            {/* Navigation arrows – only for non-group entries */}
            {!isGroup && selectedIndex > 0 && (
              <motion.button
                onClick={(e) => { e.stopPropagation(); goLightbox(-1); }}
                className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[60] text-white/40 hover:text-white transition-colors duration-200"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
              </motion.button>
            )}
            {!isGroup && selectedIndex < navigableEntries.length - 1 && (
              <motion.button
                onClick={(e) => { e.stopPropagation(); goLightbox(1); }}
                className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[60] text-white/40 hover:text-white transition-colors duration-200"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
              </motion.button>
            )}

            <motion.div
              key={selectedEntry.id}
              className={`relative ${isProject ? "w-[95vw] h-[90vh] sm:w-[85vw] sm:h-[80vh]" : isGroup ? "max-w-[90vw] sm:max-w-[75vw] max-h-[90vh] overflow-y-auto" : "max-w-[90vw] sm:max-w-[75vw] max-h-[90vh]"}`}
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.75, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Back to list — top left */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedEntry(null); }}
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/10 border border-white/15 text-white/50 hover:text-white hover:bg-white/20 hover:border-white/30 transition-colors duration-200 text-[9px] font-display tracking-[0.2em] uppercase"
                aria-label="Back to list"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Top-right controls */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(selectedEntry.id);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200"
                  aria-label={isFavorite(selectedEntry.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(selectedEntry.id) ? "fill-white" : ""}`} />
                </button>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isProject ? (
                <div className="w-full h-full flex flex-col sm:flex-row gap-0 rounded-lg overflow-hidden border border-white/10 bg-black/90">
                  {/* Left: iframe preview */}
                  <div className="flex-1 min-h-[35vh] sm:min-h-0 relative">
                    <iframe
                      src={selectedEntry.project_url!}
                      title={selectedEntry.label}
                      className="absolute inset-0 w-full h-full"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                  </div>
                  {/* Right: info panel — scrollable on mobile */}
                  <div className="sm:w-[280px] lg:w-[320px] flex flex-col justify-between p-4 sm:p-6 border-t sm:border-t-0 sm:border-l border-white/10 bg-black/95 overflow-y-auto max-h-[40vh] sm:max-h-none">
                    <div>
                      <h3 className="text-lg font-display tracking-[0.15em] uppercase text-white mb-1">
                        {selectedEntry.label}
                      </h3>
                      {selectedEntry.project_date && (
                        <p className="text-[10px] text-white/30 font-display tracking-widest uppercase mb-4">
                          {selectedEntry.project_date}
                        </p>
                      )}
                      {selectedEntry.description && (
                        <p className="text-sm text-white/60 leading-relaxed font-body mb-4">
                          {selectedEntry.description}
                        </p>
                      )}
                      {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {selectedEntry.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[9px] font-display tracking-widest uppercase border border-white/15 text-white/50 rounded-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex flex-col gap-3">
                      <a
                        href={selectedEntry.project_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-white/20 text-white/80 hover:text-white hover:border-white/50 transition-colors text-xs font-display tracking-[0.2em] uppercase"
                      >
                        <ExternalLink size={14} />
                        Visit Project
                      </a>
                      {/* Share buttons */}
                      <TooltipProvider delayDuration={300}>
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-[9px] text-white/30 font-display tracking-widest uppercase">Share</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(selectedEntry.project_url!)}&text=${encodeURIComponent(selectedEntry.label)}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-colors rounded-sm">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] tracking-widest font-display uppercase bg-card border-border text-foreground">Share on X</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(selectedEntry.project_url!)}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-colors rounded-sm">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] tracking-widest font-display uppercase bg-card border-border text-foreground">Share on Facebook</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a href={`https://t.me/share/url?url=${encodeURIComponent(selectedEntry.project_url!)}&text=${encodeURIComponent(selectedEntry.label)}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-colors rounded-sm">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] tracking-widest font-display uppercase bg-card border-border text-foreground">Share on Telegram</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(selectedEntry.project_url!)}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-colors rounded-sm">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] tracking-widest font-display uppercase bg-card border-border text-foreground">Share on LinkedIn</TooltipContent>
                          </Tooltip>
                          <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(selectedEntry.project_url!);
                                  toast.success("Link copied to clipboard", {
                                    style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
                                  });
                                }}
                                className="w-7 h-7 flex items-center justify-center border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-colors rounded-sm"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] tracking-widest font-display uppercase bg-card border-border text-foreground">Copy Link</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
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
