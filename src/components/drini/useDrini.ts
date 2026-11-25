import { useCallback, useEffect, useRef, useState } from "react";
import { arrange as arrangeFn, revise as reviseFn } from "@/lib/drini.functions";
import { checkAbc, type Check } from "@/lib/abc-check";
import { sampleScoreAbc } from "./data";
import type { ArrangeRequest } from "./ArrangeForm";
import { loadEnsemble, loadMelody } from "./useMelodyRecorder";
import { newId, saveScore, type SavedScore } from "./library";
import { keyName, transposeAbc } from "@/lib/abc-tools";

type DriniResult = Awaited<ReturnType<typeof arrangeFn>>;
type Arrangement = Extract<DriniResult, { ok: true }>["arrangement"];

export type Msg = { from: "user" | "drini"; text: string };
export type Score = Pick<Arrangement, "title" | "key" | "meter" | "bars" | "abc" | "notes">;

const initialScore: Score = {
  title: "Folk melody — Piano 4 hands",
  key: "G major",
  meter: "4/4",
  bars: 8,
  abc: sampleScoreAbc,
  notes: [{ bar: 3, text: "wide leap in primo" }],
};

const initialMsgs: Msg[] = [
  { from: "user", text: "Make it easy for the younger sister on secondo." },
  {
    from: "drini",
    text: "Done. The secondo now plays half notes on the tonic (I) and dominant (V) bass notes, with no hand position changes in the first 8 bars. The primo has an upward leap of a sixth in bar 3. Should I smooth it with a passing note?",
  },
];

const defaultRequest: ArrangeRequest = {
  mode: "audio",
  prompt: "",
  ensemble: "Piano 4 hands",
  level: "Easy",
  key: "G major",
  style: "Lyrical",
  melody: null,
};

const FAIL = "I couldn't finish that one — try again?";
const UNREADABLE = "I wrote something I couldn't read back as a score, so I kept the previous version. Try again?";

/** All Studio state for talking to Drini: the current score, its checks, the chat and loading flags. */
export function useDrini() {
  const [score, setScore] = useState<Score>(initialScore);
  const [checks, setChecks] = useState<Check[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>(initialMsgs);
  const [draft, setDraft] = useState(2);
  const [arranging, setArranging] = useState(false);
  const [revising, setRevising] = useState(false);
  // which saved score is on screen, so revisions update it instead of adding a new one
  const current = useRef<{ id: string; ensemble: string; level: string } | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  const say = (text: string) => setMsgs((m) => [...m, { from: "drini", text }]);

  // Check the sample score once on load so the pills show real results.
  useEffect(() => {
    void checkAbc(initialScore.abc).then((r) => setChecks(r.checks)).catch(() => setChecks([]));
  }, []);

  const history = () =>
    msgsRef.current.slice(-10).map((m) => ({
      role: m.from === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text.slice(0, 4000),
    }));

  /** Validate a result, ask Drini to fix it once if a check fails, then show it. */
  const apply = useCallback(async (res: DriniResult, meta: { ensemble: string; level: string; id: string }) => {
    if (!res.ok) { say(res.error); return; }
    let a = res.arrangement;
    let result = await checkAbc(a.abc);
    if (result.problems.length) {
      try {
        const fix = await reviseFn({
          data: { abc: a.abc.slice(0, 20000), message: `Fix these problems: ${result.problems.join(" ")}`, history: [] },
        });
        if (fix.ok) {
          const fixed = await checkAbc(fix.arrangement.abc);
          if (fixed.problems.length <= result.problems.length) {
            a = { ...fix.arrangement, summary: a.summary };
            result = fixed;
          }
        }
      } catch {
        // keep the first version and its check results
      }
    }
    if (result.checks[0]?.label === "Score didn't parse") { say(UNREADABLE); return; }
    const next: Score = { title: a.title, key: keyName(a.abc) ?? a.key, meter: a.meter, bars: a.bars, abc: a.abc, notes: a.notes };
    setScore(next);
    setChecks(result.checks);
    current.current = { ...meta };
    setCurrentId(meta.id);
    saveScore({ ...next, ...meta, createdAt: Date.now() });
    setDraft((d) => d + 1);
    say(a.summary);
  }, []);

  const arrange = useCallback(
    async (req?: ArrangeRequest) => {
      const r = req ?? { ...defaultRequest, ensemble: loadEnsemble() ?? defaultRequest.ensemble };
      const text = r.prompt.trim();
      let description = text;
      if (r.mode === "audio") {
        const m = r.melody ?? loadMelody();
        if (!m) { say("Record or upload a melody first, then press Arrange and I'll get to work."); return; }
        description =
          `Arrange this melody, transcribed from the user's recording (note, octave and length): ${m.text}. ` +
          `It sounds like ${m.key} at about ${m.bpm} BPM. Keep the melody's notes and rhythm (tidy obvious transcription slips), ` +
          `and use its key unless the requested key below says otherwise ("Keep original" means use the melody's key). ${text}`;
      } else if (!text) {
        say("Tell me what to arrange first: describe the piece, the instruments and the feel.");
        return;
      }
      setArranging(true);
      try {
        const res = await arrangeFn({
          data: { description: description.slice(0, 2000), ensemble: r.ensemble, level: r.level, key: r.key, style: r.style },
        });
        await apply(res, { id: newId(), ensemble: r.ensemble, level: r.level });
      } catch {
        say(FAIL);
      } finally {
        setArranging(false);
      }
    },
    [apply],
  );

  const revise = useCallback(
    async (message: string) => {
      const v = message.trim();
      if (!v) return;
      const prior = history();
      setMsgs((m) => [...m, { from: "user", text: v }]);
      setRevising(true);
      try {
        const res = await reviseFn({ data: { abc: score.abc.slice(0, 20000), message: v.slice(0, 4000), history: prior } });
        await apply(res, current.current ?? { id: newId(), ensemble: "Piano 4 hands", level: "Easy" });
      } catch {
        say(FAIL);
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
    setScore({ title: saved.title, key: saved.key, meter: saved.meter, bars: saved.bars, abc: saved.abc, notes: saved.notes });
    setDraft(1);
    setChecks((await checkAbc(saved.abc).catch(() => null))?.checks ?? []);
    say(`Here's "${saved.title}" again. Tell me what you'd like to change.`);
  }, []);

  /** Move the whole score up or down by semitones (done in the browser, no AI needed). */
  const transpose = useCallback(
    async (semitones: number, label: string) => {
      try {
        const abc = await transposeAbc(score.abc, semitones);
        const result = await checkAbc(abc);
        if (result.checks[0]?.label === "Score didn't parse") throw new Error("unreadable");
        const next: Score = { ...score, abc, key: keyName(abc) ?? score.key, notes: score.notes };
        setScore(next);
        setChecks(result.checks);
        setDraft((d) => d + 1);
        if (current.current) saveScore({ ...next, ...current.current, createdAt: Date.now() });
        say(`Transposed ${label}: now in ${next.key}.${result.problems.length ? " Some notes now sit outside a comfortable range, see the pills under the score." : ""}`);
      } catch {
        say("I couldn't transpose that score. Try another step, or ask me in the chat.");
      }
    },
    [score],
  );

  return { score, checks, msgs, draft, arranging, revising, busy: arranging || revising, currentId, arrange, revise, open, transpose };
}
