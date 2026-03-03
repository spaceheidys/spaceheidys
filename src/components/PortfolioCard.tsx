import { useState } from "react";
import { motion } from "framer-motion";

interface PortfolioCardProps {
  name: string;
  flipAxis?: "x" | "y";
}

const PortfolioCard = ({ name, flipAxis }: PortfolioCardProps) => {
  const [flipped, setFlipped] = useState(false);

  if (!flipAxis) {
    return (
      <div
        className="bg-gray-300 flex items-center justify-center text-gray-500 text-xs"
        style={{ width: 269, height: 521 }}
      >
        {name}
      </div>
    );
  }

  const animateProps = flipAxis === "x"
    ? { rotateX: flipped ? 180 : 0 }
    : { rotateY: flipped ? 180 : 0 };

  const backTransform = flipAxis === "x" ? "rotateX(180deg)" : "rotateY(180deg)";

  return (
    <div
      className="cursor-pointer"
      style={{ width: 269, height: 521, perspective: 1000 }}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={animateProps}
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
          style={{ backfaceVisibility: "hidden", transform: backTransform }}
        >
          {name} — Front
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioCard;
