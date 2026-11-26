// ABC → MusicXML (partwise 3.1) using abcjs's parsed tune. Covers what Drini writes:
// several voices/staves, chords, rests, ties, dotted values, triplets, key/time signatures and clefs.
import { keyAccidentals, makeSpeller } from "./harmony";

const LETTERS = "CDEFGAB";
const DIV = 48; // divisions per quarter note (divisible by 2, 3, 4, 8, 16)

const TYPES: [number, string, number][] = [
  // [quarters, type, dots]
  [6, "whole", 1], [4, "whole", 0], [3, "half", 1], [2, "half", 0], [1.5, "quarter", 1], [1, "quarter", 0],
  [0.75, "eighth", 1], [0.5, "eighth", 0], [0.375, "16th", 1], [0.25, "16th", 0], [0.125, "32nd", 0],
];

function typeOf(q: number): { type: string; dots: number; tuplet: boolean } {
  for (const [v, type, dots] of TYPES) if (Math.abs(v - q) < 1e-6) return { type, dots, tuplet: false };
  for (const [v, type] of TYPES) if (Math.abs((v * 2) / 3 - q) < 1e-6) return { type, dots: 0, tuplet: true };
  // closest plain value
  let best = TYPES[5]!;
  for (const t of TYPES) if (Math.abs(t[0] - q) < Math.abs(best[0] - q)) best = t;
  return { type: best[1], dots: best[2], tuplet: false };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type XNote = { q: number; pitches: { step: string; alter: number; octave: number; tieStart: boolean; tieStop: boolean }[] };
type XMeasure = XNote[];
type XPart = { name: string; clef: string; measures: XMeasure[] };

const CLEF: Record<string, [string, number]> = { treble: ["G", 2], bass: ["F", 4], alto: ["C", 3], tenor: ["C", 4] };

function voiceNames(abc: string): string[] {
  const defs = new Map<string, string>();
  for (const m of abc.matchAll(/^V:\s*(\S+)([^\n]*)$/gm)) {
    const id = m[1] ?? "";
    const name = /name="([^"]+)"/.exec(m[2] ?? "")?.[1] ?? `Part ${defs.size + 1}`;
    if (!defs.has(id)) defs.set(id, name);
  }
  const score = /^%%(?:score|staves)\s+(.+)$/m.exec(abc)?.[1];
  const order = score ? score.replace(/[{}()[\]|]/g, " ").split(/\s+/).filter(Boolean) : [...defs.keys()];
  return order.map((id) => defs.get(id) ?? id);
}

/** Build MusicXML text from an ABC score. `abcjs` is the loaded abcjs module. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function abcToMusicXml(abcjs: any, abc: string, title: string): string {
  const tune = abcjs.parseOnly(abc)?.[0];
  if (!tune?.lines) throw new Error("unreadable score");
  const mf = tune.getMeterFraction?.() ?? { num: 4, den: 4 };
  const names = voiceNames(abc);
  const parts: XPart[] = [];
  let fifths = 0;

  for (const line of tune.lines) {
    if (!line.staff) continue;
    let idx = 0;
    for (const st of line.staff) {
      const accs = st.key?.accidentals ?? [];
      if (accs.length) fifths = accs[0]?.acc === "flat" ? -accs.length : accs.length;
      for (const voice of st.voices ?? []) {
        const part = (parts[idx] ??= { name: names[idx] ?? `Part ${idx + 1}`, clef: st.clef?.type ?? "treble", measures: [[]] });
        const speller = makeSpeller(keyAccidentals(accs));
        let cur = part.measures[part.measures.length - 1]!;
        let mult = 1;
        for (const el of voice) {
          if (el.el_type === "bar") {
            speller.newBar();
            if (cur.length) { cur = []; part.measures.push(cur); }
          } else if (el.el_type === "note" && el.duration) {
            if (el.startTriplet) mult = el.tripletMultiplier ?? 2 / 3;
            const q = el.duration * mult * 4;
            const pitches = el.rest ? [] : (el.pitches ?? []).map((p: { pitch: number; accidental?: string; startTie?: unknown; endTie?: boolean }) => {
              const midi = speller.midi(p.pitch, p.accidental);
              const letter = ((p.pitch % 7) + 7) % 7;
              const octave = Math.floor(p.pitch / 7) + 4;
              const natural = 12 * (octave + 1) + [0, 2, 4, 5, 7, 9, 11][letter]!;
              return { step: LETTERS[letter]!, alter: midi - natural, octave, tieStart: !!p.startTie, tieStop: !!p.endTie };
            });
            cur.push({ q, pitches });
            if (el.endTriplet) mult = 1;
          }
        }
        idx++;
      }
    }
  }
  for (const p of parts) while (p.measures.length && !p.measures[p.measures.length - 1]!.length) p.measures.pop();

  const out: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
    '<score-partwise version="3.1">',
    `<work><work-title>${esc(title)}</work-title></work>`,
    '<identification><creator type="arranger">Drini (DriniArranges)</creator><rights>© DriniArranges</rights><encoding><software>DriniArranges</software></encoding></identification>',
    "<part-list>",
    ...parts.map((p, i) => `<score-part id="P${i + 1}"><part-name>${esc(p.name)}</part-name></score-part>`),
    "</part-list>",
  ];
  parts.forEach((p, i) => {
    out.push(`<part id="P${i + 1}">`);
    p.measures.forEach((m, mi) => {
      out.push(`<measure number="${mi + 1}">`);
      if (mi === 0) {
        const [sign, lineNo] = CLEF[p.clef] ?? CLEF["treble"]!;
        out.push(`<attributes><divisions>${DIV}</divisions><key><fifths>${fifths}</fifths></key><time><beats>${mf.num}</beats><beat-type>${mf.den}</beat-type></time><clef><sign>${sign}</sign><line>${lineNo}</line></clef></attributes>`);
      }
      for (const n of m) {
        const { type, dots, tuplet } = typeOf(n.q);
        const dur = Math.max(1, Math.round(n.q * DIV));
        const tail = `<duration>${dur}</duration>`;
        const looks = `<type>${type}</type>${"<dot/>".repeat(dots)}${tuplet ? "<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>" : ""}`;
        if (!n.pitches.length) { out.push(`<note><rest/>${tail}${looks}</note>`); continue; }
        n.pitches.forEach((pt, k) => {
          const ties = `${pt.tieStop ? '<tie type="stop"/>' : ""}${pt.tieStart ? '<tie type="start"/>' : ""}`;
          const tied = pt.tieStart || pt.tieStop ? `<notations>${pt.tieStop ? '<tied type="stop"/>' : ""}${pt.tieStart ? '<tied type="start"/>' : ""}</notations>` : "";
          out.push(`<note>${k ? "<chord/>" : ""}<pitch><step>${pt.step}</step>${pt.alter ? `<alter>${pt.alter}</alter>` : ""}<octave>${pt.octave}</octave></pitch>${tail}${ties}${looks}${tied}</note>`);
        });
      }
      if (mi === p.measures.length - 1) out.push('<barline location="right"><bar-style>light-heavy</bar-style></barline>');
      out.push("</measure>");
    });
    out.push("</part>");
  });
  out.push("</score-partwise>");
  return out.join("\n");
}
