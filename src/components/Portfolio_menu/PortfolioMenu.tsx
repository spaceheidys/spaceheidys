import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  { label: "ギャラリー", en: "GALLERY", key: "gallery" },
  { label: "プロジェクト", en: "PROJECTS", key: "projects" },
  { label: "エーアイ", en: "AI", key: "skills" },
  { label: "アーカイブ", en: "ARCHIVE", key: "archive" },
] as const;

export type PortfolioMenuKey = (typeof menuItems)[number]["key"];

interface PortfolioMenuProps {
  visible: boolean;
  activeKey?: PortfolioMenuKey | null;
  onSelect?: (key: PortfolioMenuKey) => void;
  onBack?: () => void;
  onGallerySubSelect?: (label: string) => void;
}

const PortfolioMenu = ({ visible, activeKey, onSelect, onBack, onGallerySubSelect }: PortfolioMenuProps) => {
  if (!visible) return null;

  return (
    <AnimatePresence mode="wait">
      {activeKey === "gallery" ? (
        <motion.div
          key="gallery-sub"
          className="flex items-center justify-center gap-6 sm:gap-10 mt-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {[
            { en: "VECTOR", jp: "ベクター" },
            { en: "DIGITAL", jp: "デジタル" },
            { en: "AI", jp: "エーアイ" },
            { en: "SKETCHES", jp: "スケッチ" },
            { en: "BACK", jp: "戻る", isBack: true },
          ].map((item, i) => (
            <motion.button
              key={item.en}
              className="group flex flex-col items-center gap-0.5 cursor-pointer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={'isBack' in item && item.isBack ? onBack : () => onGallerySubSelect?.(item.en)}
            >
              <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-white/50 group-hover:text-white transition-colors duration-300 font-display">
                {item.en}
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest text-white/30 group-hover:text-white/60 transition-colors duration-300 font-jp">
                {item.jp}
              </span>
            </motion.button>
          ))}
        </motion.div>
      ) : activeKey ? (
        <motion.div
          key="back"
          className="flex items-center justify-center mt-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            className="group flex flex-col items-center gap-0.5 cursor-pointer"
            onClick={onBack}
          >
            <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-white/50 group-hover:text-white transition-colors duration-300 font-display">
              BACK
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-widest text-white/30 group-hover:text-white/60 transition-colors duration-300 font-jp">
              戻る
            </span>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="menu"
          className="flex items-center justify-center gap-6 sm:gap-10 mt-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {menuItems.map((item, i) => (
            <motion.button
              key={item.en}
              className="group flex flex-col items-center gap-0.5 cursor-pointer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => onSelect?.(item.key)}
            >
              <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-white/50 group-hover:text-white transition-colors duration-300 font-display">
                {item.en}
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest text-white/30 group-hover:text-white/60 transition-colors duration-300 font-jp">
                {item.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default PortfolioMenu;
