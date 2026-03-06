import { motion } from "framer-motion";
import type { PortfolioMenuKey } from "./PortfolioMenu";

const vectorItems = Array.from({ length: 16 }, (_, i) => ({ id: i + 1, label: String(i + 1).padStart(2, "0") }));

const defaultItems = (count: number) => Array.from({ length: count }, (_, i) => ({ id: i + 1, label: String(i + 1).padStart(2, "0") }));

const sectionItems: Record<PortfolioMenuKey, { id: number; label: string }[]> = {
  gallery: defaultItems(6),
  projects: defaultItems(4),
  skills: defaultItems(4),
  archive: defaultItems(6),
};

const gallerySubItems: Record<string, { id: number; label: string }[]> = {
  VECTOR: vectorItems,
  DIGITAL: defaultItems(6),
  AI: defaultItems(6),
  SKETCHES: defaultItems(6),
};

interface PortfolioGalleryProps {
  sectionKey?: PortfolioMenuKey;
  gallerySub?: string | null;
}

const PortfolioGallery = ({ sectionKey = "gallery", gallerySub }: PortfolioGalleryProps) => {
  const items = sectionKey === "gallery" && gallerySub && gallerySubItems[gallerySub]
    ? gallerySubItems[gallerySub]
    : sectionItems[sectionKey] || sectionItems.gallery;

  return (
    <motion.div
      className={`w-full h-full grid ${items.length > 8 ? 'grid-cols-4' : 'grid-cols-2'} gap-2 p-2`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className="bg-white/5 border border-white/10 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white/20 transition-colors duration-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.06 }}
        >
          <span className="text-white/40 text-[9px] sm:text-[10px] tracking-widest font-display uppercase">
            {item.label}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PortfolioGallery;
