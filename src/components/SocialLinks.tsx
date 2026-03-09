import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon_url: string;
  is_visible: boolean;
  sort_order: number;
}

const SocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    supabase
      .from("social_links")
      .select("id, label, url, icon_url, is_visible, sort_order")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setLinks(data as SocialLink[]);
      });
  }, []);

  // Only show links that have a profile URL (not share-only buttons)
  const profileLinks = links.filter((l) => l.url.trim() !== "");

  if (profileLinks.length === 0) return null;

  return (
    <motion.div
      className="flex items-center gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.6 }}
    >
      {profileLinks.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors duration-300"
          aria-label={s.label}
        >
          {s.icon_url ? (
            <img
              src={s.icon_url}
              alt={s.label}
              style={{ height: 29 }}
              className="w-auto opacity-60 hover:opacity-100 transition-opacity"
            />
          ) : (
            <span className="text-xs font-display tracking-widest opacity-60 hover:opacity-100 transition-opacity">
              {s.label}
            </span>
          )}
        </a>
      ))}
    </motion.div>
  );
};

export default SocialLinks;
