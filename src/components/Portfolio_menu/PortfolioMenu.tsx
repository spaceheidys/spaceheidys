import { motion } from "framer-motion";

const menuItems = [
  { label: "ギャラリー", en: "GALLERY" },
  { label: "プロジェクト", en: "PROJECTS" },
  { label: "スキル", en: "SKILLS" },
  { label: "アーカイブ", en: "ARCHIVE" },
];

interface PortfolioMenuProps {
  visible: boolean;
}

const PortfolioMenu = ({ visible }: PortfolioMenuProps) => {
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
  );
};

export default PortfolioMenu;
