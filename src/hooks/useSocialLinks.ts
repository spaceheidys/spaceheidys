import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon_url: string;
  is_visible: boolean;
  sort_order: number;
  share_url_template: string;
}

let cache: SocialLink[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 min

export const useSocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL) {
      setLinks(cache);
      setLoading(false);
      return;
    }
    supabase
      .from("social_links")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) {
          cache = data as SocialLink[];
          cacheTime = Date.now();
          setLinks(cache);
        }
        setLoading(false);
      });
  }, []);

  return { links, loading };
};

/** Build a share URL from a template ({url} and {title} placeholders) */
export const buildShareUrl = (template: string, url: string, title: string): string => {
  return template
    .replace("{url}", encodeURIComponent(url))
    .replace("{title}", encodeURIComponent(title));
};

/** Invalidate cache so next useSocialLinks call re-fetches */
export const invalidateSocialLinksCache = () => {
  cache = null;
  cacheTime = 0;
};
