import { motion } from "framer-motion";

const galleryItems = [
  { id: 1, label: "Work 01" },
  { id: 2, label: "Work 02" },
  { id: 3, label: "Work 03" },
  { id: 4, label: "Work 04" },
  { id: 5, label: "Work 05" },
  { id: 6, label: "Work 06" },
];

const PortfolioGallery = () => {
  return (
    <motion.div
      className="w-full h-full grid grid-cols-2 gap-2 p-2"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {galleryItems.map((item, i) => (
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
