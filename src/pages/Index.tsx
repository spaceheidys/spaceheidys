import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.png";
import BikoKuLogo from "@/components/BikoKuLogo";
import { Navigation, ScrollIndicator } from "@/components/Navigation";
import MascotSection from "@/components/MascotSection";
import SocialLinks from "@/components/SocialLinks";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Hero background illustration */}
      <div className="absolute inset-0 w-full h-screen">
        <img
          src={heroBg}
          alt="BIKO KU manga illustration"
          className="w-full h-full object-cover object-top opacity-60"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/40" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav bar */}
        <motion.header
          className="flex items-center justify-between px-8 md:px-16 py-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-jp text-sm tracking-widest text-foreground/70">ビコ・ク</span>
          <nav className="hidden md:flex items-center gap-12">
            {["Portfolio", "Contacts", "Social"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 font-display"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex items-center px-8 md:px-16">
          <div className="w-full flex items-center justify-between">
            {/* Left side: nav + scroll indicators */}
            <div className="hidden lg:flex flex-col gap-12">
              <Navigation />
              <ScrollIndicator activeSection="Main" />
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center">
              <BikoKuLogo />
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex items-end justify-between px-8 md:px-16 pb-8">
          {/* Mascot - bottom left */}
          <MascotSection />

          {/* Social links - bottom right */}
          <SocialLinks />
        </div>
      </div>
    </div>
  );
};

export default Index;
