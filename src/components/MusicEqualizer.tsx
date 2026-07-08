import { useEffect, useRef } from "react";

// Shared across the app: main background music element is exposed on window.
declare global {
  interface Window {
    __mainAudio?: HTMLAudioElement;
    __mainAudioCtx?: AudioContext;
    __mainAudioSource?: MediaElementAudioSourceNode;
    __mainAudioAnalyser?: AnalyserNode;
  }
}

interface Props {
  className?: string;
  bars?: number;
  color?: string;
  height?: number;
}

const MusicEqualizer = ({
  className = "",
  bars = 96,
  color = "hsl(var(--foreground))",
  height = 48,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve computed color (canvas can't read hsl(var(--...)))
    const probe = document.createElement("span");
    probe.style.color = color;
    document.body.appendChild(probe);
    const resolvedColor = getComputedStyle(probe).color || "#ffffff";
    probe.remove();

    const setupAnalyser = () => {
      const audio = window.__mainAudio;
      if (!audio) return null;
      try {
        if (!window.__mainAudioCtx) {
          const AC = (window.AudioContext || (window as any).webkitAudioContext);
          window.__mainAudioCtx = new AC();
        }
        const ac = window.__mainAudioCtx!;
        if (!window.__mainAudioSource) {
          window.__mainAudioSource = ac.createMediaElementSource(audio);
        }
        if (!window.__mainAudioAnalyser) {
          const a = ac.createAnalyser();
          a.fftSize = 256;
          a.smoothingTimeConstant = 0.82;
          window.__mainAudioSource.connect(a);
          window.__mainAudioSource.connect(ac.destination);
          window.__mainAudioAnalyser = a;
        }
        if (ac.state === "suspended") ac.resume().catch(() => {});
        return window.__mainAudioAnalyser!;
      } catch {
        return null;
      }
    };

    let analyser: AnalyserNode | null = setupAnalyser();
    const waitTimer = analyser
      ? null
      : window.setInterval(() => {
          analyser = setupAnalyser();
          if (analyser && waitTimer) window.clearInterval(waitTimer);
        }, 400);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      let vals: number[] = new Array(bars).fill(0);
      if (analyser) {
        if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
          dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        }
        analyser.getByteFrequencyData(dataRef.current as unknown as Uint8Array<ArrayBuffer>);
        const data = dataRef.current;
        // Log-ish bucket mapping over lower ~70% of spectrum
        const usable = Math.floor(data.length * 0.75);
        for (let i = 0; i < bars; i++) {
          const t0 = i / bars;
          const t1 = (i + 1) / bars;
          const s0 = Math.floor(Math.pow(t0, 1.6) * usable);
          const s1 = Math.max(s0 + 1, Math.floor(Math.pow(t1, 1.6) * usable));
          let sum = 0;
          for (let k = s0; k < s1; k++) sum += data[k];
          vals[i] = sum / (s1 - s0) / 255;
        }
      } else {
        // Idle shimmer
        const now = performance.now() / 600;
        for (let i = 0; i < bars; i++) {
          vals[i] = 0.04 + 0.03 * (0.5 + 0.5 * Math.sin(now + i * 0.35));
        }
      }

      const gap = 2;
      const barW = Math.max(1, (w - gap * (bars - 1)) / bars);
      ctx.fillStyle = resolvedColor;
      for (let i = 0; i < bars; i++) {
        const v = vals[i];
        const bh = Math.max(1, v * h);
        const x = i * (barW + gap);
        const y = (h - bh) / 2;
        ctx.globalAlpha = 0.35 + 0.55 * v;
        ctx.fillRect(x, y, barW, bh);
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    const resumeOnGesture = () => {
      window.__mainAudioCtx?.resume().catch(() => {});
    };
    window.addEventListener("click", resumeOnGesture);
    window.addEventListener("keydown", resumeOnGesture);
    window.addEventListener("touchstart", resumeOnGesture);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (waitTimer) window.clearInterval(waitTimer);
      window.removeEventListener("click", resumeOnGesture);
      window.removeEventListener("keydown", resumeOnGesture);
      window.removeEventListener("touchstart", resumeOnGesture);
    };
  }, [bars, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`block w-full ${className}`}
      style={{ height }}
    />
  );
};

export default MusicEqualizer;