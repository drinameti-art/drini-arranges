import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#7B1F3A" />
      <path d="M19 14h11a18 18 0 0 1 0 36H19z" fill="none" stroke="#F6F1E7" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M23 26h18M23 32h21M23 38h18" stroke="#F6F1E7" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <ellipse cx="32" cy="35" rx="4.6" ry="3.4" transform="rotate(-22 32 35)" fill="#E2B04A" />
      <path d="M36.2 33.6V20" stroke="#E2B04A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M50 12l1.4 3.6L55 17l-3.6 1.4L50 22l-1.4-3.6L45 17l3.6-1.4z" fill="#E2B04A" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="DriniArranges home">
      <LogoMark />
      <span className="font-display text-xl leading-none">
        <span className="font-semibold text-ink">Drini</span>
        <span className="font-normal text-primary">Arranges</span>
      </span>
    </Link>
  );
}

export function Spark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className + " text-gold"} aria-hidden>
      <path d="M5 0l1.4 3.6L10 5 6.4 6.4 5 10 3.6 6.4 0 5l3.6-1.4z" fill="currentColor" />
    </svg>
  );
}
