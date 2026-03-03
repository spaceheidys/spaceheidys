import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const SECRET_CODE = "Letmein";

interface SecretDoorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecretDoorOverlay = ({ isOpen, onClose }: SecretDoorOverlayProps) => {
  const [code, setCode] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const cyberpunkAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);

  // Find and store reference to the main background audio
  const findMainAudio = () => {
    const allAudio = document.querySelectorAll("audio");
    for (const audio of allAudio) {
      if (audio.src.includes("main_buddhist")) {
        return audio;
      }
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setProgress(0);
      setTimeout(() => inputRef.current?.focus(), 100);

      // Fade out main music
      const mainAudio = findMainAudio();
      if (!mainAudio) {
        // Try to find it via the audioRef on window
        const audios = document.getElementsByTagName("audio");
        for (let i = 0; i < audios.length; i++) {
          if (!audios[i].paused) {
            mainAudioRef.current = audios[i];
            break;
          }
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

      // Play cyberpunk track
      const cyberpunkAudio = new Audio("/audio/Cyberpunk_secret_door.mp3");
      cyberpunkAudio.loop = true;
      cyberpunkAudio.play().catch(() => {});
      cyberpunkAudioRef.current = cyberpunkAudio;

      // Start 1-minute progress bar (60 seconds = 60000ms, update every 600ms = 1% per tick)
      const totalDuration = 60000;
      const tickInterval = totalDuration / 100;
      let currentProgress = 0;

      progressIntervalRef.current = setInterval(() => {
        currentProgress += 1;
        setProgress(currentProgress);

        if (currentProgress >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          // Stop cyberpunk audio, close and go back to main
          cyberpunkAudio.pause();
          cyberpunkAudio.currentTime = 0;
          onClose();
        }
      }, tickInterval);
    }

    return () => {
      if (cyberpunkAudioRef.current) {
        cyberpunkAudioRef.current.pause();
        cyberpunkAudioRef.current.currentTime = 0;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    if (value === SECRET_CODE) {
      // Stop progress and audio, navigate to secret
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (cyberpunkAudioRef.current) {
        cyberpunkAudioRef.current.pause();
      }
      setTimeout(() => {
        onClose();
        window.location.href = "/secret";
      }, 300);
    }
  };

  const handleClose = () => {
    if (cyberpunkAudioRef.current) {
      cyberpunkAudioRef.current.pause();
      cyberpunkAudioRef.current.currentTime = 0;
    }
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    // Restore main audio
    if (mainAudioRef.current) {
      mainAudioRef.current.volume = 1;
      mainAudioRef.current.play().catch(() => {});
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/90" />
      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={handleChange}
          className="bg-black border-2 border-white text-white text-center text-sm tracking-[0.3em] font-display outline-none placeholder:text-white/30"
          style={{ width: "240px", height: "56px" }}
          placeholder="ENTER CODE"
        />
        {/* Progress bar */}
        <div className="w-[240px] h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/60 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecretDoorOverlay;
