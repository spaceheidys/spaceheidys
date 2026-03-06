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
    let mouseX = -1000;
    let mouseY = -1000;
    let clickWave = { x: 0, y: 0, time: 0, active: false };

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
    const spreadDuration = 2000;
    const mouseRadius = 120;
    const mouseForce = 25;

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
            x: cx, y: cy,
            baseX: x, baseY: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            distFromCenter: dist / maxDist,
          });
        }
      }
    };

    const getPoint = (r: number, c: number) => points[r * cols + c];

    const drawTriangle = (p1: Point, p2: Point, p3: Point, t: number, elapsed: number) => {
      if (!ctx) return;
      const minProgress = Math.min(
        Math.max(0, (elapsed - p1.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4)),
        Math.max(0, (elapsed - p2.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4)),
        Math.max(0, (elapsed - p3.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4))
      );
      if (minProgress <= 0) return;

      const cx = (p1.x + p2.x + p3.x) / 3;
      const cy = (p1.y + p2.y + p3.y) / 3;

      // Mouse proximity glow
      const distToMouse = Math.sqrt((cx - mouseX) ** 2 + (cy - mouseY) ** 2);
      const mouseInfluence = Math.max(0, 1 - distToMouse / (mouseRadius * 2));

      // Click wave glow
      let waveInfluence = 0;
      if (clickWave.active) {
        const waveElapsed = t - clickWave.time;
        const waveRadius = waveElapsed * 0.4; // expands outward
        const distToClick = Math.sqrt((cx - clickWave.x) ** 2 + (cy - clickWave.y) ** 2);
        const waveDelta = Math.abs(distToClick - waveRadius);
        waveInfluence = Math.max(0, 1 - waveDelta / 80) * Math.max(0, 1 - waveElapsed / 1500);
        if (waveElapsed > 1500) clickWave.active = false;
      }

      const hue = 220 + Math.sin(cx * 0.003 + t * 0.0005) * 20 + mouseInfluence * 30 + waveInfluence * 40;
      const lightness = 8 + Math.sin(cy * 0.004 + t * 0.0003) * 4 + Math.cos(cx * 0.002 + t * 0.0004) * 3 + mouseInfluence * 12 + waveInfluence * 18;
      const alpha = (0.6 + Math.sin(cx * 0.005 + cy * 0.003 + t * 0.0006) * 0.2 + mouseInfluence * 0.3 + waveInfluence * 0.4) * Math.min(minProgress, 1);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fillStyle = `hsla(${hue}, ${15 + mouseInfluence * 20 + waveInfluence * 25}%, ${lightness}%, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 20%, ${lightness + 6}%, ${(0.15 + mouseInfluence * 0.3 + waveInfluence * 0.4) * Math.min(minProgress, 1)})`;
      ctx.lineWidth = 0.5 + mouseInfluence * 0.5;
      ctx.stroke();
    };

    const animate = (t: number) => {
      if (!ctx) return;
      if (!startTime) startTime = t;
      const elapsed = t - startTime;

      ctx.clearRect(0, 0, width, height);

      for (const p of points) {
        const progress = Math.min(1, Math.max(0, (elapsed - p.distFromCenter * spreadDuration * 0.6) / (spreadDuration * 0.4)));
        const ease = progress * (2 - progress);

        if (progress < 1) {
          p.x = width / 2 + (p.baseX - width / 2) * ease;
          p.y = height / 2 + (p.baseY - height / 2) * ease;
        } else {
          // Mouse repulsion
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius && dist > 0) {
            const force = (1 - dist / mouseRadius) * mouseForce * 0.05;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          // Click wave push
          if (clickWave.active) {
            const waveElapsed = t - clickWave.time;
            const waveRadius = waveElapsed * 0.4;
            const cdx = p.x - clickWave.x;
            const cdy = p.y - clickWave.y;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            const waveDelta = Math.abs(cdist - waveRadius);
            if (waveDelta < 60 && cdist > 0) {
              const pushForce = (1 - waveDelta / 60) * (1 - waveElapsed / 1500) * 2;
              p.vx += (cdx / cdist) * pushForce;
              p.vy += (cdy / cdist) * pushForce;
            }
          }

          p.x += p.vx;
          p.y += p.vy;
          const bx = p.x - p.baseX;
          const by = p.y - p.baseY;
          if (Math.abs(bx) > 18) p.vx *= -1;
          if (Math.abs(by) > 18) p.vy *= -1;
          p.vx += (p.baseX - p.x) * 0.0005;
          p.vy += (p.baseY - p.y) * 0.0005;
          // Damping
          p.vx *= 0.995;
          p.vy *= 0.995;
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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      clickWave = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        time: performance.now(),
        active: true,
      };
    };

    resize();
    animId = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);
    
    // Use parent element for mouse events since canvas has pointerEvents: none
    const parent = canvas.parentElement;
    parent?.addEventListener("mousemove", handleMouseMove);
    parent?.addEventListener("mouseleave", handleMouseLeave);
    parent?.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      parent?.removeEventListener("mousemove", handleMouseMove);
      parent?.removeEventListener("mouseleave", handleMouseLeave);
      parent?.removeEventListener("click", handleClick);
    };
  }, [triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
};

export default PolygonBackground;
