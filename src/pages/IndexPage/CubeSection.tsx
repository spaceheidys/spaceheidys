import { forwardRef } from "react";

interface CubeSectionProps {
  footerText?: string;
}

const CubeSection = forwardRef<HTMLDivElement, CubeSectionProps>(({ footerText }, ref) => {
  return (
    <>
      {/* divider */}
      <div className="w-full h-8 bg-black" />

      <div
        ref={ref}
        className="relative w-full bg-black flex flex-col items-center justify-center overflow-hidden min-h-[100svh]"
      >
        <div className="flex flex-col items-center justify-center gap-4 relative z-10 px-6 text-center">
          <span className="font-jp text-sm tracking-widest text-white/40">キューブ</span>
          <h2 className="text-3xl sm:text-5xl tracking-[0.3em] uppercase font-display text-white/80">
            CUBE
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-white/40 font-display">
            Coming soon
          </p>
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
    </>
  );
});

CubeSection.displayName = "CubeSection";

export default CubeSection;