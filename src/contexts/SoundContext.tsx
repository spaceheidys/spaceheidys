import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

interface SoundContextType {
  muted: boolean;
  toggleMute: () => void;
  playSound: (src: string, loop?: boolean) => HTMLAudioElement | null;
  siteMusicEnabled: boolean;
  setSiteMusicEnabled: (enabled: boolean) => void;
  analyser: AnalyserNode | null;
  connectSource: (audio: HTMLAudioElement) => void;
}

const SoundContext = createContext<SoundContextType>({
  muted: false,
  toggleMute: () => {},
  playSound: () => null,
  siteMusicEnabled: true,
  setSiteMusicEnabled: () => {},
  analyser: null,
  connectSource: () => {},
});

export const useSoundContext = () => useContext(SoundContext);

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [muted, setMuted] = useState(false);
  const [siteMusicEnabled, setSiteMusicEnabled] = useState(true);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const connectedElements = useRef<WeakSet<HTMLAudioElement>>(new WeakSet());

  const getOrCreateContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      node.smoothingTimeConstant = 0.8;
      node.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = node;
      setAnalyser(node);
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return { ctx: audioCtxRef.current, analyser: analyserRef.current! };
  }, []);

  const connectSource = useCallback((audio: HTMLAudioElement) => {
    if (connectedElements.current.has(audio)) return;
    try {
      const { ctx, analyser } = getOrCreateContext();
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      connectedElements.current.add(audio);
    } catch {
      // Already connected or cross-origin
    }
  }, [getOrCreateContext]);

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
    <SoundContext.Provider value={{ muted, toggleMute, playSound, siteMusicEnabled, setSiteMusicEnabled, analyser, connectSource }}>
      {children}
    </SoundContext.Provider>
  );
};
