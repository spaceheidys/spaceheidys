import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface Props {
  url: string;
  metaUrl?: string;
  volume?: number; // 0-100
}

/** Turn a SomaFM player page URL into a real audio stream URL. */
export function normalizeStreamUrl(raw: string): string {
  const url = (raw || "").trim();
  if (!url) return "";
  const soma = url.match(/somafm\.com\/(?:player\d*\/)?(?:station\/)?([a-z0-9-]+)/i);
  if (soma && !/\.(mp3|aac|pls|m3u8?|ogg)(\?|$)/i.test(url)) {
    return `https://ice1.somafm.com/${soma[1].toLowerCase()}-128-mp3`;
  }
  return url;
}

const LvlupRadio = ({ url, metaUrl, volume = 15 }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState("");
  const [showTrack, setShowTrack] = useState(false);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userPausedRef = useRef(false);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      userPausedRef.current = false;
      audio.play().then(() => setBlocked(false), () => setBlocked(true));
    } else {
      userPausedRef.current = true;
      audio.pause();
    }
  };

  const src = normalizeStreamUrl(url);

  // Create + start audio
  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(100, volume)) / 100;
    audioRef.current = audio;

    let cancelled = false;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    const tryPlay = () => {
      if (userPausedRef.current) return;
      audio.play().then(
        () => { if (!cancelled) setBlocked(false); },
        () => { if (!cancelled) setBlocked(true); }
      );
    };
    tryPlay();

    // If the browser blocked autoplay, resume on the first user gesture.
    const onGesture = () => tryPlay();
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);

    return () => {
      cancelled = true;
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
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

  // Now-playing polling (optional)
  useEffect(() => {
    if (!metaUrl) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch(metaUrl, { cache: "no-store" });
        const text = await res.text();
        let title = "";
        try {
          const json = JSON.parse(text);
          title =
            json?.title ||
            json?.now_playing?.song?.text ||
            json?.songtitle ||
            (Array.isArray(json?.songs) ? `${json.songs[0]?.artist ?? ""} — ${json.songs[0]?.title ?? ""}` : "");
        } catch {
          title = text.trim().slice(0, 120);
        }
        title = (title || "").replace(/^\s*—\s*|\s*—\s*$/g, "").trim();
        if (!cancelled && title && title !== track) {
          setTrack(title);
          setShowTrack(true);
          if (hideRef.current) clearTimeout(hideRef.current);
          hideRef.current = setTimeout(() => setShowTrack(false), 9000);
        }
      } catch { /* ignore */ }
    };
    pull();
    const id = setInterval(pull, 20000);
    return () => { cancelled = true; clearInterval(id); if (hideRef.current) clearTimeout(hideRef.current); };
  }, [metaUrl, track]);

  if (!src) return null;

  return (
    <>
      <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex items-center gap-3">
        <AnimatePresence>
          {showTrack && track && (
            <motion.span
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.8 }}
              className="font-display text-[10px] tracking-[0.25em] uppercase text-white/60 max-w-[50vw] text-right"
            >
              {track}
            </motion.span>
          )}
        </AnimatePresence>

        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause radio" : "Play radio"}
          className="text-white/40 hover:text-white transition-colors"
        >
          {playing ? <Pause size={16} strokeWidth={1} /> : <Play size={16} strokeWidth={1} />}
        </button>

        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute radio" : "Mute radio"}
          className="text-white/40 hover:text-white transition-colors"
        >
          {muted ? <VolumeX size={16} strokeWidth={1} /> : <Volume2 size={16} strokeWidth={1} />}
        </button>
      </div>

      {blocked && (
        <button
          onClick={() => audioRef.current?.play().then(() => setBlocked(false), () => {})}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2 border border-white/20 px-3 py-2 font-display text-[10px] tracking-[0.3em] uppercase text-white/60 hover:text-white transition-colors"
        >
          <Play size={12} strokeWidth={1} /> Radio
        </button>
      )}
    </>
  );
};

export default LvlupRadio;
