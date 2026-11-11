import { expect, it } from "vitest";
import { cardSpreadEnabled } from "./cardSpreadSettings";
it("disables the three-card spread when the admin switches it off", () => {
  expect(cardSpreadEnabled("off")).toBe(false);
  expect(cardSpreadEnabled("on")).toBe(true);
  expect(cardSpreadEnabled("")).toBe(true);
});