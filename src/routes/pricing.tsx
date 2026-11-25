import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageShell } from "@/components/drini/TopBar";

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
  { name: "Free", blurb: "For trying Drini out.", features: ["10 arrangements a month", "PDF export", "Up to 2 instruments"], cta: "Current plan", featured: false },
  { name: "Pro", blurb: "For teachers and players.", features: ["Unlimited arrangements", "PDF, MusicXML and MIDI", "Any ensemble", "Hum-to-score"], cta: "Upgrade to Pro", featured: true },
  { name: "Studio", blurb: "For schools and studios.", features: ["Everything in Pro", "5 seats", "Shared score library", "Priority arranging"], cta: "Talk to us", featured: false },
];

function Pricing() {
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <div className="text-center">
          <h1 className="text-4xl text-ink md:text-5xl">Simple pricing</h1>
          <p className="mt-3 text-graphite">Pick the plan that fits how much music you make.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`flex flex-col rounded-[20px] border p-7 ${t.featured ? "border-ink bg-ink text-cream" : "border-border bg-paper text-ink"}`}>
              <h2 className="text-2xl">{t.name}</h2>
              <p className={`mt-1 text-sm ${t.featured ? "text-cream/70" : "text-graphite"}`}>{t.blurb}</p>
              <p className="mt-6 font-display text-4xl font-semibold">[PRICE]<span className="text-base font-normal opacity-70"> / month</span></p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {t.features.map((f) => <li key={f} className="flex gap-2"><Check className={`h-4 w-4 shrink-0 ${t.featured ? "text-gold" : "text-primary"}`} />{f}</li>)}
              </ul>
              <button className={`btn mt-8 ${t.featured ? "btn-primary" : "btn-outline"}`}>{t.cta}</button>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
