import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecretDoorSettings } from "@/hooks/useSecretDoorSettings";
import { supabase } from "@/integrations/supabase/client";

const quadrants = [
  { id: "tl", label: "01" },
  { id: "tr", label: "02" },
  { id: "bl", label: "03" },
  { id: "br", label: "04" },
];

const SecretPage = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { settings } = useSecretDoorSettings();
  const impulseRef = useRef<HTMLDivElement | null>(null);
  const [quadHtml, setQuadHtml] = useState<Record<string, string | null>>({});

  // Wrap user HTML with a strict CSP that blocks all network access.
  // Combined with a restrictive iframe sandbox this isolates the content.
  const buildSandboxedDoc = (html: string) => {
    const csp = [
      "default-src 'none'",
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline'",
      "img-src data: blob:",
      "media-src data: blob:",
      "font-src data:",
      "connect-src 'none'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join("; ");
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_self"></head><body style="margin:0;background:transparent;color:inherit;">${html}</body></html>`;
  };

  useEffect(() => {
    supabase
      .from("secret_door_quadrants" as any)
      .select("id, html_content")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string | null> = {};
        (data as any[]).forEach((q) => { map[q.id] = q.html_content; });
        setQuadHtml(map);
      });
  }, []);

  // JS-driven perimeter impulse that eases in/out at every corner.
  useEffect(() => {
    if (!expanded) return;
    if (!settings.impulse_enabled) return;
    const el = impulseRef.current;
    if (!el) return;
    const duration = Math.max(1, settings.impulse_speed) * 1000;
    const mode = settings.impulse_mode;
    const easeSmooth = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t); // ease-in-out sine (slow at corners)
    const easeLinear = (t: number) => t;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) % duration) / duration; // 0..1 around loop
      const side = Math.floor(t * 4); // 0..3
      const localRaw = (t * 4) - side;
      const local = mode === "linear" || mode === "pulse" ? easeLinear(localRaw) : easeSmooth(localRaw);
      let x = 0, y = 0;
      if (side === 0) { x = local * 100; y = 0; }           // top L->R
      else if (side === 1) { x = 100; y = local * 100; }    // right T->B
      else if (side === 2) { x = (1 - local) * 100; y = 100; } // bottom R->L
      else { x = 0; y = (1 - local) * 100; }                // left B->T
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      if (mode === "pulse") {
        // breathe scale + opacity twice per side
        const phase = (localRaw * Math.PI * 2);
        const s = 0.7 + 0.6 * (0.5 + 0.5 * Math.sin(phase));
        const o = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(phase));
        el.style.transform = `translate(-50%, -50%) scale(${s.toFixed(3)})`;
        el.style.opacity = o.toFixed(3);
      } else {
        el.style.transform = "translate(-50%, -50%)";
        el.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [expanded, settings.impulse_speed, settings.impulse_enabled, settings.impulse_mode]);

  return (
    <div className="relative h-[100svh] w-screen bg-background overflow-hidden">
      <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
        {quadrants.map((q, i) => (
          <motion.section
            key={q.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            onClick={() => setExpanded(q.id)}
            className="relative border border-border flex items-center justify-center overflow-hidden cursor-pointer hover:bg-foreground/[0.02] transition-colors"
          >
            <span className="absolute top-3 left-3 text-[10px] font-display tracking-[0.3em] text-muted-foreground">
              {q.label}
            </span>
            {q.id === "br" ? (
              <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
                <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground/50 text-center leading-relaxed max-w-[80%]">
                  ACCESS GRANTED<br />
                  WELCOME TO THE HIDDEN SECTOR
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
            ) : (
              <span className="text-xs font-display tracking-[0.3em] text-muted-foreground/60">
                {quadHtml[q.id] ? "READY" : "EMPTY"}
              </span>
            )}
          </motion.section>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            style={{ padding: 60 }}
          >
            <motion.div
              layoutId={`quad-${expanded}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative h-full w-full border border-border bg-background overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none">
                {settings.impulse_enabled && <div
                  ref={impulseRef}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: settings.impulse_color,
                    boxShadow: `0 0 8px ${settings.impulse_color}99`,
                    transform: "translate(-50%, -50%)",
                    left: 0,
                    top: 0,
                  }}
                />}
              </div>
              <span className="absolute top-4 left-4 text-[10px] font-display tracking-[0.3em] text-muted-foreground">
                {quadrants.find((q) => q.id === expanded)?.label}
              </span>
              <button
                onClick={() => setExpanded(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors border border-border hover:border-foreground/60 z-10"
              >
                <span className="text-sm leading-none">×</span>
              </button>
              <div className="h-full w-full">
                {quadHtml[expanded] ? (
                  <iframe
                    title={`Quadrant ${expanded}`}
                    srcDoc={buildSandboxedDoc(quadHtml[expanded] || "")}
                    sandbox="allow-scripts allow-pointer-lock"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full border-0 bg-background"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-xs font-display tracking-[0.3em] text-muted-foreground/60">
                      EMPTY
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecretPage;
