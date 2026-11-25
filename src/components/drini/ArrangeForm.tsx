import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Mic, Square, Upload } from "lucide-react";
import { Spark } from "./Logo";
import { Waveform } from "./Waveform";
import { formatTime, loadMelody, useMelodyRecorder, type StoredMelody } from "./useMelodyRecorder";

export type ArrangeRequest = {
  mode: "text" | "audio";
  prompt: string;
  ensemble: string;
  level: string;
  key: string;
  style: string;
  melody: StoredMelody | null;
};

const selects = [
  { id: "ensemble", label: "Ensemble", options: ["Piano 4 hands", "Solo piano", "Piano + strings (2 violins, viola)", "String quartet", "String orchestra", "Flute + piano", "Wind quartet", "SATB choir", "SA choir + piano", "Guitar", "Lead sheet"] },
  { id: "level", label: "Level", options: ["Easy", "Intermediate", "Advanced"] },
  { id: "key", label: "Key", options: ["Keep original", "C major", "G major", "D major", "A major", "F major", "Bb major", "Eb major", "A minor", "E minor", "D minor", "G minor"] },
  { id: "style", label: "Style", options: ["Lyrical", "Classical", "Pop", "Jazz", "Folk"] },
] as const;

const tryPrompts = [
  "Happy Birthday for string quartet",
  "Easy piano solo, lullaby in F major",
  "SATB hymn, 16 bars, D major",
];

type Preset = { id: string; title: string; request: Partial<ArrangeRequest> };

export function ArrangeForm({ loading, onArrange, initialMode = "text", preset = null }: { loading: boolean; onArrange: (r: ArrangeRequest) => void; initialMode?: ArrangeRequest["mode"]; preset?: Preset | null }) {
  const [req, setReq] = useState<ArrangeRequest>({
    mode: initialMode,
    prompt: "Turn my folk melody into an easy piano duet, 4 hands, for two sisters. Keep the secondo simple, gentle and flowing, about 2 minutes.",
    ensemble: "Piano 4 hands",
    level: "Easy",
    key: "G major",
    style: "Lyrical",
    melody: null,
  });
  const rec = useMelodyRecorder();
  const [presetTitle, setPresetTitle] = useState<string | null>(null);
  // A template from the Templates page fills the form once.
  useEffect(() => {
    if (!preset) return;
    setReq((r) => ({ ...r, ...preset.request }));
    setPresetTitle(preset.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset?.id]);
  // A melody recorded on the /record screen (or earlier) shows up here until a new one replaces it.
  const [stored, setStored] = useState<StoredMelody | null>(null);
  useEffect(() => { setStored(loadMelody()); }, []);
  const melody: StoredMelody | null = rec.melody ?? (rec.status === "idle" ? stored : null);

  return (
    <section className="card-paper p-5 md:p-6">
      <h2 className="text-2xl text-ink">What should Drini arrange?</h2>
      {presetTitle && (
        <p className="mt-2 text-sm text-graphite">
          Template: <span className="font-medium text-primary">{presetTitle}</span>. Change anything you like, then press Arrange.
          {req.mode === "audio" && " Record or upload your melody first."}
        </p>
      )}

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
          <div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Describe the piece, the instruments and the feel</span>
            <textarea
              id="drini-prompt"
              className="field min-h-28 resize-y leading-relaxed"
              value={req.prompt}
              onChange={(e) => setReq({ ...req, prompt: e.target.value })}
            />
          </label>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-graphite">Try:</span>
              {tryPrompts.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReq({ ...req, prompt: t })}
                  className="pill border border-input bg-paper text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-background/50 px-4 py-6 text-center sm:flex-row sm:items-start sm:text-left">
            <button
              type="button"
              onClick={() => (rec.recording ? rec.stop() : void rec.start())}
              disabled={rec.status === "analysing"}
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              aria-label={rec.recording ? "Stop recording" : "Record"}
            >
              {rec.recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
              <span className="text-[10px] font-medium">{rec.recording ? "Stop" : "Record"}</span>
            </button>
            <div className="min-w-0 flex-1">
              <Waveform animated={rec.recording || rec.status === "analysing"} className="h-10 justify-start" bars={44} />
              <p className="mt-2 text-sm text-graphite" aria-live="polite">
                {rec.status === "recording" && <><span className="font-medium text-ink">Listening… {formatTime(rec.seconds)}</span> — hum one line, then press Stop (up to 0:30).</>}
                {rec.status === "analysing" && <span className="font-medium text-ink">Finding the notes…</span>}
                {rec.status === "error" && <span className="text-warning">{rec.error}</span>}
                {rec.status !== "recording" && rec.status !== "analysing" && rec.status !== "error" && (melody
                  ? <><span className="font-medium text-ink">{rec.fileName ?? "Your melody"} · {melody.names.length} notes</span> — likely {melody.key}, about {melody.bpm} BPM.</>
                  : <>Press record and hum one line, or upload a recording. A single melody works best.</>)}
              </p>
              {melody && rec.status !== "recording" && rec.status !== "analysing" && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {melody.names.slice(0, 32).map((n, i) => (
                    <span key={i} className="flex h-8 min-w-7 items-center justify-center rounded-lg bg-beige px-1.5 font-display text-sm font-semibold text-ink">{n}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="btn btn-ghost cursor-pointer">
                  <Upload className="h-4 w-4" />Upload a recording
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) rec.upload(f); e.target.value = ""; }}
                  />
                </label>
                <Link to="/record" className="btn btn-outline"><Mic className="h-4 w-4" />Hum on your phone</Link>
              </div>
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
        <p className="text-xs text-graphite">Output: score · PDF · MIDI · ABC</p>
        <button className="btn btn-primary px-5" disabled={loading || rec.recording || rec.status === "analysing"} onClick={() => onArrange({ ...req, melody })}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Spark />}
          {loading ? "Drini is arranging…" : "Arrange with Drini"}
        </button>
      </div>
    </section>
  );
}
