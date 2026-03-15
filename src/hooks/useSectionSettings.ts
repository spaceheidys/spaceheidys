import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionVisibility {
  gallery: boolean;
  projects: boolean;
  skills: boolean;
  archive: boolean;
  about: boolean;
  contact_title: boolean;
  contact_body: boolean;
  contact_email: boolean;
  share: boolean;
}

const DEFAULT: SectionVisibility = { gallery: true, projects: true, skills: true, archive: true, about: true, contact_title: true, contact_body: true, contact_email: true, share: true };

export function useSectionSettings() {
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("section_settings" as any)
      .select("section, is_visible");
    if (data) {
      const v = { ...DEFAULT };
      (data as any[]).forEach((row) => {
        if (row.section in v) {
          (v as any)[row.section] = row.is_visible;
        }
      });
      setVisibility(v);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggle = async (section: keyof SectionVisibility) => {
    const newVal = !visibility[section];
    setVisibility((prev) => ({ ...prev, [section]: newVal }));
    await supabase
      .from("section_settings" as any)
      .update({ is_visible: newVal, updated_at: new Date().toISOString() } as any)
      .eq("section", section);
  };

  return { visibility, loading, toggle, refetch: fetchSettings };
}
