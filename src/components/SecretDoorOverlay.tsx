import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSecretDoorSettings, verifySecretCode } from "@/hooks/useSecretDoorSettings";

interface SecretDoorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  secretDoorSoundUrl?: string;
}

const SecretDoorOverlay = ({ isOpen, onClose, secretDoorSoundUrl }: SecretDoorOverlayProps) => {
  const { settings } = useSecretDoorSettings();
  const [code, setCode] = useState("");
  const [progress, setProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [denied, setDenied] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cyberpunkAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);

  const findMainAudio = () => {
    const allAudio = document.querySelectorAll("audio");
    for (const audio of allAudio) {
      if (audio.src.includes("main_buddhist")) return audio;
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      const duration = settings.timer_seconds;
      setCode("");
      setProgress(0);
      setSecondsLeft(duration);
      setDenied(false);
      setTimeout(() => inputRef.current?.focus(), 100);

      // Fade out main music
      const mainAudio = findMainAudio();
      if (!mainAudio) {
        const audios = document.getElementsByTagName("audio");
        for (let i = 0; i < audios.length; i++) {
          if (!audios[i].paused) { mainAudioRef.current = audios[i]; break; }
        }
      } else {
        mainAudioRef.current = mainAudio;
      }

      if (mainAudioRef.current) {
        const audio = mainAudioRef.current;
        const fadeOut = setInterval(() => {
          if (audio.volume > 0.05) {
            audio.volume = Math.max(0, audio.volume - 0.05);
          } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(fadeOut);
          }
        }, 50);
      }

      if (settings.music_enabled && secretDoorSoundUrl !== "muted") {
        const cyberpunkAudio = new Audio(secretDoorSoundUrl || "/audio/Cyberpunk_secret_door.mp3");
        cyberpunkAudio.loop = true;
        cyberpunkAudio.play().catch(() => {});
        cyberpunkAudioRef.current = cyberpunkAudio;
      }

      let currentSeconds = duration;
      progressIntervalRef.current = setInterval(() => {
        currentSeconds -= 1;
        setSecondsLeft(currentSeconds);
        setProgress(((duration - currentSeconds) / duration) * 100);
        if (currentSeconds <= 0) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          // Fade out audio
          if (cyberpunkAudioRef.current) {
            const audio = cyberpunkAudioRef.current;
            const fadeAudio = setInterval(() => {
              if (audio.volume > 0.05) {
                audio.volume = Math.max(0, audio.volume - 0.05);
              } else {
                audio.volume = 0;
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fadeAudio);
              }
            }, 80);
          }
          // Trigger fade-out animation, then close after 1.5s
          setClosing(true);
          setTimeout(() => {
            setClosing(false);
            onClose();
          }, 1500);
        }
      }, 1000);
    }

    return () => {
      if (cyberpunkAudioRef.current) { cyberpunkAudioRef.current.pause(); cyberpunkAudioRef.current.currentTime = 0; }
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, onClose, settings.timer_seconds]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    setDenied(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && code.length > 0) {
      const valid = await verifySecretCode(code);
      if (valid) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (cyberpunkAudioRef.current) cyberpunkAudioRef.current.pause();
        setTimeout(() => { onClose(); window.location.href = "/secret"; }, 300);
      } else {
        setDenied(true);
        setCode("");
      }
    }
  };

  const handleClose = () => {
    if (cyberpunkAudioRef.current) { cyberpunkAudioRef.current.pause(); cyberpunkAudioRef.current.currentTime = 0; }
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (mainAudioRef.current) { mainAudioRef.current.volume = 1; mainAudioRef.current.play().catch(() => {}); }
    onClose();
  };

  if (!isOpen) return null;

  const totalDuration = settings.timer_seconds;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: closing ? 1.5 : 0.3, ease: "easeInOut" }}
      onClick={handleClose}
    >
      {settings.background_url ? (
        <>
          <div className="absolute inset-0">
            <img src={settings.background_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/70" />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/90" />
      )}

      {/* Corner squares */}
      <motion.div className={`absolute bottom-4 left-4 w-2.5 h-2.5 ${secondsLeft <= 10 ? 'bg-red-500' : 'bg-white/80'}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, rotate: secondsLeft <= 10 ? 360 : 0 }} transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 }, rotate: secondsLeft <= 10 ? { duration: 1, repeat: Infinity, ease: "linear" } : {} }} />
      {secondsLeft <= totalDuration - 15 && (
        <motion.div className={`absolute top-4 left-4 w-2.5 h-2.5 ${secondsLeft <= 10 ? 'bg-red-500' : 'bg-white/80'}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, rotate: secondsLeft <= 10 ? 360 : 0 }} transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 }, rotate: secondsLeft <= 10 ? { duration: 1, repeat: Infinity, ease: "linear" } : {} }} />
      )}
      {secondsLeft <= totalDuration - 30 && (
        <motion.div className={`absolute top-4 right-4 w-2.5 h-2.5 ${secondsLeft <= 10 ? 'bg-red-500' : 'bg-white/80'}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, rotate: secondsLeft <= 10 ? 360 : 0 }} transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 }, rotate: secondsLeft <= 10 ? { duration: 1, repeat: Infinity, ease: "linear" } : {} }} />
      )}
      {secondsLeft <= totalDuration - 45 && (
        <motion.div className={`absolute bottom-4 right-4 w-2.5 h-2.5 ${secondsLeft <= 10 ? 'bg-red-500' : 'bg-white/80'}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, rotate: secondsLeft <= 10 ? 360 : 0 }} transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 }, rotate: secondsLeft <= 10 ? { duration: 1, repeat: Infinity, ease: "linear" } : {} }} />
      )}

      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="password"
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="bg-black border-2 border-white text-white text-center text-sm tracking-[0.3em] font-display outline-none placeholder:text-white/30"
          style={{ width: "240px", height: "56px" }}
          placeholder="ENTER CODE"
        />
        {denied && (
          <motion.p className="text-red-500 text-xs tracking-[0.2em] font-display" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            ACCESS IS DENIED
          </motion.p>
        )}
        <div className="w-[240px] h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-white/60 rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
        <motion.span
          className="text-xs tracking-[0.5em] font-display font-bold"
          style={{
            color: secondsLeft <= 10 ? "rgba(255,60,60,0.9)" : "rgba(255,255,255,0.5)",
            textShadow: secondsLeft <= 10
              ? "0 0 8px rgba(255,60,60,0.6), 0 0 20px rgba(255,60,60,0.3)"
              : "0 0 6px rgba(255,255,255,0.15), 0 0 15px rgba(0,255,255,0.1)",
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.05, 1],
            x: secondsLeft <= 10 ? [0, -1, 2, -2, 1, 0] : 0,
          }}
          transition={{
            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            x: secondsLeft <= 10 ? { duration: 0.3, repeat: Infinity, repeatDelay: 1 } : {},
          }}
        >
          {String(secondsLeft).padStart(2, "0")}
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default SecretDoorOverlay;
