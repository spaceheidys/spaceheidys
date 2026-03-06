import { motion } from "framer-motion";

const menuItems = [
  { label: "ギャラリー", en: "GALLERY", key: "gallery" },
  { label: "プロジェクト", en: "PROJECTS", key: "projects" },
  { label: "スキル", en: "SKILLS", key: "skills" },
  { label: "アーカイブ", en: "ARCHIVE", key: "archive" },
] as const;

export type PortfolioMenuKey = (typeof menuItems)[number]["key"];

interface PortfolioMenuProps {
  visible: boolean;
  activeKey?: PortfolioMenuKey | null;
  onSelect?: (key: PortfolioMenuKey) => void;
}

const PortfolioMenu = ({ visible, activeKey, onSelect }: PortfolioMenuProps) => {
  if (!visible) return null;

  return (
    <motion.div
      className="flex items-center justify-center gap-6 sm:gap-10 mt-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      {menuItems.map((item, i) => (
        <motion.button
          key={item.en}
          className="group flex flex-col items-center gap-0.5 cursor-pointer"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.08 }}
          onClick={() => onSelect?.(item.key)}
        >
          <span className={`text-[10px] sm:text-xs tracking-[0.2em] uppercase transition-colors duration-300 font-display ${activeKey === item.key ? "text-white" : "text-white/50 group-hover:text-white"}`}>
            {item.en}
          </span>
          <span className={`text-[9px] sm:text-[10px] tracking-widest transition-colors duration-300 font-jp ${activeKey === item.key ? "text-white/80" : "text-white/30 group-hover:text-white/60"}`}>
            {item.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default PortfolioMenu;
