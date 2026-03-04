import { useState } from "react";
import { motion } from "framer-motion";

interface PortfolioCardProps {
  name: string;
  flipAxis?: "x" | "y-right" | "y-center";
  frontImage?: string;
  width?: number;
  height?: number;
}

const PortfolioCard = ({ name, flipAxis, frontImage, width = 205, height = 364 }: PortfolioCardProps) => {
  const [flipped, setFlipped] = useState(false);

  if (!flipAxis) {
    return (
      <div
        className="bg-muted flex items-center justify-center text-muted-foreground text-xs"
        style={{ width, height }}>
        
        {name}
      </div>);

  }

  const isY = flipAxis === "y-right" || flipAxis === "y-center";
  const animateProps = isY ?
  { rotateY: flipped ? -180 : 0 } :
  { rotateX: flipped ? 180 : 0 };

  const backTransform = isY ? "rotateY(180deg)" : "rotateX(180deg)";
  const origin = flipAxis === "y-right" ? "right center" : "center center";

  return (
    <div
      className="cursor-pointer"
      style={{ width, height, perspective: 1000 }}
      onClick={() => setFlipped((prev) => !prev)}>
      
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d", transformOrigin: origin }}
        animate={animateProps}
        transition={{ duration: 0.6, ease: "easeInOut" }}>
        
        {/* Front */}
        <div
          className="absolute inset-0 flex items-center justify-center text-xs bg-muted text-muted-foreground"
          style={{ backfaceVisibility: "hidden" }}>
          
          {frontImage ? (
            <img src={frontImage} alt={name} className="w-full h-full object-cover" />
          ) : name}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 bg-accent flex items-center justify-center text-accent-foreground text-xs"
          style={{ backfaceVisibility: "hidden", transform: backTransform }}>
          
          {name} — Front
        </div>
      </motion.div>
    </div>);

};

export default PortfolioCard;