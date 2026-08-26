/**
 * Global image optimisation for admin uploads.
 *
 * Any image sent to Supabase Storage is intercepted: the user is asked whether
 * to upload an optimised (resized + re-encoded) version or the original file.
 */
import { supabase } from "@/integrations/supabase/client";

export interface OptimizePrompt {
  file: File;
  optimized: File | null;
  resolve: (choice: "optimized" | "original" | "cancel") => void;
}

type Listener = (p: OptimizePrompt | null) => void;

let current: OptimizePrompt | null = null;
const listeners = new Set<Listener>();

export function subscribeOptimizePrompt(fn: Listener) {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}

function setPrompt(p: OptimizePrompt | null) {
  current = p;
  listeners.forEach((l) => l(p));
}

export const MAX_DIMENSION = 2200;
export const QUALITY = 0.82;

const OPTIMIZABLE = /^image\/(jpeg|jpg|png|webp)$/i;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Resize + re-encode an image file to WebP. Returns null when not possible. */
export async function optimizeImage(file: File): Promise<File | null> {
  if (!OPTIMIZABLE.test(file.type)) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/webp", QUALITY)
    );
    if (!blob) return null;

    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch {
    return null;
  }
}

/** Ask the user which version to upload. Resolves with the file to use, or null if cancelled. */
export async function askOptimize(file: File): Promise<File | null> {
  if (!OPTIMIZABLE.test(file.type)) return file;
  const optimized = await optimizeImage(file);
  // Nothing to gain — skip the dialog
  if (!optimized || optimized.size >= file.size * 0.95) return file;

  const choice = await new Promise<"optimized" | "original" | "cancel">((resolve) => {
    setPrompt({ file, optimized, resolve });
  });
  setPrompt(null);
  if (choice === "cancel") return null;
  return choice === "optimized" ? optimized : file;
}

/**
 * Patch supabase.storage so every image upload goes through the prompt.
 * Safe to call multiple times.
 */
let patched = false;
export function installUploadOptimizer() {
  if (patched) return;
  patched = true;
  const storage = supabase.storage as any;
  const originalFrom = storage.from.bind(storage);
  storage.from = (bucket: string) => {
    const api = originalFrom(bucket);
    const originalUpload = api.upload.bind(api);
    api.upload = async (path: string, body: any, options?: any) => {
      if (typeof File !== "undefined" && body instanceof File && OPTIMIZABLE.test(body.type)) {
        const chosen = await askOptimize(body);
        if (!chosen) {
          return { data: null, error: { message: "Upload cancelled", name: "Cancelled" } } as any;
        }
        if (chosen !== body) {
          // Keep the caller's path (they reuse it for getPublicUrl); only the
          // bytes and content type change.
          return originalUpload(path, chosen, { ...(options || {}), contentType: "image/webp" });
        }
      }
      return originalUpload(path, body, options);
    };
    return api;
  };
}
