import { LockKeyhole } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const SIGNAL = [
  "7F ▪ A9 ▪ 00 ── ████ ── 8C ▪ F1",
  "░░ 0101 ░░ ▓▓▓▓ ░░ 1100 ░░",
  "E2 ── ██████ ── 4D ▪ 09 ▪ B7",
  "1010 ▪ ░░░░ ▪ 0011 ▪ ▓▓▓▓",
  "██ ── C0 ▪ 7A ── ████ ── FF",
];

export default function AboutNoAccess() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="relative w-full h-full overflow-hidden px-6 py-6 sm:px-10 font-mono text-foreground" role="status" aria-label="ABOUT access denied">
      <div aria-hidden="true" className="absolute inset-6 sm:inset-10 flex flex-col justify-between text-xs text-muted-foreground/30 select-none overflow-hidden">
        {SIGNAL.map((line, index) => (
          <motion.div
            key={line}
            className="whitespace-nowrap border-b border-border/40 pb-3"
            animate={reducedMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3.5, delay: index * 0.4, repeat: Infinity }}
          >
            {line}　{line}　{line}
          </motion.div>
        ))}
      </div>
      <div className="relative h-full flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-[10px] text-muted-foreground">[ ABOUT / CLASSIFIED ]</span>
        <LockKeyhole size={26} strokeWidth={1} aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-mono">NO ACCESS</h2>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 bg-foreground motion-safe:animate-pulse" aria-hidden="true" />
          <span>DATA REDACTED · 403</span>
        </div>
      </div>
    </div>
  );
}