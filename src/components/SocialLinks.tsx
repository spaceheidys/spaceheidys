import { motion } from "framer-motion";
import { useSocialLinks } from "@/hooks/useSocialLinks";
import iconBe from "@/assets/icon_Be.svg";
import iconLN from "@/assets/icon_LN.svg";
import iconTwitter from "@/assets/icon_twitter.svg";

// Fallback icons for known labels when no custom icon is uploaded
const FALLBACK_ICONS: Record<string, string> = {
  behance: iconBe,
  linkedin: iconLN,
  twitter: iconTwitter,
  "x (twitter)": iconTwitter,
};

const SocialLinks = () => {
  const { links, loading } = useSocialLinks();

  const visibleLinks = links.filter((l) => l.is_visible && l.url);

  if (loading || visibleLinks.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="flex items-center gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.6 }}
    >
      {visibleLinks.map((s) => {
        const iconSrc = s.icon_url || FALLBACK_ICONS[s.label.toLowerCase()] || "";
        return (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors duration-300"
            aria-label={s.label}
          >
            {iconSrc ? (
              <img src={iconSrc} alt={s.label} style={{ height: 29 }} className="w-auto opacity-60 hover:opacity-100 transition-opacity" />
            ) : (
              <span className="text-xs font-display tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity">
                {s.label}
              </span>
            )}
          </a>
        );
      })}
    </motion.div>
  );
};

export default SocialLinks;
