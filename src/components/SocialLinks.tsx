import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface SocialLinkData {
  id: string;
  label: string;
  url: string;
  icon_url: string;
  is_visible: boolean;
  sort_order: number;
}

const SocialLinks = () => {
  const [links, setLinks] = useState<SocialLinkData[]>([]);

  useEffect(() => {
    const fetchLinks = async () => {
      const { data } = await supabase
        .from("social_links")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order");
      if (data) setLinks(data);
    };
    fetchLinks();
  }, []);

  const visibleLinks = links.filter((l) => l.url && l.icon_url);

  if (visibleLinks.length === 0) return null;

  return (
    <motion.div
      className="flex items-center gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.6 }}
    >
      {visibleLinks.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors duration-300"
          aria-label={s.label}
        >
          <img src={s.icon_url} alt={s.label} style={{ height: 29 }} className="w-auto opacity-60 hover:opacity-100 transition-opacity invert" />
        </a>
      ))}
    </motion.div>
  );
};

export default SocialLinks;
