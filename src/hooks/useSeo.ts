import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SeoSetting {
  id: string;
  page_key: string;
  title: string;
  description: string;
  og_image_url: string;
}

/**
 * Fetches SEO setting for a single page key, falling back to "default".
 */
export const useSeo = (pageKey: string) => {
  const [seo, setSeo] = useState<SeoSetting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!pageKey) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      const { data } = await supabase
        .from("seo_settings")
        .select("*")
        .in("page_key", [pageKey, "default"]);

      if (cancelled) return;

      if (data && data.length > 0) {
        const exact = data.find((d) => d.page_key === pageKey);
        const fallback = data.find((d) => d.page_key === "default");
        setSeo((exact ?? fallback) as SeoSetting);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  return { seo, loading };
};

/**
 * Fetches all SEO settings (for admin page).
 */
export const useAllSeo = () => {
  const [items, setItems] = useState<SeoSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seo_settings")
      .select("*")
      .order("page_key");
    if (data) setItems(data as SeoSetting[]);
    setLoading(false);
  };

  useEffect(() => {
    refetch();
  }, []);

  return { items, loading, refetch };
};