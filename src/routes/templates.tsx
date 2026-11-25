import { createFileRoute, Link } from "@tanstack/react-router";
import { Piano, Music2, Users, Guitar, Mic2, Baby } from "lucide-react";
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

const templates = [
  { icon: Piano, title: "Piano duet for students", desc: "Two players, one piano. A simple secondo under a singing primo.", tags: ["Easy", "4 hands"] },
  { icon: Users, title: "SATB hymn", desc: "Four-part chorale writing with clean voice leading and tidy ranges.", tags: ["Choir", "Intermediate"] },
  { icon: Music2, title: "String quartet wedding", desc: "A warm, lyrical setting for processionals and signing moments.", tags: ["Strings", "Advanced"] },
  { icon: Guitar, title: "Fingerstyle guitar solo", desc: "Melody on top, gentle bass and arpeggios, with tab included.", tags: ["Guitar", "Intermediate"] },
  { icon: Baby, title: "Children's choir, SA + piano", desc: "Two treble parts in comfortable ranges with a supportive piano.", tags: ["Choir", "Easy"] },
  { icon: Mic2, title: "Lead sheet from a hum", desc: "Hum a tune and get melody, chord symbols and lyrics space.", tags: ["Any", "Quick"] },
];

function Templates() {
  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="text-4xl text-ink">Templates</h1>
        <p className="mt-2 text-graphite">Start from a proven brief, then tell Drini what to change.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.title} className="card-paper flex flex-col p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige text-primary"><t.icon className="h-5 w-5" /></div>
              <h2 className="mt-4 text-xl text-ink">{t.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-graphite">{t.desc}</p>
              <div className="mt-4 flex gap-2">{t.tags.map((g) => <span key={g} className="pill bg-beige text-ink">{g}</span>)}</div>
              <Link to="/" className="btn btn-outline mt-5">Use template</Link>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
