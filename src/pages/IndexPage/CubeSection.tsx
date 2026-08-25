import { forwardRef, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, Play, Volume2, VolumeX } from "lucide-react";
import { createPortal } from "react-dom";
import RotatingCube, { GlitchTitle } from "@/components/RotatingCube";
import LvlupRadio, { normalizeStreamUrl } from "@/components/LvlupRadio";
import { useSectionContent } from "@/hooks/useSectionContent";
import { supabase } from "@/integrations/supabase/client";

interface ScreenAudioProps {
  url: string;
  volume: number; // 0-100
}

/** Plays a per-screen music file or radio stream while its overlay is open. */
const ScreenAudio = ({ url, volume }: ScreenAudioProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const src = normalizeStreamUrl(url);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(100, volume)) / 100;
    audioRef.current = audio;

    const tryPlay = () => audio.play().then(() => setBlocked(false), () => setBlocked(true));
    tryPlay();

    // If autoplay is blocked, resume on the first user gesture.
    const onGesture = () => {
      if (audio.paused) tryPlay();
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(100, volume)) / 100;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  if (!src) return null;

  return (
    <>
      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute audio" : "Mute audio"}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white transition-colors"
      >
        {muted ? <VolumeX size={16} strokeWidth={1} /> : <Volume2 size={16} strokeWidth={1} />}
      </button>

      {blocked && (
        <button
          onClick={() => audioRef.current?.play().then(() => setBlocked(false), () => {})}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2 border border-white/20 px-3 py-2 font-display text-[10px] tracking-[0.3em] uppercase text-white/60 hover:text-white transition-colors"
        >
          <Play size={12} strokeWidth={1} /> Play
        </button>
      )}
    </>
  );
};

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
  const [subOpen, setSubOpen] = useState<0 | 1 | 2>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { get, getDuration } = useSectionContent();
  const nextBg = get("lvlup_bg") || get("cube_next_bg") || backgroundUrl || "";
  const nextBgIsVideo = nextBg ? /\.(mp4|webm|mov|ogg)(\?|$)/i.test(nextBg) : false;
  const sub1Bg = get("lvlup_sub1_bg") || "";
  const sub1IsVideo = sub1Bg ? /\.(mp4|webm|mov|ogg)(\?|$)/i.test(sub1Bg) : false;
  const sub2Bg = get("lvlup_sub2_bg") || "";
  const sub2IsVideo = sub2Bg ? /\.(mp4|webm|mov|ogg)(\?|$)/i.test(sub2Bg) : false;
  const radioVolume = Number(get("lvlup_radio_volume") || 15);
  const mainAudioOn = get("lvlup_bg_audio_on") === "1";
  const mainAudioUrl = get("lvlup_bg_audio_url");
  const sub1AudioOn = get("lvlup_sub1_bg_audio_on") === "1";
  const sub1AudioUrl = get("lvlup_sub1_bg_audio_url");
  const sub2AudioOn = get("lvlup_sub2_bg_audio_on") === "1";
  const sub2AudioUrl = get("lvlup_sub2_bg_audio_url");
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
    if (!nextOpen && subOpen === 0) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [nextOpen, subOpen]);

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
                {mainAudioOn && mainAudioUrl ? (
                  <ScreenAudio url={mainAudioUrl} volume={radioVolume} />
                ) : (
                  <LvlupRadio
                    url={get("lvlup_radio_url")}
                    metaUrl={get("lvlup_radio_meta_url")}
                    volume={radioVolume}
                  />
                )}

                {/* Sub-screen arrows — top right and bottom right */}
                <button
                  onClick={() => setSubOpen(1)}
                  aria-label="Open screen 1"
                  className="absolute right-3 sm:right-6 top-6 z-10 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronRight size={32} strokeWidth={1} />
                </button>
                <button
                  onClick={() => setSubOpen(2)}
                  aria-label="Open screen 2"
                  className="absolute right-3 sm:right-6 bottom-6 z-10 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronRight size={32} strokeWidth={1} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Sub-screens — each arrow opens its own full-screen wallpaper */}
        {createPortal(
          <AnimatePresence>
            {subOpen > 0 && (
              <motion.div
                key={subOpen}
                className="fixed inset-0 z-[350] bg-black overflow-hidden"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {(() => {
                  const bg = subOpen === 1 ? sub1Bg : sub2Bg;
                  const isVid = subOpen === 1 ? sub1IsVideo : sub2IsVideo;
                  return bg ? (
                    isVid ? (
                      <video src={bg} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : (
                      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )
                  ) : null;
                })()}
                {(subOpen === 1 ? sub1AudioOn : sub2AudioOn) && (
                  <ScreenAudio
                    url={subOpen === 1 ? sub1AudioUrl : sub2AudioUrl}
                    volume={radioVolume}
                  />
                )}
                <button
                  onClick={() => setSubOpen(0)}
                  className="absolute left-5 sm:left-8 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors font-display text-[10px] tracking-[0.3em] uppercase"
                >
                  <ArrowLeft size={16} strokeWidth={1} />
                  Back
                </button>
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
