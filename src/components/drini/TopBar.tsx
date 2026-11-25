import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const nav = [
  { to: "/", label: "Studio" },
  { to: "/scores", label: "My scores" },
  { to: "/templates", label: "Templates" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function TopBar() {
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
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-graphite sm:inline">7 arrangements left</span>
          <Link to="/pricing" className="btn btn-outline">Upgrade</Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs font-semibold text-cream">DA</div>
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
