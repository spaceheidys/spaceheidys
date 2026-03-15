import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionContent {
  id: string;
  key: string;
  content: string;
  display_duration: number | null;
}

export function useSectionContent() {
  const [items, setItems] = useState<SectionContent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("section_content")
      .select("id, key, content, display_duration");
    if (data) setItems(data as SectionContent[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const get = (key: string) => items.find((i) => i.key === key)?.content ?? "";

  const getDuration = (key: string): number | null => {
    const item = items.find((i) => i.key === key);
    return item?.display_duration ?? null;
  };

  const update = async (key: string, content: string) => {
    await supabase
      .from("section_content")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("key", key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, content } : i)));
  };

  const updateDuration = async (key: string, duration: number | null) => {
    await supabase
      .from("section_content")
      .update({ display_duration: duration, updated_at: new Date().toISOString() } as any)
      .eq("key", key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, display_duration: duration } : i)));
  };

  return { items, loading, get, getDuration, update, updateDuration, refetch: fetch };
}
