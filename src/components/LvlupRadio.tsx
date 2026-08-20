import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface LvlupRadioProps {
  streamUrl: string;
  metaUrl?: string;
  volume?: number; // 0..1
}

function extractTitle(payload: unknown): string {
  const seen = new Set<unknown>();
  const keys = ["now_playing", "nowplaying", "song", "title", "artist", "streamTitle", "track"];
  const walk = (node: any, depth: number): string => {
    if (!node || depth > 4) return "";
    if (typeof node === "string") return node.trim();
    if (typeof node !== "object" || seen.has(node)) return "";
    seen.add(node);
    for (const k of keys) {
      const v = node[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (v && typeof v === "object") {
        const artist = typeof v.artist === "string" ? v.artist.trim() : "";
        const title = typeof v.title === "string" ? v.title.trim() : "";
        if (artist || title) return [artist, title].filter(Boolean).join(" — ");
        const nested = walk(v, depth + 1);
        if (nested) return nested;
      }
    }
    for (const v of Object.values(node)) {
      const nested = walk(v, depth + 1);
      if (nested) return nested;
    }
    return "";
  };
  return walk(payload, 0);
}

const LvlupRadio = ({ streamUrl, metaUrl, volume = 0.25 }: LvlupRadioProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState("");
  const [visible, setVisible] = useState(false);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!streamUrl) return;
    const audio = new Audio(streamUrl);
    audio.crossOrigin = "anonymous";
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [streamUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  useEffect(() => {
    if (!metaUrl) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(metaUrl, { cache: "no-store" });
        const text = await res.text();
        let title = "";
        try {
          title = extractTitle(JSON.parse(text));
        } catch {
          title = text.trim().slice(0, 120);
        }
        if (!cancelled && title) setTrack((prev) => (prev === title ? prev : title));
      } catch {
        /* ignore (CORS / offline) */
      }
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [metaUrl]);

  useEffect(() => {
    if (!track) return;
    setVisible(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setVisible(false), 9000);
    return () => { if (hideRef.current) clearTimeout(hideRef.current); };
  }, [track]);

  if (!streamUrl) return null;

  return (
    <AnimatePresence>
      {visible && track && (
        <motion.div
          key={track}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 z-20 max-w-[45vw] text-right"
        >
          <span className="font-display text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/60 select-none">
            {track}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LvlupRadio;
