import { motion } from "framer-motion";
import iconBe from "@/assets/icon_Be.svg";
import iconLN from "@/assets/icon_LN.svg";
import iconTwitter from "@/assets/icon_twitter.svg";

const socials = [
  { icon: iconBe, href: "https://www.behance.net/Biko_Ku", label: "Behance" },
  { icon: iconLN, href: "https://www.linkedin.com/in/viktor-kudriavcev-94757990/", label: "LinkedIn" },
  { icon: iconTwitter, href: "https://x.com/spaceheidys", label: "X (Twitter)" },
];

const SocialLinks = () => {
  return (
    <motion.div
      className="flex items-center gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.6 }}
    >
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors duration-300"
          aria-label={s.label}
          onClick={(e) => { e.preventDefault(); window.open(s.href, '_blank'); }}
        >
          <img src={s.icon} alt={s.label} className="h-5 w-auto opacity-60 hover:opacity-100 transition-opacity invert" />
        </a>
      ))}
    </motion.div>
  );
};

export default SocialLinks;
