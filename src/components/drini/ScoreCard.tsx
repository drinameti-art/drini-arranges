import { useRef, useState } from "react";
import { ArrowUpDown, FileCode2, FileDown, Pause, Play, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ScoreSheet, type ScoreSheetHandle } from "./ScoreSheet";
import { sampleScoreAbc } from "./data";

export function ScoreCard({ draft, refreshing }: { draft: number; refreshing: boolean }) {
  const [started, setStarted] = useState(false);
  const sheet = useRef<ScoreSheetHandle>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    if (playing) { sheet.current?.pause(); setPlaying(false); return; }
    setPlaying(true);
    if (started) sheet.current?.resume();
    else { setStarted(true); await sheet.current?.play(); }
  };

  return (
    <section className={`card-paper p-5 transition-opacity md:p-6 ${refreshing ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div>
          <h2 className="text-2xl text-ink">Folk melody — Piano 4 hands</h2>
          <p className="mt-1 text-sm text-graphite">Arranged by Drini · G major · 4/4 · 32 bars · Draft {draft}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={toggle} aria-pressed={playing}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button className="btn btn-ghost" onClick={() => toast("Transpose is coming soon")}><ArrowUpDown className="h-4 w-4" />Transpose</button>
          <button className="btn btn-ghost" onClick={() => toast("MusicXML download will be ready soon")}><FileCode2 className="h-4 w-4" />MusicXML</button>
          <button className="btn btn-ink" onClick={() => toast("PDF export will be ready soon")}><FileDown className="h-4 w-4" />Export PDF</button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-paper px-2 py-3">
        <div className="min-w-[680px]"><ScoreSheet ref={sheet} abc={sampleScoreAbc} highlightBar={2} highlightLabel="Bar 3 · Drini's note" onEnded={() => { setPlaying(false); setStarted(false); }} /></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="pill bg-success-soft text-success"><Check className="h-3.5 w-3.5" />Ranges checked</span>
        <span className="pill bg-success-soft text-success"><Check className="h-3.5 w-3.5" />No parallel 5ths / 8ves</span>
        <span className="pill bg-warning-soft text-warning"><AlertTriangle className="h-3.5 w-3.5" />Bar 3: wide leap in primo</span>
      </div>
    </section>
  );
}
