import { describe, expect, it } from "vitest";
import { isAboutMasked } from "./aboutAccess";

describe("ABOUT access appearance", () => {
  it("masks ABOUT when the admin switch is on", () => {
    expect(isAboutMasked("about", "true")).toBe(true);
  });
  it("restores ABOUT when the admin switch is off", () => {
    expect(isAboutMasked("about", "false")).toBe(false);
  });
  it("keeps ABOUT unchanged before the setting is configured", () => {
    expect(isAboutMasked("about", "")).toBe(false);
  });
  it.each(["contact", "shop"])("does not mask %s", (section) => {
    expect(isAboutMasked(section, "true")).toBe(false);
  });
});