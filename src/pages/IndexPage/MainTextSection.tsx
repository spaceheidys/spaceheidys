import { forwardRef, memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SectionVisibility } from "@/hooks/useSectionSettings";
import { useCapabilities } from "@/hooks/useCapabilities";

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

/** Blinking square that jumps between the four frame corners. */
const TravelPixel = () => (
  <motion.div
    className="absolute w-2 h-2 bg-foreground rounded-sm pointer-events-none z-10"
    initial={{ top: "4px", left: "-3.5px", opacity: 0 }}
    animate={{
      top: [
        "4px", "4px", "4px", "4px", "4px",
        "4px", "4px", "4px", "4px", "4px",
        "calc(100% - 12px)", "calc(100% - 12px)", "calc(100% - 12px)", "calc(100% - 12px)", "calc(100% - 12px)",
        "calc(100% - 12px)", "calc(100% - 12px)", "calc(100% - 12px)", "calc(100% - 12px)", "calc(100% - 12px)",
      ],
      left: [
        "-3.5px", "-3.5px", "-3.5px", "-3.5px", "-3.5px",
        "calc(100% - 4.5px)", "calc(100% - 4.5px)", "calc(100% - 4.5px)", "calc(100% - 4.5px)", "calc(100% - 4.5px)",
        "calc(100% - 4.5px)", "calc(100% - 4.5px)", "calc(100% - 4.5px)", "calc(100% - 4.5px)", "calc(100% - 4.5px)",
        "-3.5px", "-3.5px", "-3.5px", "-3.5px", "-3.5px",
      ],
      opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    }}
    transition={{ duration: 3, ease: "linear", times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95] }}
  />
);

/** Minimal vertical scrollbar — 1px solid white track with a small square thumb,
 *  inset equally from the top and bottom of the scroll area. */
const CustomScroll = ({
  children,
  className,
  autoScroll = false,
}: {
  children: React.ReactNode;
  className?: string;
  autoScroll?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [show, setShow] = useState(false);
  const lastHeightRef = useRef(0);

  const update = useCallback(() => {
    const el = ref.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const overflow = el.scrollHeight > Math.ceil(el.clientHeight);
    setShow(overflow);
    const trackH = track.clientHeight;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const ratio = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
    const thumbH = 8;
    const maxThumb = Math.max(0, trackH - thumbH);
    setThumbTop(ratio * maxThumb);

    if (autoScroll && overflow && el.scrollHeight > lastHeightRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    lastHeightRef.current = el.scrollHeight;
  }, [autoScroll]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    lastHeightRef.current = el.scrollHeight;
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      mo.disconnect();
    };
  }, [update]);

  useEffect(() => {
    if (show) update();
  }, [show, update]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = ref.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const trackH = track.clientHeight;
    const thumbH = 8;
    const maxThumb = Math.max(0, trackH - thumbH);
    const maxScroll = el.scrollHeight - el.clientHeight;
    const startY = e.clientY;
    const startScroll = el.scrollTop;

    const onMove = (ev: MouseEvent) => {
      const deltaY = ev.clientY - startY;
      el.scrollTop = Math.max(0, Math.min(maxScroll, startScroll + (deltaY / maxThumb) * maxScroll));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <div className={`relative ${className || ""}`}>
      <div ref={ref} className="h-full max-h-full overflow-y-auto scrollbar-hide">
        {children}
      </div>
      <div ref={trackRef} className="absolute right-0 top-6 bottom-6 w-px bg-foreground/25 pointer-events-none z-10">
        {show && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground cursor-pointer pointer-events-auto"
            style={{ top: thumbTop }}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </div>
  );
};

/** Section text — typewriter body. */
const AboutBody = ({
  getContent,
  typeDelay,
}: {
  getContent: (key: string) => string;
  typeDelay: number;
}) => {
  const { items } = useCapabilities();
  const caps = items.filter((c) => c.is_visible && c.label.trim());

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-stretch gap-6 md:gap-10 px-6 sm:px-10 py-6 overflow-hidden">
      {/* Left — about text */}
      <CustomScroll className="flex-1 min-h-0 max-h-full pr-6 sm:pr-10">
        <div className="min-h-full flex items-start">
          <Typewriter
            delay={typeDelay}
            text={getContent("about") || "Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work."}
            className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed block"
          />
        </div>
      </CustomScroll>

      {/* Right — capabilities */}
      {caps.length > 0 && (
        <div className="flex-1 md:max-w-[46%] min-h-0 max-h-full overflow-y-auto scrollbar-hide">
          <div className="min-h-full flex flex-col justify-start">
            <p className="text-[10px] font-display tracking-[0.25em] uppercase text-foreground/40 mb-2">
              Capabilities
            </p>
            <ul className="flex flex-col">
              {caps.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-baseline gap-3 border-t border-foreground/15 py-2 last:border-b"
                >
                  <span className="text-[10px] font-display tracking-widest text-foreground/35 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-body text-foreground/85">
                    <Typewriter delay={typeDelay + 0.25 + i * 0.25} text={c.label} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

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
    return <AboutBody getContent={getContent} typeDelay={typeDelay} />;
  }
  if (section === "contact") {
    return (
      <CustomScroll className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4 max-h-full">
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
      </CustomScroll>
    );
  }
  return (
    <CustomScroll className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center px-4 max-h-full">
      <p className="font-display tracking-widest text-foreground/90 mb-2">
        <Typewriter delay={typeDelay} text="✦ Shop ✦" />
      </p>
      <p>
        <Typewriter delay={typeDelay + 0.4} text="This section is currently under construction" />
      </p>
    </CustomScroll>
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
      // - switch: text should appear much earlier while the pixel is still
      //   running its corner cycle, so start after a short beat (~0.55s)
      // - no animation: short fade in
      const typeDelay = !animateReveal
        ? 0.5
        : phase === "switch"
        ? 0.55
        : 1.55;

      // Bounds match the equalizer bar (which sits above), inset a bit so the
      // frame is visibly narrower than the equalizer.
      const boundClasses =
        "absolute inset-y-0 left-6 right-6 sm:left-[calc(8rem+2rem)] sm:right-16 md:left-[calc(11rem+2rem)] md:right-24";


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
