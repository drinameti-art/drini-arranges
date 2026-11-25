import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mic, Square } from "lucide-react";
import { Spark } from "@/components/drini/Logo";
import { Waveform } from "@/components/drini/Waveform";

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

const notes = ["G", "A", "B", "D", "C", "B", "A", "G"];
const targets = ["Piano", "Choir", "Strings", "Guitar"];

function Record() {
  const [recording, setRecording] = useState(true);
  const [target, setTarget] = useState("Piano");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-6 pt-4">
      <Link to="/" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-paper text-ink"><ArrowLeft className="h-5 w-5" /></Link>
      <h1 className="mt-6 text-4xl text-ink">Hum your melody</h1>
      <p className="mt-2 text-graphite">Sing, hum or play one line. Drini turns it into notes.</p>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <span className={`absolute inset-0 rounded-full bg-primary/10 ${recording ? "ring-pulse" : ""}`} />
          <span className="absolute inset-6 rounded-full bg-primary/15" />
          <button
            onClick={() => setRecording((r) => !r)}
            aria-label={recording ? "Stop recording" : "Record again"}
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {recording ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-10 w-10" />}
          </button>
        </div>
        <p className="mt-2 font-display text-3xl font-semibold text-ink">{recording ? "0:18" : "0:42"}</p>
        <p className="text-sm text-graphite">{recording ? "Listening…" : "Recording saved · tap to redo"}</p>
        <Waveform animated={recording} bars={40} className="mt-4 h-12 w-full" />
      </div>

      <section className="card-paper mt-6 p-4">
        <p className="label-caps">Notes heard</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {notes.map((n, i) => <span key={i} className="flex h-9 w-8 items-center justify-center rounded-lg bg-beige font-display font-semibold text-ink">{n}</span>)}
        </div>
        <p className="mt-3 text-sm text-graphite">Likely key: G major · about 96 BPM</p>
      </section>

      <p className="label-caps mt-6">Arrange for</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map((t) => (
          <button key={t} onClick={() => setTarget(t)} className={`pill min-h-11 px-5 text-sm ${t === target ? "bg-ink text-cream" : "border border-border bg-paper text-ink"}`}>{t}</button>
        ))}
      </div>

      <div className="flex-1" />
      <Link to="/" className="btn btn-primary mt-8 h-14 w-full text-base"><Spark />Arrange with Drini</Link>
    </main>
  );
}
