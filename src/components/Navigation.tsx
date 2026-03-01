import { motion } from "framer-motion";

const navItems = ["About", "Portfolio", "Contacts"];

const ScrollIndicator = ({ activeSection = "Main" }: { activeSection?: string }) => {
  return (
    <div className="flex flex-col gap-8 w-48">
      {navItems.map((item) => (
        <div key={item} className="line-indicator text-xs tracking-[0.3em] uppercase text-muted-foreground font-display">
          {activeSection === item ? item : ""}
        </div>
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
