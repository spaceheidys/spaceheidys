import { useCallback, useEffect, useRef } from "react";

interface ScratchRevealProps {
  topImageUrl: string;
  className?: string;
}

type Point = { x: number; y: number };

const drawCover = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
};

/** A full-size image canvas whose pixels are erased by mouse or touch dragging. */
const ScratchReveal = ({ topImageUrl, className = "" }: ScratchRevealProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const brushSizeRef = useRef(window.matchMedia("(max-width: 640px)").matches ? 42 : 64);

  const applyCursorSize = useCallback(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const size = brushSizeRef.current;
    cursor.style.width = `${size}px`;
    cursor.style.height = `${size}px`;
  }, []);


  const paintImage = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete || !image.naturalWidth) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawCover(ctx, image, rect.width, rect.height);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
      paintImage();
    };
    image.src = topImageUrl;

    const observer = new ResizeObserver(paintImage);
    const canvas = canvasRef.current;
    if (canvas) observer.observe(canvas);
    return () => {
      observer.disconnect();
      image.onload = null;
      imageRef.current = null;
    };
  }, [topImageUrl, paintImage]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const moveCursor = (point: Point, pointerType: string) => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const brushSize = window.matchMedia("(max-width: 640px)").matches ? 42 : 64;
    cursor.style.transform = `translate3d(${point.x - brushSize / 2}px, ${point.y - brushSize / 2}px, 0)`;
    cursor.style.opacity = pointerType === "touch" ? "0" : "1";
  };

  const eraseTo = (point: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const brushSize = window.matchMedia("(max-width: 640px)").matches ? 42 : 64;
    const previous = lastPointRef.current ?? point;
    ctx.save();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();
    lastPointRef.current = point;
  };

  return (
    <div className={`absolute inset-0 ${className}`}>
      <canvas
        ref={canvasRef}
        aria-label="Scratch away the upper image to reveal the image below"
        className="absolute inset-0 h-full w-full cursor-none touch-none"
        onPointerEnter={(event) => moveCursor(pointFromEvent(event), event.pointerType)}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drawingRef.current = true;
          lastPointRef.current = pointFromEvent(event);
          moveCursor(lastPointRef.current, event.pointerType);
          eraseTo(lastPointRef.current);
        }}
        onPointerMove={(event) => {
          const point = pointFromEvent(event);
          moveCursor(point, event.pointerType);
          if (!drawingRef.current) return;
          eraseTo(point);
        }}
        onPointerLeave={() => {
          if (!drawingRef.current && cursorRef.current) cursorRef.current.style.opacity = "0";
        }}
        onPointerUp={(event) => {
          drawingRef.current = false;
          lastPointRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
          lastPointRef.current = null;
          if (cursorRef.current) cursorRef.current.style.opacity = "0";
        }}
      />
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 size-[42px] rounded-full border border-foreground opacity-0 shadow-[0_0_0_1px_hsl(var(--background)/0.65)] transition-opacity duration-100 sm:size-16"
      />
    </div>
  );
};

export default ScratchReveal;