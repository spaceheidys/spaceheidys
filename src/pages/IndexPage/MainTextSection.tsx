import { forwardRef, memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SectionVisibility } from "@/hooks/useSectionSettings";

interface MainTextSectionProps {
  activeSection: "about" | "contact" | "shop" | null;
  sectionVisibility: SectionVisibility;
  getContent: (key: string) => string;
  animateReveal?: boolean;
}

/** Typewriter — reveals `text` character-by-character after `delay` seconds. */
const Typewriter = ({
  text,
  delay = 0,
  speed = 22,
  className,
}: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let iv: ReturnType<typeof setInterval> | null = null;
    const t = setTimeout(() => {
      iv = setInterval(() => {
        setN((prev) => {
          if (prev >= text.length) {
            if (iv) clearInterval(iv);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }, delay * 1000);
    return () => {
      clearTimeout(t);
      if (iv) clearInterval(iv);
    };
  }, [text, delay, speed]);
  return <span className={className} style={{ whiteSpace: "pre-line" }}>{text.slice(0, n)}</span>;
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
const RevealFrame = ({
  enabled,
  revealKey,
  children,
  textDelay = 0,
}: {
  enabled: boolean;
  revealKey: string;
  children: React.ReactNode;
  /** Delay before children appear (seconds). When enabled, matches end of frame animation. */
  textDelay?: number;
}) => {
  if (!enabled) {
    return (
      <motion.div
        key={`plain-${revealKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: textDelay || 0.9, duration: 0.6 } }}
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
          width: ["4px", "4px", "4px", "4px", "4px", "4px", "4px", "100%"],
          height: ["4px", "4px", "4px", "4px", "4px", "4px", "4px", "calc(100% - 16px)"],
          left: ["50%", "50%", "50%", "50%", "50%", "50%", "50%", "0px"],
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
        animate={{ opacity: 1, transition: { delay: 1.55, duration: 0.3 } }}
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
      // Type-in starts once frame is drawn (~1.55s) if animation enabled; else ~0.9s.
      const typeDelay = animateReveal ? 1.55 : 0.9;
      // Bounds match the equalizer bar (which sits above), inset a bit so the
      // frame is visibly narrower than the equalizer.
      const boundClasses =
        "absolute inset-y-0 left-[calc(4rem+2rem)] right-8 sm:left-[calc(6rem+2rem)] sm:right-12 md:left-[calc(8rem+2rem)] md:right-20";
      return (
        <div ref={ref} className="relative w-full bg-background h-[320px] sm:h-[380px] md:h-[420px]">
          <AnimatePresence mode="wait">
            {activeSection === "about" && (
              <motion.div key="about" className={boundClasses} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <RevealFrame enabled={animateReveal} revealKey="about">
                  {sectionVisibility.about !== false && (
                    <Typewriter
                      delay={typeDelay}
                      text={getContent("about") || "Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work."}
                      className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4 block"
                    />
                  )}
                </RevealFrame>
              </motion.div>
            )}
            {activeSection === "contact" && (
              <motion.div key="contact" className={boundClasses} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <RevealFrame enabled={animateReveal} revealKey="contact">
                  <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4">
                    {(sectionVisibility as any).contact_title !== false && (
                      <p className="font-display tracking-widest text-foreground/90 mb-2">
                        <Typewriter delay={typeDelay} text={getContent("contact_title") || "Cooperation & Commissions"} />
                      </p>
                    )}
                    {(sectionVisibility as any).contact_body !== false && (
                      <p>
                        <Typewriter delay={typeDelay + 0.6} text={getContent("contact_body") || "For collaboration projects or custom commissions, please contact me via email."} />
                      </p>
                    )}
                    {(sectionVisibility as any).contact_email !== false && (
                      <p className="mt-2 text-foreground/90">
                        <Typewriter delay={typeDelay + 1.4} text={getContent("contact_email") || "spaceheidys@gmail.com"} />
                      </p>
                    )}
                  </div>
                </RevealFrame>
              </motion.div>
            )}
            {activeSection === "shop" && (
              <motion.div key="shop" className={boundClasses} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <RevealFrame enabled={animateReveal} revealKey="shop">
                  <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4">
                    <p className="font-display tracking-widest text-foreground/90 mb-2">
                      <Typewriter delay={typeDelay} text="✦ Shop ✦" />
                    </p>
                    <p>
                      <Typewriter delay={typeDelay + 0.4} text="This section is currently under construction" />
                    </p>
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
