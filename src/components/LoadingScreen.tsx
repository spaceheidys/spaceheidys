import { motion } from "framer-motion";

interface LoadingScreenProps {
  progress: number; // 0..1
}

const LoadingScreen = ({ progress }: LoadingScreenProps) => {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-40 h-[2px] bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-foreground/60 rounded-full"
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
