import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, type ComponentType, type ReactNode } from "react";

const api = vi.hoisted(() => ({
  signUp: vi.fn(), signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), getUser: vi.fn(), google: vi.fn(), navigate: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: api } }));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: { signInWithOAuth: api.google } } }));
vi.mock("@/components/drini/TopBar", () => ({ PageShell: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/drini/auth", () => ({ useAccount: () => ({ user: null, ready: true }) }));
vi.mock("@tanstack/react-router", async (original) => {
  const router = await original<typeof import("@tanstack/react-router")>();
  return { ...router, useNavigate: () => api.navigate, Link: ({ children }: { children: ReactNode }) => createElement("a", {}, children) };
});

async function show(path: "login" | "reset-password") {
  const module = path === "login" ? await import("@/routes/login") : await import("@/routes/reset-password");
  const Component = module.Route.options.component as ComponentType;
  let result: ReturnType<typeof render> | undefined;
  await act(async () => { result = render(createElement(Component)); });
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear(); sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  api.signUp.mockResolvedValue({ data: { session: null }, error: null });
  api.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  api.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  api.updateUser.mockResolvedValue({ data: {}, error: null });
  api.getUser.mockResolvedValue({ data: { user: { id: "recovery-user" } }, error: null });
  api.google.mockResolvedValue({ redirected: true, error: null });
});

describe("Account form behavior", () => {
  it("signs up with a real email and waits for email confirmation instead of treating signup as signed in", async () => {
    await show("login");
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "player@example.com" } });
    fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "a-valid-password" } });
    fireEvent.submit(screen.getByLabelText("Email").closest("form") as HTMLFormElement);
    await waitFor(() => expect(api.signUp).toHaveBeenCalledWith({ email: "player@example.com", password: "a-valid-password", options: { emailRedirectTo: window.location.origin } }));
    expect(api.navigate).not.toHaveBeenCalled();
  });
  it("uses email and password for sign in", async () => {
    await show("login");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "player@example.com" } });
    fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "a-valid-password" } });
    fireEvent.submit(screen.getByLabelText("Email").closest("form") as HTMLFormElement);
    await waitFor(() => expect(api.signInWithPassword).toHaveBeenCalledWith({ email: "player@example.com", password: "a-valid-password" }));
  });
  it("sends password recovery back to the public reset-password page", async () => {
    await show("login");
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "player@example.com" } });
    fireEvent.submit(screen.getByLabelText("Email").closest("form") as HTMLFormElement);
    await waitFor(() => expect(api.resetPasswordForEmail).toHaveBeenCalledWith("player@example.com", { redirectTo: `${window.location.origin}/reset-password` }));
  });
  it("calls managed Google sign-in with a public same-origin return page", async () => {
    await show("login");
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(api.google).toHaveBeenCalledWith("google", { redirect_uri: `${window.location.origin}/login` }));
  });
  it("does not allow password update without a recovery link", async () => {
    await show("reset-password");
    expect(screen.queryByLabelText("New password", { exact: true })).toBeNull();
    expect(api.getUser).not.toHaveBeenCalled();
    expect(api.updateUser).not.toHaveBeenCalled();
  });
  it("updates the recovery password without sending current_password", async () => {
    window.history.replaceState({}, "", "/reset-password#type=recovery");
    await show("reset-password");
    const password = await screen.findByLabelText("New password", { exact: true });
    fireEvent.change(password, { target: { value: "new-valid-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new-valid-password" } });
    await act(async () => { fireEvent.submit(password.closest("form") as HTMLFormElement); });
    await waitFor(() => expect(api.updateUser).toHaveBeenCalledWith({ password: "new-valid-password" }));
    await waitFor(() => expect(sessionStorage.getItem("drini:password-recovery")).toBeNull());
  });
});