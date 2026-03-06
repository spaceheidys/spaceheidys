import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioMenuKey } from "./PortfolioMenu";

const ITEMS_PER_PAGE = 6;

const sectionItems: Record<PortfolioMenuKey, { id: number; label: string }[]> = {
  gallery: [
    { id: 1, label: "01" },
    { id: 2, label: "02" },
    { id: 3, label: "03" },
    { id: 4, label: "04" },
    { id: 5, label: "05" },
    { id: 6, label: "06" },
  ],
  projects: [
    { id: 1, label: "01" },
    { id: 2, label: "02" },
    { id: 3, label: "03" },
    { id: 4, label: "04" },
  ],
  skills: [
    { id: 1, label: "01" },
    { id: 2, label: "02" },
    { id: 3, label: "03" },
    { id: 4, label: "04" },
  ],
  archive: [
    { id: 1, label: "01" },
    { id: 2, label: "02" },
    { id: 3, label: "03" },
    { id: 4, label: "04" },
    { id: 5, label: "05" },
    { id: 6, label: "06" },
    { id: 7, label: "07" },
    { id: 8, label: "08" },
  ],
};

interface PortfolioGalleryProps {
  sectionKey?: PortfolioMenuKey;
}

const PortfolioGallery = ({ sectionKey = "gallery" }: PortfolioGalleryProps) => {
  const items = sectionItems[sectionKey] || sectionItems.gallery;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const [page, setPage] = useState(0);
  const hasPagination = totalPages > 1;

  const pageItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Left arrow */}
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

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          className="w-full h-full grid grid-cols-2 gap-2 p-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {pageItems.map((item, i) => (
            <motion.div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white/20 transition-colors duration-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
            >
              <span className="text-white/40 text-[9px] sm:text-[10px] tracking-widest font-display uppercase">
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Right arrow */}
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
    </div>
  );
};

export default PortfolioGallery;
