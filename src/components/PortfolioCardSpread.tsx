import { useCallback, useEffect, useRef, useState, type ComponentProps, type PointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import PortfolioCard from "@/components/PortfolioCard";
import { Button } from "@/components/ui/button";
import { CARD_SLOTS, placeSpreadCard, turnSpreadCard, spreadFull, spreadComplete, type CardSlot, type CardSpread } from "@/lib/cardSpread";

type Props = ComponentProps<typeof PortfolioCard>;
const positions = {
  left: { left: "21%", top: "53%", rotate: -38 },
  top: { left: "50%", top: "23%", rotate: 0 },
  right: { left: "79%", top: "53%", rotate: 38 },
};

export default function PortfolioCardSpread(props: Props) {
  const [spread, setSpread] = useState<CardSpread>({});
  const [deckKey, setDeckKey] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<CardSlot | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const targets = useRef<Partial<Record<CardSlot, HTMLDivElement>>>({});
  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const images = useRef({ front: "", back: "" });
  const latestProps = useRef(props);
  latestProps.current = props;
  const reduceMotion = useReducedMotion();
  const full = spreadFull(spread);
  const complete = spreadComplete(spread);
  const captureImages = useCallback((front: string, back: string) => { images.current = { front, back }; }, []);
  const reset = useCallback(() => {
    setSpread({});
    setDeckKey(key => key + 1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    setHover(null);
    gesture.current = null;
    latestProps.current.onFlip?.(true);
    latestProps.current.onFrontTextChange?.("");
  }, []);

  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(reset, reduceMotion ? 150 : 850);
    return () => window.clearTimeout(timer);
  }, [complete, reset, reduceMotion]);

  useEffect(() => {
    const section = root.current?.closest("#portfolio-section");
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) reset();
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [reset]);

  function hitSlot(x: number, y: number): CardSlot | null {
    for (const slot of CARD_SLOTS) {
      if (spread[slot]) continue;
      const box = targets.current[slot]?.getBoundingClientRect();
      if (box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return slot;
    }
    return null;
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (props.flipped !== false || full || event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY, moved: false };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const startPoint = gesture.current;
    if (!startPoint) return;
    const x = event.clientX - startPoint.x;
    const y = event.clientY - startPoint.y;
    if (!startPoint.moved && Math.hypot(x, y) < 8) return;
    startPoint.moved = true;
    suppressClick.current = true;
    setDragging(true);
    setOffset({ x, y });
    setHover(hitSlot(event.clientX, event.clientY));
  }
  function finish(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const startPoint = gesture.current;
    if (!startPoint) return;
    gesture.current = null;
    const slot = !cancelled && startPoint.moved ? hitSlot(event.clientX, event.clientY) : null;
    if (slot) {
      setSpread(previous => placeSpreadCard(previous, slot, { ...images.current, turned: false }));
      setDeckKey(key => key + 1);
      props.onFlip?.(true);
      props.onFrontTextChange?.("");
    }
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    setHover(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div ref={root} className="relative w-full h-full select-none" aria-label="Portfolio card spread">
      {CARD_SLOTS.map(slot => {
        const card = spread[slot];
        const position = positions[slot];
        return (
          <div key={slot} ref={element => { if (element) targets.current[slot] = element; }}
            data-card-slot={slot}
            className="absolute w-[27%] sm:w-[21%] max-w-[230px] aspect-[2/3] -translate-x-1/2 -translate-y-1/2"
            style={{ left: position.left, top: position.top }}>
            <AnimatePresence>
              {!card && dragging && (
                <motion.div className={`absolute inset-0 flex items-center justify-center border border-dashed rounded-lg ${hover === slot ? "border-primary bg-primary/15 text-primary" : "border-foreground/30 bg-background/20 text-foreground/60"}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1, scale: hover === slot ? 1.06 : 1 }} exit={{ opacity: 0 }}>
                  <Plus className="h-7 w-7" />
                </motion.div>
              )}
              {card && (
                <motion.div className="absolute inset-0" style={{ perspective: 1000 }}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: complete ? 0 : 1, scale: complete ? 0.9 : 1, rotate: position.rotate }}
                  exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.4, delay: complete ? 0.6 : 0 }}>
                  <Button variant="ghost" disabled={!full || card.turned} aria-label={`Turn ${slot} card`}
                    onClick={() => setSpread(previous => turnSpreadCard(previous, slot))}
                    className="block relative w-full h-full p-0 rounded-lg bg-transparent hover:bg-transparent disabled:opacity-100 overflow-visible">
                    <motion.span className="block relative w-full h-full" style={{ transformStyle: "preserve-3d" }}
                      animate={{ rotateY: card.turned ? -180 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.6 }}>
                      <img src={card.front} alt={`${slot} chosen card`} draggable={false} className="absolute inset-0 w-full h-full object-cover rounded-lg border border-foreground/30" style={{ backfaceVisibility: "hidden" }} />
                      <img src={card.back} alt="Card back" draggable={false} className="absolute inset-0 w-full h-full object-cover rounded-lg border border-foreground/30" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
                    </motion.span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <AnimatePresence>
        {!full && (
          <motion.div key="deck" className="absolute left-1/2 top-[66%] w-[34%] sm:w-[25%] max-w-[250px] aspect-[2/3] -translate-x-1/2 -translate-y-1/2 z-20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`w-full h-full ${props.flipped === false ? "touch-none cursor-grab active:cursor-grabbing" : "touch-pan-y"}`}
              animate={{ x: offset.x, y: offset.y, scale: dragging ? 0.9 : 1 }}
              transition={{ duration: dragging || reduceMotion ? 0 : 0.3 }}
              onPointerDown={start} onPointerMove={move} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
              onClickCapture={event => { if (suppressClick.current) { event.stopPropagation(); event.preventDefault(); suppressClick.current = false; } }}>
              <PortfolioCard key={deckKey} {...props} onVisibleImagesChange={captureImages} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}