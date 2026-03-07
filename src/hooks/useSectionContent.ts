import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionContent {
  id: string;
  key: string;
  content: string;
}

export function useSectionContent() {
  const [items, setItems] = useState<SectionContent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("section_content")
      .select("id, key, content");
    if (data) setItems(data as SectionContent[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const get = (key: string) => items.find((i) => i.key === key)?.content ?? "";

  const update = async (key: string, content: string) => {
    await supabase
      .from("section_content")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("key", key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, content } : i)));
  };

  return { items, loading, get, update, refetch: fetch };
}
