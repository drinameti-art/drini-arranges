import { useCallback, useEffect, useRef, useState } from "react";
import { arrange as arrangeFn, arrangeFromFile as arrangeFileFn, revise as reviseFn } from "@/lib/drini.functions";
import { checkAbc, type Check } from "@/lib/abc-check";
import { keyName as abcKeyName, transposeAbc } from "@/lib/abc-tools";
import { getLang, tr } from "@/lib/i18n";
import { beamAbc } from "@/lib/abc-beam";
import { toAbc, type ImportedNote } from "@/lib/score-import";
import { sampleScoreAbc } from "./data";
import type { ArrangeRequest } from "./ArrangeForm";
import { loadEnsemble, loadMelody, type StoredMelody } from "./useMelodyRecorder";
import { newId, saveScore, type SavedScore } from "./library";
import { demoFor } from "./demo";
import { countArrangement, FREE_PER_MONTH, freeLeft, getDemo } from "./usage";

type DriniResult = Awaited<ReturnType<typeof arrangeFn>>;
type Arrangement = Extract<DriniResult, { ok: true }>["arrangement"];

/** A chat message; `key` marks built-in messages that are shown in the current language. */
export type Msg = { from: "user" | "drini"; text: string; key?: "chat.welcome" };
export type Score = Pick<Arrangement, "title" | "key" | "meter" | "bars" | "abc" | "notes"> & { example?: boolean };
/** One version of the arrangement on screen, so the user can go back to an earlier draft. */
export type Draft = { n: number; score: Score; checks: Check[]; label: string };

const initialScore: Score = {
  title: "Folk melody — Piano 4 hands",
  key: "G major",
  meter: "4/4",
  bars: 8,
  abc: sampleScoreAbc,
  notes: [{ bar: 3, text: "wide leap in primo" }],
  example: true,
};

const defaultRequest: ArrangeRequest = {
  mode: "audio",
  prompt: "",
  ensemble: "Piano 4 hands",
  level: "Easy",
  key: "G major",
  style: "Lyrical",
  melody: null,
  upload: null,
};

type Meta = { ensemble: string; level: string; id: string };

/** All Studio state for talking to Drini: the current score, its checks, the chat and loading flags. */
export function useDrini() {
  const [score, setScore] = useState<Score>(initialScore);
  const [checks, setChecks] = useState<Check[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "drini", text: "", key: "chat.welcome" }]);
  const [draft, setDraft] = useState(1);
  const [drafts, setDrafts] = useState<Draft[]>([{ n: 1, score: initialScore, checks: [], label: "" }]);
  /** Record the score now on screen as a draft; a new arrangement starts the list again. */
  const remember = (next: Score, nextChecks: Check[], label: string, fresh: boolean) => {
    setDrafts((list) => {
      const base = fresh ? [] : list;
      const n = (base[base.length - 1]?.n ?? 0) + 1;
      setDraft(n);
      return [...base, { n, score: next, checks: nextChecks, label }].slice(-12);
    });
  };
  const [arranging, setArranging] = useState(false);
  const [revising, setRevising] = useState(false);
  // which saved score is on screen, so revisions update it instead of adding a new one
  const current = useRef<Meta | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  const say = (text: string) => setMsgs((m) => [...m, { from: "drini", text }]);

  // Check the sample score once on load so the pills show real results.
  useEffect(() => {
    void checkAbc(initialScore.abc).then((r) => setChecks(r.checks)).catch(() => setChecks([]));
  }, []);

  const history = () =>
    msgsRef.current.filter((m) => m.text).slice(-10).map((m) => ({
      role: m.from === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text.slice(0, 4000),
    }));

  /** Show a score and save it (used by AI results and demo mode). */
  const show = (next: Score, meta: Meta, result: Awaited<ReturnType<typeof checkAbc>>, label = "", fresh = true) => {
    setScore(next);
    setChecks(result.checks);
    current.current = { ...meta };
    setCurrentId(meta.id);
    saveScore({ ...next, ...meta, createdAt: Date.now() });
    remember(next, result.checks, label, fresh);
  };

  /** Validate an AI result, ask Drini to fix it once if a hard check fails, then show it. */
  const apply = useCallback(async (res: DriniResult, meta: Meta, isNew: boolean, label = "") => {
    if (!res.ok) { say(res.error + (/credit/i.test(res.error) ? tr("msg.credits") : "")); return; }
    let a = { ...res.arrangement, abc: beamAbc(res.arrangement.abc) };
    let result = await checkAbc(a.abc);
    if (result.problems.length) {
      try {
        const fix = await reviseFn({
          data: { abc: a.abc.slice(0, 20000), message: `Fix these problems: ${result.problems.join(" ")}`, history: [], lang: getLang() },
        });
        if (fix.ok) {
          const fixed = await checkAbc(beamAbc(fix.arrangement.abc));
          if (fixed.problems.length <= result.problems.length) {
            a = { ...fix.arrangement, abc: beamAbc(fix.arrangement.abc), summary: a.summary };
            result = fixed;
          }
        }
      } catch {
        // keep the first version and its check results
      }
    }
    if (result.checks[0]?.label === "Score didn't parse") { say(tr("msg.unreadable")); return; }
    show({ title: a.title, key: abcKeyName(a.abc) ?? a.key, meter: a.meter, bars: a.bars, abc: a.abc, notes: a.notes }, meta, result, label, isNew);
    if (isNew) countArrangement();
    say(a.summary);
  }, []);

  /** Demo mode: show a ready-made or imported score locally, without AI. */
  const demo = useCallback(async (r: ArrangeRequest) => {
    let abc: string | null = null;
    let notes: Score["notes"] = [];
    let message = tr("demo.arranged", { ensemble: r.ensemble });
    const melody = r.mode === "audio" ? r.melody ?? loadMelody() : null;
    if (r.mode === "upload" && r.upload?.kind === "abc") { abc = r.upload.abc; message = tr("demo.source", { ensemble: r.ensemble }); }
    else if (melody) { abc = melodyToAbc(melody); message = tr("demo.melody", { ensemble: r.ensemble }); }
    else {
      if (r.mode === "upload" && r.upload) message = tr("demo.photo");
      const d = demoFor(r.ensemble);
      abc = d?.abc ?? sampleScoreAbc;
      notes = d?.notes ?? initialScore.notes;
    }
    abc = beamAbc(abc);
    const result = await checkAbc(abc);
    const title = /^T:(.*)$/m.exec(abc)?.[1]?.trim() || "Demo";
    const bars = (abc.match(/^\[V:[^\]]+\][^\n]*/m)?.[0].match(/\|/g)?.length ?? 8) - 0;
    const meter = /^M:(.*)$/m.exec(abc)?.[1]?.trim() ?? "4/4";
    show({ title, key: abcKeyName(abc) ?? "", meter, bars, abc, notes }, { id: newId(), ensemble: r.ensemble, level: r.level }, result);
    say(message);
  }, []);

  const arrange = useCallback(
    async (req?: ArrangeRequest) => {
      const r = req ?? { ...defaultRequest, ensemble: loadEnsemble() ?? defaultRequest.ensemble };
      const lang = getLang();
      if (getDemo()) {
        setArranging(true);
        try { await new Promise((ok) => setTimeout(ok, 700)); await demo(r); } finally { setArranging(false); }
        return;
      }
      if (freeLeft() <= 0) { say(tr("usage.out", { max: FREE_PER_MONTH })); return; }
      const words = (r.lyrics ?? "").trim();
      const lyricsNote = words
        ? `\n\nLyrics to set under the melody (one syllable per note, hyphens between syllables of a word, in w: lines under the voice that sings them):\n${words.slice(0, 2000)}`
        : "";
      const text = r.prompt.trim();
      let description = text;
      if (r.mode === "audio") {
        const m = r.melody ?? loadMelody();
        if (!m) { say(tr("msg.needMelody")); return; }
        description =
          `Arrange this melody, transcribed from the user's recording (note, octave and length): ${m.text}. ` +
          `It sounds like ${m.key} at about ${m.bpm} BPM. Keep the melody's notes and rhythm (tidy obvious transcription slips), ` +
          `and use its key unless the requested key below says otherwise ("Keep original" means use the melody's key). ${text}`;
      } else if (r.mode === "upload") {
        const src = r.upload;
        if (!src) { say(tr("msg.needUpload")); return; }
        setArranging(true);
        try {
          const base = { ensemble: r.ensemble, level: r.level, key: r.key, style: r.style, description: (text + lyricsNote).slice(0, 4000), lang };
          const res = src.kind === "abc"
            ? await arrangeFn({ data: { ...base, source: src.abc.slice(0, 30000) } })
            : await arrangeFileFn({ data: { ...base, data: src.data, mediaType: src.mediaType as "image/jpeg" | "application/pdf", fileName: src.fileName.slice(0, 200) } });
          await apply(res, { id: newId(), ensemble: r.ensemble, level: r.level }, true);
        } catch {
          say(tr("msg.uploadFail"));
        } finally {
          setArranging(false);
        }
        return;
      } else if (!text) {
        say(tr("msg.needText"));
        return;
      }
      setArranging(true);
      try {
        const res = await arrangeFn({
          data: { description: (description + lyricsNote).slice(0, 4000), ensemble: r.ensemble, level: r.level, key: r.key, style: r.style, lang },
        });
        await apply(res, { id: newId(), ensemble: r.ensemble, level: r.level }, true);
      } catch {
        say(tr("msg.fail"));
      } finally {
        setArranging(false);
      }
    },
    [apply, demo],
  );

  const revise = useCallback(
    async (message: string) => {
      const v = message.trim();
      if (!v) return;
      const prior = history();
      setMsgs((m) => [...m, { from: "user", text: v }]);
      if (getDemo()) { setTimeout(() => say(tr("demo.revise")), 400); return; }
      setRevising(true);
      try {
        const res = await reviseFn({ data: { abc: score.abc.slice(0, 20000), message: v.slice(0, 4000), history: prior, lang: getLang() } });
        await apply(res, current.current ?? { id: newId(), ensemble: "Piano 4 hands", level: "Easy" }, false, v.slice(0, 60));
      } catch {
        say(tr("msg.fail"));
      } finally {
        setRevising(false);
      }
    },
    [apply, score.abc],
  );

  /** Show a saved score again. */
  const open = useCallback(async (saved: SavedScore) => {
    current.current = { id: saved.id, ensemble: saved.ensemble, level: saved.level };
    setCurrentId(saved.id);
    const abc = beamAbc(saved.abc);
    const opened: Score = { title: saved.title, key: saved.key, meter: saved.meter, bars: saved.bars, abc, notes: saved.notes };
    setScore(opened);
    const c = (await checkAbc(abc).catch(() => null))?.checks ?? [];
    setChecks(c);
    remember(opened, c, "", true);
    say(tr("msg.opened", { title: saved.title }));
  }, []);

  /** Move the whole score up or down by semitones (done in the browser, no AI needed). */
  const transpose = useCallback(
    async (semitones: number, label: string) => {
      try {
        const abc = beamAbc(await transposeAbc(score.abc, semitones));
        const result = await checkAbc(abc);
        if (result.checks[0]?.label === "Score didn't parse") throw new Error("unreadable");
        const next: Score = { ...score, abc, key: abcKeyName(abc) ?? score.key, notes: score.notes };
        setScore(next);
        setChecks(result.checks);
        remember(next, result.checks, label, false);
        if (current.current) saveScore({ ...next, ...current.current, createdAt: Date.now() });
        say(tr("msg.transposed", { step: label.toLowerCase(), key: next.key }) + (result.problems.length ? tr("msg.transposedRange") : ""));
      } catch {
        say(tr("msg.transposeFail"));
      }
    },
    [score],
  );

  /** Go back to an earlier draft: it becomes the score on screen (and is saved again). */
  const restore = useCallback((n: number) => {
    const d = drafts.find((x) => x.n === n);
    if (!d) return;
    setScore(d.score);
    setChecks(d.checks);
    setDraft(n);
    if (current.current) saveScore({ ...d.score, ...current.current, createdAt: Date.now() });
    say(tr("msg.restored", { n }));
  }, [drafts]);

  /** Show a ready-made example (not saved, not counted), e.g. from the empty Recent list. */
  const preview = useCallback(async (abc: string) => {
    const fixed = beamAbc(abc);
    const result = await checkAbc(fixed);
    const title = /^T:(.*)$/m.exec(fixed)?.[1]?.trim() || "Example";
    const meter = /^M:(.*)$/m.exec(fixed)?.[1]?.trim() ?? "4/4";
    const bars = (fixed.match(/^\[V:[^\]]+\][^\n]*/m)?.[0].match(/\|/g)?.length ?? 8);
    current.current = null;
    setCurrentId(null);
    const next: Score = { title, key: abcKeyName(fixed) ?? "", meter, bars, abc: fixed, notes: [], example: true };
    setScore(next);
    setChecks(result.checks);
    remember(next, result.checks, "", true);
  }, []);

  return { score, checks, msgs, draft, drafts, arranging, revising, busy: arranging || revising, currentId, arrange, revise, open, transpose, restore, preview };
}

// ---- demo helpers ----

const PCS: Record<string, number> = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const FIFTHS: Record<number, number> = { 0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6, 1: -5, 5: -1, 10: -2, 3: -3, 8: -4 };
const LEN: Record<string, number> = { eighth: 0.5, quarter: 1, "dotted quarter": 1.5, half: 2, "dotted half": 3, whole: 4 };

/** The analyser's "G4 (quarter), A4 (half), …" text → a one-staff ABC melody. */
function melodyToAbc(m: StoredMelody): string {
  const events: ImportedNote[] = [];
  let t = 0;
  for (const part of m.text.split(/,\s*/)) {
    const x = /^([A-G][#b]?)(-?\d)\s*\(([^)]+)\)/.exec(part.trim());
    if (!x) continue;
    const midi = 12 * (Number(x[2]) + 1) + (PCS[x[1]!] ?? 0);
    const words = x[3]!;
    const d = LEN[words] ?? (Number(/^(\d+)/.exec(words)?.[1] ?? "2") / 2);
    events.push({ t, d, p: [midi] });
    t += d;
  }
  const km = /^([A-G][#b]?)\s+(major|minor)/i.exec(m.key);
  const pc = km ? PCS[km[1]!] ?? 0 : 0;
  const fifths = FIFTHS[km && /minor/i.test(km[2]!) ? (pc + 3) % 12 : pc] ?? 0;
  return toAbc({ title: "Your melody", fifths, num: 4, den: 4, tempo: m.bpm, parts: [{ name: "Melody", events }] });
}
