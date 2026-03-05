import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ArrowUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import mainBiko01 from "@/assets/main_biko_01.png";
import mainBiko02 from "@/assets/main_biko_02.png";
import mainBiko03 from "@/assets/main_biko_03.png";
import teddyImg from "@/assets/Teddy.png";
import taroCorelImg from "@/assets/TARO_Corel.png";
import taro01Img from "@/assets/TARO_01.png";
import taroEyeImg from "@/assets/Taro_backside_eye.png";
import wallpaper3rdCard from "@/assets/wallpaper_3rd_card.png";
import BikoKuLogo from "@/components/BikoKuLogo";
import { useSoundContext } from "@/contexts/SoundContext";

import MascotSection from "@/components/MascotSection";
import SocialLinks from "@/components/SocialLinks";
import AboutModal from "@/components/AboutModal";
import LoadingScreen from "@/components/LoadingScreen";
import SecretDoorOverlay from "@/components/SecretDoorOverlay";
import PortfolioCard from "@/components/PortfolioCard";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showNav, setShowNav] = useState(true);
  const [activeSection, setActiveSection] = useState<"about" | "contact" | "shop" | null>(null);
  const [bgImage, setBgImage] = useState(mainBiko01);
  const aboutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portfolioRef = useRef<HTMLDivElement | null>(null);
  const [secretDoorOpen, setSecretDoorOpen] = useState(false);
  const [thirdCardFlipped, setThirdCardFlipped] = useState(true);
  const { muted, toggleMute } = useSoundContext();
  const bgOptions = [mainBiko01, mainBiko02, mainBiko03];

  const handleAboutClick = () => {
    if (aboutTimerRef.current) clearTimeout(aboutTimerRef.current);
    setActiveSection("about");
    aboutTimerRef.current = setTimeout(() => {
      setActiveSection((prev) => prev === "about" ? null : prev);
    }, 30000);
  };

  const handleContactClick = () => {
    if (aboutTimerRef.current) clearTimeout(aboutTimerRef.current);
    setActiveSection("contact");
  };

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
      <div className="relative min-h-screen bg-background overflow-hidden">
      {/* === MAIN section === */}
      {/* Hero background illustration */}
      <div className="absolute inset-0 w-full h-screen">
        <img
            src={bgImage}
            alt="BIKO KU manga illustration"
            className="w-full h-full object-cover object-top opacity-60" />
          
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/40" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav bar */}
        <motion.header
            className="flex items-center justify-between px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8"
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
                href={item === "Secret Door" || item === "Shop" ? undefined : `#${item.toLowerCase()}`}
                onClick={item === "Secret Door" ? () => setSecretDoorOpen(true) : item === "Shop" ? () => setActiveSection("shop") : undefined}
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
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex items-center px-4 sm:px-8 md:px-16 relative">
          {/* Left side nav */}
          <AnimatePresence>
            {showNav &&
              <motion.nav
                className="hidden lg:flex flex-col gap-8 mr-auto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}>
                
                {[
                { jp: "アバウト", en: "ABOUT", action: handleAboutClick },
                { jp: "ポートフォリオ", en: "PORTFOLIO", action: () => portfolioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) },
                { jp: "コンタクト", en: "CONTACT", action: handleContactClick }].
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
              
              <p className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work.
                This space is dedicated to sharing visual storytelling and artistic expression across various styles and mediums.
              </p>
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
                <p className="font-display tracking-widest text-foreground/90 mb-2">Cooperation & Commissions</p>
                <p>For collaboration projects or custom commissions, please contact me via email. I'd be happy to discuss any ideas or concepts you have in mind.</p>
                <p className="mt-2 text-foreground/90">spaceheidys@gmail.com</p>
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
                <p>This section is currently under construction. Stay tuned!</p>
              </div>
            </motion.div>
            }
        </AnimatePresence>

        {/* Bottom section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between px-4 sm:px-8 md:px-16 pb-0 gap-4 sm:gap-0">
          <div className="flex items-end">
            <MascotSection />
          </div>
          <div className="pb-4 sm:pb-8">
            <SocialLinks />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 md:px-16 pb-3">
          <div className="border-t-[3px] border-white" />
          <div className="text-center mt-2 text-[10px] sm:text-xs tracking-widest text-foreground/40 font-display">
            © 2026 Spaceheidys. All rights reserved.
          </div>
        </div>
      </div>
    </div>
    {/* === 2nd_dimension === */}
    <div className="w-full h-8 bg-black" />
    {/* White section with image placeholders */}
    <div ref={portfolioRef} className="relative w-full bg-white flex items-center justify-center overflow-hidden" style={{ height: 1080 }}>
      {/* Wallpaper background for 3rd card */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${wallpaper3rdCard})`,
          opacity: thirdCardFlipped ? 0 : 1,
        }}
      />
      {/* Scroll to top arrow */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 cursor-pointer text-black/40 hover:text-black transition-colors duration-300"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        <ArrowUp size={32} />
      </div>
      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Wisdom text above cards 2-4 */}
        <p className="text-black/60 text-sm tracking-[0.2em] uppercase text-center font-light italic">
          "The cards know what the mind has forgotten"
        </p>
        <div className="flex gap-1 items-end">
          {[
            { name: "TARO_01" },
            { name: "Portfolio_2" },
            { name: "Portfolio_3", backImage: taroEyeImg, onFlip: (f: boolean) => setThirdCardFlipped(f) },
            { name: "Portfolio_4" },
            { name: "Portfolio_5" },
          ].map((card) => (
            <PortfolioCard
              key={card.name}
              name={card.name}
              flipAxis="y-center"
              frontImage={taro01Img}
              backImage={card.backImage}
              width={250}
              height={374}
              onFlip={card.onFlip}
            />
          ))}
        </div>
      </div>
    </div>
    <SecretDoorOverlay isOpen={secretDoorOpen} onClose={() => setSecretDoorOpen(false)} />
    </>);

};

export default Index;