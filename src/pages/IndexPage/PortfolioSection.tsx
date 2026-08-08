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
import MusicEqualizer from "@/components/MusicEqualizer";
import { useGallerySubs } from "@/hooks/useGallerySubs";

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
  activeWallpaper?: string;
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
      activeWallpaper,
    },
    ref
  ) => {
    const { subs: gallerySubs } = useGallerySubs();
    const handleBack = () => {
      onSelectPortfolio(null);
      onSelectGallerySub(null);
      onPageInfo(null);
    };

    const parseFrontImages = () => {
      try {
        const p = JSON.parse(getContent("card_front_images") || "[]");
        if (Array.isArray(p) && p.length > 0)
          return p
            .map((item: any) => (typeof item === "string" ? { url: item, text: "" } : item))
            .filter((item: any) => !item?.hidden);
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
        <div className="relative w-full h-8 bg-black overflow-hidden">
          <div className="absolute inset-y-0 left-4 right-4 sm:left-[calc(6rem+1rem)] sm:right-8 md:left-[calc(8rem+1rem)] md:right-16 pointer-events-none flex items-center justify-center">
            <MusicEqualizer height={28} color="hsl(0 0% 100%)" />
          </div>
        </div>

        {/* Portfolio section */}
        <div id="portfolio-section" ref={ref} className="relative w-full bg-black flex flex-col overflow-hidden min-h-[100svh]">
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
          ) : getContent("card_bg_type") === "wallpaper" && activeWallpaper ? (
            <AnimatePresence mode="sync">
              <motion.img
                key={activeWallpaper}
                src={activeWallpaper}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: bgOpacity }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </AnimatePresence>
          ) : (
            <PolygonBackground triggerKey={flipCount} />
          )}

          {/* Cards content — centered when closed, anchored to the bottom when a section is open */}
          <div
            className={`flex flex-1 items-center ${
              activePortfolioKey ? "justify-end" : "justify-center"
            } pt-4 sm:pt-8 md:pt-12 pb-2 sm:pb-3 px-3 sm:px-4 relative z-10`}
          >
            <div className="items-center justify-center flex flex-col w-full">

              <div className="relative flex items-center justify-center">
                {/* Fixed-height card wrapper */}
                <div
                  className={`flex items-center justify-center ${
                    activePortfolioKey
                      ? "w-[95vw] h-[135vw] max-w-[520px] max-h-[690px] sm:w-[448px] sm:h-[560px] md:w-[588px] md:h-[700px] lg:w-[728px] lg:h-[812px] xl:w-[840px] xl:h-[910px] sm:max-w-none sm:max-h-none"
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

                {/* Menu positioned below card without affecting layout (only when no active section) */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 w-max transition-opacity duration-300 ${
                    "hidden"
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

          {/* Spacer — only on mobile when the card is closed to push the bottom strip down */}
          <div className={activePortfolioKey ? "flex-none" : "flex-1 sm:flex-none"} />

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
        </div>

        {/* Segmented section bar — always fixed; shows wisdom text when card is closed, menu items when open */}
        <div
          id="portfolio-nav-bar"
          className="w-full bg-black border-t border-white/10 h-14 flex items-center justify-center overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {thirdCardFlipped && !activePortfolioKey ? (
              <motion.p
                key="wisdom"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                className="text-white/60 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center font-light italic px-4"
              >
                {currentFrontText || getContent("cards_wisdom") || "The cards know what the mind has forgotten"}
              </motion.p>
            ) : (
              <motion.div
                key="portfolio-nav-bar-items"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {(() => {
                  type BarItem = {
                    id: string;
                    num: string;
                    label: string;
                    jp: string;
                    active: boolean;
                    onClick: () => void;
                  };
                  let items: BarItem[];

                  if (activePortfolioKey === "gallery") {
                    items = [
                      ...gallerySubs.map((s) => ({
                        id: s.en,
                        num: "",
                        label: s.en,
                        jp: s.jp,
                        active: activeGallerySub === s.en,
                        onClick: () => {
                          onSelectGallerySub(s.en);
                        },
                      })),
                      {
                        id: "return",
                        num: "",
                        label: "RETURN",
                        jp: "戻る",
                        active: false,
                        onClick: handleBack,
                      },
                    ];
                  } else if (activePortfolioKey) {
                    items = [
                      {
                        id: "return",
                        num: "",
                        label: "RETURN",
                        jp: "戻る",
                        active: false,
                        onClick: handleBack,
                      },
                    ];
                  } else {
                    items = [
                      { key: "skills" as PortfolioMenuKey, num: "", label: "SKILLS", jp: "スキル" },
                      { key: "gallery" as PortfolioMenuKey, num: "", label: "GALLERY", jp: "ギャラリー" },
                      { key: "projects" as PortfolioMenuKey, num: "", label: "PROJECTS", jp: "プロジェクト" },
                    ].map((item) => ({
                      id: item.key,
                      num: item.num,
                      label: item.label,
                      jp: item.jp,
                      active: false,
                      onClick: () => {
                        onSelectPortfolio(item.key);
                      },
                    }));
                  }

                  return (
                    <div className="px-4 sm:px-8 md:px-12 lg:px-16">
                      <div className="flex flex-nowrap items-center justify-center gap-6 sm:gap-8 md:gap-10 py-3 sm:py-4 overflow-x-auto scrollbar-hide">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`group flex flex-col items-center gap-1 cursor-pointer transition-colors duration-300 ${
                              item.active ? "text-[hsl(72,95%,60%)]" : "text-white/50 hover:text-white"
                            }`}
                          >
                            <span className="text-[9px] sm:text-[10px] tracking-widest font-jp">
                              {item.jp}
                            </span>
                            <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-display">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </>
    );
  }
);

PortfolioSection.displayName = "PortfolioSection";

export default PortfolioSection;
