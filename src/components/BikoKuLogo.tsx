import { motion } from "framer-motion";
import { useMemo } from "react";
import biko01 from "@/assets/biko_01.svg";
import biko02 from "@/assets/biko_02.svg";
import biko03 from "@/assets/biko_03.svg";

const logos = [biko01, biko02, biko03];

const BikoKuLogo = () => {
  const selectedLogo = useMemo(() => logos[Math.floor(Math.random() * logos.length)], []);

  return (
    <motion.div
      className="flex items-center justify-center select-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
    >
      <img src={selectedLogo} alt="BIKO KU logo" className="h-[420px] w-auto" />
    </motion.div>
  );
};

export default BikoKuLogo;
