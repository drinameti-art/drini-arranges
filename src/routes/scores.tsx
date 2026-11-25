import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/drini/TopBar";
import { relativeDay, useLibrary } from "@/components/drini/library";

export const Route = createFileRoute("/scores")({
  head: () => ({
    meta: [
      { title: "My scores · DriniArranges" },
      { name: "description", content: "All the arrangements Drini has written for you, ready to play, print and share." },
      { property: "og:title", content: "My scores · DriniArranges" },
      { property: "og:description", content: "All the arrangements Drini has written for you, ready to play, print and share." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Scores,
});

function Staff() {
  return (
    <svg viewBox="0 0 200 60" className="h-16 w-full text-graphite" aria-hidden>
      {[10, 20, 30, 40, 50].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="currentColor" strokeOpacity=".35" />)}
      {[[30, 35], [60, 30], [90, 25], [120, 15], [150, 20], [180, 30]].map(([x, y]) => (
        <g key={x}><ellipse cx={x} cy={y} rx="5" ry="3.6" transform={`rotate(-20 ${x} ${y})`} className="fill-ink" /><line x1={(x ?? 0) + 4.5} x2={(x ?? 0) + 4.5} y1={y} y2={(y ?? 0) - 22} className="stroke-ink" strokeWidth="1.3" /></g>
      ))}
    </svg>
  );
}

function Scores() {
  const scores = useLibrary();
  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="text-4xl text-ink">My scores</h1>
        <p className="mt-2 text-graphite">Every arrangement Drini has written for you, saved in this browser.</p>
        {scores.length === 0 ? (
          <div className="card-paper mt-8 flex flex-col items-start gap-4 p-8">
            <p className="text-ink">No scores yet. Describe a piece or hum a melody, and Drini's arrangements will be kept here.</p>
            <Link to="/" className="btn btn-primary">Go to the Studio</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {scores.map((s) => (
              <Link to="/" search={{ open: s.id }} key={s.id} className="card-paper group p-5 transition-colors hover:border-primary/40">
                <div className="rounded-xl bg-background px-4 py-3"><Staff /></div>
                <h2 className="mt-4 text-xl text-ink group-hover:text-primary">{s.title}</h2>
                <p className="text-sm text-ink">{s.ensemble || "Arrangement"}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-graphite">
                  <span>{[s.key, `${s.bars} bars`, s.level].filter(Boolean).join(" · ")}</span>
                  <span>{relativeDay(s.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}
