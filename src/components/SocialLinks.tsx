import { motion } from "framer-motion";

const SocialLinks = () => {
  return (
    <motion.div
      className="flex items-center gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.6 }}
    >
      {/* Behance */}
      <a
        href="https://www.behance.net/Biko_Ku"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors duration-300"
        aria-label="Behance"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.57 1.022 2.604 2.594 2.604.822 0 1.676-.368 2.089-1.009h3.073zM15.97 13.12h5.055c-.083-1.167-.772-2.052-2.334-2.052-1.378 0-2.292.776-2.721 2.052zM9.089 13.293H5.744v3.689h3.188c1.236 0 2.262-.523 2.262-1.814 0-1.369-.894-1.875-2.105-1.875zM8.62 8.344H5.744v3.147h2.746c.984 0 1.835-.413 1.835-1.626 0-1.326-.79-1.521-1.705-1.521zM0 6V18h9.578c3.063 0 4.922-1.464 4.922-4.11 0-1.588-.711-2.882-2.324-3.329 1.096-.478 1.776-1.433 1.776-2.79C13.952 5.484 12.104 6 9.578 6H0z" />
        </svg>
      </a>

      {/* LinkedIn */}
      <a
        href="https://www.linkedin.com/in/viktor-kudriavcev-94757990/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors duration-300"
        aria-label="LinkedIn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
    </motion.div>
  );
};

export default SocialLinks;
