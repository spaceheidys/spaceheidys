import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heroBg from "@/assets/hero-bg.png";
import BikoKuLogo from "@/components/BikoKuLogo";

import MascotSection from "@/components/MascotSection";
import SocialLinks from "@/components/SocialLinks";
import AboutModal from "@/components/AboutModal";

const Index = () => {
  const [showNav, setShowNav] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  return (
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
          className="flex items-center justify-between px-8 md:px-16 py-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="font-jp text-sm tracking-widest text-foreground/70 cursor-pointer hover:text-foreground transition-colors duration-300"
            onClick={() => setShowNav((prev) => !prev)}
          >
            ビコ・ク
          </span>
          <nav className="hidden md:flex items-center gap-12">
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
        <div className="flex-1 flex items-center px-8 md:px-16 relative">
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
                  { jp: "アバウト", en: "ABOUT", action: () => setShowAbout(true) },
                  { jp: "ポートフォリオ", en: "PORTFOLIO" },
                  { jp: "コンタクト", en: "CONTACT" },
                ].map((item, i) => (
                  <motion.a
                    key={item.en}
                    href={item.action ? undefined : `#${item.en.toLowerCase()}`}
                    onClick={item.action}
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

        {/* Bottom section */}
        <div className="flex items-end justify-between px-8 md:px-16 pb-0">
          <div className="flex items-end">
            <MascotSection />
          </div>
          <div className="pb-8">
            <SocialLinks />
          </div>
        </div>
      </div>

      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
};

export default Index;
