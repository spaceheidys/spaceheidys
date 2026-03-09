import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  icon_url: string;
  sort_order: number;
  is_visible: boolean;
}

const SkillsDisplay = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [skillsRes, contentRes] = await Promise.all([
        supabase.from("skills").select("*").eq("is_visible", true).order("sort_order", { ascending: true }),
        supabase.from("section_content").select("content").eq("key", "skills_description").single(),
      ]);
      if (!skillsRes.error && skillsRes.data) setSkills(skillsRes.data as Skill[]);
      if (!contentRes.error && contentRes.data) setDescription(contentRes.data.content);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-white/40 text-xs tracking-widest font-display uppercase">No skills added</span>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full h-full flex flex-col items-center justify-center gap-6 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {skills.map((skill, i) => (
          <motion.div
            key={skill.id}
            className="flex flex-col items-center gap-2 group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.05 }}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center p-2 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
              {skill.icon_url ? (
                <img src={skill.icon_url} alt={skill.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-white/30 text-[8px] font-display">{skill.name.slice(0,2)}</span>
              )}
            </div>
            <span className="text-[8px] sm:text-[9px] text-white/50 group-hover:text-white/80 transition-colors duration-300 font-display tracking-wider uppercase text-center max-w-[60px] truncate">
              {skill.name}
            </span>
          </motion.div>
        ))}
      </div>
      {description && (
        <motion.p
          className="text-xs sm:text-sm text-white/60 font-body text-center max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
};

export default SkillsDisplay;
