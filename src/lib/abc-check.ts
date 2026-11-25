// Client-side sanity checks for Drini's ABC output (parse, bar lengths, voice alignment, ranges).
export type Check = { ok: boolean; label: string };
export type CheckResult = { checks: Check[]; problems: string[] };

// Diatonic steps from C4 (abcjs pitch numbering: C4 = 0, D4 = 1 ...).
const RANGES: { match: RegExp; lo: number; hi: number; label: string }[] = [
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
  const voices: { bars: number[]; acc: number; pitches: { p: number; bar: number }[] }[] = [];

  for (const line of tune.lines) {
    if (!line.staff) continue;
    let idx = 0;
    for (const st of line.staff) {
      for (const voice of st.voices ?? []) {
        const rec = (voices[idx] ??= { bars: [], acc: 0, pitches: [] });
        let mult = 1;
        for (const el of voice) {
          if (el.el_type === "note" && el.duration) {
            if (el.startTriplet) mult = el.tripletMultiplier ?? 1;
            rec.acc += el.duration * mult;
            for (const p of el.pitches ?? []) rec.pitches.push({ p: p.pitch, bar: rec.bars.length + 1 });
            if (el.endTriplet) mult = 1;
          } else if (el.el_type === "bar" && rec.acc > 0) {
            rec.bars.push(rec.acc);
            rec.acc = 0;
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

  return { checks, problems };
}

export async function checkAbc(abc: string): Promise<CheckResult> {
  const mod = await import("abcjs");
  return checkAbcWith(mod.default ?? mod, abc);
}
