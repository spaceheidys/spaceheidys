import { forwardRef, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { createPortal } from "react-dom";
import RotatingCube, { GlitchTitle } from "@/components/RotatingCube";
import LvlupRadio from "@/components/LvlupRadio";
import { useSectionContent } from "@/hooks/useSectionContent";
import { supabase } from "@/integrations/supabase/client";

interface CubeSectionProps {
  footerText?: string;
  backgroundUrl?: string | null;
}

const CubeSection = forwardRef<HTMLDivElement, CubeSectionProps>(({ footerText, backgroundUrl }, ref) => {
  const isVideo = backgroundUrl ? /\.(mp4|webm|mov|ogg)(\?|$)/i.test(backgroundUrl) : false;
  const [visits, setVisits] = useState<number | null>(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [titleTrigger, setTitleTrigger] = useState(0);
  const [showTitle, setShowTitle] = useState(true);
  const [showMessage, setShowMessage] = useState(true);
  const [messageTrigger, setMessageTrigger] = useState(0);
  const [nextOpen, setNextOpen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { get, getDuration } = useSectionContent();
  const nextBg = get("lvlup_bg") || get("cube_next_bg") || backgroundUrl || "";
  const nextBgIsVideo = nextBg ? /\.(mp4|webm|mov|ogg)(\?|$)/i.test(nextBg) : false;
  const titleDurationSeconds = Math.max(0, Math.min(60, getDuration("cube_title_duration") ?? 5));
  const titleVisibleMs = titleDurationSeconds * 1000;
  const titlePersists = titleDurationSeconds === 0;
  const messageDurationSeconds = Math.max(1, Math.min(60, getDuration("cube_message_duration") ?? 5));
  const messageVisibleMs = messageDurationSeconds * 1000;
  const gapDurationSeconds = Math.max(0, Math.min(30, getDuration("cube_gap_duration") ?? 1));
  const gapMs = gapDurationSeconds * 1000;
  const activeMessage = (get(`cube_face_message_${activeIndex}`) ?? "").trim();
  const hasMessage = activeMessage.length > 0;

  useEffect(() => {
    let cancelled = false;
    return () => { cancelled = true; void cancelled; };
  }, []);

  useEffect(() => {
    if (!nextOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [nextOpen]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const already = sessionStorage.getItem("visit_counted") === "1";
      if (already) {
        const { data } = await supabase.from("site_visits").select("count").eq("id", 1).maybeSingle();
        if (!cancelled && data) setVisits(Number(data.count));
      } else {
        const { data, error } = await supabase.rpc("increment_site_visits");
        if (!cancelled) {
          if (!error && data != null) {
            sessionStorage.setItem("visit_counted", "1");
            setVisits(Number(data));
          } else {
            const { data: r } = await supabase.from("site_visits").select("count").eq("id", 1).maybeSingle();
            if (r) setVisits(Number(r.count));
          }
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowTitle(true);
    if (titlePersists) return;
    hideTimerRef.current = setTimeout(() => {
      setShowTitle(false);
    }, titleVisibleMs);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [activeTitle, titleTrigger, titleVisibleMs, titlePersists]);

  // Keep the latest durations in refs so timers can read fresh values
  // without the effect resetting whenever a duration prop changes.
  const messageVisibleMsRef = useRef(messageVisibleMs);
  const gapMsRef = useRef(gapMs);
  const titleVisibleMsRef = useRef(titleVisibleMs);
  const titlePersistsRef = useRef(titlePersists);
  useEffect(() => { messageVisibleMsRef.current = messageVisibleMs; }, [messageVisibleMs]);
  useEffect(() => { gapMsRef.current = gapMs; }, [gapMs]);
  useEffect(() => { titleVisibleMsRef.current = titleVisibleMs; }, [titleVisibleMs]);
  useEffect(() => { titlePersistsRef.current = titlePersists; }, [titlePersists]);

  // Only re-arm the message cycle when the active face changes or the
  // message content itself changes. Title glitch re-triggers and duration
  // updates no longer interrupt the hide timer.
  useEffect(() => {
    if (messageShowTimerRef.current) clearTimeout(messageShowTimerRef.current);
    if (messageHideTimerRef.current) clearTimeout(messageHideTimerRef.current);
    setShowMessage(false);
    if (!hasMessage) return;
    const delay = (titlePersistsRef.current ? 0 : titleVisibleMsRef.current + 700) + gapMsRef.current;
    messageShowTimerRef.current = setTimeout(() => {
      setShowMessage(true);
      setMessageTrigger((k) => k + 1);
      const hideMs = messageVisibleMsRef.current;
      messageHideTimerRef.current = setTimeout(() => setShowMessage(false), hideMs);
    }, delay);
    return () => {
      if (messageShowTimerRef.current) clearTimeout(messageShowTimerRef.current);
      if (messageHideTimerRef.current) clearTimeout(messageHideTimerRef.current);
    };
  }, [hasMessage, activeMessage, activeIndex]);

  const formatted = visits != null ? visits.toLocaleString("en-US") : null;
  return (
    <div ref={ref}>
      {/* divider with visit counter */}
      <div className="w-full h-8 bg-black flex items-center justify-center">
        {formatted && (
          <span className="font-display text-[10px] tracking-[0.3em] text-white/30 tabular-nums select-none">
            {formatted}
          </span>
        )}
      </div>

      <div
        className="relative w-full bg-black flex flex-col items-center justify-center overflow-hidden min-h-[100svh] py-20"
      >
        {backgroundUrl && (
          isVideo ? (
            <video
              src={backgroundUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            <img
              src={backgroundUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )
        )}
        <div className="relative z-10 w-full flex items-center justify-center px-6">
          <RotatingCube
            onActiveTitleChange={(title, index) => {
              setActiveIndex(index);
              if (title !== activeTitle) {
                setActiveTitle(title);
                setTitleTrigger((k) => k + 1);
              }
            }}
          />
        </div>

        {/* Next section arrow */}
        <button
          onClick={() => setNextOpen(true)}
          aria-label="Next section"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white transition-colors"
        >
          <ChevronRight size={32} strokeWidth={1} />
        </button>

        {createPortal(
          <AnimatePresence>
            {nextOpen && (
              <motion.div
                className="fixed inset-0 z-[300] bg-black overflow-hidden"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {nextBg && (
                  nextBgIsVideo ? (
                    <video src={nextBg} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  ) : (
                    <img src={nextBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  )
                )}
                <button
                  onClick={() => setNextOpen(false)}
                  className="absolute left-5 sm:left-8 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors font-display text-[10px] tracking-[0.3em] uppercase"
                >
                  <ArrowLeft size={16} strokeWidth={1} />
                  Back
                </button>
                <LvlupRadio
                  url={get("lvlup_radio_url")}
                  metaUrl={get("lvlup_radio_meta_url")}
                  volume={Number(get("lvlup_radio_volume") || 15)}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* Cube category divider strip — moved from the top of the cube to the bottom */}
      <div className="relative w-full h-8 bg-black overflow-hidden flex items-center justify-center gap-4">
        <div className={`transition-opacity duration-700 flex items-center gap-4 ${showTitle ? "opacity-100" : "opacity-0"}`}>
          <GlitchTitle text="CUBE" triggerKey={0} className="text-sm tracking-[0.4em] uppercase text-white/60 tabular-nums select-none" />
          {activeTitle && (
            <>
              <span className="text-white/20 select-none">·</span>
              <GlitchTitle text={activeTitle.toUpperCase()} triggerKey={titleTrigger} className="text-sm tracking-[0.4em] uppercase text-white/60 tabular-nums select-none" />
            </>
          )}
        </div>
        {hasMessage && (
          <div className={`transition-opacity duration-700 flex items-center gap-4 ${showMessage ? "opacity-100" : "opacity-0"}`}>
            <span className="text-white/20 select-none">·</span>
            <GlitchTitle text={activeMessage.toUpperCase()} triggerKey={messageTrigger} className="text-sm tracking-[0.4em] uppercase text-white/60 tabular-nums select-none" />
          </div>
        )}
      </div>

      {footerText && (
        <div className="w-full bg-black">
          <div className="w-full h-px bg-white/10" />
          <div className="w-full h-12 sm:h-16 items-center justify-center flex flex-row">
            <span className="text-[9px] sm:text-[10px] tracking-widest text-white/40 font-display">
              {footerText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

CubeSection.displayName = "CubeSection";

export default CubeSection;
