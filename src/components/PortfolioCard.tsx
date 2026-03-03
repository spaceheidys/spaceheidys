import { useState } from "react";
import { motion } from "framer-motion";

interface PortfolioCardProps {
  name: string;
  flipAxis?: "x" | "y-right";
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

  const isYRight = flipAxis === "y-right";
  const animateProps = isYRight
    ? { rotateY: flipped ? -180 : 0 }
    : { rotateX: flipped ? 180 : 0 };

  const backTransform = isYRight ? "rotateY(180deg)" : "rotateX(180deg)";
  const origin = isYRight ? "right center" : "center center";

  return (
    <div
      className="cursor-pointer"
      style={{ width: 269, height: 521, perspective: 1000 }}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d", transformOrigin: origin }}
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
