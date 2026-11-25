import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mic, Square, Upload } from "lucide-react";
import { Spark } from "@/components/drini/Logo";
import { Waveform } from "@/components/drini/Waveform";
import { formatTime, storeEnsemble, useMelodyRecorder } from "@/components/drini/useMelodyRecorder";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Hum your melody · DriniArranges" },
      { name: "description", content: "Sing, hum or play one line. Drini turns it into notes and arranges it." },
      { property: "og:title", content: "Hum your melody · DriniArranges" },
      { property: "og:description", content: "Sing, hum or play one line. Drini turns it into notes and arranges it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Record,
});

const targets = [
  { label: "Piano", ensemble: "Solo piano" },
  { label: "Piano duet", ensemble: "Piano 4 hands" },
  { label: "Choir", ensemble: "SATB choir" },
  { label: "Strings", ensemble: "String quartet" },
  { label: "Guitar", ensemble: "Guitar" },
];

function Record() {
  const rec = useMelodyRecorder();
  const [target, setTarget] = useState("Piano");
  const busy = rec.recording || rec.status === "analysing";
  const ensemble = targets.find((t) => t.label === target)?.ensemble ?? "Solo piano";

  const status =
    rec.status === "recording" ? "Listening… hum one line, then tap stop"
    : rec.status === "analysing" ? "Finding the notes…"
    : rec.status === "done" ? "Got it · tap to record again"
    : rec.status === "error" ? (rec.error ?? "Something went wrong")
    : "Tap the button and start humming";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-6 pt-4">
      <Link to="/" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-paper text-ink"><ArrowLeft className="h-5 w-5" /></Link>
      <h1 className="mt-6 text-4xl text-ink">Hum your melody</h1>
      <p className="mt-2 text-graphite">Sing, hum or play one line. Drini turns it into notes.</p>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <span className={`absolute inset-0 rounded-full bg-primary/10 ${rec.recording ? "ring-pulse" : ""}`} />
          <span className="absolute inset-6 rounded-full bg-primary/15" />
          <button
            onClick={() => (rec.recording ? rec.stop() : void rec.start())}
            disabled={rec.status === "analysing"}
            aria-label={rec.recording ? "Stop recording" : rec.status === "done" ? "Record again" : "Start recording"}
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70"
          >
            {rec.recording ? <Square className="h-8 w-8 fill-current" /> : rec.status === "analysing" ? <Loader2 className="h-9 w-9 animate-spin" /> : <Mic className="h-10 w-10" />}
          </button>
        </div>
        <p className="mt-2 font-display text-3xl font-semibold text-ink">{formatTime(rec.seconds)}</p>
        <p className={`px-4 text-center text-sm ${rec.status === "error" ? "text-warning" : "text-graphite"}`} aria-live="polite">{status}</p>
        <Waveform animated={busy} bars={40} className="mt-4 h-12 w-full" />
        <label className="btn btn-ghost mt-3 cursor-pointer">
          <Upload className="h-4 w-4" />Or upload a recording
          <input type="file" accept="audio/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) rec.upload(f); e.target.value = ""; }} />
        </label>
      </div>

      {rec.melody && (
        <section className="card-paper mt-6 p-4">
          <p className="label-caps">Notes heard</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {rec.melody.names.slice(0, 32).map((n, i) => <span key={i} className="flex h-9 min-w-8 items-center justify-center rounded-lg bg-beige px-1.5 font-display font-semibold text-ink">{n}</span>)}
          </div>
          <p className="mt-3 text-sm text-graphite">Likely key: {rec.melody.key} · about {rec.melody.bpm} BPM</p>
        </section>
      )}

      <p className="label-caps mt-6">Arrange for</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map((t) => (
          <button key={t.label} onClick={() => setTarget(t.label)} className={`pill min-h-11 px-5 text-sm ${t.label === target ? "bg-ink text-cream" : "border border-border bg-paper text-ink"}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1" />
      {rec.melody && !busy ? (
        <Link to="/" search={{ tab: "audio", arrange: true }} onClick={() => storeEnsemble(ensemble)} className="btn btn-primary mt-8 h-14 w-full text-base"><Spark />Arrange with Drini</Link>
      ) : (
        <button disabled className="btn btn-primary mt-8 h-14 w-full text-base opacity-50"><Spark />Record a melody first</button>
      )}
    </main>
  );
}
