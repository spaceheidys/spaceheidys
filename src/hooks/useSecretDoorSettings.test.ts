import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser }, rpc: mocks.rpc },
}));

import { verifySecretDoorAdminAccess } from "./useSecretDoorSettings";

describe("Secret Door admin passwordless entry", () => {
  beforeEach(() => vi.resetAllMocks());

  it("allows a server-verified administrator without a door password", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    expect(await verifySecretDoorAdminAccess()).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("has_role", { _user_id: "admin-id", _role: "admin" });
  });

  it("rejects a signed-in non-administrator", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-id" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect(await verifySecretDoorAdminAccess()).toBe(false);
  });

  it("rejects signed-out visitors without querying roles", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await verifySecretDoorAdminAccess()).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed when role verification fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: new Error("Unavailable") });
    expect(await verifySecretDoorAdminAccess()).toBe(false);
  });
});