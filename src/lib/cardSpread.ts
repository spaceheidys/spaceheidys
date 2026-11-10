export const CARD_SLOTS = ["left", "top", "right"] as const;
export type CardSlot = typeof CARD_SLOTS[number];
export interface SpreadCard { front: string; back: string; turned: boolean }
export type CardSpread = Partial<Record<CardSlot, SpreadCard>>;
export const spreadFull = (spread: CardSpread) => CARD_SLOTS.every(slot => Boolean(spread[slot]));
export const spreadComplete = (spread: CardSpread) => CARD_SLOTS.every(slot => spread[slot]?.turned === true);
export function placeSpreadCard(spread: CardSpread, slot: CardSlot, card: SpreadCard): CardSpread {
  return spread[slot] ? spread : { ...spread, [slot]: { ...card, turned: false } };
}
export function turnSpreadCard(spread: CardSpread, slot: CardSlot): CardSpread {
  const card = spread[slot];
  return !spreadFull(spread) || !card || card.turned ? spread : { ...spread, [slot]: { ...card, turned: true } };
}