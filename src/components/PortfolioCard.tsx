import { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { useSoundContext } from "@/contexts/SoundContext";
import taroBackside from "@/assets/Taro_backside.png";

interface PortfolioCardProps {
  name: string;
  flipAxis?: "x" | "y-right" | "y-center";
  frontImage?: string;
  backImage?: string;
  width?: number;
  height?: number;
  onFlip?: (flipped: boolean) => void;
}

const PortfolioCard = forwardRef<HTMLDivElement, PortfolioCardProps>(({ name, flipAxis, frontImage, backImage, width, height, onFlip }, ref) => {
  const [flipped, setFlipped] = useState(true);
  const { muted } = useSoundContext();

  const handleFlip = () => {
    if (!muted) {
      new Audio("/audio/flipcard_sound.mp3").play().catch(() => {});
    }
    setFlipped((prev) => {
      const next = !prev;
      onFlip?.(next);
      return next;
    });
  };

  if (!flipAxis) {
    return (
      <div
        className="bg-muted flex items-center justify-center text-muted-foreground text-xs"
        style={{ width: width ?? 205, height: height ?? 364 }}>
        
        {name}
      </div>);

  }

  const isY = flipAxis === "y-right" || flipAxis === "y-center";
  const animateProps = isY ?
  { rotateY: flipped ? -180 : 0 } :
  { rotateX: flipped ? 180 : 0 };

  const backTransform = isY ? "rotateY(180deg)" : "rotateX(180deg)";
  const origin = flipAxis === "y-right" ? "right center" : "center center";

  const w = width;
  const h = height;

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-[16px] w-[140px] h-[210px] sm:w-[160px] sm:h-[240px] md:w-[200px] md:h-[300px] lg:w-[250px] lg:h-[374px]"
      style={{ ...(w && h ? { width: w, height: h } : {}), perspective: 1000 }}
      onClick={handleFlip}>
      
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
          className="absolute inset-0 flex items-center justify-center"
          style={{ backfaceVisibility: "hidden", transform: backTransform }}>
          
          <img src={backImage || taroBackside} alt={`${name} back`} className="w-full h-full object-cover" />
        </div>
      </motion.div>
    </div>);

};

export default PortfolioCard;