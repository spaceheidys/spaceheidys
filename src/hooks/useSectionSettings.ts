import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionSetting {
  section: string;
  is_visible: boolean;
  sort_order: number;
  label: string;
  label_jp: string;
}

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
  const [sections, setSections] = useState<SectionSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("section_settings" as any)
      .select("section, is_visible, sort_order, label, label_jp")
      .order("sort_order", { ascending: true });
    if (data) {
      const v = { ...DEFAULT };
      const secs: SectionSetting[] = [];
      (data as any[]).forEach((row) => {
        if (row.section in v) {
          (v as any)[row.section] = row.is_visible;
        }
        secs.push({
          section: row.section,
          is_visible: row.is_visible,
          sort_order: row.sort_order ?? 0,
          label: row.label || row.section.toUpperCase(),
          label_jp: row.label_jp || '',
        });
      });
      setVisibility(v);
      setSections(secs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggle = async (section: keyof SectionVisibility) => {
    const newVal = !visibility[section];
    setVisibility((prev) => ({ ...prev, [section]: newVal }));
    setSections((prev) => prev.map((s) => s.section === section ? { ...s, is_visible: newVal } : s));
    await supabase
      .from("section_settings" as any)
      .update({ is_visible: newVal, updated_at: new Date().toISOString() } as any)
      .eq("section", section);
  };

  const updateLabel = async (section: string, label: string, label_jp: string) => {
    setSections((prev) => prev.map((s) => s.section === section ? { ...s, label, label_jp } : s));
    await supabase
      .from("section_settings" as any)
      .update({ label, label_jp, updated_at: new Date().toISOString() } as any)
      .eq("section", section);
  };

  const reorder = async (reordered: SectionSetting[]) => {
    setSections(reordered);
    const updates = reordered.map((s, idx) =>
      supabase
        .from("section_settings" as any)
        .update({ sort_order: idx, updated_at: new Date().toISOString() } as any)
        .eq("section", s.section)
    );
    await Promise.all(updates);
  };

  return { visibility, sections, loading, toggle, updateLabel, reorder, refetch: fetchSettings };
}
