import { createFileRoute, Link } from "@tanstack/react-router";
import { Piano, Music2, Users, Guitar, Mic2, Baby } from "lucide-react";
import { templates } from "@/components/drini/templates";
import { PageShell } from "@/components/drini/TopBar";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates · DriniArranges" },
      { name: "description", content: "Start from a ready-made arrangement brief: piano duets, SATB hymns, string quartets and more." },
      { property: "og:title", content: "Templates · DriniArranges" },
      { property: "og:description", content: "Start from a ready-made arrangement brief: piano duets, SATB hymns, string quartets and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Templates,
});

const icons = { "piano-duet": Piano, "satb-hymn": Users, "quartet-wedding": Music2, "guitar-solo": Guitar, "children-choir": Baby, "lead-sheet": Mic2 } as const;

function Templates() {
  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="text-4xl text-ink">Templates</h1>
        <p className="mt-2 text-graphite">Start from a proven brief, then tell Drini what to change.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const Icon = icons[t.id as keyof typeof icons] ?? Music2;
            return (
            <div key={t.id} className="card-paper flex flex-col p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige text-primary"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-4 text-xl text-ink">{t.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-graphite">{t.desc}</p>
              <div className="mt-4 flex gap-2">{t.tags.map((g) => <span key={g} className="pill bg-beige text-ink">{g}</span>)}</div>
              <Link to="/" search={{ template: t.id }} className="btn btn-outline mt-5">Use template</Link>
            </div>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}
