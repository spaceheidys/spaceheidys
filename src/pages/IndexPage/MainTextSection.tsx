import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SectionVisibility } from "@/hooks/useSectionSettings";

interface MainTextSectionProps {
  activeSection: "about" | "contact" | "shop" | null;
  sectionVisibility: SectionVisibility;
  getContent: (key: string) => string;
}

const sectionAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.4 },
};

const MainTextSection = forwardRef<HTMLDivElement, MainTextSectionProps>(
  ({ activeSection, sectionVisibility, getContent }, ref) => {
    return (
      <div ref={ref} className="relative w-full bg-background" style={{ height: 420 }}>
        <AnimatePresence mode="wait">
          {activeSection === "about" && (
            <motion.div key="about" className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 md:px-16" {...sectionAnimation}>
              {sectionVisibility.about !== false && (
                <p className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                  {getContent("about") || "Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work."}
                </p>
              )}
            </motion.div>
          )}
          {activeSection === "contact" && (
            <motion.div key="contact" className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 md:px-16" {...sectionAnimation}>
              <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                {(sectionVisibility as any).contact_title !== false && (
                  <p className="font-display tracking-widest text-foreground/90 mb-2">
                    {getContent("contact_title") || "Cooperation & Commissions"}
                  </p>
                )}
                {(sectionVisibility as any).contact_body !== false && (
                  <p>{getContent("contact_body") || "For collaboration projects or custom commissions, please contact me via email."}</p>
                )}
                {(sectionVisibility as any).contact_email !== false && (
                  <p className="mt-2 text-foreground/90">{getContent("contact_email") || "spaceheidys@gmail.com"}</p>
                )}
              </div>
            </motion.div>
          )}
          {activeSection === "shop" && (
            <motion.div key="shop" className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 md:px-16" {...sectionAnimation}>
              <div className="text-sm sm:text-base text-foreground/80 font-body leading-relaxed max-w-2xl text-center">
                <p className="font-display tracking-widest text-foreground/90 mb-2">✦ Shop✦</p>
                <p>This section is currently under construction</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

MainTextSection.displayName = "MainTextSection";

export default MainTextSection;
