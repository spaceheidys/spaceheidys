import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Capability {
  id: string;
  label: string;
  sort_order: number;
  is_visible: boolean;
}

export function useCapabilities() {
  const [items, setItems] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("capabilities")
      .select("id, label, sort_order, is_visible")
      .order("sort_order", { ascending: true });
    if (data) setItems(data as Capability[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  return { items, setItems, loading, refetch: fetchItems };
}
