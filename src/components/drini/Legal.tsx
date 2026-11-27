import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { COPYRIGHT } from "@/lib/abc-tools";

/** Where people reach DriniArranges about the service, privacy or copyright. */
export const CONTACT_EMAIL = "drinameti15@gmail.com";
export const LEGAL_UPDATED = "26 November 2026";

export type LegalSection = { h: string; p: string[] };

/** A plain, readable legal page with an English and an Albanian version. */
export function LegalPage({ title, en, sq }: { title: { en: string; sq: string }; en: LegalSection[]; sq: LegalSection[] }) {
  const { lang } = useLang();
  const sections = lang === "sq" ? sq : en;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="text-4xl text-ink">{lang === "sq" ? title.sq : title.en}</h1>
      <p className="mt-2 text-sm text-graphite">
        {lang === "sq" ? `Përditësuar më ${LEGAL_UPDATED.replace("November", "nëntor")}` : `Last updated ${LEGAL_UPDATED}`}
      </p>
      <div className="mt-8 space-y-7">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl text-ink">{s.h}</h2>
            {s.p.map((para) => (
              <p key={para.slice(0, 40)} className="mt-2 leading-relaxed text-graphite">{para}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}

/** Site footer: copyright line and links to the legal pages. */
export function Footer() {
  const { lang } = useLang();
  const sq = lang === "sq";
  return (
    <footer className="no-print mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-graphite md:flex-row md:px-6">
        <span>{COPYRIGHT} · {new Date().getFullYear()}</span>
        <nav className="flex flex-wrap gap-4">
          <Link to="/terms" className="hover:text-ink">{sq ? "Kushtet e përdorimit" : "Terms"}</Link>
          <Link to="/privacy" className="hover:text-ink">{sq ? "Privatësia" : "Privacy"}</Link>
          <Link to="/copyright" className="hover:text-ink">{sq ? "Të drejtat e autorit" : "Copyright"}</Link>
          <Link to="/refunds" className="hover:text-ink">{sq ? "Rimbursimet" : "Refunds"}</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">{sq ? "Kontakt" : "Contact"}</a>
        </nav>
      </div>
    </footer>
  );
}
