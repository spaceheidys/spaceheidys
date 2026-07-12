import { forwardRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SectionVisibility } from "@/hooks/useSectionSettings";

interface MainTextSectionProps {
  activeSection: "about" | "contact" | "shop" | null;
  sectionVisibility: SectionVisibility;
  getContent: (key: string) => string;
  animateReveal?: boolean;
}

const sectionAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.4 },
};

/**
 * Animated reveal frame:
 * 1) small square blinks 3× at center
 * 2) expands horizontally into a 1px-border rectangle (padding 8px vertical,
 *    60px right from side menu, 8px left)
 * 3) fades in child text inside the frame
 *
 * When `enabled` is false, renders children with a plain fade-in and no frame.
 */
const RevealFrame = ({ enabled, revealKey, children }: { enabled: boolean; revealKey: string; children: React.ReactNode }) => {
  if (!enabled) {
    return (
      <motion.div
        key={`plain-${revealKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.9, duration: 0.6 } }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        className="w-full h-full flex items-center justify-center"
      >
        {children}
      </motion.div>
    );
  }

  // Timings (seconds): blink 0.0-0.9 (3 blinks), scaleX 0.9-1.5, text 1.5+
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Blink → expand frame */}
      <motion.div
        key={`frame-${revealKey}`}
        className="absolute border border-foreground/70"
        style={{
          top: 8,
          bottom: 8,
          transformOrigin: "center center",
        }}
        initial={{
          opacity: 0,
          width: 4,
          height: 4,
          left: "50%",
          right: "auto",
          translateX: "-50%",
        }}
        animate={{
          opacity: [0, 1, 0, 1, 0, 1, 1, 1],
          width: ["4px", "4px", "4px", "4px", "4px", "4px", "4px", "calc(100% - 68px)"],
          height: ["4px", "4px", "4px", "4px", "4px", "4px", "4px", "calc(100% - 16px)"],
          left: ["50%", "50%", "50%", "50%", "50%", "50%", "50%", "8px"],
          translateX: ["-50%", "-50%", "-50%", "-50%", "-50%", "-50%", "-50%", "0%"],
          transition: { duration: 1.5, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1], ease: "easeInOut" },
        }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      />
      {/* Text — fades in after frame is drawn */}
      <motion.div
        key={`text-${revealKey}`}
        className="relative w-full h-full flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1.55, duration: 0.5 } }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const MainTextSection = memo(
  forwardRef<HTMLDivElement, MainTextSectionProps>(
    ({ activeSection, sectionVisibility, getContent, animateReveal = true }, ref) => {
      return (
        <div ref={ref} className="relative w-full bg-background h-[320px] sm:h-[380px] md:h-[420px]">
          <AnimatePresence mode="wait">
            {activeSection === "about" && (
              <motion.div key="about" className="absolute inset-0 px-6 sm:px-8 md:px-16" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <RevealFrame enabled={animateReveal} revealKey="about">
                  {sectionVisibility.about !== false && (
                    <p className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4">
                      {getContent("about") || "Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work."}
                    </p>
                  )}
                </RevealFrame>
              </motion.div>
            )}
            {activeSection === "contact" && (
              <motion.div key="contact" className="absolute inset-0 px-6 sm:px-8 md:px-16" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <RevealFrame enabled={animateReveal} revealKey="contact">
                  <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4">
                    {(sectionVisibility as any).contact_title !== false && (
                      <p className="font-display tracking-widest text-foreground/90 mb-2">
                        {getContent("contact_title") || "Cooperation & Commissions"}
                      </p>
                    )}
                    {(sectionVisibility as any).contact_body !== false && (
                      <p>{getContent("contact_body") || "For collaboration projects or custom commissions, please contact me via email."}</p>
                    )}
                    {(sectionVisibility as any).contact_email !== false && (
                      <p className="mt-2 text-foreground/90">{getContent("contact_email") || "spaceheidys@gmail.com"}</p>
                    )}
                  </div>
                </RevealFrame>
              </motion.div>
            )}
            {activeSection === "shop" && (
              <motion.div key="shop" className="absolute inset-0 px-6 sm:px-8 md:px-16" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <RevealFrame enabled={animateReveal} revealKey="shop">
                  <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4">
                    <p className="font-display tracking-widest text-foreground/90 mb-2">✦ Shop ✦</p>
                    <p>This section is currently under construction</p>
                  </div>
                </RevealFrame>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
  )
);

MainTextSection.displayName = "MainTextSection";

export default MainTextSection;
