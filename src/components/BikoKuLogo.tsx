import { motion } from "framer-motion";

const BikoKuLogo = () => {
  return (
    <motion.div
      className="flex flex-col items-center select-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
    >
      <h1 className="text-[8rem] md:text-[12rem] lg:text-[16rem] font-display font-black leading-none tracking-tighter text-foreground text-glow mix-blend-difference">
        BI
      </h1>
      <h1 className="text-[8rem] md:text-[12rem] lg:text-[16rem] font-display font-black leading-none tracking-tighter text-foreground text-glow mix-blend-difference -mt-8 md:-mt-14 lg:-mt-20">
        KO
      </h1>
    </motion.div>
  );
};

export default BikoKuLogo;
