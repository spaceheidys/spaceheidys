import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import lostInTime01 from "@/assets/lost_in_time_01.png";
import lostInTime02 from "@/assets/lost_in_time_02.png";
import lostInTime03 from "@/assets/lost_in_time_03.png";
import { useSoundContext } from "@/contexts/SoundContext";

import LoadingScreen from "@/components/LoadingScreen";
import SecretDoorOverlay from "@/components/SecretDoorOverlay";
import MobileNav from "@/components/MobileNav";
import type { PortfolioMenuKey } from "@/components/Portfolio_menu/PortfolioMenu";
import { useSectionSettings } from "@/hooks/useSectionSettings";
import { useNavButtons } from "@/hooks/useNavButtons";
import { useSectionContent } from "@/hooks/useSectionContent";
import { useFavorites } from "@/hooks/useFavorites";

import HeroSection from "@/pages/IndexPage/HeroSection";
import MainTextSection from "@/pages/IndexPage/MainTextSection";
import PortfolioSection from "@/pages/IndexPage/PortfolioSection";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(() => {
    if (sessionStorage.getItem('loaded')) return false;
    return true;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showNav, setShowNav] = useState(true);
  const [activeSection, setActiveSection] = useState<"about" | "contact" | "shop" | null>(null);
  const defaultBgOptions = [lostInTime01, lostInTime02, lostInTime03];
  const [bgOptions, setBgOptions] = useState<string[]>(defaultBgOptions);
  const [bgImage, setBgImage] = useState(() => defaultBgOptions[Math.floor(Math.random() * defaultBgOptions.length)]);
  const [portfolioBg, setPortfolioBg] = useState<string | null>(null);
  const aboutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainTextRef = useRef<HTMLDivElement | null>(null);
  const portfolioRef = useRef<HTMLDivElement | null>(null);
  const [secretDoorOpen, setSecretDoorOpen] = useState(false);
  const [thirdCardFlipped, setThirdCardFlipped] = useState(true);
  const [flipCount, setFlipCount] = useState(0);
  const [currentFrontText, setCurrentFrontText] = useState("");
  const { muted, toggleMute, setSiteMusicEnabled } = useSoundContext();
  const [activePortfolioKey, setActivePortfolioKey] = useState<PortfolioMenuKey | null>(null);
  const [activeGallerySub, setActiveGallerySub] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<{ current: number; total: number } | null>(null);
  const [isClosingSection, setIsClosingSection] = useState(false);
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { visibility: sectionVisibility } = useSectionSettings();
  const { buttons: navButtons } = useNavButtons();
  const { get: getContent, getDuration, loading: contentLoading } = useSectionContent();
  const { count: favoritesCount } = useFavorites();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const siteMusicEnabled = !contentLoading && getContent("site_music_enabled") !== "false";

  // Sync siteMusicEnabled to context
  useEffect(() => {
    setSiteMusicEnabled(siteMusicEnabled);
  }, [siteMusicEnabled, setSiteMusicEnabled]);

  // Show scroll-to-top arrow only when in portfolio section
  useEffect(() => {
    const handleScroll = () => {
      if (!portfolioRef.current) return;
      const rect = portfolioRef.current.getBoundingClientRect();
      const inPortfolio = rect.top < window.innerHeight * 0.5;
      const notAtTop = window.scrollY > 200;
      setShowScrollTop(inPortfolio && notAtTop);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset card to backside when scrolling back to MAIN section
  useEffect(() => {
    if (!portfolioRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (activePortfolioKey && !isClosingSection) {
            setIsClosingSection(true);
            closingTimeoutRef.current = setTimeout(() => {
              setActivePortfolioKey(null);
              setActiveGallerySub(null);
              setPageInfo(null);
              setIsClosingSection(false);
            }, 300);
          }
          if (!thirdCardFlipped) {
            if (!muted && siteMusicEnabled && getContent("audio_flipcard_sound_muted") !== "true") {
              new Audio(getContent("audio_flipcard_sound") || "/audio/flipcard_sound.mp3").play().catch(() => {});
            }
            setThirdCardFlipped(true);
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(portfolioRef.current);
    return () => {
      observer.disconnect();
      if (closingTimeoutRef.current) clearTimeout(closingTimeoutRef.current);
    };
  }, [thirdCardFlipped, muted, activePortfolioKey, isClosingSection]);

  // Fetch dynamic backgrounds
  useEffect(() => {
    const fetchBgs = async () => {
      const { data } = await supabase.from("page_backgrounds").select("*").order("sort_order");
      if (data && data.length > 0) {
        const mainBgs = data.filter((b: any) => b.section === "main" && b.is_active !== false).map((b: any) => b.image_url);
        const portfolioBgs = data.filter((b: any) => b.section === "portfolio" && b.is_active !== false).map((b: any) => b.image_url);
        if (mainBgs.length > 0) {
          setBgOptions(mainBgs);
          setBgImage(mainBgs[Math.floor(Math.random() * mainBgs.length)]);
        }
        if (portfolioBgs.length > 0) setPortfolioBg(portfolioBgs[0]);
      }
    };
    fetchBgs();
  }, []);

  // Section click handler (about / contact / shop)
  const handleSectionClick = (section: "about" | "contact" | "shop") => {
    if (aboutTimerRef.current) clearTimeout(aboutTimerRef.current);
    setActiveSection(section);
    setTimeout(() => mainTextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    const sectionKeys: Record<string, string[]> = {
      about: ["about"],
      contact: ["contact_title", "contact_body", "contact_email"],
      shop: [],
    };
    const keys = sectionKeys[section] || [];
    const durations = keys.map((k) => getDuration(k));
    const hasAlways = durations.some((d) => d === null);
    if (!hasAlways && durations.length > 0) {
      const maxDuration = Math.max(...durations.filter((d): d is number => d !== null));
      aboutTimerRef.current = setTimeout(() => {
        setActiveSection((prev) => (prev === section ? null : prev));
      }, maxDuration * 1000);
    }
  };

  const handleAboutClick = () => handleSectionClick("about");
  const handleContactClick = () => handleSectionClick("contact");

  // Background music
  useEffect(() => {
    if (contentLoading) return;
    if (!siteMusicEnabled) return;
    if (getContent("audio_main_music_muted") === "true") return;

    const audio = new Audio(getContent("audio_main_music") || "/audio/main_buddhist.mp3");
    audio.loop = false;
    audioRef.current = audio;

    const playAudio = () => {
      audio.play().catch(() => {});
      window.removeEventListener("click", playAudio);
      window.removeEventListener("keydown", playAudio);
      window.removeEventListener("touchstart", playAudio);
    };

    audio.play().catch(() => {
      window.addEventListener("click", playAudio);
      window.addEventListener("keydown", playAudio);
      window.addEventListener("touchstart", playAudio);
    });

    return () => {
      audio.pause();
      window.removeEventListener("click", playAudio);
      window.removeEventListener("keydown", playAudio);
      window.removeEventListener("touchstart", playAudio);
    };
  }, [contentLoading, siteMusicEnabled]);

  // Ctrl+Shift+A shortcut to admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        navigate("/admin");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Mute/unmute background audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <LoadingScreen onComplete={() => { sessionStorage.setItem('loaded', '1'); setLoading(false); }} />
        )}
      </AnimatePresence>

      {/* Fixed header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span
          className="font-jp text-xs sm:text-sm tracking-widest text-foreground/70 cursor-pointer hover:text-foreground transition-colors duration-300"
          onClick={() => setShowNav((prev) => !prev)}
        >
          ビコ・ク
        </span>
        <nav className="hidden md:flex items-center gap-8 lg:gap-12">
          {["Secret Door", "Shop"].map((item, i) => (
            <motion.a
              key={item}
              onClick={item === "Secret Door" ? () => setSecretDoorOpen(true) : () => navigate("/shop")}
              className="text-xs tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 font-display cursor-pointer"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              {item}
            </motion.a>
          ))}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {bgOptions.map((bg, i) => (
              <div
                key={i}
                className={`cursor-pointer transition-all duration-300 ${bgImage === bg ? "opacity-100 rounded-full" : "opacity-50 hover:opacity-80 rounded-none"}`}
                style={{ width: "18.24px", height: "18.24px", backgroundColor: "white" }}
                onClick={() => setBgImage(bg)}
              />
            ))}
            {siteMusicEnabled && (
              <div
                className="cursor-pointer ml-2 text-foreground/60 hover:text-foreground transition-colors duration-300"
                onClick={toggleMute}
                aria-label={muted ? "Unmute sound" : "Mute sound"}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </div>
            )}
          </motion.div>
        </nav>
        <MobileNav
          onSecretDoor={() => setSecretDoorOpen(true)}
          onShop={() => navigate("/shop")}
          navButtons={navButtons}
          actionMap={{
            about: handleAboutClick,
            portfolio: () => portfolioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
            gallery: () => navigate("/gallery"),
            contacts: handleContactClick,
          }}
          bgOptions={bgOptions}
          bgImage={bgImage}
          onBgChange={setBgImage}
          siteMusicEnabled={siteMusicEnabled}
          bellSoundUrl={getContent("audio_bell_sound") || undefined}
          bellSoundMuted={getContent("audio_bell_sound_muted") === "true"}
        />
      </motion.header>

      {/* === MAIN Hero === */}
      <HeroSection bgImage={bgImage} />

      {/* Fixed left side nav */}
      <AnimatePresence>
        {showNav && (
          <motion.nav
            className="hidden md:flex flex-col gap-8 fixed left-4 sm:left-8 md:left-16 z-[100] items-start justify-center"
            style={{ top: "4rem", bottom: 0 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            {(() => {
              const actionMap: Record<string, () => void> = {
                about: handleAboutClick,
                portfolio: () => portfolioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
                gallery: () => navigate("/gallery"),
                contacts: handleContactClick,
              };
              return navButtons
                .filter((b) => b.is_visible)
                .map((b) => ({ jp: b.label_jp, en: b.label, action: actionMap[b.key] }));
            })().map((item, i) => (
              <motion.a
                key={item.en}
                href={item.action ? undefined : `#${item.en.toLowerCase()}`}
                onClick={() => {
                  if (!muted && siteMusicEnabled && getContent("audio_bell_sound_muted") !== "true") {
                    new Audio(getContent("audio_bell_sound") || "/audio/bell-sounds.mp3").play().catch(() => {});
                  }
                  item.action?.();
                }}
                className="group flex flex-col gap-1 text-foreground/60 hover:text-foreground transition-colors duration-300 cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="font-jp text-xs tracking-widest">{item.jp}</span>
                <span className="text-[10px] tracking-[0.3em] font-display">{item.en}</span>
              </motion.a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* === MAIN_TEXT === */}
      <MainTextSection
        ref={mainTextRef}
        activeSection={activeSection}
        sectionVisibility={sectionVisibility}
        getContent={getContent}
      />

      {/* === PORTFOLIO + FOOTER === */}
      <PortfolioSection
        ref={portfolioRef}
        activePortfolioKey={activePortfolioKey}
        onSelectPortfolio={setActivePortfolioKey}
        activeGallerySub={activeGallerySub}
        onSelectGallerySub={setActiveGallerySub}
        thirdCardFlipped={thirdCardFlipped}
        onFlip={setThirdCardFlipped}
        flipCount={flipCount}
        onFlipCountChange={setFlipCount}
        showScrollTop={showScrollTop}
        portfolioBg={portfolioBg}
        getContent={getContent}
        lightboxOpen={lightboxOpen}
        onLightboxChange={setLightboxOpen}
        pageInfo={pageInfo}
        onPageInfo={setPageInfo}
        currentFrontText={currentFrontText}
        onFrontTextChange={setCurrentFrontText}
        favoritesCount={favoritesCount}
        footerText={getContent("footer") || "© 2018 - 2026 Spaceheidys. All rights reserved."}
      />

      <SecretDoorOverlay
        isOpen={secretDoorOpen}
        onClose={() => setSecretDoorOpen(false)}
        secretDoorSoundUrl={
          getContent("audio_secret_door_muted") !== "true"
            ? getContent("audio_secret_door") || undefined
            : "muted"
        }
      />
    </>
  );
};

export default Index;
