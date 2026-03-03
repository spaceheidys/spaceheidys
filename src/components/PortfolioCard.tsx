import { useState } from "react";
import { motion } from "framer-motion";

interface PortfolioCardProps {
  name: string;
  isFlippable: boolean;
}

const PortfolioCard = ({ name, isFlippable }: PortfolioCardProps) => {
  const [flipped, setFlipped] = useState(false);

  if (!isFlippable) {
    return (
      <div
        className="bg-gray-300 flex items-center justify-center text-gray-500 text-xs"
        style={{ width: 269, height: 521 }}
      >
        {name}
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer"
      style={{ width: 269, height: 521, perspective: 1000 }}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateX: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500 text-xs"
          style={{ backfaceVisibility: "hidden" }}
        >
          {name}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 bg-gray-700 flex items-center justify-center text-white text-xs"
          style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
        >
          {name} — Front
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioCard;
