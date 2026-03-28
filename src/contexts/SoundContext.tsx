import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SoundContextType {
  muted: boolean;
  toggleMute: () => void;
  playSound: (src: string, loop?: boolean) => HTMLAudioElement | null;
  siteMusicEnabled: boolean;
  setSiteMusicEnabled: (enabled: boolean) => void;
}

const SoundContext = createContext<SoundContextType>({
  muted: false,
  toggleMute: () => {},
  playSound: () => null,
  siteMusicEnabled: true,
  setSiteMusicEnabled: () => {},
});

export const useSoundContext = () => useContext(SoundContext);

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [muted, setMuted] = useState(false);
  const [siteMusicEnabled, setSiteMusicEnabled] = useState(true);

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const playSound = useCallback(
    (src: string, loop = false): HTMLAudioElement | null => {
      if (muted || !siteMusicEnabled) return null;
      const audio = new Audio(src);
      audio.loop = loop;
      audio.play().catch(() => {});
      return audio;
    },
    [muted, siteMusicEnabled],
  );

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playSound, siteMusicEnabled, setSiteMusicEnabled }}>
      {children}
    </SoundContext.Provider>
  );
};
