import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { subscribeOptimizePrompt, formatBytes, type OptimizePrompt } from "@/lib/imageOptimize";

type Meta = { url: string; w: number; h: number } | null;

const useImageMeta = (file: File | null | undefined): Meta => {
  const [meta, setMeta] = useState<Meta>(null);
  useEffect(() => {
    if (!file) {
      setMeta(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setMeta({ url, w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return meta;
};

const ImageOptimizeDialog = () => {
  const [prompt, setPrompt] = useState<OptimizePrompt | null>(null);
  const [side, setSide] = useState<"original" | "optimized">("optimized");

  useEffect(() => subscribeOptimizePrompt(setPrompt) as unknown as () => void, []);

  const origMeta = useImageMeta(prompt?.file);
  const optMeta = useImageMeta(prompt?.optimized);

  if (!prompt || !prompt.optimized) return null;

  const { file, optimized, resolve } = prompt;
  const saved = Math.max(0, Math.round((1 - optimized.size / file.size) * 100));
  const shown = side === "optimized" ? optMeta : origMeta;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/85 backdrop-blur-sm px-4">
      <div className="w-full max-w-md border border-border bg-background p-5 space-y-4">
        <h2 className="font-display text-[11px] tracking-[0.3em] uppercase text-foreground">
          Optimize image?
        </h2>
        <p className="font-display text-[10px] tracking-wider text-muted-foreground break-all">
          {file.name}
        </p>

        <div className="space-y-2">
          <div className="relative h-56 border border-border bg-[repeating-conic-gradient(hsl(var(--muted))_0_25%,transparent_0_50%)] bg-[length:16px_16px] flex items-center justify-center overflow-hidden">
            {shown ? (
              <img
                src={shown.url}
                alt={`${side} preview of ${file.name}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="font-display text-[9px] tracking-widest uppercase text-muted-foreground">
                Loading…
              </span>
            )}
            <span className="absolute bottom-1 right-1 bg-background/80 px-1.5 py-0.5 font-display text-[9px] tracking-widest uppercase text-foreground">
              {side === "optimized" ? "WebP" : "Original"}
              {shown ? ` · ${shown.w}×${shown.h}` : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide("original")}
              className={`px-2 py-1 font-display text-[9px] tracking-[0.2em] uppercase border transition-colors ${
                side === "original"
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              View original
            </button>
            <button
              onClick={() => setSide("optimized")}
              className={`px-2 py-1 font-display text-[9px] tracking-[0.2em] uppercase border transition-colors ${
                side === "optimized"
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              View optimized
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border p-3 space-y-1">
            <span className="block font-display text-[9px] tracking-widest uppercase text-muted-foreground">
              Original
            </span>
            <span className="block font-display text-xs text-foreground">{formatBytes(file.size)}</span>
            <span className="block font-display text-[9px] tracking-wider text-muted-foreground">
              {origMeta ? `${origMeta.w}×${origMeta.h}` : "—"}
            </span>
          </div>
          <div className="border border-foreground p-3 space-y-1">
            <span className="block font-display text-[9px] tracking-widest uppercase text-muted-foreground">
              Optimized · WebP
            </span>
            <span className="block font-display text-xs text-foreground">
              {formatBytes(optimized.size)} <span className="text-muted-foreground">−{saved}%</span>
            </span>
            <span className="block font-display text-[9px] tracking-wider text-muted-foreground">
              {optMeta ? `${optMeta.w}×${optMeta.h}` : "—"}
            </span>
          </div>
        </div>


        <div className="flex flex-col gap-2">
          <button
            onClick={() => resolve("optimized")}
            className="w-full border border-foreground px-3 py-2 font-display text-[10px] tracking-[0.2em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Optimize
          </button>
          <button
            onClick={() => resolve("original")}
            className="w-full border border-border px-3 py-2 font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Keep original
          </button>
          <button
            onClick={() => resolve("cancel")}
            className="w-full px-3 py-1 font-display text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageOptimizeDialog;
