import { motion, AnimatePresence } from "framer-motion";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const AboutModal = ({ open, onClose }: AboutModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] max-w-[90vw] h-[620px] max-h-[80vh] bg-white/80 rounded-sm p-10 overflow-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-black/60 hover:text-black text-xl font-display"
            >
              ✕
            </button>
            <h2 className="font-display text-2xl font-bold text-black mb-6">About Me</h2>
            <p className="font-body text-black/80 leading-relaxed">
              Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work. 
              This space is dedicated to sharing visual storytelling and artistic expression across various styles and mediums.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;
