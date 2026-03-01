import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot.png";

const floatingCards = [
{ rotate: -15, x: -30, y: -60, icon: "♥" },
{ rotate: 12, x: 40, y: -80, icon: "✦" },
{ rotate: -8, x: 60, y: -20, icon: "▲" }];


const MascotSection = () => {
  return (
    <div className="relative">
      {/* Floating cards */}
      {floatingCards.map((card, i) =>
      <motion.div
        key={i}
        className="floating-card absolute w-10 h-12 flex items-center justify-center text-foreground/60 text-sm"
        style={{ left: `${50 + card.x}px`, top: `${100 + card.y}px` }}
        initial={{ opacity: 0, y: 20, rotate: 0 }}
        animate={{
          opacity: 1,
          y: [0, -8, 0],
          rotate: card.rotate
        }}
        transition={{
          delay: 1.2 + i * 0.2,
          duration: 3,
          y: { repeat: Infinity, duration: 2 + i * 0.5 }
        }}>

          {card.icon}
        </motion.div>
      )}

      {/* Mascot */}
      <motion.img

        alt="BIKO KU mascot"
        className="w-32 md:w-40 lg:w-48 drop-shadow-2xl relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }} src="/lovable-uploads/9a756186-dec2-4b1a-8cd3-510182fe6192.png" />


      {/* Speech bubble */}
      <motion.div
        className="relative z-10 mt-2 bg-secondary border border-border px-5 py-3 max-w-[220px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}>

        {/* Bubble tail */}
        <div className="absolute -top-2 left-6 w-4 h-4 bg-secondary border-l border-t border-border rotate-45" />
        <p className="text-xs text-muted-foreground font-body leading-relaxed relative z-10">
          Welcome to my creative space ✦
        </p>
      </motion.div>
    </div>);

};

export default MascotSection;