import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-4">
      <SEO title="404 — Page Not Found | BIKO KU" description="The page you are looking for does not exist." path={location.pathname} />
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="mb-4 text-4xl sm:text-5xl font-display tracking-[0.3em] text-foreground">404</h1>
        <p className="mb-6 text-sm sm:text-base text-muted-foreground font-display tracking-widest uppercase">
          Page not found
        </p>
        <button
          onClick={() => navigate("/")}
          className="text-xs tracking-[0.3em] uppercase text-foreground/70 hover:text-foreground transition-colors font-display"
        >
          ← Return Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
