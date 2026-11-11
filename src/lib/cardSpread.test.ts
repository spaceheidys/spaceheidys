import { describe, it, expect } from "vitest";
import { isCardDrag, placeSpreadCard, turnSpreadCard, spreadFull, spreadComplete, type CardSpread } from "./cardSpread";
const card = { front: "chosen-image", back: "back", turned: false };
function filled() {
  let spread: CardSpread = {};
  for (const slot of ["left", "top", "right"] as const) spread = placeSpreadCard(spread, slot, card);
  return spread;
}
describe("three-card spread", () => {
  it("keeps clicks and small pointer movements as ordinary card flips", () => {
    expect(isCardDrag(0, 0)).toBe(false);
    expect(isCardDrag(3, 4)).toBe(false);
    expect(isCardDrag(8, 0)).toBe(true);
  });
  it("hides the deck only when all three places are filled", () => {
    expect(spreadFull(placeSpreadCard({}, "left", card))).toBe(false);
    expect(spreadFull(filled())).toBe(true);
  });
  it("keeps the chosen image and does not replace occupied places", () => {
    const spread = placeSpreadCard({}, "top", card);
    expect(spread.top?.front).toBe("chosen-image");
    expect(placeSpreadCard(spread, "top", { ...card, front: "other" })).toBe(spread);
  });
  it("waits for all three cards to turn before returning the deck", () => {
    let spread = turnSpreadCard(filled(), "left");
    spread = turnSpreadCard(spread, "right");
    expect(spreadComplete(spread)).toBe(false);
    expect(spreadComplete(turnSpreadCard(spread, "top"))).toBe(true);
  });
  it("does not turn pinned cards while the deck is still being dealt", () => {
    const spread = placeSpreadCard({}, "left", card);
    expect(turnSpreadCard(spread, "left")).toBe(spread);
  });
});