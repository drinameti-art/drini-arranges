// Client-side sanity checks for Drini's ABC output (parse, bar lengths, voice alignment, ranges).
import { checkVoiceLeading, keyAccidentals, makeSpeller, type NoteEvent } from "./harmony";

export type Check = { ok: boolean; label: string };
export type CheckResult = { checks: Check[]; problems: string[] };

// Diatonic steps from C4 (abcjs pitch numbering: C4 = 0, D4 = 1 ...).
const RANGES: { match: RegExp; lo: number; hi: number; label: string }[] = [
  { match: /contrabass|double bass/i, lo: -19, hi: -3, label: "E1–G3" },
  { match: /piccolo/i, lo: 8, hi: 21, label: "D5–C7" },
  { match: /flute/i, lo: 0, hi: 21, label: "C4–C7" },
  { match: /horn/i, lo: -11, hi: 10, label: "F2–F5" },
  { match: /bassoon/i, lo: -15, hi: 9, label: "Bb1–E5" },
  { match: /soprano/i, lo: 0, hi: 11, label: "C4–G5" },
  { match: /alto/i, lo: -3, hi: 8, label: "G3–D5" },
  { match: /tenor/i, lo: -7, hi: 4, label: "C3–G4" },
  { match: /^bass\b|choir bass|\bbass$/i, lo: -12, hi: 0, label: "E2–C4" },
  { match: /viola/i, lo: -7, hi: 9, label: "C3–E5" },
  { match: /violin/i, lo: -3, hi: 19, label: "G3–A6" },
  { match: /cello/i, lo: -14, hi: 5, label: "C2–A4" },
  { match: /guitar/i, lo: -12, hi: 13, label: "E2–B5" },
];

function voiceNames(abc: string): string[] {
  const defs = new Map<string, string>();
  for (const m of abc.matchAll(/^V:\s*(\S+)([^\n]*)$/gm)) {
    const id = m[1] ?? "";
    const name = /name="([^"]+)"/.exec(m[2] ?? "")?.[1] ?? id;
    if (!defs.has(id)) defs.set(id, name);
  }
  const score = /^%%(?:score|staves)\s+(.+)$/m.exec(abc)?.[1];
  const order = score ? score.replace(/[{}()[\]|]/g, " ").split(/\s+/).filter(Boolean) : [...defs.keys()];
  return order.map((id) => defs.get(id) ?? id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkAbcWith(abcjs: any, abc: string): CheckResult {
  const fail = (msg: string): CheckResult => ({ checks: [{ ok: false, label: "Score didn't parse" }], problems: [msg] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tune: any;
  try {
    tune = abcjs.parseOnly(abc)?.[0];
  } catch (e) {
    return fail(`The ABC could not be parsed: ${String(e)}`);
  }
  if (!tune?.lines?.some((l: { staff?: unknown }) => l.staff)) return fail("The ABC has no music lines that abcjs can read.");

  const mf = tune.getMeterFraction?.() ?? { num: 4, den: 4 };
  const barLen = mf.num / mf.den;
  const names = voiceNames(abc);
  const voices: {
    bars: number[]; acc: number; pitches: { p: number; bar: number }[];
    t: number; events: NoteEvent[]; speller: ReturnType<typeof makeSpeller> | null; clef: string;
  }[] = [];

  for (const line of tune.lines) {
    if (!line.staff) continue;
    let idx = 0;
    for (const st of line.staff) {
      for (const voice of st.voices ?? []) {
        const rec = (voices[idx] ??= { bars: [], acc: 0, pitches: [], t: 0, events: [], speller: null, clef: String(st.clef?.type ?? "treble") });
        rec.speller ??= makeSpeller(keyAccidentals(st.key?.accidentals));
        let mult = 1;
        for (const el of voice) {
          if (el.el_type === "note" && el.duration) {
            if (el.startTriplet) mult = el.tripletMultiplier ?? 1;
            const dur = el.duration * mult;
            const midis: number[] = [];
            for (const p of el.pitches ?? []) {
              rec.pitches.push({ p: p.pitch, bar: rec.bars.length + 1 });
              midis.push(rec.speller.midi(p.pitch, p.accidental));
            }
            rec.events.push({ t: rec.t, dur, midis: el.rest ? [] : midis });
            rec.t += dur;
            rec.acc += dur;
            if (el.endTriplet) mult = 1;
          } else if (el.el_type === "bar") {
            rec.speller.newBar();
            if (rec.acc > 0) {
              rec.bars.push(rec.acc);
              rec.acc = 0;
            }
          }
        }
        idx++;
      }
    }
  }
  voices.forEach((v) => { if (v.acc > 0) { v.bars.push(v.acc); v.acc = 0; } });

  const problems: string[] = [];
  const checks: Check[] = [{ ok: true, label: "Score parses" }];

  const badBars: string[] = [];
  voices.forEach((v, i) => {
    v.bars.forEach((d, b) => {
      const edge = (b === 0 || b === v.bars.length - 1) && d < barLen;
      if (!edge && Math.abs(d - barLen) > 1e-3) badBars.push(`${names[i] ?? `Voice ${i + 1}`} bar ${b + 1}`);
    });
  });
  if (badBars.length) {
    problems.push(`These bars don't add up to ${mf.num}/${mf.den}: ${badBars.slice(0, 8).join(", ")}.`);
    checks.push({ ok: false, label: `Bar lengths off in ${badBars.length} bar${badBars.length > 1 ? "s" : ""}` });
  } else checks.push({ ok: true, label: "Every bar adds up" });

  const counts = voices.map((v) => v.bars.length);
  if (new Set(counts).size > 1) {
    problems.push(`Voices have different bar counts: ${counts.map((c, i) => `${names[i] ?? `Voice ${i + 1}`} ${c}`).join(", ")}.`);
    checks.push({ ok: false, label: "Voices don't line up" });
  } else checks.push({ ok: true, label: `Voices line up · ${counts[0] ?? 0} bars` });

  const rangeIssues: string[] = [];
  voices.forEach((v, i) => {
    const name = names[i] ?? "";
    const r = RANGES.find((x) => x.match.test(name));
    if (!r) return;
    const out = v.pitches.filter((x) => x.p < r.lo || x.p > r.hi);
    if (out.length) rangeIssues.push(`${name} goes outside ${r.label} in bar ${out[0]?.bar}`);
  });
  if (rangeIssues.length) {
    problems.push(`Range problems: ${rangeIssues.join("; ")}.`);
    checks.push({ ok: false, label: rangeIssues[0] ?? "Range issue" });
  } else checks.push({ ok: true, label: "Ranges checked" });

  // Staff: every part stays within one ledger line of its staff (Drin's rule for readable parts).
  const STAFF: Record<string, [number, number, string]> = {
    treble: [0, 13, "C4–B5"], bass: [-12, 1, "E2–D4"], alto: [-6, 7, "D3–C5"], tenor: [-8, 5, "B2–A4"],
  };
  const LET = "CDEFGAB";
  const nameOf = (p: number) => `${LET[((p % 7) + 7) % 7]}${Math.floor(p / 7) + 4}`;
  const offStaff: string[] = [];
  const offNames: string[] = [];
  voices.forEach((v, i) => {
    const base = STAFF[v.clef.replace(/[+-]8$/, "")];
    if (!base) return;
    // piano hands may use two ledger lines; every other part one
    const wide = /piano|pian|\b(rh|lh)\b|keys|harp/i.test(names[i] ?? "") ? 2 : 0;
    const lim: [number, number, string] = [base[0] - wide, base[1] + wide, wide ? `${base[2]}, two ledger lines for piano` : base[2]];
    const out = v.pitches.filter((x) => x.p < lim[0] || x.p > lim[1]);
    if (!out.length) return;
    const worst = out.reduce((a, b) => (Math.abs(b.p - (b.p > lim[1] ? lim[1] : lim[0])) > Math.abs(a.p - (a.p > lim[1] ? lim[1] : lim[0])) ? b : a));
    const name = names[i] ?? `Voice ${i + 1}`;
    offNames.push(name);
    offStaff.push(`${name} goes beyond the staff in ${out.length} place${out.length > 1 ? "s" : ""}, worst in bar ${worst.bar} (${nameOf(worst.p)}); keep it within one ledger line (${v.clef} clef ${lim[2]}) by changing octave, clef or giving the passage to another part`);
  });
  if (offStaff.length) {
    problems.push(`Ledger lines: ${offStaff.join("; ")}.`);
    checks.push({ ok: false, label: `Notes beyond the staff: ${offNames.slice(0, 3).join(", ")}` });
  } else if (voices.length) checks.push({ ok: true, label: "Notes stay on the staff" });

  // Voice leading: parallels, crossing, spacing, piano stretches.
  if (voices.length >= 1) {
    const issues = checkVoiceLeading(
      voices.map((v, i) => ({ name: names[i] ?? `Voice ${i + 1}`, events: v.events })),
      barLen,
    );
    const first = (k: string) => issues.find((x) => x.kind === k);
    const par = first("parallel");
    if (voices.length >= 2) {
      checks.push(par ? { ok: false, label: `Parallel 5ths / 8ves in bar ${par.bar}` } : { ok: true, label: "No parallel 5ths / 8ves" });
    }
    const cross = first("crossing");
    if (cross) checks.push({ ok: false, label: `Voices cross in bar ${cross.bar}` });
    const space = first("spacing");
    if (space) checks.push({ ok: false, label: `Wide spacing in bar ${space.bar}` });
    const stretch = first("stretch");
    if (stretch) checks.push({ ok: false, label: `Wide hand stretch in bar ${stretch.bar}` });
    if (issues.length) problems.push(`Voice-leading problems: ${issues.slice(0, 6).map((x) => x.text).join("; ")}.`);
  }

  // Notation habits (shown as pills only; never sent to the fix pass, which would cost AI credits).
  const music = voiceMusic(abc);
  const noDyn = [...music.entries()]
    .filter(([, m]) => {
      // mask decorations and annotations so "!mf!" or "^text" letters don't count as notes
      const masked = m.replace(/![^!]*!|"[^"]*"/g, (x) => " ".repeat(x.length));
      const head = m.slice(0, Math.max(0, masked.search(/[A-Ga-gz]/)));
      return !/!(p{1,3}|mp|mf|f{1,3}|sfz|fp)!/.test(head);
    })
    .map(([id]) => voiceLabel(abc, id));
  if (music.size) checks.push(noDyn.length ? { ok: false, label: `No starting dynamic: ${noDyn.slice(0, 3).join(", ")}` } : { ok: true, label: "Dynamics marked" });
  if (music.size) checks.push(/!fermata!|(^|[\s|[(])H[\^_=]?[A-Ga-g]/.test(abc) ? { ok: true, label: "Final fermata" } : { ok: false, label: "No fermata on the final chord" });

  return { checks, problems };
}

/** Music text of each voice, keyed by voice id (handles both "V:1" lines and inline "[V:1]"). */
function voiceMusic(abc: string): Map<string, string> {
  const out = new Map<string, string>();
  let cur = "1";
  let inBody = false;
  for (const raw of abc.split("\n")) {
    const line = raw.replace(/%.*$/, "");
    const v = /^V:\s*(\S+)/.exec(line);
    if (v) { cur = v[1]!; continue; }
    if (/^K:/.test(line)) { inBody = true; continue; }
    if (!inBody || /^[A-Za-z]:/.test(line)) continue;
    let rest = line;
    const inline = /^\[V:\s*([^\]\s]+)[^\]]*\]/.exec(rest);
    if (inline) { cur = inline[1]!; rest = rest.slice(inline[0].length); }
    if (!rest.trim()) continue;
    out.set(cur, (out.get(cur) ?? "") + " " + rest.trim());
  }
  return out;
}

function voiceLabel(abc: string, id: string) {
  const re = new RegExp(`^V:\\s*${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^\\n]*name="([^"]+)"`, "m");
  return re.exec(abc)?.[1] ?? `Voice ${id}`;
}

export async function checkAbc(abc: string): Promise<CheckResult> {
  const mod = await import("abcjs");
  return checkAbcWith(mod.default ?? mod, abc);
}
