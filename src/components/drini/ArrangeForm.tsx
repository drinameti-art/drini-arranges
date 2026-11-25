import { useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { Spark } from "./Logo";
import { Waveform } from "./Waveform";

export type ArrangeRequest = {
  mode: "text" | "audio";
  prompt: string;
  ensemble: string;
  level: string;
  key: string;
  style: string;
};

const selects = [
  { id: "ensemble", label: "Ensemble", options: ["Piano 4 hands", "Solo piano", "String quartet", "SATB choir", "Guitar"] },
  { id: "level", label: "Level", options: ["Easy", "Intermediate", "Advanced"] },
  { id: "key", label: "Key", options: ["G major", "Keep original", "C major", "D minor"] },
  { id: "style", label: "Style", options: ["Lyrical", "Classical", "Pop", "Jazz", "Folk"] },
] as const;

export function ArrangeForm({ loading, onArrange }: { loading: boolean; onArrange: (r: ArrangeRequest) => void }) {
  const [req, setReq] = useState<ArrangeRequest>({
    mode: "text",
    prompt: "Turn my folk melody into an easy piano duet, 4 hands, for two sisters. Keep the secondo simple, gentle and flowing, about 2 minutes.",
    ensemble: "Piano 4 hands",
    level: "Easy",
    key: "G major",
    style: "Lyrical",
  });
  const [recording, setRecording] = useState(false);

  return (
    <section className="card-paper p-5 md:p-6">
      <h2 className="text-2xl text-ink">What should Drini arrange?</h2>

      <div role="tablist" className="mt-4 grid grid-cols-2 rounded-xl bg-beige p-1">
        {(["text", "audio"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={req.mode === m}
            onClick={() => setReq({ ...req, mode: m })}
            className={`min-h-11 rounded-[10px] text-sm font-medium transition-colors ${req.mode === m ? "bg-paper text-ink shadow-sm" : "text-graphite hover:text-ink"}`}
          >
            {m === "text" ? "Describe in text" : "Upload or hum audio"}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {req.mode === "text" ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Describe the piece, the instruments and the feel</span>
            <textarea
              className="field min-h-28 resize-y leading-relaxed"
              value={req.prompt}
              onChange={(e) => setReq({ ...req, prompt: e.target.value })}
            />
          </label>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-background/50 px-4 py-6 text-center sm:flex-row sm:text-left">
            <button
              onClick={() => setRecording((r) => !r)}
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
              aria-label="Record"
            >
              <Mic className="h-5 w-5" />
              <span className="text-[10px] font-medium">{recording ? "Stop" : "Record"}</span>
            </button>
            <div className="flex-1">
              <Waveform animated={recording} className="h-10 justify-start" bars={44} />
              <p className="mt-2 text-sm text-graphite">
                <span className="font-medium text-ink">melody_hum.m4a · 0:42</span> — Drop a file or press record. A single melody works best.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {selects.map((s) => (
          <label key={s.id} className="block">
            <span className="mb-1.5 block text-xs font-medium text-graphite">{s.label}</span>
            <select
              className="field cursor-pointer"
              value={req[s.id]}
              onChange={(e) => setReq({ ...req, [s.id]: e.target.value })}
            >
              {s.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-graphite">Output: score + parts · PDF · MusicXML · MIDI</p>
        <button className="btn btn-primary px-5" disabled={loading} onClick={() => onArrange(req)}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Spark />}
          {loading ? "Drini is arranging…" : "Arrange with Drini"}
        </button>
      </div>
    </section>
  );
}
