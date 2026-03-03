import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heroBg from "@/assets/hero-bg.png";
import teddyImg from "@/assets/Teddy.png";
import BikoKuLogo from "@/components/BikoKuLogo";

import MascotSection from "@/components/MascotSection";
import SocialLinks from "@/components/SocialLinks";
import AboutModal from "@/components/AboutModal";
import LoadingScreen from "@/components/LoadingScreen";

const Index = () => {
  const [showNav, setShowNav] = useState(true);
  const [showAboutText, setShowAboutText] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const aboutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAboutClick = () => {
    // Clear any existing timer
    if (aboutTimerRef.current) clearTimeout(aboutTimerRef.current);
    // Play bell sound
    const bell = new Audio("/audio/bell-sounds.mp3");
    bell.play().catch(() => {});
    // Show text
    setShowAboutText(true);
    // Hide after 1 minute
    aboutTimerRef.current = setTimeout(() => {
      setShowAboutText(false);
    }, 60000);
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

    // Try autoplay first, fall back to first interaction
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

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>
      <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Hero background illustration */}
      <div className="absolute inset-0 w-full h-screen">
        <img
          src={heroBg}
          alt="BIKO KU manga illustration"
          className="w-full h-full object-cover object-top opacity-60"
        />
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
          transition={{ duration: 0.6 }}
        >
          <span
            className="font-jp text-xs sm:text-sm tracking-widest text-foreground/70 cursor-pointer hover:text-foreground transition-colors duration-300"
            onClick={() => setShowNav((prev) => !prev)}
          >
            ビコ・ク
          </span>
          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {["Portfolio", "Contacts", "Social"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 font-display"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex items-center px-4 sm:px-8 md:px-16 relative">
          {/* Left side nav */}
          <AnimatePresence>
            {showNav && (
              <motion.nav
                className="hidden lg:flex flex-col gap-8 mr-auto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                {[
                  { jp: "アバウト", en: "ABOUT", action: handleAboutClick },
                  { jp: "ポートフォリオ", en: "PORTFOLIO" },
                  { jp: "コンタクト", en: "CONTACT" },
                ].map((item, i) => (
                  <motion.a
                    key={item.en}
                    href={item.action ? undefined : `#${item.en.toLowerCase()}`}
                    onClick={() => {
                      const bell = new Audio("/audio/bell-sounds.mp3");
                      bell.play().catch(() => {});
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

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <BikoKuLogo />
            </div>
          </div>
        </div>

        {/* About text - between logo and bottom illustration */}
        <AnimatePresence>
          {showAboutText && (
            <motion.div
              className="flex justify-center px-4 sm:px-8 md:px-16"
              style={{ marginBottom: 30 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work.
                This space is dedicated to sharing visual storytelling and artistic expression across various styles and mediums.
              </p>
            </motion.div>
          )}
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
    </>
  );
};

export default Index;
