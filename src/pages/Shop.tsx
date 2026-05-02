import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import SEO from "@/components/SEO";

interface Variant {
  label: string;
  price: number | null;
}

interface ShopItem {
  id: string;
  category: "prints" | "merch";
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  main_image: string | null;
  images: string[];
  sort_order: number;
  variants: Variant[];
}

const CATEGORY_LABELS: Record<string, { en: string; jp: string }> = {
  prints: { en: "Prints & Originals", jp: "プリント" },
  merch: { en: "Merch", jp: "グッズ" },
};

const VARIANT_LABEL: Record<string, string> = {
  prints: "Paper size",
  merch: "Size",
};

const Shop = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState<boolean | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"all" | "prints" | "merch">("all");
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);

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

  useEffect(() => {
    if (!visible) return;
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .eq("visible", true)
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });
      if (!error && data) {
        setItems(
          data.map((d: any) => ({
            ...d,
            variants: Array.isArray(d.variants) ? d.variants : [],
          })) as ShopItem[]
        );
      }
      setLoading(false);
    };
    fetchItems();
  }, [visible]);

  const symbolFor = (cur: string) =>
    cur === "EUR" ? "€" : cur === "USD" ? "$" : cur === "GBP" ? "£" : cur;

  const fmt = (cur: string, n: number) => `${symbolFor(cur)}${Number(n).toFixed(0)}`;

  const formatPrice = (item: ShopItem) => {
    const prices = (item.variants || [])
      .map((v) => v.price)
      .filter((p): p is number => p !== null && p !== undefined && !isNaN(Number(p)));
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? fmt(item.currency, min) : `${fmt(item.currency, min)}–${fmt(item.currency, max)}`;
    }
    if (item.price === null || item.price === undefined) return "—";
    return fmt(item.currency, Number(item.price));
  };

  const filteredItems =
    activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  const grouped = {
    prints: filteredItems.filter((i) => i.category === "prints"),
    merch: filteredItems.filter((i) => i.category === "merch"),
  };

  const openItem = (item: ShopItem) => {
    setSelected(item);
    setImgIndex(0);
    setSelectedVariantIdx(0);
  };

  const allImages = (item: ShopItem) => {
    const arr: string[] = [];
    if (item.main_image) arr.push(item.main_image);
    item.images.forEach((u) => {
      if (u && u !== item.main_image) arr.push(u);
    });
    return arr;
  };

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

  const renderSection = (key: "prints" | "merch") => {
    const sectionItems = grouped[key];
    if (sectionItems.length === 0) return null;
    return (
      <section key={key} className="mb-16">
        <div className="flex items-baseline gap-3 mb-6 border-b border-border pb-3">
          <h2 className="text-sm font-display tracking-[0.3em] uppercase text-foreground">
            {CATEGORY_LABELS[key].en}
          </h2>
          <span className="text-xs font-jp text-muted-foreground">{CATEGORY_LABELS[key].jp}</span>
          <span className="ml-auto text-[10px] font-display tracking-widest uppercase text-muted-foreground">
            {sectionItems.length} {sectionItems.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sectionItems.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              className="group text-left flex flex-col gap-2"
            >
              <div className="aspect-[3/4] bg-muted overflow-hidden border border-border group-hover:border-foreground/40 transition-colors">
                {item.main_image ? (
                  <img
                    src={item.main_image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs font-display tracking-widest uppercase">
                    No image
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-display tracking-wider uppercase text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs font-display tracking-wider text-muted-foreground shrink-0">
                  {formatPrice(item)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-[100svh] bg-background flex flex-col">
      <SEO
        pageKey="shop"
        fallbackTitle="Shop — BIKO KU"
        fallbackDescription="Shop original prints, merch and illustrations by Viktor Ku."
        path="/shop"
      />
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border sticky top-0 bg-background z-20">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-display tracking-[0.2em] uppercase transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <p className="text-xs text-foreground font-display tracking-[0.3em] uppercase">Shop</p>
        <div className="w-16" />
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {(["all", "prints", "merch"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] font-display tracking-[0.3em] uppercase px-3 py-1.5 border transition-colors ${
                activeCategory === cat
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat].en}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border border-foreground/30 border-t-foreground animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm font-display tracking-[0.2em] uppercase text-muted-foreground/60 py-20">
            No items yet
          </p>
        ) : (
          <>
            {renderSection("prints")}
            {renderSection("merch")}
          </>
        )}
      </main>

      {selected && (() => {
        const imgs = allImages(selected);
        return (
          <div
            className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div
              className="bg-background border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto grid md:grid-cols-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-square bg-muted">
                {imgs.length > 0 ? (
                  <>
                    <img
                      src={imgs[imgIndex]}
                      alt={selected.title}
                      className="w-full h-full object-contain"
                    />
                    {imgs.length > 1 && (
                      <>
                        <button
                          onClick={() => setImgIndex((i) => (i - 1 + imgs.length) % imgs.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 border border-border flex items-center justify-center text-foreground hover:bg-background"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setImgIndex((i) => (i + 1) % imgs.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 border border-border flex items-center justify-center text-foreground hover:bg-background"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {imgs.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setImgIndex(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                i === imgIndex ? "bg-foreground" : "bg-muted-foreground/40"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs font-display uppercase">
                    No image
                  </div>
                )}
              </div>
              <div className="p-6 sm:p-8 flex flex-col gap-4">
                <p className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
                  {CATEGORY_LABELS[selected.category].en}
                </p>
                <h3 className="text-xl font-display tracking-wider uppercase text-foreground">
                  {selected.title}
                </h3>
                {(() => {
                  const variants = selected.variants || [];
                  const activeVariant = variants[selectedVariantIdx];
                  const activePrice =
                    variants.length > 0 && activeVariant && activeVariant.price !== null
                      ? fmt(selected.currency, Number(activeVariant.price))
                      : formatPrice(selected);
                  return (
                    <>
                      <p className="text-lg font-display tracking-wider text-foreground">{activePrice}</p>
                      {variants.length > 0 && (
                        <div>
                          <p className="text-[10px] font-display tracking-[0.25em] uppercase text-muted-foreground mb-2">
                            {VARIANT_LABEL[selected.category] || "Option"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {variants.map((v, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedVariantIdx(i)}
                                className={`text-[10px] font-display tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                                  i === selectedVariantIdx
                                    ? "border-foreground text-foreground"
                                    : "border-border text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {v.label}
                                {v.price !== null && (
                                  <span className="ml-1.5 text-muted-foreground/70">
                                    {fmt(selected.currency, Number(v.price))}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                {selected.description && (
                  <p className="text-sm font-body text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selected.description}
                  </p>
                )}
                <div className="mt-auto pt-4 border-t border-border">
                  <p className="text-[10px] font-display tracking-widest uppercase text-muted-foreground/60">
                    Inquiries — coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Shop;
