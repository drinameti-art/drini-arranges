import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { PageShell } from "@/components/drini/TopBar";
import { RecentList } from "@/components/drini/RecentList";
import { ArrangeForm } from "@/components/drini/ArrangeForm";
import { ScoreCard } from "@/components/drini/ScoreCard";
import { DriniChat } from "@/components/drini/DriniChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio · DriniArranges" },
      { name: "description", content: "Describe a piece or hum a melody and Drini arranges a playable, downloadable score." },
      { property: "og:title", content: "Studio · DriniArranges" },
      { property: "og:description", content: "Describe a piece or hum a melody and Drini arranges a playable, downloadable score." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): StudioSearch => ({
    ...(s["tab"] === "audio" ? { tab: "audio" as const } : {}),
    ...(s["arrange"] === true || s["arrange"] === "true" ? { arrange: true } : {}),
  }),
  component: Studio,
});

type StudioSearch = { tab?: "audio"; arrange?: boolean };

function Studio() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(2);

  // Placeholder: swap for the real arranging call later.
  const arrange = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDraft((d) => d + 1); }, 1800);
  };

  const handedOff = useRef(false);
  useEffect(() => {
    if (!search.arrange || handedOff.current) return;
    handedOff.current = true;
    arrange();
    void navigate({ search: { tab: "audio" }, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageShell>
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)_340px]">
        <RecentList />
        <div className="min-w-0 space-y-6">
          <ArrangeForm loading={loading} onArrange={arrange} initialMode={search.tab === "audio" ? "audio" : "text"} />
          <ScoreCard draft={draft} refreshing={loading} />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start"><DriniChat /></div>
      </main>
      <Link
        to="/record"
        aria-label="Hum your melody"
        className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover md:hidden"
      >
        <Mic className="h-6 w-6" />
      </Link>
    </PageShell>
  );
}
