import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NavButton {
  id: string;
  key: string;
  label: string;
  label_jp: string;
  is_visible: boolean;
  sort_order: number;
}

export function useNavButtons() {
  const [buttons, setButtons] = useState<NavButton[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchButtons = async () => {
    const { data } = await supabase
      .from("nav_buttons")
      .select("*")
      .order("sort_order");
    if (data) setButtons(data as NavButton[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchButtons();
  }, []);

  const updateButton = async (id: string, updates: Partial<Pick<NavButton, "label" | "label_jp" | "is_visible" | "sort_order">>) => {
    await supabase
      .from("nav_buttons")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    await fetchButtons();
  };

  const swapOrder = async (idA: string, idB: string) => {
    const a = buttons.find(b => b.id === idA);
    const b = buttons.find(b2 => b2.id === idB);
    if (!a || !b) return;
    await Promise.all([
      supabase.from("nav_buttons").update({ sort_order: b.sort_order, updated_at: new Date().toISOString() }).eq("id", idA),
      supabase.from("nav_buttons").update({ sort_order: a.sort_order, updated_at: new Date().toISOString() }).eq("id", idB),
    ]);
    await fetchButtons();
  };

  return { buttons, loading, updateButton, swapOrder, refetch: fetchButtons };
}
