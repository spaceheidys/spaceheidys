import { describe, expect, it } from "vitest";
import { secretDoorEntryTarget } from "./secretDoorEntry";

describe("visitor Secret Door entry", () => {
  it("opens the sector directly when the admin enables passwordless entry", () => {
    expect(secretDoorEntryTarget("true")).toBe("/secret");
  });

  it("keeps the password prompt when disabled or missing", () => {
    expect(secretDoorEntryTarget("false")).toBeNull();
    expect(secretDoorEntryTarget("")).toBeNull();
  });
});