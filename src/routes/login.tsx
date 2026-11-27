import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PageShell } from "@/components/drini/TopBar";
import { useAccount } from "@/components/drini/auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useLang } from "@/lib/i18n";
import "@/components/drini/auth-controls.css";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({ meta: [
    { title: "Sign in · DriniArranges" },
    { name: "description", content: "Sign in or create your DriniArranges account to keep your scores in the cloud." },
    { property: "og:title", content: "Sign in · DriniArranges" },
    { property: "og:description", content: "Sign in or create your DriniArranges account to keep your scores in the cloud." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Login,
});

function Login() {
  const { t } = useLang();
  const { user, ready } = useAccount();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!ready || !user) return;
    let back: string | null = new URLSearchParams(window.location.search).get("redirect");
    try { back = back ?? sessionStorage.getItem("drini:after-login"); sessionStorage.removeItem("drini:after-login"); } catch { /* ignore */ }
    void navigate({ to: back === "/studio" ? "/studio" : "/scores", replace: true });
  }, [ready, user, navigate]);
  const changeMode = (next: typeof mode) => { setMode(next); setMessage(""); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (mode === "up" && password.length < 8) { setMessage(t("auth.passwordShort")); return; }
    setBusy(true); setMessage("");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        setMessage(t(error ? "auth.resetError" : "auth.resetSent"));
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        setMessage(t(error ? "auth.signupError" : "auth.checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setMessage(t("auth.error"));
      }
    } catch { setMessage(t(mode === "forgot" ? "auth.resetError" : mode === "up" ? "auth.signupError" : "auth.error")); }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/login` });
      if (result.error) setMessage(t("auth.error"));
    } catch { setMessage(t("auth.error")); }
    finally { setBusy(false); }
  }
  return <PageShell><main className="mx-auto w-full max-w-md px-4 py-12">
    <div className="card-paper p-6 sm:p-8">
      <h1 className="text-3xl text-ink">{t(mode === "forgot" ? "auth.resetTitle" : mode === "up" ? "auth.signUp" : "auth.signIn")}</h1>
      {mode !== "forgot" && <div className="mt-5 flex gap-2">
        <Button variant="ghost" className="btn btn-ghost flex-1" aria-pressed={mode === "in"} onClick={() => changeMode("in")}>{t("auth.signIn")}</Button>
        <Button variant="ghost" className="btn btn-ghost flex-1" aria-pressed={mode === "up"} onClick={() => changeMode("up")}>{t("auth.signUp")}</Button>
      </div>}
      <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
        <div><label htmlFor="auth-email" className="label-caps">{t("auth.email")}</label><input id="auth-email" className="field mt-2 w-full" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {mode !== "forgot" && <div><label htmlFor="auth-password" className="label-caps">{t("auth.password")}</label><input id="auth-password" className="field mt-2 w-full" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} required minLength={mode === "up" ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
        {message && <p role="status" className="text-sm text-ink">{message}</p>}
        <Button type="submit" className="btn btn-primary w-full" disabled={busy}>{t(busy ? "auth.working" : mode === "forgot" ? "auth.sendReset" : mode === "up" ? "auth.signUp" : "auth.signIn")}</Button>
      </form>
      {mode !== "forgot" && <Button variant="ghost" className="btn google-sign-in mt-3 w-full" disabled={busy} onClick={() => void google()}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="!size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>{t("auth.google")}
      </Button>}
      <Button variant="ghost" className="btn btn-ghost mt-4 w-full whitespace-normal" onClick={() => changeMode(mode === "forgot" ? "in" : "forgot")}>{t(mode === "forgot" ? "auth.back" : "auth.forgot")}</Button>
    </div>
  </main></PageShell>;
}