import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const quadrants = [
  { id: "tl", label: "01" },
  { id: "tr", label: "02" },
  { id: "bl", label: "03" },
  { id: "br", label: "04" },
];

const SecretPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative h-[100svh] w-screen bg-background overflow-hidden">
      <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
        {quadrants.map((q, i) => (
          <motion.section
            key={q.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="relative border border-border flex items-center justify-center overflow-hidden"
          >
            <span className="absolute top-3 left-3 text-[10px] font-display tracking-[0.3em] text-muted-foreground">
              {q.label}
            </span>
            {q.id === "br" ? (
              <div className="flex flex-col items-center gap-4">
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
    </div>
  );
};

export default SecretPage;
