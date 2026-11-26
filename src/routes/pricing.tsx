import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageShell } from "@/components/drini/TopBar";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · DriniArranges" },
      { name: "description", content: "Free, Pro and Studio plans for students, teachers and working musicians." },
      { property: "og:title", content: "Pricing · DriniArranges" },
      { property: "og:description", content: "Free, Pro and Studio plans for students, teachers and working musicians." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const tiers = [
  { name: "pr.free", blurb: "pr.freeBlurb", price: "€0", features: ["pr.f.free1", "pr.f.free2", "pr.f.free3", "pr.f.free4"], cta: "pr.current", featured: false },
  { name: "pr.pro", blurb: "pr.proBlurb", price: "€29.99", features: ["pr.f.pro1", "pr.f.pro2", "pr.f.pro3", "pr.f.pro4"], cta: "pr.soon", featured: true },
  { name: "pr.studio", blurb: "pr.studioBlurb", price: "€59.99", features: ["pr.f.st1", "pr.f.st2", "pr.f.st3", "pr.f.st4"], cta: "pr.soon", featured: false },
] as const;

function Pricing() {
  const { t } = useLang();
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <div className="text-center">
          <h1 className="text-4xl text-ink md:text-5xl">{t("pr.title")}</h1>
          <p className="mt-3 text-graphite">{t("pr.sub")}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.name} className={`flex flex-col rounded-[20px] border p-7 ${tier.featured ? "border-ink bg-ink text-cream" : "border-border bg-paper text-ink"}`}>
              <h2 className="text-2xl">{t(tier.name)}</h2>
              <p className={`mt-1 text-sm ${tier.featured ? "text-cream/70" : "text-graphite"}`}>{t(tier.blurb)}</p>
              <p className="mt-6 font-display text-4xl font-semibold">{tier.price}<span className="text-base font-normal opacity-70"> {t("pr.month")}</span></p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {tier.features.map((f) => <li key={f} className="flex gap-2"><Check className={`h-4 w-4 shrink-0 ${tier.featured ? "text-gold" : "text-primary"}`} />{t(f)}</li>)}
              </ul>
              <button disabled className={`btn mt-8 ${tier.featured ? "btn-primary" : "btn-outline"} disabled:cursor-default disabled:opacity-70`}>{t(tier.cta)}</button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-graphite">{t("pr.note")}</p>
      </main>
    </PageShell>
  );
}
