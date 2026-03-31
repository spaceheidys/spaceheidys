import { memo } from "react";
import BikoKuLogo from "@/components/BikoKuLogo";
import SocialLinks from "@/components/SocialLinks";

interface HeroSectionProps {
  bgImage: string;
}

const HeroSection = memo(({ bgImage }: HeroSectionProps) => {
  const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(bgImage);

  return (
    <div className="relative bg-background overflow-hidden rounded-none min-h-[100svh]">
      {/* Hero background */}
      <div className="absolute inset-0 w-full h-full">
        {isVideo ? (
          <video
            key={bgImage}
            src={bgImage}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center opacity-60"
          />
        ) : (
          <img
            src={bgImage}
            alt="BIKO KU manga illustration"
            className="w-full h-full object-cover object-center opacity-60"
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/40" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-[100svh] flex flex-col">
        <div className="h-16 sm:h-20 md:h-24" />
        <div className="flex-1 flex items-center px-4 sm:px-8 md:px-16 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <BikoKuLogo />
            </div>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-center py-4 sm:py-5 pb-10 sm:pb-12 md:pb-16">
          <SocialLinks />
        </div>
      </div>
    </div>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
