// Voice-leading checks on a simple, library-free representation of a score.
// Times are in whole notes (1 = one 4/4 bar), pitches are MIDI numbers.

export type NoteEvent = { t: number; dur: number; midis: number[] };
export type VoiceLine = { name: string; events: NoteEvent[] };
export type Issue = { kind: "parallel" | "crossing" | "spacing" | "stretch"; bar: number; text: string };

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
export const noteName = (m: number) => `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

const PIANO = /primo|secondo|piano|right hand|left hand|\brh\b|\blh\b/i;

/** Pitch sounding in a line at time t (top or bottom note of a chord), or null for a rest. */
function at(line: VoiceLine, t: number, pick: "top" | "bottom"): number | null {
  for (const e of line.events) {
    if (t >= e.t - 1e-9 && t < e.t + e.dur - 1e-9) {
      if (!e.midis.length) return null;
      return pick === "top" ? Math.max(...e.midis) : Math.min(...e.midis);
    }
  }
  return null;
}

function onsets(lines: VoiceLine[]) {
  const set = new Set<number>();
  for (const l of lines) for (const e of l.events) set.add(Math.round(e.t * 1e6) / 1e6);
  return [...set].sort((a, b) => a - b);
}

/**
 * Checks parallel 5ths/8ves (every pair of lines), voice crossing and wide spacing
 * (choirs and strings), and hand stretches over an octave (piano parts).
 * Lines must be ordered top to bottom as they appear in the score.
 */
export function checkVoiceLeading(lines: VoiceLine[], barLength: number): Issue[] {
  const issues: Issue[] = [];
  const barOf = (t: number) => Math.floor(t / barLength + 1e-9) + 1;
  const used = lines.filter((l) => l.events.some((e) => e.midis.length));
  if (used.length < 1) return issues;
  const lowest = used.length - 1;
  // Upper lines follow their top note; the lowest line follows its bass note.
  const pickFor = (i: number) => (i === lowest && used.length > 1 ? "bottom" : "top") as "top" | "bottom";
  const times = onsets(used);

  // Parallel perfect fifths and octaves/unisons between any two lines.
  for (let a = 0; a < used.length; a++) {
    for (let b = a + 1; b < used.length; b++) {
      const A = used[a]!, B = used[b]!;
      let prev: { x: number; y: number } | null = null;
      for (const t of times) {
        const x = at(A, t, pickFor(a));
        const y = at(B, t, pickFor(b));
        if (x === null || y === null) { prev = null; continue; }
        if (prev && (x !== prev.x || y !== prev.y)) {
          const i1 = Math.abs(prev.x - prev.y), i2 = Math.abs(x - y);
          const c1 = i1 % 12, c2 = i2 % 12;
          const dx = x - prev.x, dy = y - prev.y;
          const bothMove = dx !== 0 && dy !== 0;
          const perfect = (c: number, i: number) => c === 7 || (c === 0 && i >= 0);
          if (bothMove && Math.sign(dx) === Math.sign(dy) && c1 === c2 && perfect(c1, i1)) {
            const kind = c1 === 7 ? "fifths" : i1 === 0 && i2 === 0 ? "unisons" : "octaves";
            issues.push({
              kind: "parallel",
              bar: barOf(t),
              text: `Parallel ${kind} between ${A.name} and ${B.name} in bar ${barOf(t)} (${noteName(prev.x)}–${noteName(prev.y)} to ${noteName(x)}–${noteName(y)})`,
            });
          }
        }
        prev = { x, y };
      }
    }
  }

  // Crossing and spacing: only for ensembles of separate single-line parts (no piano).
  const lineParts = used.filter((l) => !PIANO.test(l.name));
  if (lineParts.length >= 3) {
    for (let i = 0; i + 1 < lineParts.length; i++) {
      const up = lineParts[i]!, lo = lineParts[i + 1]!;
      const isBassPair = i + 1 === lineParts.length - 1;
      let crossed = false, spaced = false;
      for (const t of times) {
        const x = at(up, t, "bottom");
        const y = at(lo, t, "top");
        if (x === null || y === null) continue;
        if (!crossed && x < y) {
          crossed = true;
          issues.push({ kind: "crossing", bar: barOf(t), text: `${up.name} crosses below ${lo.name} in bar ${barOf(t)} (${noteName(x)} under ${noteName(y)})` });
        }
        if (!spaced && !isBassPair && x - y > 12) {
          spaced = true;
          issues.push({ kind: "spacing", bar: barOf(t), text: `More than an octave between ${up.name} and ${lo.name} in bar ${barOf(t)}` });
        }
      }
    }
  }

  // Piano: flag chords in one hand wider than an octave (a stretch for most students).
  for (const l of used) {
    if (!PIANO.test(l.name)) continue;
    const wide = l.events.find((e) => e.midis.length > 1 && Math.max(...e.midis) - Math.min(...e.midis) > 12);
    if (wide) {
      issues.push({
        kind: "stretch",
        bar: barOf(wide.t),
        text: `${l.name} has a chord wider than an octave in bar ${barOf(wide.t)} (${noteName(Math.min(...wide.midis))} to ${noteName(Math.max(...wide.midis))})`,
      });
    }
  }

  return issues;
}

// --- converting abcjs pitches to MIDI ---------------------------------------

const STEP = [0, 2, 4, 5, 7, 9, 11];
const ACC: Record<string, number> = { sharp: 1, flat: -1, natural: 0, dblsharp: 2, dblflat: -2 };

/** MIDI number from an abcjs diatonic pitch (C4 = 0) and a semitone alteration. */
export function diatonicToMidi(pitch: number, alter: number) {
  const octave = Math.floor(pitch / 7);
  const letter = ((pitch % 7) + 7) % 7;
  return 60 + 12 * octave + STEP[letter]! + alter;
}

/**
 * Tracks key signature and bar-local accidentals for one voice.
 * keyAcc maps letter index (0 = C … 6 = B) to its key-signature alteration.
 */
export function makeSpeller(keyAcc: Record<number, number>) {
  let bar: Record<number, number> = {};
  return {
    newBar() { bar = {}; },
    midi(pitch: number, accidental?: string) {
      const letter = ((pitch % 7) + 7) % 7;
      if (accidental && accidental in ACC) bar[pitch] = ACC[accidental]!;
      const alter = bar[pitch] ?? keyAcc[letter] ?? 0;
      return diatonicToMidi(pitch, alter);
    },
  };
}

export function keyAccidentals(list: { acc?: string; note?: string }[] | undefined): Record<number, number> {
  const out: Record<number, number> = {};
  for (const k of list ?? []) {
    const letter = "cdefgab".indexOf((k.note ?? "").charAt(0).toLowerCase());
    if (letter >= 0 && k.acc && k.acc in ACC) out[letter] = ACC[k.acc]!;
  }
  return out;
}
