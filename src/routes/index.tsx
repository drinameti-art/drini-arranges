import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  component: Studio,
});

function Studio() {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(2);

  // Placeholder: swap for the real arranging call later.
  const arrange = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDraft((d) => d + 1); }, 1800);
  };

  return (
    <PageShell>
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)_340px]">
        <RecentList />
        <div className="min-w-0 space-y-6">
          <ArrangeForm loading={loading} onArrange={arrange} />
          <ScoreCard draft={draft} refreshing={loading} />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start"><DriniChat /></div>
      </main>
    </PageShell>
  );
}
