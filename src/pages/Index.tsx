import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ArrowUp } from "lucide-react";
import lostInTime01 from "@/assets/lost_in_time_01.png";
import lostInTime02 from "@/assets/lost_in_time_02.png";
import lostInTime03 from "@/assets/lost_in_time_03.png";
import taro01Img from "@/assets/TARO_01.png";
import taroEyeImg from "@/assets/Taro_backside_eye.png";
import BikoKuLogo from "@/components/BikoKuLogo";
import { useSoundContext } from "@/contexts/SoundContext";

import SocialLinks from "@/components/SocialLinks";
import LoadingScreen from "@/components/LoadingScreen";
import SecretDoorOverlay from "@/components/SecretDoorOverlay";
import PortfolioCard from "@/components/PortfolioCard";
import PolygonBackground from "@/components/PolygonBackground";
import MobileNav from "@/components/MobileNav";
import PortfolioMenu from "@/components/Portfolio_menu/PortfolioMenu";
import type { PortfolioMenuKey } from "@/components/Portfolio_menu/PortfolioMenu";
import PortfolioGallery from "@/components/Portfolio_menu/PortfolioGallery";
import SkillsDisplay from "@/components/Portfolio_menu/SkillsDisplay";
import { useSectionSettings } from "@/hooks/useSectionSettings";
import { useNavButtons } from "@/hooks/useNavButtons";
import { useSectionContent } from "@/hooks/useSectionContent";
import { useFavorites } from "@/hooks/useFavorites";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showNav, setShowNav] = useState(true);
  const [activeSection, setActiveSection] = useState<"about" | "contact" | "shop" | null>(null);
  const defaultBgOptions = [lostInTime01, lostInTime02, lostInTime03];
  const [bgOptions, setBgOptions] = useState<string[]>(defaultBgOptions);
  const [bgImage, setBgImage] = useState(() => {
    return defaultBgOptions[Math.floor(Math.random() * defaultBgOptions.length)];
  });
  const [portfolioBg, setPortfolioBg] = useState<string | null>(null);
  const aboutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portfolioRef = useRef<HTMLDivElement | null>(null);
  const [secretDoorOpen, setSecretDoorOpen] = useState(false);
  const [thirdCardFlipped, setThirdCardFlipped] = useState(true);
  const [flipCount, setFlipCount] = useState(0);
  const { muted, toggleMute } = useSoundContext();
  const [activePortfolioKey, setActivePortfolioKey] = useState<PortfolioMenuKey | null>(null);
  const [activeGallerySub, setActiveGallerySub] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<{current: number;total: number;} | null>(null);
  const [isClosingSection, setIsClosingSection] = useState(false);
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { visibility: sectionVisibility } = useSectionSettings();
  const { buttons: navButtons } = useNavButtons();
  const { get: getContent, getDuration } = useSectionContent();
  const { count: favoritesCount } = useFavorites();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll-to-top arrow only when in portfolio section
  useEffect(() => {
    const handleScroll = () => {
      if (!portfolioRef.current) return;
      const rect = portfolioRef.current.getBoundingClientRect();
      // Show when portfolio section top is above viewport center (user scrolled into it)
      const inPortfolio = rect.top < window.innerHeight * 0.5;
      // Hide when at the very top of the page
      const notAtTop = window.scrollY > 200;
      setShowScrollTop(inPortfolio && notAtTop);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset card to backside when scrolling back to MAIN section
  useEffect(() => {
    if (!portfolioRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When portfolio section leaves viewport (user scrolled back to MAIN)
        if (!entry.isIntersecting) {
          // Smoothly close any active portfolio section
          if (activePortfolioKey && !isClosingSection) {
            setIsClosingSection(true);
            // Wait for exit animation (300ms) before clearing state
            closingTimeoutRef.current = setTimeout(() => {
              setActivePortfolioKey(null);
              setActiveGallerySub(null);
              setPageInfo(null);
              setIsClosingSection(false);
            }, 300);
          }
          // Flip card back if it's currently unflipped
          if (!thirdCardFlipped) {
            if (!muted) {
              new Audio("/audio/flipcard_sound.mp3").play().catch(() => {});
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
      if (closingTimeoutRef.current) {
        clearTimeout(closingTimeoutRef.current);
      }
    };
  }, [thirdCardFlipped, muted, activePortfolioKey, isClosingSection]);

  // Fetch dynamic backgrounds
  useEffect(() => {
    const fetchBgs = async () => {
      const { data } = await supabase
        .from("page_backgrounds")
        .select("*")
        .order("sort_order");
      if (data && data.length > 0) {
        const mainBgs = data.filter((b: any) => b.section === "main" && b.is_active !== false).map((b: any) => b.image_url);
        const portfolioBgs = data.filter((b: any) => b.section === "portfolio" && b.is_active !== false).map((b: any) => b.image_url);
        if (mainBgs.length > 0) {
          setBgOptions(mainBgs);
          setBgImage(mainBgs[Math.floor(Math.random() * mainBgs.length)]);
        }
        if (portfolioBgs.length > 0) {
          setPortfolioBg(portfolioBgs[0]);
        }
      }
    };
    fetchBgs();
  }, []);

  const handleSectionClick = (section: "about" | "contact" | "shop") => {
    if (aboutTimerRef.current) clearTimeout(aboutTimerRef.current);
    setActiveSection(section);
    // Use the max duration among the section's content keys, or the single key's duration
    const sectionKeys: Record<string, string[]> = {
      about: ["about"],
      contact: ["contact_title", "contact_body", "contact_email"],
      shop: [],
    };
    const keys = sectionKeys[section] || [];
    const durations = keys.map((k) => getDuration(k));
    // If any key is null (always), the whole section stays. Otherwise use the max.
    const hasAlways = durations.some((d) => d === null);
    if (!hasAlways && durations.length > 0) {
      const maxDuration = Math.max(...durations.filter((d): d is number => d !== null));
      aboutTimerRef.current = setTimeout(() => {
        setActiveSection((prev) => prev === section ? null : prev);
      }, maxDuration * 1000);
    }
  };

  const handleAboutClick = () => handleSectionClick("about");

  const handleContactClick = () => handleSectionClick("contact");

  useEffect(() => {
    const audio = new Audio("/audio/main_buddhist.mp3");
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
  }, []);

  // Ctrl+Shift+A shortcut to navigate to admin
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

  // Mute/unmute the background audio when muted state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>
      <div className="relative bg-background overflow-hidden rounded-none min-h-[100dvh]">
      {/* === MAIN section === */}
      {/* Hero background illustration */}
      <div className="absolute inset-0 w-full h-[100dvh]">
        <img
            src={bgImage}
            alt="BIKO KU manga illustration"
            className="w-full h-full object-cover object-center opacity-60"
            loading="eager" />
          
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/40" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {/* Top nav bar */}
        <motion.header
            className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            
          <span
              className="font-jp text-xs sm:text-sm tracking-widest text-foreground/70 cursor-pointer hover:text-foreground transition-colors duration-300"
              onClick={() => setShowNav((prev) => !prev)}>
              
            ビコ・ク
          </span>
          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {["Secret Door", "Shop"].map((item, i) =>
              <motion.a
                key={item}
                onClick={item === "Secret Door" ? () => setSecretDoorOpen(true) : () => setActiveSection("shop")}
                className="text-xs tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 font-display cursor-pointer"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}>
                {item}
              </motion.a>
              )}
            <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}>
              {bgOptions.map((bg, i) =>
                <div
                  key={i}
                  className={`cursor-pointer transition-all duration-300 ${bgImage === bg ? "opacity-100 rounded-full" : "opacity-50 hover:opacity-80 rounded-none"}`}
                  style={{ width: "18.24px", height: "18.24px", backgroundColor: "white" }}
                  onClick={() => setBgImage(bg)} />
                )}
              <div
                  className="cursor-pointer ml-2 text-foreground/60 hover:text-foreground transition-colors duration-300"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute sound" : "Mute sound"}>
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </div>
            </motion.div>
          </nav>
          <MobileNav
              onSecretDoor={() => setSecretDoorOpen(true)}
              onShop={() => setActiveSection("shop")}
              navButtons={navButtons}
              actionMap={{
                about: handleAboutClick,
                portfolio: () => portfolioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
                gallery: () => navigate("/gallery"),
                contacts: handleContactClick,
              }}
              bgOptions={bgOptions}
              bgImage={bgImage}
              onBgChange={setBgImage} />
            
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex items-center px-4 sm:px-8 md:px-16 relative">
          {/* Left side nav */}
          <AnimatePresence>
            {showNav &&
              <motion.nav
                className="hidden md:flex flex-col gap-8 mr-auto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}>
                
                {(() => {
                  const actionMap: Record<string, () => void> = {
                    about: handleAboutClick,
                    portfolio: () => portfolioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
                    gallery: () => navigate("/gallery"),
                    contacts: handleContactClick,
                  };
                  return navButtons
                    .filter(b => b.is_visible)
                    .map(b => ({ jp: b.label_jp, en: b.label, action: actionMap[b.key] }));
                })().
                map((item, i) =>
                <motion.a
                  key={item.en}
                  href={item.action ? undefined : `#${item.en.toLowerCase()}`}
                  onClick={() => {
                    if (!muted) {
                      const bell = new Audio("/audio/bell-sounds.mp3");
                      bell.play().catch(() => {});
                    }
                    item.action?.();
                  }}
                  className="group flex flex-col gap-1 text-foreground/60 hover:text-foreground transition-colors duration-300 cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}>
                  
                    <span className="font-jp text-xs tracking-widest">{item.jp}</span>
                    <span className="text-[10px] tracking-[0.3em] font-display">{item.en}</span>
                  </motion.a>
                )}
              </motion.nav>
              }
          </AnimatePresence>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <BikoKuLogo />
            </div>
          </div>
        </div>

        {/* About text - between logo and bottom illustration */}
        <AnimatePresence mode="wait">
          {activeSection === "about" &&
            <motion.div
              key="about"
              className="flex justify-center px-4 sm:px-8 md:px-16"
              style={{ marginBottom: 30 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}>
              
              {sectionVisibility.about !== false && (
                <p className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                  {getContent("about") || "Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work."}
                </p>
              )}
            </motion.div>
            }
          {activeSection === "contact" &&
            <motion.div
              key="contact"
              className="flex justify-center px-4 sm:px-8 md:px-16"
              style={{ marginBottom: 30 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}>
              
              <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                {(sectionVisibility as any).contact_title !== false && (
                  <p className="font-display tracking-widest text-foreground/90 mb-2">{getContent("contact_title") || "Cooperation & Commissions"}</p>
                )}
                {(sectionVisibility as any).contact_body !== false && (
                  <p>{getContent("contact_body") || "For collaboration projects or custom commissions, please contact me via email."}</p>
                )}
                {(sectionVisibility as any).contact_email !== false && (
                  <p className="mt-2 text-foreground/90">{getContent("contact_email") || "spaceheidys@gmail.com"}</p>
                )}
              </div>
            </motion.div>
            }
          {activeSection === "shop" &&
            <motion.div
              key="shop"
              className="flex justify-center px-4 sm:px-8 md:px-16"
              style={{ marginBottom: 30 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}>
              
              <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                <p className="font-display tracking-widest text-foreground/90 mb-2">✦ Shop✦</p>
                <p>This section is currently under construction
                </p>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Bottom section */}
        <div className="mt-auto flex items-center justify-center py-4 sm:py-5 pb-10 sm:pb-12 md:pb-16">
          <SocialLinks />
        </div>


      </div>
    </div>
    {/* === 2nd_dimension === */}
    <div className="w-full h-8 bg-black" />
    {/* White section with image placeholders */}
    <div ref={portfolioRef} className="relative w-full bg-black flex flex-col overflow-hidden min-h-[100dvh]">
      {/* Portfolio background image */}
      {portfolioBg && (
        <div className="absolute inset-0">
          <img src={portfolioBg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      {/* Animated polygon background or video */}
      {getContent("card_bg_type") === "video" && getContent("card_bg_video") ? (
        <video
          src={getContent("card_bg_video")}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: (parseInt(getContent("card_bg_video_opacity") || "40", 10)) / 100 }}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <PolygonBackground triggerKey={flipCount} />
      )}
      

      {/* Cards content — centered */}
      <div className="flex flex-1 items-center justify-center pt-12 sm:pt-16 md:pt-20 px-3 sm:px-4 relative z-10">
        <div className="items-center justify-center flex flex-col w-full">
          {/* Wisdom text above cards */}
          <AnimatePresence mode="wait">
            {activePortfolioKey ?
              <motion.p
                key={`section-${activePortfolioKey}`}
                className="text-white/60 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center font-light px-0 my-[20px] font-display"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}>
                
                {{ gallery: "Gallery", projects: "Projects", skills: "Skills", archive: "Archive" }[activePortfolioKey]}
                {activePortfolioKey === "gallery" && activeGallerySub ? ` | ${activeGallerySub}` : ''}
                {pageInfo && pageInfo.total > 1 &&
                <span className="text-white/30 ml-2 text-[10px] sm:text-xs">{pageInfo.current}/{pageInfo.total}</span>
                }
              </motion.p> :

              <motion.p
                key="wisdom"
                className="text-white/60 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center font-light italic px-0 my-[20px]"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}>
                
                {getContent("cards_wisdom") || "The cards know what the mind has forgotten"}
              </motion.p>
              }
          </AnimatePresence>
          <div className="relative flex items-center justify-center">
            {/* Fixed-height card wrapper */}
            <div className={`flex items-center justify-center w-[60vw] h-[90vw] max-w-[300px] max-h-[450px] ${activePortfolioKey ? 'sm:w-[320px] sm:h-[400px] md:w-[420px] md:h-[500px] lg:w-[520px] lg:h-[580px] xl:w-[600px] xl:h-[650px] sm:max-w-none sm:max-h-none' : 'sm:w-[130px] sm:h-[195px] md:w-[170px] md:h-[255px] lg:w-[220px] lg:h-[330px] xl:w-[250px] xl:h-[374px] sm:max-w-none sm:max-h-none'} transition-all duration-500`}>
              <AnimatePresence mode="wait">
                {activePortfolioKey === "skills" ?
                  <motion.div key="skills" className="w-full h-full" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                    <SkillsDisplay />
                  </motion.div> :
                activePortfolioKey ?
                  <motion.div key={`${activePortfolioKey}-${activeGallerySub}`} className="w-full h-full" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                    <PortfolioGallery sectionKey={activePortfolioKey} gallerySub={activeGallerySub} onPageInfo={setPageInfo} />
                  </motion.div> :

                  <motion.div
                    key="card"
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}>
                    
                    <PortfolioCard
                      name="Card_03"
                      flipAxis="y-center"
                      frontImage={getContent("card_front_image") || taro01Img}
                      backImage={getContent("card_back_image") || taroEyeImg}
                      flipped={thirdCardFlipped}
                      onFlip={(f: boolean) => {setThirdCardFlipped(f);setFlipCount((c) => c + 1);}} />
                  </motion.div>
                  }
              </AnimatePresence>
            </div>
            {/* Menu positioned below card without affecting layout */}
            <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 w-max ${activePortfolioKey ? 'sm:hidden' : ''}`}>
              <PortfolioMenu
                  visible={!thirdCardFlipped}
                  activeKey={activePortfolioKey}
                  onSelect={(key) => setActivePortfolioKey(key)}
                  onBack={() => {setActivePortfolioKey(null);setActiveGallerySub(null);setPageInfo(null);}}
                  onGallerySubSelect={(label) => setActiveGallerySub(label)}
                  favoritesCount={favoritesCount} />
                
            </div>
          </div>
        </div>
      </div>

      {/* Spacer — only on mobile to push arrow down */}
      <div className="flex-1 sm:flex-none" />

      {/* Scroll to top arrow — only visible in portfolio section */}
      <AnimatePresence>
        {showScrollTop && !activePortfolioKey && (
          <motion.div
            className="fixed bottom-6 right-6 z-30 cursor-pointer text-white/40 hover:text-white transition-colors duration-300"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}>
            <ArrowUp className="w-8 h-8 sm:w-10 sm:h-10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu at bottom position when section is active (desktop only) */}
      {activePortfolioKey &&
        <div className="hidden sm:flex relative z-10 items-center justify-center pb-4">
          <PortfolioMenu
            visible={!thirdCardFlipped}
            activeKey={activePortfolioKey}
            onSelect={(key) => setActivePortfolioKey(key)}
            onBack={() => {setActivePortfolioKey(null);setActiveGallerySub(null);setPageInfo(null);}}
            onGallerySubSelect={(label) => setActiveGallerySub(label)}
            favoritesCount={favoritesCount} />
          
        </div>
        }

    </div>
    {/* Footer — outside portfolio block */}
    <div className="w-full bg-black flex flex-col">
      <div className="w-full h-px bg-white/10" />
      <div className="w-full h-12 sm:h-16 items-center justify-center flex flex-row">
        <span className="text-[9px] sm:text-[10px] tracking-widest text-white/40 font-display">{getContent("footer") || "© 2018 - 2026 Spaceheidys. All rights reserved."}</span>
      </div>
    </div>
    <SecretDoorOverlay isOpen={secretDoorOpen} onClose={() => setSecretDoorOpen(false)} />
    </>);

};

export default Index;