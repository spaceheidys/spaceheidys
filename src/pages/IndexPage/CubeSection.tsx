import { forwardRef, useEffect, useState } from "react";
import RotatingCube from "@/components/RotatingCube";
import { supabase } from "@/integrations/supabase/client";

interface CubeSectionProps {
  footerText?: string;
  backgroundUrl?: string | null;
}

/** Looping typewriter used in the cube divider strip. */
const LoopTypewriter = ({ text, speed = 140, hold = 2200 }: { text: string; speed?: number; hold?: number }) => {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing">("typing");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (n < text.length) t = setTimeout(() => setN(n + 1), speed);
      else t = setTimeout(() => setPhase("holding"), hold);
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("erasing"), hold);
    } else {
      if (n > 0) t = setTimeout(() => setN(n - 1), speed / 2);
      else t = setTimeout(() => setPhase("typing"), 600);
    }
    return () => clearTimeout(t);
  }, [n, phase, text, speed, hold]);
  return (
    <span className="font-display text-[10px] tracking-[0.4em] text-white/60 tabular-nums select-none">
      {text.slice(0, n)}
      <span className="inline-block w-[1px] h-[10px] bg-white/60 ml-[2px] align-middle animate-pulse" />
    </span>
  );
};

const CubeSection = forwardRef<HTMLDivElement, CubeSectionProps>(({ footerText, backgroundUrl }, ref) => {
  const isVideo = backgroundUrl ? /\.(mp4|webm|mov|ogg)(\?|$)/i.test(backgroundUrl) : false;
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const already = sessionStorage.getItem("visit_counted") === "1";
      if (already) {
        const { data } = await supabase.from("site_visits").select("count").eq("id", 1).maybeSingle();
        if (!cancelled && data) setVisits(Number(data.count));
      } else {
        const { data, error } = await supabase.rpc("increment_site_visits");
        if (!cancelled) {
          if (!error && data != null) {
            sessionStorage.setItem("visit_counted", "1");
            setVisits(Number(data));
          } else {
            const { data: r } = await supabase.from("site_visits").select("count").eq("id", 1).maybeSingle();
            if (r) setVisits(Number(r.count));
          }
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const formatted = visits != null ? visits.toLocaleString("en-US") : null;
  return (
    <>
      {/* divider with visit counter */}
      <div className="w-full h-8 bg-black flex items-center justify-center">
        {formatted && (
          <span className="font-display text-[10px] tracking-[0.3em] text-white/30 tabular-nums select-none">
            {formatted}
          </span>
        )}
      </div>

      <div
        ref={ref}
        className="relative w-full bg-black flex flex-col items-center justify-center overflow-hidden min-h-[100svh] py-20"
      >
        {backgroundUrl && (
          isVideo ? (
            <video
              src={backgroundUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            <img
              src={backgroundUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )
        )}
        <div className="relative z-10 w-full flex items-center justify-center px-6">
          <RotatingCube />
        </div>

        {footerText && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="w-full h-px bg-white/10" />
            <div className="w-full h-12 sm:h-16 items-center justify-center flex flex-row">
              <span className="text-[9px] sm:text-[10px] tracking-widest text-white/40 font-display">
                {footerText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cube category divider strip (mirror of the equalizer strip above portfolio) */}
      <div className="relative w-full h-8 bg-black overflow-hidden">
        <div className="absolute inset-y-0 left-4 right-4 sm:left-[calc(6rem+1rem)] sm:right-8 md:left-[calc(8rem+1rem)] md:right-16 pointer-events-none flex items-center justify-center">
          <LoopTypewriter text="CUBE" />
        </div>
      </div>
    </>
  );
});

CubeSection.displayName = "CubeSection";

export default CubeSection;