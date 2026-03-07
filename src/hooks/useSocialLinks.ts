import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon_url: string;
  is_visible: boolean;
  sort_order: number;
}

export const useSocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("social_links")
      .select("*")
      .order("sort_order");
    if (data) setLinks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateLink = async (id: string, updates: Partial<Pick<SocialLink, "label" | "url" | "icon_url" | "is_visible">>) => {
    const { error } = await supabase
      .from("social_links")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    }
    return error;
  };

  const addLink = async (label: string) => {
    const maxOrder = links.reduce((m, l) => Math.max(m, l.sort_order), -1);
    const { error } = await supabase
      .from("social_links")
      .insert({ label, url: "", icon_url: "", sort_order: maxOrder + 1 });
    if (!error) await fetch();
    return error;
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (!error) setLinks((prev) => prev.filter((l) => l.id !== id));
    return error;
  };

  const swapOrder = async (idA: string, idB: string) => {
    const a = links.find((l) => l.id === idA);
    const b = links.find((l) => l.id === idB);
    if (!a || !b) return;
    const { error: e1 } = await supabase.from("social_links").update({ sort_order: b.sort_order }).eq("id", idA);
    const { error: e2 } = await supabase.from("social_links").update({ sort_order: a.sort_order }).eq("id", idB);
    if (!e1 && !e2) {
      setLinks((prev) =>
        prev.map((l) => {
          if (l.id === idA) return { ...l, sort_order: b.sort_order };
          if (l.id === idB) return { ...l, sort_order: a.sort_order };
          return l;
        }).sort((x, y) => x.sort_order - y.sort_order)
      );
    }
  };

  return { links, loading, updateLink, addLink, deleteLink, swapOrder, refetch: fetch };
};
