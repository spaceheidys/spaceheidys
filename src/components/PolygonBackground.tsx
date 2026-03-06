import { useEffect, useRef } from "react";

interface PolygonBackgroundProps {
  triggerKey?: number;
}

const PolygonBackground = ({ triggerKey = 0 }: PolygonBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    interface Point {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      distFromCenter: number;
    }

    const points: Point[] = [];
    const cols = 12;
    const rows = 10;
    let startTime = 0;
    const spreadDuration = 2000; // ms for full spread

    const resize = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initPoints();
    };

    const initPoints = () => {
      points.length = 0;
      const cellW = width / (cols - 1);
      const cellH = height / (rows - 1);
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + (Math.random() - 0.5) * cellW * 0.4;
          const y = r * cellH + (Math.random() - 0.5) * cellH * 0.4;
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          points.push({
            x: cx, y: cy, // start at center
            baseX: x, baseY: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            distFromCenter: dist / maxDist, // normalized 0-1
          });
        }
      }
    };

    const getPoint = (r: number, c: number) => points[r * cols + c];

    const drawTriangle = (p1: Point, p2: Point, p3: Point, t: number, elapsed: number) => {
      if (!ctx) return;
      // Don't draw if any vertex hasn't started spreading yet
      const minProgress = Math.min(
        Math.max(0, (elapsed - p1.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4)),
        Math.max(0, (elapsed - p2.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4)),
        Math.max(0, (elapsed - p3.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4))
      );
      if (minProgress <= 0) return;

      const cx = (p1.x + p2.x + p3.x) / 3;
      const cy = (p1.y + p2.y + p3.y) / 3;
      const hue = 220 + Math.sin(cx * 0.003 + t * 0.0005) * 20;
      const lightness = 8 + Math.sin(cy * 0.004 + t * 0.0003) * 4 + Math.cos(cx * 0.002 + t * 0.0004) * 3;
      const alpha = (0.6 + Math.sin(cx * 0.005 + cy * 0.003 + t * 0.0006) * 0.2) * Math.min(minProgress, 1);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fillStyle = `hsla(${hue}, 15%, ${lightness}%, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 20%, ${lightness + 6}%, ${0.15 * Math.min(minProgress, 1)})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    const animate = (t: number) => {
      if (!ctx) return;
      if (!startTime) startTime = t;
      const elapsed = t - startTime;

      ctx.clearRect(0, 0, width, height);

      // Update points - spread from center then drift
      for (const p of points) {
        const progress = Math.min(1, Math.max(0, (elapsed - p.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4)));
        const ease = progress * (2 - progress); // ease-out

        if (progress < 1) {
          p.x = width / 2 + (p.baseX - width / 2) * ease;
          p.y = height / 2 + (p.baseY - height / 2) * ease;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          const dx = p.x - p.baseX;
          const dy = p.y - p.baseY;
          if (Math.abs(dx) > 18) p.vx *= -1;
          if (Math.abs(dy) > 18) p.vy *= -1;
          p.vx += (p.baseX - p.x) * 0.0005;
          p.vy += (p.baseY - p.y) * 0.0005;
        }
      }

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const tl = getPoint(r, c);
          const tr = getPoint(r, c + 1);
          const bl = getPoint(r + 1, c);
          const br = getPoint(r + 1, c + 1);
          drawTriangle(tl, tr, bl, t, elapsed);
          drawTriangle(tr, br, bl, t, elapsed);
        }
      }

      animId = requestAnimationFrame(animate);
    };

    resize();
    animId = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
};

export default PolygonBackground;
