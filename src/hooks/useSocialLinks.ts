import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon_url: string;
  sort_order: number;
  is_visible: boolean;
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("social_links" as any)
      .select("*")
      .order("sort_order");
    if (data) setLinks(data as any as SocialLink[]);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const updateLink = async (id: string, updates: Partial<Pick<SocialLink, "label" | "url" | "icon_url" | "is_visible">>) => {
    await supabase
      .from("social_links" as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const addLink = async (label: string) => {
    const maxOrder = links.reduce((m, l) => Math.max(m, l.sort_order), -1);
    const { data } = await supabase
      .from("social_links" as any)
      .insert({ label, url: "", icon_url: "", sort_order: maxOrder + 1 } as any)
      .select()
      .single();
    if (data) setLinks((prev) => [...prev, data as any as SocialLink]);
  };

  const deleteLink = async (id: string) => {
    await supabase.from("social_links" as any).delete().eq("id", id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const swapOrder = async (idA: string, idB: string) => {
    const a = links.find((l) => l.id === idA);
    const b = links.find((l) => l.id === idB);
    if (!a || !b) return;
    await Promise.all([
      supabase.from("social_links" as any).update({ sort_order: b.sort_order } as any).eq("id", idA),
      supabase.from("social_links" as any).update({ sort_order: a.sort_order } as any).eq("id", idB),
    ]);
    setLinks((prev) =>
      prev
        .map((l) => {
          if (l.id === idA) return { ...l, sort_order: b.sort_order };
          if (l.id === idB) return { ...l, sort_order: a.sort_order };
          return l;
        })
        .sort((x, y) => x.sort_order - y.sort_order)
    );
  };

  return { links, loading, updateLink, addLink, deleteLink, swapOrder, refetch: fetchLinks };
}
