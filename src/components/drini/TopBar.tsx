import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";
import { FREE_PER_MONTH, useFreeLeft } from "./usage";

const nav = [
  { to: "/", label: "nav.studio" },
  { to: "/scores", label: "nav.scores" },
  { to: "/templates", label: "nav.templates" },
  { to: "/pricing", label: "nav.pricing" },
] as const;

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
          <Link to="/pricing" className="btn btn-outline">{t("upgrade")}</Link>
        </div>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopBar />
      {children}
    </div>
  );
}
