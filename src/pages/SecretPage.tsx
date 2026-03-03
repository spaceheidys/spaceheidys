import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SecretPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-display tracking-widest text-foreground mb-4">SECRET ROOM</h1>
        <p className="text-foreground/60 text-sm tracking-widest">You found the secret door.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 text-xs tracking-[0.3em] uppercase text-foreground/40 hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </motion.div>
    </div>
  );
};

export default SecretPage;
