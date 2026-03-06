import { useEffect, useRef } from "react";

const PolygonBackground = () => {
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
    }

    const points: Point[] = [];
    const cols = 12;
    const rows = 10;

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
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + (Math.random() - 0.5) * cellW * 0.4;
          const y = r * cellH + (Math.random() - 0.5) * cellH * 0.4;
          points.push({
            x, y,
            baseX: x, baseY: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
          });
        }
      }
    };

    const getPoint = (r: number, c: number) => points[r * cols + c];

    const drawTriangle = (p1: Point, p2: Point, p3: Point, t: number) => {
      if (!ctx) return;
      const cx = (p1.x + p2.x + p3.x) / 3;
      const cy = (p1.y + p2.y + p3.y) / 3;
      
      // Subtle color variation based on position and time
      const hue = 220 + Math.sin(cx * 0.003 + t * 0.0005) * 20;
      const lightness = 8 + Math.sin(cy * 0.004 + t * 0.0003) * 4 + Math.cos(cx * 0.002 + t * 0.0004) * 3;
      const alpha = 0.6 + Math.sin(cx * 0.005 + cy * 0.003 + t * 0.0006) * 0.2;
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fillStyle = `hsla(${hue}, 15%, ${lightness}%, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 20%, ${lightness + 6}%, 0.15)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    const animate = (t: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Update points with gentle drift
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        
        const dx = p.x - p.baseX;
        const dy = p.y - p.baseY;
        const maxDrift = 18;
        
        if (Math.abs(dx) > maxDrift) p.vx *= -1;
        if (Math.abs(dy) > maxDrift) p.vy *= -1;
        
        // Slight pull back to base
        p.vx += (p.baseX - p.x) * 0.0005;
        p.vy += (p.baseY - p.y) * 0.0005;
      }

      // Draw triangles from grid
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const tl = getPoint(r, c);
          const tr = getPoint(r, c + 1);
          const bl = getPoint(r + 1, c);
          const br = getPoint(r + 1, c + 1);
          drawTriangle(tl, tr, bl, t);
          drawTriangle(tr, br, bl, t);
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
