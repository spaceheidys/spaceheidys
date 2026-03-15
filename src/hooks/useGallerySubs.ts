import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GallerySub {
  en: string;
  jp: string;
}

const DEFAULT_SUBS: GallerySub[] = [
  { en: "VECTOR", jp: "ベクター" },
  { en: "DIGITAL", jp: "デジタル" },
  { en: "AI", jp: "エーアイ" },
  { en: "SKETCHES", jp: "スケッチ" },
];

export function useGallerySubs() {
  const [subs, setSubs] = useState<GallerySub[]>(DEFAULT_SUBS);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("section_content")
      .select("content")
      .eq("key", "gallery_subs")
      .single();
    if (data?.content) {
      try {
        const parsed = JSON.parse(data.content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubs(parsed);
        }
      } catch {}
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (newSubs: GallerySub[]) => {
    const json = JSON.stringify(newSubs);
    const { data: existing } = await supabase
      .from("section_content")
      .select("id")
      .eq("key", "gallery_subs")
      .single();

    if (existing) {
      await supabase
        .from("section_content")
        .update({ content: json, updated_at: new Date().toISOString() })
        .eq("key", "gallery_subs");
    } else {
      await supabase
        .from("section_content")
        .insert({ key: "gallery_subs", content: json });
    }
    setSubs(newSubs);
  };

  return { subs, loading, save, refetch: fetch };
}
