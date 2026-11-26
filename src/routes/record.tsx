import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mic, Square, Upload } from "lucide-react";
import { Spark } from "@/components/drini/Logo";
import { Waveform } from "@/components/drini/Waveform";
import { formatTime, storeEnsemble, useMelodyRecorder } from "@/components/drini/useMelodyRecorder";
import { keyName, noteName, useLang } from "@/lib/i18n";

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
  { label: "t.piano", ensemble: "Solo piano" },
  { label: "t.duet", ensemble: "Piano 4 hands" },
  { label: "t.choir", ensemble: "SATB choir" },
  { label: "t.strings", ensemble: "String quartet" },
  { label: "t.guitar", ensemble: "Guitar" },
] as const;

function Record() {
  const rec = useMelodyRecorder();
  const [target, setTarget] = useState<string>("t.piano");
  const { t, lang } = useLang();
  const busy = rec.recording || rec.status === "analysing";
  const ensemble = targets.find((x) => x.label === target)?.ensemble ?? "Solo piano";

  const status =
    rec.status === "recording" ? t("rp.listening")
    : rec.status === "analysing" ? t("rp.finding")
    : rec.status === "done" ? t("rp.done")
    : rec.status === "error" ? (rec.error ?? t("msg.fail"))
    : t("rp.idle");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-6 pt-4">
      <Link to="/" aria-label={t("rp.back")} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-paper text-ink"><ArrowLeft className="h-5 w-5" /></Link>
      <h1 className="mt-6 text-4xl text-ink">{t("rp.title")}</h1>
      <p className="mt-2 text-graphite">{t("rp.sub")}</p>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <span className={`absolute inset-0 rounded-full bg-primary/10 ${rec.recording ? "ring-pulse" : ""}`} />
          <span className="absolute inset-6 rounded-full bg-primary/15" />
          <button
            onClick={() => (rec.recording ? rec.stop() : void rec.start())}
            disabled={rec.status === "analysing"}
            aria-label={rec.recording ? t("rec.stop") : t("rec.record")}
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70"
          >
            {rec.recording ? <Square className="h-8 w-8 fill-current" /> : rec.status === "analysing" ? <Loader2 className="h-9 w-9 animate-spin" /> : <Mic className="h-10 w-10" />}
          </button>
        </div>
        <p className="mt-2 font-display text-3xl font-semibold text-ink">{formatTime(rec.seconds)}</p>
        <p className={`px-4 text-center text-sm ${rec.status === "error" ? "text-warning" : "text-graphite"}`} aria-live="polite">{status}</p>
        <Waveform animated={busy} bars={40} className="mt-4 h-12 w-full" />
        <label className="btn btn-ghost mt-3 cursor-pointer">
          <Upload className="h-4 w-4" />{t("rp.upload")}
          <input type="file" accept="audio/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) rec.upload(f); e.target.value = ""; }} />
        </label>
      </div>

      {rec.melody && (
        <section className="card-paper mt-6 p-4">
          <p className="label-caps">{t("rp.heard")}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {rec.melody.names.slice(0, 32).map((n, i) => <span key={i} className="flex h-9 min-w-8 items-center justify-center rounded-lg bg-beige px-1.5 font-display font-semibold text-ink">{noteName(n, lang)}</span>)}
          </div>
          <p className="mt-3 text-sm text-graphite">{t("rp.likely", { key: keyName(rec.melody.key, lang), bpm: rec.melody.bpm })}</p>
        </section>
      )}

      <p className="label-caps mt-6">{t("rp.for")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map((x) => (
          <button key={x.label} onClick={() => setTarget(x.label)} className={`pill min-h-11 px-5 text-sm ${x.label === target ? "bg-ink text-cream" : "border border-border bg-paper text-ink"}`}>{t(x.label)}</button>
        ))}
      </div>

      <div className="flex-1" />
      {rec.melody && !busy ? (
        <Link to="/" search={{ tab: "audio", arrange: true }} onClick={() => storeEnsemble(ensemble)} className="btn btn-primary mt-8 h-14 w-full text-base"><Spark />{t("form.arrange")}</Link>
      ) : (
        <button disabled className="btn btn-primary mt-8 h-14 w-full text-base opacity-50"><Spark />{t("rp.first")}</button>
      )}
    </main>
  );
}
