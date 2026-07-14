import { forwardRef, memo, useEffect, useRef, useState } from "react";
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

/** Pixel dot that travels once around the frame perimeter. */
const TravelPixel = () => (
  <motion.div
    className="absolute w-1 h-1 bg-foreground rounded-[1px] pointer-events-none z-10"
    initial={{ top: "8px", left: "0%" }}
    animate={{
      top: ["8px", "8px", "calc(100% - 8px)", "calc(100% - 8px)", "8px"],
      left: ["0%", "calc(100% - 4px)", "calc(100% - 4px)", "0%", "0%"],
    }}
    transition={{ duration: 0.8, ease: "linear", times: [0, 0.25, 0.5, 0.75, 1] }}
  />
);

/** Section text — typewriter body. */
const SectionBody = ({
  section,
  sectionVisibility,
  getContent,
  typeDelay,
}: {
  section: "about" | "contact" | "shop";
  sectionVisibility: SectionVisibility;
  getContent: (key: string) => string;
  typeDelay: number;
}) => {
  if (section === "about") {
    if (sectionVisibility.about === false) return null;
    return (
      <Typewriter
        delay={typeDelay}
        text={getContent("about") || "Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work."}
        className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4 block"
      />
    );
  }
  if (section === "contact") {
    return (
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
    );
  }
  return (
    <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4">
      <p className="font-display tracking-widest text-foreground/90 mb-2">
        <Typewriter delay={typeDelay} text="✦ Shop ✦" />
      </p>
      <p>
        <Typewriter delay={typeDelay + 0.4} text="This section is currently under construction" />
      </p>
    </div>
  );
};

const MainTextSection = memo(
  forwardRef<HTMLDivElement, MainTextSectionProps>(
    ({ activeSection, sectionVisibility, getContent, animateReveal = true }, ref) => {
      // Track whether we are switching between sections (frame already open)
      // or introducing the frame for the first time.
      const prevSectionRef = useRef<typeof activeSection>(null);
      const [phase, setPhase] = useState<"idle" | "intro" | "switch">("idle");

      useEffect(() => {
        const prev = prevSectionRef.current;
        prevSectionRef.current = activeSection;
        if (!activeSection) setPhase("idle");
        else if (!prev) setPhase("intro");
        else if (prev !== activeSection) setPhase("switch");
      }, [activeSection]);

      // Delay before typewriter starts.
      // - intro: after frame blink+expand (~1.55s)
      // - switch: after the pixel travels around the frame (~0.85s)
      // - no animation: short fade in
      const typeDelay = !animateReveal
        ? 0.5
        : phase === "switch"
        ? 0.9
        : 1.55;

      // Bounds match the equalizer bar (which sits above), inset a bit so the
      // frame is visibly narrower than the equalizer.
      const boundClasses =
        "absolute inset-y-0 left-4 right-4 sm:left-[calc(6rem+2rem)] sm:right-12 md:left-[calc(8rem+2rem)] md:right-20";

      return (
        <div ref={ref} className="relative w-full bg-background h-[320px] sm:h-[380px] md:h-[420px]">
          <div className={boundClasses}>
            {/* Persistent frame — only re-animates on first intro; stays put on section switch */}
            <AnimatePresence>
              {activeSection && animateReveal && (
                <motion.div
                  key="frame"
                  className="absolute border border-foreground/70"
                  style={{ top: 8, bottom: 8, transformOrigin: "center center" }}
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
                    transition: {
                      duration: 1.5,
                      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1],
                      ease: "easeInOut",
                    },
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                />
              )}
            </AnimatePresence>

            {/* Travelling pixel — only on switch between sections */}
            {animateReveal && phase === "switch" && activeSection && (
              <TravelPixel key={`pixel-${activeSection}`} />
            )}

            {/* Text — swaps on section change */}
            <AnimatePresence mode="wait">
              {activeSection && (
                <motion.div
                  key={activeSection}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <SectionBody
                    section={activeSection}
                    sectionVisibility={sectionVisibility}
                    getContent={getContent}
                    typeDelay={typeDelay}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
    }
  )
);

MainTextSection.displayName = "MainTextSection";

export default MainTextSection;
