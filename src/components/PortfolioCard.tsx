import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSoundContext } from "@/contexts/SoundContext";
import taroBackside from "@/assets/Taro_backside.png";

interface PortfolioCardProps {
  name: string;
  flipAxis?: "x" | "y-right" | "y-center";
  frontImage?: string;
  frontImages?: string[];
  backImage?: string;
  width?: number;
  height?: number;
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  flipSoundUrl?: string;
}

const PortfolioCard = ({ name, flipAxis, frontImage, frontImages, backImage, width, height, flipped: controlledFlipped, onFlip, flipSoundUrl }: PortfolioCardProps) => {
  const [internalFlipped, setInternalFlipped] = useState(true);
  const flipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const { muted, siteMusicEnabled } = useSoundContext();
  const frontIndexRef = useRef(0);
  const [currentFrontImage, setCurrentFrontImage] = useState(frontImage);

  // Determine which front image to show
  const allFrontImages = frontImages && frontImages.length > 0 ? frontImages : (frontImage ? [frontImage] : []);

  const handleFlip = () => {
    if (!muted && siteMusicEnabled) {
      new Audio(flipSoundUrl || "/audio/flipcard_sound.mp3").play().catch(() => {});
    }
    const next = !flipped;
    
    // When flipping back to front (next = false means showing front), cycle to next image
    if (!next && allFrontImages.length > 1) {
      frontIndexRef.current = (frontIndexRef.current + 1) % allFrontImages.length;
      setCurrentFrontImage(allFrontImages[frontIndexRef.current]);
    }
    
    setInternalFlipped(next);
    onFlip?.(next);
  };

  // Use cycled image or fallback
  const displayFrontImage = allFrontImages.length > 1 
    ? (currentFrontImage || allFrontImages[0])
    : frontImage;

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
      className="cursor-pointer overflow-hidden rounded-[12px] sm:rounded-[16px] w-full h-full"
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
          
          {displayFrontImage ? (
            <img src={displayFrontImage} alt={name} className="w-full h-full object-cover" />
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