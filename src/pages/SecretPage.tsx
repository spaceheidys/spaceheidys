import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const quadrants = [
  { id: "tl", label: "01" },
  { id: "tr", label: "02" },
  { id: "bl", label: "03" },
  { id: "br", label: "04" },
];

const SecretPage = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

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
                EMPTY
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
              <span className="absolute top-4 left-4 text-[10px] font-display tracking-[0.3em] text-muted-foreground">
                {quadrants.find((q) => q.id === expanded)?.label}
              </span>
              <button
                onClick={() => setExpanded(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors border border-border hover:border-foreground/60"
              >
                <span className="text-sm leading-none">×</span>
              </button>
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-xs font-display tracking-[0.3em] text-muted-foreground/60">
                  EMPTY
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecretPage;
