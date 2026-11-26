import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, FileMusic, Loader2, Mic, Square, Upload, X } from "lucide-react";
import { Spark } from "./Logo";
import { Waveform } from "./Waveform";
import { formatTime, loadMelody, useMelodyRecorder, type StoredMelody } from "./useMelodyRecorder";
import { ScoreSheet } from "./ScoreSheet";
import { importScoreFile, type ScoreSource } from "@/lib/score-import";
import { keyName, noteName, optionLabel, useLang } from "@/lib/i18n";
import { setDemo, useDemo } from "./usage";

export type ArrangeRequest = {
  mode: "text" | "audio" | "upload";
  prompt: string;
  ensemble: string;
  level: string;
  key: string;
  style: string;
  melody: StoredMelody | null;
  upload: ScoreSource | null;
  /** Optional words to set under the melody (choir, songs). */
  lyrics?: string;
};

const selects = [
  { id: "ensemble", label: "sel.ensemble", options: ["Piano 4 hands", "Solo piano", "Piano + strings (2 violins, viola)", "String quartet", "String orchestra", "Flute + piano", "Wind quartet", "SATB choir", "SA choir + piano", "Guitar", "Lead sheet"] },
  { id: "level", label: "sel.level", options: ["Easy", "Intermediate", "Advanced"] },
  { id: "key", label: "sel.key", options: ["Keep original", "C major", "G major", "D major", "A major", "F major", "Bb major", "Eb major", "A minor", "E minor", "D minor", "G minor"] },
  { id: "style", label: "sel.style", options: ["Lyrical", "Classical", "Pop", "Jazz", "Folk"] },
] as const;

const tryPrompts = ["try.1", "try.2", "try.3"] as const;

type Preset = { id: string; title: string; request: Partial<ArrangeRequest> };

export function ArrangeForm({ loading, onArrange, initialMode = "text", preset = null }: { loading: boolean; onArrange: (r: ArrangeRequest) => void; initialMode?: ArrangeRequest["mode"]; preset?: Preset | null }) {
  const [req, setReq] = useState<ArrangeRequest>({
    mode: initialMode,
    prompt: "",
    ensemble: "Piano 4 hands",
    level: "Easy",
    key: "G major",
    style: "Lyrical",
    melody: null,
    upload: null,
    lyrics: "",
  });
  const [showLyrics, setShowLyrics] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setImporting(true);
    setImportError(null);
    try {
      const src = await importScoreFile(f);
      setReq((r) => ({ ...r, upload: src }));
    } catch (e) {
      setReq((r) => ({ ...r, upload: null }));
      setImportError(e instanceof Error ? e.message : "I couldn't read that file.");
    } finally {
      setImporting(false);
    }
  };
  const rec = useMelodyRecorder();
  const { t, lang } = useLang();
  const demo = useDemo();
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
    <section id="arrange" className="card-paper scroll-mt-20 p-5 md:p-6">
      <h2 className="text-2xl text-ink">{t("form.title")}</h2>
      {presetTitle && (
        <p className="mt-2 text-sm text-graphite">
          {t("form.template", { name: presetTitle })}
          {req.mode === "audio" && t("form.templateAudio")}
        </p>
      )}

      <div role="tablist" className="mt-4 grid grid-cols-3 rounded-xl bg-beige p-1">
        {(["text", "audio", "upload"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={req.mode === m}
            onClick={() => setReq({ ...req, mode: m })}
            className={`min-h-11 rounded-[10px] px-1 text-xs font-medium transition-colors sm:text-sm ${req.mode === m ? "bg-paper text-ink shadow-sm" : "text-graphite hover:text-ink"}`}
          >
            {m === "text" ? t("tab.text") : m === "audio" ? t("tab.audio") : t("tab.upload")}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {req.mode === "text" ? (
          <div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{t("form.describe")}</span>
            <textarea
              id="drini-prompt"
              placeholder={t("try.2")}
              className="field min-h-28 resize-y leading-relaxed"
              value={req.prompt}
              onChange={(e) => setReq({ ...req, prompt: e.target.value })}
            />
          </label>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-graphite">{t("form.try")}</span>
              {tryPrompts.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setReq({ ...req, prompt: t(k) })}
                  className="pill border border-input bg-paper text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        ) : req.mode === "upload" ? (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-background/50 px-4 py-6 text-center sm:flex-row sm:items-start sm:text-left"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void onFile(e.dataTransfer.files?.[0]); }}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-beige text-primary">
                {importing ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileMusic className="h-7 w-7" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-graphite" aria-live="polite">
                  {importing ? <span className="font-medium text-ink">{t("up.reading")}</span>
                    : importError ? <span className="text-warning">{importError}</span>
                    : req.upload ? <><span className="font-medium text-ink">{req.upload.fileName}</span> · {req.upload.info}</>
                    : <>{t("up.hint")}</>}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <label className="btn btn-ghost cursor-pointer">
                    <Upload className="h-4 w-4" />{t("up.choose")}
                    <input type="file" className="sr-only" accept=".mscz,.mscx,.musicxml,.xml,.mxl,.mid,.midi,.abc,.pdf,image/*"
                      onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  <label className="btn btn-ghost cursor-pointer">
                    <Camera className="h-4 w-4" />{t("up.photo")}
                    <input type="file" className="sr-only" accept="image/*" capture="environment"
                      onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  {req.upload && (
                    <button type="button" className="btn btn-ghost" onClick={() => setReq({ ...req, upload: null })}><X className="h-4 w-4" />{t("up.remove")}</button>
                  )}
                </div>
              </div>
            </div>
            {req.upload?.kind === "abc" && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-graphite">{t("up.read")}</p>
                <div className="max-h-56 overflow-auto rounded-xl border border-border bg-paper px-2 py-2">
                  <div className="min-w-[640px]"><ScoreSheet abc={previewAbc(req.upload.abc)} /></div>
                </div>
              </div>
            )}
            {req.upload?.kind === "image" && req.upload.previewUrl && (
              <img src={req.upload.previewUrl} alt={t("up.photoAlt")} className="max-h-56 rounded-xl border border-border object-contain" />
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">{t("up.extra")}</span>
              <input className="field" value={req.prompt} onChange={(e) => setReq({ ...req, prompt: e.target.value })}
                placeholder={t("up.extraPh")} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-background/50 px-4 py-6 text-center sm:flex-row sm:items-start sm:text-left">
            <button
              type="button"
              onClick={() => (rec.recording ? rec.stop() : void rec.start())}
              disabled={rec.status === "analysing"}
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              aria-label={rec.recording ? t("rec.stop") : t("rec.record")}
            >
              {rec.recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
              <span className="text-[10px] font-medium">{rec.recording ? t("rec.stop") : t("rec.record")}</span>
            </button>
            <div className="min-w-0 flex-1">
              <Waveform animated={rec.recording || rec.status === "analysing"} className="h-10 justify-start" bars={44} />
              <p className="mt-2 text-sm text-graphite" aria-live="polite">
                {rec.status === "recording" && <><span className="font-medium text-ink">{t("rec.listening", { time: formatTime(rec.seconds) })}</span>{t("rec.listeningTail")}</>}
                {rec.status === "analysing" && <span className="font-medium text-ink">{t("rec.finding")}</span>}
                {rec.status === "error" && <span className="text-warning">{rec.error}</span>}
                {rec.status !== "recording" && rec.status !== "analysing" && rec.status !== "error" && (melody
                  ? <><span className="font-medium text-ink">{rec.fileName ?? t("rec.yourMelody")} · {t("rec.notes", { n: melody.names.length })}</span> — {t("rec.likely", { key: keyName(melody.key, lang), bpm: melody.bpm })}</>
                  : <>{t("rec.hint")}</>)}
              </p>
              {melody && rec.status !== "recording" && rec.status !== "analysing" && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {melody.names.slice(0, 32).map((nm) => noteName(nm, lang)).map((n, i) => (
                    <span key={i} className="flex h-8 min-w-7 items-center justify-center rounded-lg bg-beige px-1.5 font-display text-sm font-semibold text-ink">{n}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="btn btn-ghost cursor-pointer">
                  <Upload className="h-4 w-4" />{t("rec.upload")}
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) rec.upload(f); e.target.value = ""; }}
                  />
                </label>
                <Link to="/record" className="btn btn-outline"><Mic className="h-4 w-4" />{t("rec.phone")}</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        {showLyrics || req.lyrics ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{t("form.lyrics")}</span>
            <textarea
              className="field min-h-24 resize-y leading-relaxed"
              placeholder={t("form.lyricsHint")}
              value={req.lyrics ?? ""}
              maxLength={2000}
              onChange={(e) => setReq({ ...req, lyrics: e.target.value })}
            />
          </label>
        ) : (
          <button type="button" className="text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={() => setShowLyrics(true)}>
            + {t("form.addLyrics")}
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {selects.map((s) => (
          <label key={s.id} className="block">
            <span className="mb-1.5 block text-xs font-medium text-graphite">{t(s.label)}</span>
            <select
              className="field cursor-pointer"
              value={req[s.id]}
              onChange={(e) => setReq({ ...req, [s.id]: e.target.value })}
            >
              {s.options.map((o) => <option key={o} value={o}>{optionLabel(o, lang)}</option>)}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-graphite">{t("form.output")}</p>
        <button className="btn btn-primary px-5" disabled={loading || rec.recording || rec.status === "analysing" || importing} onClick={() => onArrange({ ...req, melody })}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Spark />}
          {loading ? t("form.arranging") : t("form.arrange")}
        </button>
      </div>
      <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-graphite">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7B1F3A]" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
        <span><span className="font-medium text-ink">{t("demo.label")}</span> · {t("demo.desc")}</span>
      </label>
    </section>
  );
}

/** Only the first 8 bars of each part, so the preview stays small. */
function previewAbc(abc: string) {
  return abc
    .split("\n")
    .map((l) => (l.startsWith("[V:") ? l.split("|").slice(0, 8).join("|") + "|" : l))
    .join("\n");
}
