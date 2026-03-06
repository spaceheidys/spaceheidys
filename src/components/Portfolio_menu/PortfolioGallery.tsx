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
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      let query = supabase
        .from("portfolio_items")
        .select("id, title, image_url, sort_order")
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
          }))
        );
      } else {
        setDbItems(null);
      }
    };
    fetchItems();
  }, [sectionKey, gallerySub]);

  const items =
    dbItems ??
    (sectionKey === "gallery" && gallerySub && defaultGallerySubItems[gallerySub]
      ? defaultGallerySubItems[gallerySub]
      : defaultSectionItems[sectionKey] || defaultSectionItems.gallery);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const [page, setPage] = useState(0);
  const hasPagination = totalPages > 1;

  useEffect(() => {
    setPage(0);
  }, [sectionKey, gallerySub]);

  useEffect(() => {
    onPageInfo?.(page + 1, totalPages);
  }, [page, totalPages, onPageInfo]);

  const pageItems = items.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

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
          className="w-full h-full grid grid-cols-2 gap-2 p-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {pageItems.map((item, i) => (
            <motion.div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white/20 transition-colors duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              onClick={() => item.image_url && setSelectedItem(item)}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
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
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="relative max-w-[90vw] max-h-[85vh]"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors duration-200"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={selectedItem.image_url}
                alt={selectedItem.label}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-md cursor-pointer"
                onClick={() => setSelectedItem(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioGallery;
