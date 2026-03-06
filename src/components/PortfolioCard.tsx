import { useState } from "react";
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

const PortfolioCard = ({ name, flipAxis, frontImage, backImage, width, height, onFlip }: PortfolioCardProps) => {
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
      className="cursor-pointer overflow-hidden rounded-[12px] sm:rounded-[16px] w-[100px] h-[150px] sm:w-[140px] sm:h-[210px] md:w-[180px] md:h-[270px] lg:w-[220px] lg:h-[330px] xl:w-[250px] xl:h-[374px] landscape:w-[90px] landscape:h-[135px] sm:landscape:w-[120px] sm:landscape:h-[180px] md:landscape:w-[160px] md:landscape:h-[240px] lg:landscape:w-[200px] lg:landscape:h-[300px] xl:landscape:w-[250px] xl:landscape:h-[374px]"
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