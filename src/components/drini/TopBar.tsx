import { Footer } from "./Legal";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";
import { FREE_PER_MONTH, useFreeLeft } from "./usage";

const nav = [
  { to: "/studio", label: "nav.studio" },
  { to: "/scores", label: "nav.scores" },
  { to: "/templates", label: "nav.templates" },
  { to: "/pricing", label: "nav.pricing" },
] as const;

/** Light / dark switch; the choice is remembered in this browser. */
function ThemeToggle() {
  const { t } = useLang();
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("drini.theme", next ? "dark" : "light"); } catch { /* private mode */ }
  };
  return (
    <button type="button" onClick={flip} aria-label={dark ? t("theme.light") : t("theme.dark")} title={dark ? t("theme.light") : t("theme.dark")}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-paper text-graphite transition-colors hover:text-ink">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function TopBar() {
  const { t, lang, setLang } = useLang();
  const left = useFreeLeft();
  return (
    <header className="border-b border-border bg-paper">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-4 py-3 md:px-6">
        <Logo />
        <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:ml-6 md:w-auto">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-graphite transition-colors hover:text-ink"
              activeProps={{ className: "bg-beige text-ink" }}
            >
              {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {left !== null && (
            <span className="hidden text-sm text-graphite lg:inline" title={t("usage.left", { n: left, max: FREE_PER_MONTH })}>
              {t("usage.short", { n: left, max: FREE_PER_MONTH })}
            </span>
          )}
          <div className="flex rounded-full bg-beige p-1 text-xs font-semibold" role="group" aria-label="Language / Gjuha">
            {(["en", "sq"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`min-h-9 min-w-10 rounded-full px-2.5 transition-colors ${lang === l ? "bg-paper text-ink shadow-sm" : "text-graphite hover:text-ink"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <ThemeToggle />
          <Link to="/pricing" className="btn btn-outline hidden sm:inline-flex">{t("upgrade")}</Link>
        </div>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
