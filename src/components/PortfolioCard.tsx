import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSoundContext } from "@/contexts/SoundContext";
import taroBackside from "@/assets/Taro_backside.png";

export interface FrontImageItem {
  url: string;
  text?: string;
}

export interface BackImageItem {
  url: string;
  weight?: number;
}

interface PortfolioCardProps {
  name: string;
  flipAxis?: "x" | "y-right" | "y-center";
  frontImage?: string;
  frontImages?: FrontImageItem[];
  backImage?: string;
  backImages?: BackImageItem[];
  width?: number;
  height?: number;
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  onFrontTextChange?: (text: string) => void;
  flipSoundUrl?: string;
}

const PortfolioCard = ({ name, flipAxis, frontImage, frontImages, backImage, backImages, width, height, flipped: controlledFlipped, onFlip, onFrontTextChange, flipSoundUrl }: PortfolioCardProps) => {
  const [internalFlipped, setInternalFlipped] = useState(true);
  const flipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const { muted, siteMusicEnabled } = useSoundContext();
  const frontIndexRef = useRef(0);
  const [currentFrontImage, setCurrentFrontImage] = useState(frontImage);
  const allBackItems = backImages && backImages.length > 0 ? backImages : (backImage ? [{ url: backImage, weight: 1 }] : []);
  const pickWeightedBack = () => {
    if (allBackItems.length === 0) return undefined;
    const weights = allBackItems.map(b => Math.max(0, Number(b.weight) || 0));
    const total = weights.reduce((s, w) => s + w, 0);
    if (total <= 0) return allBackItems[Math.floor(Math.random() * allBackItems.length)].url;
    let r = Math.random() * total;
    for (let i = 0; i < allBackItems.length; i++) {
      r -= weights[i];
      if (r <= 0) return allBackItems[i].url;
    }
    return allBackItems[allBackItems.length - 1].url;
  };
  const [currentBackImage, setCurrentBackImage] = useState<string | undefined>(() => allBackItems[0]?.url);

  // Determine which front image to show
  const allFrontItems = frontImages && frontImages.length > 0 ? frontImages : (frontImage ? [{ url: frontImage }] : []);
  const allFrontUrls = allFrontItems.map(i => i.url);

  const handleFlip = () => {
    if (!muted && siteMusicEnabled && flipSoundUrl !== "muted") {
      new Audio(flipSoundUrl || "/audio/flipcard_sound.mp3").play().catch(() => {});
    }
    const next = !flipped;
    
    // When flipping back to front (next = false means showing front), cycle to next image
    if (!next && allFrontItems.length > 1) {
      frontIndexRef.current = (frontIndexRef.current + 1) % allFrontItems.length;
      setCurrentFrontImage(allFrontItems[frontIndexRef.current].url);
      onFrontTextChange?.(allFrontItems[frontIndexRef.current].text || "");
    }
    // When flipping to back, pick a weighted-random back image
    if (next && allBackItems.length > 1) {
      const picked = pickWeightedBack();
      if (picked) setCurrentBackImage(picked);
    }
    
    setInternalFlipped(next);
    onFlip?.(next);
  };

  // Use cycled image or fallback
  const displayFrontImage = allFrontUrls.length > 1 
    ? (currentFrontImage || allFrontUrls[0])
    : frontImage;
  const displayBackImage = allBackItems.length > 1
    ? (currentBackImage || allBackItems[0].url)
    : backImage;

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
          
          <img src={displayBackImage || taroBackside} alt={`${name} back`} className="w-full h-full object-cover" />
        </div>
      </motion.div>
    </div>);

};

export default PortfolioCard;