import { motion } from "framer-motion";

const navItems = ["About", "Portfolio", "Contacts"];

const ScrollIndicator = ({ activeSection = "Main" }: { activeSection?: string }) => {
  const sections = ["About", "Portfolio", "Contacts"];
  return (
    <div className="flex flex-col gap-3">
      {sections.map((item, i) => (
        <motion.div
          key={item}
          className="w-16 h-16 border border-border/50 flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors duration-300"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
        >
          {(i === 0 || activeSection === item) && (
            <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-display">
              {item}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

const Navigation = () => {
  return (
    <nav className="flex flex-col gap-6">
      {navItems.map((item, i) => (
        <motion.a
          key={item}
          href={`#${item.toLowerCase()}`}
          className="text-sm tracking-[0.3em] uppercase text-foreground/70 hover:text-foreground transition-colors duration-300 font-display"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
        >
          {item}
        </motion.a>
      ))}
    </nav>
  );
};

export { Navigation, ScrollIndicator };
