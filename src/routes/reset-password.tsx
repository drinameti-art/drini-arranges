import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PageShell } from "@/components/drini/TopBar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password · DriniArranges" },
    { name: "description", content: "Securely reset the password for your DriniArranges account." },
    { property: "og:title", content: "Reset password · DriniArranges" },
    { property: "og:description", content: "Securely reset the password for your DriniArranges account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: ResetPassword,
});

function ResetPassword() {
  const { t } = useLang();
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    const verify = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (active) setValid(!error && Boolean(data.user));
    };
    const recovery = () => { void verify(); };
    window.addEventListener("drini:recovery", recovery);
    // Recovery links carry type=recovery; remember it before the auth client consumes the hash.
    if (new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery") {
      sessionStorage.setItem("drini:password-recovery", "1");
      void verify();
    } else if (sessionStorage.getItem("drini:password-recovery") === "1") void verify();
    return () => { active = false; window.removeEventListener("drini:recovery", recovery); };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    if (password !== confirm) { setMessage(t("auth.passwordMismatch")); return; }
    if (password.length < 8) { setMessage(t("auth.passwordShort")); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage(t("auth.updateError"));
      else { setDone(true); sessionStorage.removeItem("drini:password-recovery"); }
    } catch { setMessage(t("auth.updateError")); }
    finally { setBusy(false); }
  }
  return <PageShell><main className="mx-auto w-full max-w-md px-4 py-12"><div className="card-paper p-6 sm:p-8">
    <h1 className="text-3xl text-ink">{t("auth.resetTitle")}</h1>
    {done ? <p role="status" className="mt-5 text-ink">{t("auth.passwordUpdated")}</p> : valid ? <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
      <div><label htmlFor="new-password" className="label-caps">{t("auth.newPassword")}</label><input id="new-password" type="password" autoComplete="new-password" className="field mt-2 w-full" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <div><label htmlFor="confirm-password" className="label-caps">{t("auth.confirmPassword")}</label><input id="confirm-password" type="password" autoComplete="new-password" className="field mt-2 w-full" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
      {message && <p role="status" className="text-sm text-ink">{message}</p>}
      <Button type="submit" className="btn btn-primary w-full whitespace-normal" disabled={busy}>{t(busy ? "auth.working" : "auth.updatePassword")}</Button>
    </form> : <p className="mt-5 text-graphite">{t("auth.resetInvalid")}</p>}
    <Button asChild variant="ghost" className="btn btn-ghost mt-5 w-full"><Link to="/login">{t("auth.back")}</Link></Button>
  </div></main></PageShell>;
}