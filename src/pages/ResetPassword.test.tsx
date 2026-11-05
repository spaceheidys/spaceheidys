import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(), updateUser: vi.fn(), signOut: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import ResetPassword from "./ResetPassword";

afterEach(() => { cleanup(); window.location.hash = ""; vi.clearAllMocks(); });
describe("password recovery", () => {
  it("does not allow a signed-in user without a recovery link to reset a password", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "existing-user" } }, error: null });
    render(<MemoryRouter><ResetPassword /></MemoryRouter>);
    await screen.findByText(/reset link is missing/);
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("uses a verified recovery session to set a new password without the old password", async () => {
    window.location.hash = "type=recovery";
    auth.getUser.mockResolvedValue({ data: { user: { id: "existing-user" } }, error: null });
    auth.updateUser.mockResolvedValue({ error: null });
    auth.signOut.mockResolvedValue({ error: null });
    render(<MemoryRouter><ResetPassword /></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText("New password"), { target: { value: "test-only-new-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "test-only-new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));
    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: "test-only-new-password" }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
  });
});