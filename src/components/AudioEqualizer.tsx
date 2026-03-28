import { useEffect, useRef } from "react";
import { useSoundContext } from "@/contexts/SoundContext";

interface Props {
  className?: string;
  barColor?: string;
  barCount?: number;
  height?: number;
}

const AudioEqualizer = ({ className = "", barColor, barCount = 64, height = 20 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { analyser, muted } = useSoundContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Resolve color from CSS variable
      const color = barColor || getComputedStyle(canvas).getPropertyValue("color") || "rgba(255,255,255,0.3)";

      if (!analyser || muted) {
        // Draw static flat line
        const gap = 2;
        const barW = Math.max(1, (w - (barCount - 1) * gap) / barCount);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barW + gap);
          ctx.fillRect(x, h - 1, barW, 1);
        }
        ctx.globalAlpha = 1;
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const gap = 2;
      const barW = Math.max(1, (w - (barCount - 1) * gap) / barCount);
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        // Average a chunk of frequencies for this bar
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j] || 0;
        }
        const avg = sum / step;
        const barH = Math.max(1, (avg / 255) * h);
        const x = i * (barW + gap);

        // Pixel-style: draw small squares stacked
        const pixelSize = Math.max(2, barW);
        const pixelGap = 1;
        const numPixels = Math.ceil(barH / (pixelSize + pixelGap));

        for (let p = 0; p < numPixels; p++) {
          const y = h - (p * (pixelSize + pixelGap)) - pixelSize;
          const alpha = 0.2 + (p / Math.max(1, numPixels)) * 0.6;
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [analyser, muted, barColor, barCount, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full pointer-events-none ${className}`}
      style={{ height: `${height}px` }}
    />
  );
};

export default AudioEqualizer;
