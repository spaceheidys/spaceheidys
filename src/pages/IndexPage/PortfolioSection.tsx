import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import taro01Img from "@/assets/TARO_01.png";
import taroEyeImg from "@/assets/Taro_backside_eye.png";
import PortfolioCard from "@/components/PortfolioCard";
import PolygonBackground from "@/components/PolygonBackground";
import PortfolioMenu from "@/components/Portfolio_menu/PortfolioMenu";
import type { PortfolioMenuKey } from "@/components/Portfolio_menu/PortfolioMenu";
import PortfolioGallery from "@/components/Portfolio_menu/PortfolioGallery";
import SkillsDisplay from "@/components/Portfolio_menu/SkillsDisplay";

interface PortfolioSectionProps {
  activePortfolioKey: PortfolioMenuKey | null;
  onSelectPortfolio: (key: PortfolioMenuKey | null) => void;
  activeGallerySub: string | null;
  onSelectGallerySub: (sub: string | null) => void;
  thirdCardFlipped: boolean;
  onFlip: (flipped: boolean) => void;
  flipCount: number;
  onFlipCountChange: (count: number) => void;
  showScrollTop: boolean;
  portfolioBg: string | null;
  getContent: (key: string) => string;
  lightboxOpen: boolean;
  onLightboxChange: (open: boolean) => void;
  pageInfo: { current: number; total: number } | null;
  onPageInfo: (info: { current: number; total: number } | null) => void;
  currentFrontText: string;
  onFrontTextChange: (text: string) => void;
  favoritesCount: number;
  footerText: string;
}

const PortfolioSection = forwardRef<HTMLDivElement, PortfolioSectionProps>(
  (
    {
      activePortfolioKey,
      onSelectPortfolio,
      activeGallerySub,
      onSelectGallerySub,
      thirdCardFlipped,
      onFlip,
      flipCount,
      onFlipCountChange,
      showScrollTop,
      portfolioBg,
      getContent,
      lightboxOpen,
      onLightboxChange,
      pageInfo,
      onPageInfo,
      currentFrontText,
      onFrontTextChange,
      favoritesCount,
      footerText,
    },
    ref
  ) => {
    const handleBack = () => {
      onSelectPortfolio(null);
      onSelectGallerySub(null);
      onPageInfo(null);
    };

    const parseFrontImages = () => {
      try {
        const p = JSON.parse(getContent("card_front_images") || "[]");
        if (Array.isArray(p) && p.length > 0)
          return p.map((item: any) => (typeof item === "string" ? { url: item, text: "" } : item));
        return undefined;
      } catch {
        return undefined;
      }
    };

    const parseBackImages = () => {
      try {
        const p = JSON.parse(getContent("card_back_images") || "[]");
        if (Array.isArray(p) && p.length > 0)
          return p.map((item: any) => (typeof item === "string" ? { url: item, weight: 1 } : { url: item.url, weight: Number(item.weight) || 1 }));
        return undefined;
      } catch {
        return undefined;
      }
    };

    const bgOpacity = parseInt(getContent("card_bg_video_opacity") || "40", 10) / 100;

    return (
      <>
        {/* 2nd dimension divider */}
        <div className="w-full h-8 bg-black" />

        {/* Portfolio section */}
        <div ref={ref} className="relative w-full bg-black flex flex-col overflow-hidden min-h-[100svh]">
          {/* Portfolio background image */}
          {portfolioBg && (
            <div className="absolute inset-0">
              <img src={portfolioBg} alt="" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          )}

          {/* Animated polygon background, video, or wallpaper */}
          {getContent("card_bg_type") === "video" && getContent("card_bg_video") ? (
            <video
              src={getContent("card_bg_video")}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: bgOpacity }}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : getContent("card_bg_type") === "wallpaper" && getContent("card_bg_wallpaper") ? (
            <img
              src={getContent("card_bg_wallpaper")}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: bgOpacity }}
            />
          ) : (
            <PolygonBackground triggerKey={flipCount} />
          )}

          {/* Cards content — centered */}
          <div className="flex flex-1 items-center justify-center pt-12 sm:pt-16 md:pt-20 px-3 sm:px-4 relative z-10">
            <div className="items-center justify-center flex flex-col w-full">
              {/* Wisdom text above cards */}
              <AnimatePresence mode="wait">
                {activePortfolioKey ? (
                  <motion.p
                    key={`section-${activePortfolioKey}`}
                    className="text-white/60 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center font-light px-0 my-2 sm:my-[20px] font-display"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {{ gallery: "Gallery", projects: "Projects", skills: "Skills", archive: "Archive" }[activePortfolioKey]}
                    {activePortfolioKey === "gallery" && activeGallerySub ? ` | ${activeGallerySub}` : ""}
                    {pageInfo && pageInfo.total > 1 && (
                      <span className="text-white/30 ml-2 text-[10px] sm:text-xs">
                        {pageInfo.current}/{pageInfo.total}
                      </span>
                    )}
                  </motion.p>
                ) : (
                  <motion.p
                    key="wisdom"
                    className="text-white/60 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center font-light italic px-0 my-[20px]"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentFrontText || getContent("cards_wisdom") || "The cards know what the mind has forgotten"}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="relative flex items-center justify-center">
                {/* Fixed-height card wrapper */}
                <div
                  className={`flex items-center justify-center ${
                    activePortfolioKey
                      ? "w-[88vw] h-[110vw] max-w-[400px] max-h-[530px] sm:w-[320px] sm:h-[400px] md:w-[420px] md:h-[500px] lg:w-[520px] lg:h-[580px] xl:w-[600px] xl:h-[650px] sm:max-w-none sm:max-h-none"
                      : "w-[60vw] h-[90vw] max-w-[300px] max-h-[450px] sm:w-[130px] sm:h-[195px] md:w-[170px] md:h-[255px] lg:w-[220px] lg:h-[330px] xl:w-[250px] xl:h-[374px] sm:max-w-none sm:max-h-none"
                  } transition-all duration-500`}
                >
                  <AnimatePresence mode="wait">
                    {activePortfolioKey === "skills" ? (
                      <motion.div
                        key="skills"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <SkillsDisplay />
                      </motion.div>
                    ) : activePortfolioKey ? (
                      <motion.div
                        key={`${activePortfolioKey}-${activeGallerySub}`}
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <PortfolioGallery
                          sectionKey={activePortfolioKey}
                          gallerySub={activeGallerySub}
                          onPageInfo={onPageInfo}
                          onLightboxChange={onLightboxChange}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="card"
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PortfolioCard
                          name="Card_03"
                          flipAxis="y-center"
                          frontImage={getContent("card_front_image") || taro01Img}
                          frontImages={parseFrontImages()}
                          backImage={getContent("card_back_image") || taroEyeImg}
                          backImages={parseBackImages()}
                          flipSoundUrl={
                            getContent("audio_flipcard_sound_muted") !== "true"
                              ? getContent("audio_flipcard_sound") || undefined
                              : "muted"
                          }
                          flipped={thirdCardFlipped}
                          onFrontTextChange={onFrontTextChange}
                          onFlip={(f: boolean) => {
                            onFlip(f);
                            onFlipCountChange(flipCount + 1);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Menu positioned below card without affecting layout */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 w-max transition-opacity duration-300 ${
                    activePortfolioKey ? "sm:hidden" : ""
                  } ${lightboxOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                >
                  <PortfolioMenu
                    visible={!thirdCardFlipped}
                    activeKey={activePortfolioKey}
                    onSelect={(key) => onSelectPortfolio(key)}
                    onBack={handleBack}
                    onGallerySubSelect={(label) => onSelectGallerySub(label)}
                    favoritesCount={favoritesCount}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spacer — only on mobile to push arrow down */}
          <div className="flex-1 sm:flex-none" />

          {/* Scroll to top arrow */}
          <AnimatePresence>
            {showScrollTop && !activePortfolioKey && (
              <motion.div
                className="fixed bottom-6 right-6 z-30 cursor-pointer text-white/40 hover:text-white transition-colors duration-300"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Scroll to top"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowUp className="w-8 h-8 sm:w-10 sm:h-10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Menu at bottom position when section is active (desktop only) */}
          {activePortfolioKey && (
            <div
              className={`hidden sm:flex relative z-10 items-center justify-center pb-4 transition-opacity duration-300 ${
                lightboxOpen ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <PortfolioMenu
                visible={!thirdCardFlipped}
                activeKey={activePortfolioKey}
                onSelect={(key) => onSelectPortfolio(key)}
                onBack={handleBack}
                onGallerySubSelect={(label) => onSelectGallerySub(label)}
                favoritesCount={favoritesCount}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-full bg-black flex flex-col">
          <div className="w-full h-px bg-white/10" />
          <div className="w-full h-12 sm:h-16 items-center justify-center flex flex-row">
            <span className="text-[9px] sm:text-[10px] tracking-widest text-white/40 font-display">
              {footerText}
            </span>
          </div>
        </div>
      </>
    );
  }
);

PortfolioSection.displayName = "PortfolioSection";

export default PortfolioSection;
