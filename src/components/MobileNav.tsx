import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Volume2, VolumeX } from "lucide-react";
import { useSoundContext } from "@/contexts/SoundContext";

interface MobileNavProps {
  onGallery: () => void;
  onSecretDoor: () => void;
  onShop: () => void;
  onAbout: () => void;
  onPortfolio: () => void;
  onContact: () => void;
  bgOptions: string[];
  bgImage: string;
  onBgChange: (bg: string) => void;
  galleryVisible?: boolean;
}

const MobileNav = ({
  onSecretDoor,
  onShop,
  onAbout,
  onPortfolio,
  onGallery,
  onContact,
  bgOptions,
  bgImage,
  onBgChange,
  galleryVisible = true,
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
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8"
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

            {[
               { label: "アバウト / ABOUT", action: onAbout },
               { label: "ポートフォリオ / PORTFOLIO", action: onPortfolio },
               ...(galleryVisible ? [{ label: "ギャラリー / GALLERY", action: onGallery }] : []),
               { label: "コンタクト / CONTACT", action: onContact },
               { label: "Secret Door", action: onSecretDoor },
               { label: "Shop", action: onShop },
             ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleClick(item.action)}
                className="text-sm tracking-[0.2em] uppercase text-foreground/70 hover:text-foreground transition-colors font-display"
              >
                {item.label}
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
              <button
                className="ml-2 text-foreground/60 hover:text-foreground transition-colors"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileNav;
