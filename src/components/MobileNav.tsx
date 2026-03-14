import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Volume2, VolumeX } from "lucide-react";
import { useSoundContext } from "@/contexts/SoundContext";
import type { NavButton } from "@/hooks/useNavButtons";

interface MobileNavProps {
  onSecretDoor: () => void;
  onShop: () => void;
  navButtons: NavButton[];
  actionMap: Record<string, () => void>;
  bgOptions: string[];
  bgImage: string;
  onBgChange: (bg: string) => void;
  siteMusicEnabled?: boolean;
}

const MobileNav = ({
  onSecretDoor,
  onShop,
  navButtons,
  actionMap,
  bgOptions,
  bgImage,
  onBgChange,
  siteMusicEnabled = true,
}: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const { muted, toggleMute } = useSoundContext();

  const handleClick = (action: () => void) => {
    if (!muted) {
      new Audio("/audio/bell-sounds.mp3").play().catch(() => {});
    }
    action();
    setOpen(false);
  };

  const visibleButtons = navButtons.filter(b => b.is_visible);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[150] bg-background flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-5 right-5 text-foreground/70 hover:text-foreground"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>

            {visibleButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleClick(actionMap[btn.key] || (() => {}))}
                className="text-sm tracking-[0.2em] uppercase text-foreground/70 hover:text-foreground transition-colors font-display"
              >
                {btn.label_jp} / {btn.label}
              </button>
            ))}

            {/* BG switcher + mute */}
            <div className="flex items-center gap-3 mt-4">
              {bgOptions.map((bg, i) => (
                <div
                  key={i}
                  className={`cursor-pointer transition-all duration-300 ${
                    bgImage === bg ? "opacity-100 rounded-full" : "opacity-50 rounded-none"
                  }`}
                  style={{ width: 18, height: 18, backgroundColor: "white" }}
                  onClick={() => onBgChange(bg)}
                />
              ))}
              {siteMusicEnabled && (
                <button
                  className="ml-2 text-foreground/60 hover:text-foreground transition-colors"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileNav;
