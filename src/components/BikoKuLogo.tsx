import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import biko01 from "@/assets/biko_01.svg";
import biko02 from "@/assets/biko_02.svg";
import biko03 from "@/assets/biko_03.svg";

const fallbackLogos = [biko01, biko02, biko03];

const BikoKuLogo = () => {
  const [logos, setLogos] = useState<string[]>(fallbackLogos);
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(6);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [bgRes, fadeRes, durationRes] = await Promise.all([
        supabase.from("page_backgrounds").select("image_url").eq("section", "main_logos").eq("is_active", true).order("sort_order"),
        supabase.from("section_content").select("content").eq("key", "logo_fade_enabled").single(),
        supabase.from("section_content").select("content").eq("key", "logo_fade_seconds").single(),
      ]);
      if (bgRes.data && bgRes.data.length > 0) {
        setLogos(bgRes.data.map((b) => b.image_url));
      }
      if (fadeRes.data?.content === "true") {
        setFadeEnabled(true);
      }
      const sec = parseInt(durationRes.data?.content || "6");
      if (sec > 0) setFadeDuration(sec);
      setLoaded(true);
    };
    fetchData();
  }, []);

  const selectedLogo = useMemo(
    () => logos[Math.floor(Math.random() * logos.length)],
    [logos]
  );

  if (!loaded) return null;

  return (
    <motion.div
      className="flex items-center justify-center select-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        fadeEnabled
          ? { opacity: [0, 1, 1, 0], scale: 1 }
          : { opacity: 1, scale: 1 }
      }
      transition={
        fadeEnabled
          ? {
              delay: 0.3,
              duration: fadeDuration,
              times: [0, 0.1, 0.6, 1],
              ease: "easeInOut",
            }
          : { delay: 0.3, duration: 0.8, ease: "easeOut" }
      }
    >
      <img
        src={selectedLogo}
        alt="BIKO KU logo"
        className="h-[200px] sm:h-[300px] md:h-[360px] lg:h-[420px] w-auto object-scale-down"
      />
    </motion.div>
  );
};

export default BikoKuLogo;
