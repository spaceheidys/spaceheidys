import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

const Shop = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("section_content")
        .select("content")
        .eq("key", "shop_visible")
        .maybeSingle();
      setVisible(data?.content === "true");
    };
    check();
  }, []);

  if (visible === null) {
    return (
      <div className="min-h-[100svh] bg-background flex items-center justify-center">
        <div className="w-5 h-5 border border-foreground/30 border-t-foreground animate-spin" />
      </div>
    );
  }

  if (!visible) {
    return (
      <div className="min-h-[100svh] bg-background flex flex-col items-center justify-center gap-6 px-4">
        <p className="text-xs text-muted-foreground font-display tracking-[0.3em] uppercase text-center">
          Shop is currently unavailable
        </p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-display tracking-[0.2em] uppercase transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background flex flex-col">
      <SEO
        pageKey="shop"
        fallbackTitle="Shop — BIKO KU"
        fallbackDescription="Shop original prints and illustrations by Viktor Ku."
        path="/shop"
      />
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-display tracking-[0.2em] uppercase transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <p className="text-xs text-foreground font-display tracking-[0.3em] uppercase">Shop</p>
        <div className="w-16" />
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground/60 font-display tracking-[0.2em] uppercase">
          Coming soon
        </p>
      </div>
    </div>
  );
};

export default Shop;
