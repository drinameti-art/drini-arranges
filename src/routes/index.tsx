import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { PageShell } from "@/components/drini/TopBar";
import { RecentList } from "@/components/drini/RecentList";
import { ArrangeForm } from "@/components/drini/ArrangeForm";
import { ScoreCard } from "@/components/drini/ScoreCard";
import { DriniChat } from "@/components/drini/DriniChat";
import { useDrini } from "@/components/drini/useDrini";
import { findScore } from "@/components/drini/library";
import { findTemplate } from "@/components/drini/templates";

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
    ...(typeof s["open"] === "string" ? { open: s["open"] } : {}),
    ...(typeof s["template"] === "string" ? { template: s["template"] } : {}),
  }),
  component: Studio,
});

type StudioSearch = { tab?: "audio"; arrange?: boolean; open?: string; template?: string };

function Studio() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const drini = useDrini();
  const template = search.template ? findTemplate(search.template) : null;
  const preset = template ? { id: template.id, title: template.title, request: template.request } : null;
  const arrange = drini.arrange;

  const handedOff = useRef(false);
  useEffect(() => {
    if (handedOff.current) return;
    if (search.open) {
      handedOff.current = true;
      const saved = findScore(search.open);
      if (saved) void drini.open(saved);
      void navigate({ search: {}, replace: true });
      return;
    }
    if (!search.arrange) return;
    handedOff.current = true;
    void arrange();
    void navigate({ search: { tab: "audio" }, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageShell>
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)_340px]">
        <RecentList
          selectedId={drini.currentId}
          onOpen={(s) => void drini.open(s)}
          onNew={() => {
            const el = document.getElementById("drini-prompt");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            el?.focus();
          }}
        />
        <div className="min-w-0 space-y-6">
          <ArrangeForm loading={drini.arranging} onArrange={(r) => void arrange(r)} initialMode={search.tab === "audio" || template?.request.mode === "audio" ? "audio" : "text"} preset={preset} />
          <ScoreCard score={drini.score} checks={drini.checks} draft={drini.draft} refreshing={drini.busy} onTranspose={(n, label) => void drini.transpose(n, label)} />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start"><DriniChat msgs={drini.msgs} busy={drini.busy} onSend={(t) => void drini.revise(t)} /></div>
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
