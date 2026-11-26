import { createFileRoute, Link } from "@tanstack/react-router";
import { Piano, Music2, Users, Guitar, Mic2, Baby } from "lucide-react";
import { templates, templateText } from "@/components/drini/templates";
import { useLang } from "@/lib/i18n";
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
  const { t: tx, lang } = useLang();
  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="text-4xl text-ink">{tx("tp.title")}</h1>
        <p className="mt-2 text-graphite">{tx("tp.sub")}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const Icon = icons[t.id as keyof typeof icons] ?? Music2;
            const text = templateText(t, lang);
            return (
            <div key={t.id} className="card-paper flex flex-col p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige text-primary"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-4 text-xl text-ink">{text.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-graphite">{text.desc}</p>
              <div className="mt-4 flex gap-2">{text.tags.map((g) => <span key={g} className="pill bg-beige text-ink">{g}</span>)}</div>
              <Link to="/studio" search={{ template: t.id }} className="btn btn-outline mt-5">{tx("tp.use")}</Link>
            </div>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}
