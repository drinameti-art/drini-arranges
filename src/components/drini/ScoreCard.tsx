import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, FileCode2, FileDown, Pause, Play, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Check as CheckItem } from "@/lib/abc-check";
import { ScoreSheet, type ScoreSheetHandle } from "./ScoreSheet";
import type { Score } from "./useDrini";

type Props = { score: Score; checks: CheckItem[]; draft: number; refreshing: boolean };

export function ScoreCard({ score, checks, draft, refreshing }: Props) {
  const [started, setStarted] = useState(false);
  const sheet = useRef<ScoreSheetHandle>(null);
  const [playing, setPlaying] = useState(false);

  // A new score replaces the old one: stop playback and start fresh next time.
  useEffect(() => {
    setPlaying(false);
    setStarted(false);
  }, [score.abc]);

  const toggle = async () => {
    if (playing) { sheet.current?.pause(); setPlaying(false); return; }
    setPlaying(true);
    if (started) sheet.current?.resume();
    else { setStarted(true); await sheet.current?.play(); }
  };

  const downloadAbc = () => {
    const blob = new Blob([score.abc], { type: "text/vnd.abc;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(score.title) || "drini-score"}.abc`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Downloaded as ABC. MusicXML export is coming soon.");
  };

  const highlights = score.notes.map((n) => ({ bar: n.bar, label: `Bar ${n.bar} · Drini's note` }));

  return (
    <section className={`print-area card-paper p-5 transition-opacity md:p-6 ${refreshing ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div>
          <h2 className="text-2xl text-ink">{score.title}</h2>
          <p className="mt-1 text-sm text-graphite">
            Arranged by Drini · {score.key} · {score.meter} · {score.bars} bars · Draft {draft}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={toggle} aria-pressed={playing}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button className="btn btn-ghost" onClick={() => toast("Transpose is coming soon")}><ArrowUpDown className="h-4 w-4" />Transpose</button>
          <button className="btn btn-ghost" onClick={downloadAbc}><FileCode2 className="h-4 w-4" />MusicXML</button>
          <button className="btn btn-ink" onClick={() => window.print()}><FileDown className="h-4 w-4" />Export PDF</button>
        </div>
      </div>

      <div className="score-scroll mt-5 overflow-x-auto rounded-2xl border border-border bg-paper px-2 py-3">
        <div className="min-w-[680px]">
          <ScoreSheet ref={sheet} abc={score.abc} highlights={highlights} onEnded={() => { setPlaying(false); setStarted(false); }} />
        </div>
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        {checks.map((c) =>
          c.ok ? (
            <span key={c.label} className="pill bg-success-soft text-success"><Check className="h-3.5 w-3.5" />{c.label}</span>
          ) : (
            <span key={c.label} className="pill bg-warning-soft text-warning"><AlertTriangle className="h-3.5 w-3.5" />{c.label}</span>
          ),
        )}
        {score.notes.map((n) => (
          <span key={`${n.bar}-${n.text}`} className="pill bg-warning-soft text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />Bar {n.bar}: {n.text}
          </span>
        ))}
      </div>
    </section>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
