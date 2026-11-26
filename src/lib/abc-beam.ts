// Beaming for ABC: in ABC, notes only get connected beams when they are written without spaces
// between them ("cdef" is beamed, "c d e f" shows separate flags). This joins eighths and shorter
// notes that fall inside the same beat, so scores look like engraved music. Anything it doesn't
// fully understand in a bar is left exactly as it was.

type Tok = { text: string; dur: number | null; joinable: boolean };

const META = /^\[[A-Za-z]:[^\]]*\]$/;
const NOTE = /(\[[^\]]*\]|[\^_=]*[A-Ga-g][,']*|[zxZ])(\d*)(\/*)(\d*)(-?)/g;

function frac(s: string | undefined, dflt: number) {
  if (!s) return dflt;
  const m = /^(\d+)\/(\d+)$/.exec(s.trim());
  return m ? Number(m[1]) / Number(m[2]) : dflt;
}

/** Split a bar into whitespace tokens, keeping "quoted text" and !decorations! intact. */
function splitTokens(bar: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false, d = false;
  for (const ch of bar) {
    if (ch === '"' && !d) q = !q;
    else if (ch === "!" && !q) d = !d;
    if (/\s/.test(ch) && !q && !d) { if (cur) out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Duration (in whole notes) of a token, whether it has notes shorter than a beat, or null if unknown. */
function measure(text: string, unit: number, beat: number): Tok {
  if (META.test(text)) return { text, dur: 0, joinable: false };
  // strip things that carry no duration
  const core = text.replace(/"[^"]*"/g, "").replace(/![^!]*!/g, "").replace(/^[.~HLMOPSTuv]+/, "").replace(/[()]/g, "").replace(/\.(?=[\^_=A-Ga-g[])/g, "");
  if (!core) return { text, dur: 0, joinable: false }; // decoration or annotation alone
  if (/[<>{}&\\]/.test(core) || /\(\d/.test(text)) return { text, dur: null, joinable: false };
  let total = 0, pos = 0, allShort = true, anyNote = false;
  NOTE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NOTE.exec(core))) {
    if (m.index !== pos) return { text, dur: null, joinable: false };
    pos = m.index + m[0].length;
    const [, head, n1, slashes, n2] = m;
    if (head === "Z") return { text, dur: null, joinable: false };
    let len = n1 ? Number(n1) : 1;
    if (slashes) len = n2 ? len / Number(n2) : len / 2 ** slashes.length;
    const dur = len * unit;
    total += dur;
    const rest = /^[zx]$/.test(head!);
    if (!rest) anyNote = true;
    if (rest || dur >= beat - 1e-9) allShort = false;
  }
  if (pos !== core.length) return { text, dur: null, joinable: false };
  return { text, dur: total, joinable: anyNote && allShort };
}

function beamBar(bar: string, unit: number, beat: number): string {
  const raw = splitTokens(bar);
  if (raw.length < 2) return bar;
  // attach duration-less tokens (decorations, chord symbols) to the token after them
  const toks: Tok[] = [];
  let prefix = "";
  for (const r of raw) {
    const t = measure(prefix + r, unit, beat);
    if (t.dur === 0 && !META.test(r)) { prefix = prefix + r; continue; } // decorations attach directly: !mf!"^dolce"B
    if (prefix && t.dur === null) { toks.push({ text: prefix, dur: 0, joinable: false }); prefix = ""; toks.push(measure(r, unit, beat)); continue; }
    prefix = "";
    toks.push(t);
  }
  if (prefix) toks.push({ text: prefix, dur: 0, joinable: false });
  if (toks.some((t) => t.dur === null)) return bar; // something unusual: leave the bar alone

  const out: string[] = [];
  let pos = 0;
  let group: { text: string; beatNo: number } | null = null;
  for (const t of toks) {
    const start = pos, end = pos + (t.dur ?? 0);
    pos = end;
    const b0 = Math.floor(start / beat + 1e-9), b1 = Math.floor((end - 1e-9) / beat + 1e-9);
    if (t.joinable && b0 === b1) {
      if (group && group.beatNo === b0) { group.text += t.text; continue; }
      if (group) out.push(group.text);
      group = { text: t.text, beatNo: b0 };
      continue;
    }
    if (group) { out.push(group.text); group = null; }
    out.push(t.text);
  }
  if (group) out.push(group.text);
  const lead = /^\s*/.exec(bar)?.[0] ?? "";
  const trail = /\s*$/.exec(bar)?.[0] ?? "";
  return lead + out.join(" ") + trail;
}

/** Return the ABC with eighth notes (and shorter) beamed within each beat. */
export function beamAbc(abc: string): string {
  let unit = 1 / 8;
  let num = 4, den = 4;
  let inBody = false;
  let lSet = false;
  const lines = abc.split("\n");
  return lines
    .map((line) => {
      const field = /^([A-Za-z]):\s*(.*)$/.exec(line);
      if (field) {
        const [, k, v] = field;
        if (k === "L") { unit = frac(v, unit); lSet = true; }
        if (k === "M") {
          const mm = /^(\d+)\/(\d+)/.exec(v ?? "");
          if (mm) { num = Number(mm[1]); den = Number(mm[2]); if (!lSet && num / den < 0.75) unit = 1 / 16; }
          else if (/^C\|/.test(v ?? "")) { num = 2; den = 2; } else if (/^C/.test(v ?? "")) { num = 4; den = 4; }
        }
        if (k === "K") inBody = true;
        return line;
      }
      if (!inBody || /^\s*%/.test(line) || !line.trim()) return line;
      const beat = den === 8 && num % 3 === 0 ? 3 / 8 : 1 / den;
      // keep a leading inline voice tag, then beam bar by bar
      const tag = /^\s*\[V:[^\]]*\]\s*/.exec(line)?.[0] ?? "";
      const body = line.slice(tag.length);
      const parts = body.split(/(\|\]|\|\||\[\||\|:|:\||::|\|\d?|\[\d)/);
      return tag + parts.map((p, i) => (i % 2 === 1 ? p : beamBar(p, unit, beat))).join("");
    })
    .join("\n");
}
