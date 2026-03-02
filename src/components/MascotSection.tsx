import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MascotSection = () => {
  const [showBubble, setShowBubble] = useState(false);

  return (
    <div className="relative flex items-end gap-4">
      {/* Mascot */}
      <img
        src="/lovable-uploads/9a756186-dec2-4b1a-8cd3-510182fe6192.png"
        alt="BIKO KU mascot"
        className="w-24 sm:w-32 md:w-40 lg:w-48 drop-shadow-2xl relative z-10 cursor-pointer"
        onClick={() => setShowBubble((prev) => !prev)} />
      

      {/* Speech bubble - to the right */}
      <AnimatePresence>
        {showBubble &&
        <motion.div
          className="relative z-10 mb-8 bg-secondary border border-border px-5 py-3 max-w-[220px]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}>
          
            <div className="absolute top-1/2 -left-2 w-4 h-4 bg-secondary border-l border-b border-border rotate-45 -translate-y-1/2" />
            <p className="text-xs text-muted-foreground font-body leading-relaxed relative z-10 text-center">
               Welcome to my creative space ✦
            
          </p>
          </motion.div>}
      </AnimatePresence>
    </div>);

};

export default MascotSection;