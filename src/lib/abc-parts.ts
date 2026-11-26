// Splitting a full score into one part per player, and other text-level edits of the score
// that playback and printing need (removing voices, adding a count-in bar).
// Works on the ABC text only, so it can be tested without abcjs.

export type Voice = { id: string; name: string; def: string; extra: string[]; body: string[]; hasLyrics: boolean };
export type ParsedScore = { header: string[]; voices: Voice[] };

const HAND = /^(.*?)[\s-]*(?:\b(?:RH|LH)\b|right hand|left hand|dora e djathtë|dora e majtë)$/i;

/** Splits an ABC tune into its header and its voices (definition, per-voice directives and music lines). */
export function parseScore(abc: string): ParsedScore {
  const header: string[] = [];
  const voices: Voice[] = [];
  const byId = new Map<string, Voice>();
  let cur: Voice | null = null;
  let inBody = false;
  const voice = (id: string): Voice => {
    let v = byId.get(id);
    if (!v) {
      v = { id, name: id, def: `V:${id}`, extra: [], body: [], hasLyrics: false };
      byId.set(id, v);
      voices.push(v);
    }
    return v;
  };
  for (const line of abc.split("\n")) {
    const def = /^V:\s*(\S+)(.*)$/.exec(line);
    if (def) {
      const v = voice(def[1]!);
      if (/\b(clef|name|nm|snm|subname|octave|transpose)=/.test(def[2] ?? "") && !/name=/.test(v.def)) {
        v.def = line;
        v.name = /(?:name|nm)="([^"]*)"/.exec(def[2] ?? "")?.[1] ?? v.id;
      }
      cur = v;
      continue;
    }
    const inline = /^\s*\[V:\s*([^\]\s]+)[^\]]*\]/.exec(line);
    if (inline) {
      cur = voice(inline[1]!);
      cur.body.push(line);
      inBody = true;
      continue;
    }
    if (/^w:/.test(line)) {
      if (cur) { cur.body.push(line); cur.hasLyrics = true; }
      continue;
    }
    if (/^%%MIDI\b/.test(line) && cur) { cur.extra.push(line); continue; }
    if (!inBody && (/^[A-Za-z]:/.test(line) || /^%/.test(line) || !line.trim())) {
      if (cur && !/^%%score/.test(line) && /^%/.test(line)) { cur.extra.push(line); continue; }
      header.push(line);
      continue;
    }
    if (!line.trim()) continue;
    if (cur) { cur.body.push(line); inBody = true; }
    else header.push(line);
  }
  return { header, voices };
}

/** Groups voices into players: the two hands of a piano (or of each 4-hands player) belong together. */
export function playerGroups(score: ParsedScore): { name: string; ids: string[] }[] {
  const groups: { name: string; ids: string[] }[] = [];
  for (const v of score.voices) {
    if (!v.body.length) continue;
    const m = HAND.exec(v.name.trim());
    const name = m ? (m[1] ?? "").trim() || "Piano" : v.name;
    const g = m ? groups.find((x) => x.name === name) : undefined;
    if (g) g.ids.push(v.id);
    else groups.push({ name, ids: [v.id] });
  }
  return groups;
}

/** Written transposition (semitones up from concert pitch) and the name to print on the part. */
export function writtenPitch(name: string): { semitones: number; label: string } | null {
  if (/\bin c\b/i.test(name)) return null;
  const table: [RegExp, number, string][] = [
    [/bass clarinet/i, 14, "Bass Clarinet in B♭"],
    [/clarinet in a|klarinet.* a\b/i, 3, "Clarinet in A"],
    [/clarinet|klarinet/i, 2, "Clarinet in B♭"],
    [/flugel/i, 2, "Flugelhorn in B♭"],
    [/trumpet|trumbet/i, 2, "Trumpet in B♭"],
    [/english horn|cor anglais/i, 7, "English Horn in F"],
    [/horn|korno/i, 7, "Horn in F"],
    [/soprano sax/i, 2, "Soprano Saxophone in B♭"],
    [/alto sax/i, 9, "Alto Saxophone in E♭"],
    [/tenor sax/i, 14, "Tenor Saxophone in B♭"],
    [/baritone sax/i, 21, "Baritone Saxophone in E♭"],
  ];
  const hit = table.find(([re]) => re.test(name));
  return hit ? { semitones: hit[1], label: hit[2] } : null;
}

/** Bar length in units of L: (for rests and the count-in bar). */
function barUnits(header: string[]): { units: number; beats: number; beatUnits: number } {
  const L = header.map((l) => /^L:\s*(\d+)\/(\d+)/.exec(l)).find(Boolean);
  const M = header.map((l) => /^M:\s*(.*)$/.exec(l)).find(Boolean);
  const unit = L ? Number(L[1]) / Number(L[2]) : 1 / 8;
  let num = 4, den = 4;
  const mm = M ? /^(\d+)\/(\d+)/.exec(M[1] ?? "") : null;
  if (mm) { num = Number(mm[1]); den = Number(mm[2]); }
  else if (M && /^C\|/.test(M[1] ?? "")) { num = 2; den = 2; }
  const compound = den === 8 && num % 3 === 0 && num > 3;
  const beats = compound ? num / 3 : num;
  const beatLen = compound ? 3 / den : 1 / den;
  return { units: Math.round(((num / den) / unit) * 1000) / 1000, beats, beatUnits: Math.round((beatLen / unit) * 1000) / 1000 };
}

const BAR_SPLIT = /(\|\]|\|\||\[\||\|:|:\||::|\|\d?|\[\d)/;

/** Compresses runs of empty bars into multi-bar rests and lays the part out four bars to a line. */
function reflowPart(body: string[]): string[] {
  const music = body.map((l) => l.replace(/^\s*\[V:[^\]]*\]\s*/, "")).join(" ");
  const pieces = music.split(BAR_SPLIT);
  const bars: { content: string; bar: string }[] = [];
  for (let i = 0; i < pieces.length; i += 2) {
    const content = (pieces[i] ?? "").trim();
    const bar = pieces[i + 1] ?? "";
    if (!content && !bar) continue;
    if (!content && bars.length) { bars[bars.length - 1]!.bar += bar; continue; }
    bars.push({ content, bar });
  }
  const isRest = (c: string) => /^(?:[zx][\d/]*\s*)+$/.test(c.trim());
  const out: string[] = [];
  let line: string[] = [];
  let count = 0;
  let rest = 0;
  const flushRest = () => {
    if (!rest) return;
    line.push(rest === 1 ? `Z |` : `Z${rest} |`);
    count++;
    rest = 0;
  };
  for (const b of bars) {
    const plain = b.bar.trim() === "|";
    if (isRest(b.content) && plain) { rest++; continue; }
    flushRest();
    if (count >= 4) { out.push(line.join(" ")); line = []; count = 0; }
    line.push(`${b.content} ${b.bar}`.trim());
    count++;
    if (count >= 4) { out.push(line.join(" ")); line = []; count = 0; }
  }
  flushRest();
  if (line.length) out.push(line.join(" "));
  // make sure the part ends with a final barline
  if (out.length && !/\|\]\s*$/.test(out[out.length - 1]!)) out[out.length - 1] = out[out.length - 1]!.replace(/\|?\s*$/, " |]");
  return out;
}

/** The ABC of one player's part: the title with the part name, only that player's staves, empty bars compressed. */
export function partAbc(abc: string, ids: string[], partName: string): string {
  const score = parseScore(abc);
  const vs = ids.map((id) => score.voices.find((v) => v.id === id)).filter((v): v is Voice => Boolean(v));
  const header: string[] = [];
  let titles = 0;
  for (const l of score.header) {
    if (/^%%score/.test(l)) continue;
    if (/^T:/.test(l)) {
      titles++;
      if (titles === 1) { header.push(l); header.push(`T:${partName}`); }
      continue; // the ensemble subtitle is replaced by the part name
    }
    if (/^K:/.test(l)) continue;
    header.push(l);
  }
  const key = score.header.find((l) => /^K:/.test(l)) ?? "K:C";
  const out = [...header.filter((l) => l.trim())];
  if (vs.length > 1) out.push(`%%score {${vs.map((v) => v.id).join(" ")}}`);
  out.push(key);
  for (const v of vs) {
    out.push(v.def.replace(/\s*\b(?:name|nm|snm|subname)="[^"]*"/g, "") + (vs.length > 1 ? "" : ""));
    out.push(...v.extra.filter((l) => !/^%%MIDI/.test(l)));
  }
  if (vs.length === 1 && !vs[0]!.hasLyrics) {
    reflowPart(vs[0]!.body).forEach((l) => out.push(`[V:${vs[0]!.id}] ${l}`));
  } else {
    // several staves (piano) or lyrics: keep the original lines, in their original order
    const keep = new Set(vs.map((v) => v.id));
    let cur = "";
    for (const line of abc.split("\n")) {
      const inline = /^\s*\[V:\s*([^\]\s]+)/.exec(line);
      const def = /^V:\s*(\S+)/.exec(line);
      if (def) { cur = def[1]!; continue; }
      if (inline) { cur = inline[1]!; if (keep.has(cur)) out.push(line); continue; }
      if (/^w:/.test(line) && keep.has(cur)) out.push(line);
    }
  }
  return out.join("\n") + "\n";
}

/** Removes voices (for muting parts in playback); the score line is updated to match. */
export function withoutVoices(abc: string, muted: string[]): string {
  if (!muted.length) return abc;
  const drop = new Set(muted);
  let skip = false;
  const out: string[] = [];
  for (const line of abc.split("\n")) {
    const def = /^V:\s*(\S+)/.exec(line);
    const inline = /^\s*\[V:\s*([^\]\s]+)/.exec(line);
    if (def) { skip = drop.has(def[1]!); if (skip) continue; out.push(line); continue; }
    if (inline) { skip = drop.has(inline[1]!); if (skip) continue; out.push(line); continue; }
    if (/^%%score/.test(line)) {
      const kept = line.slice(7).replace(/[^\s{}[\]()|]+/g, (tok) => (drop.has(tok) ? "" : tok));
      const tidy = kept.replace(/([[{(])\s+/g, "$1").replace(/\s+([\]})])/g, "$1").replace(/\{\}|\[\]|\(\)/g, "").replace(/\s+/g, " ").trim();
      out.push(`%%score ${tidy}`);
      continue;
    }
    if (skip && (/^w:/.test(line) || /^%%MIDI/.test(line) || (!/^[A-Za-z]:/.test(line) && !/^%/.test(line)))) continue;
    out.push(line);
  }
  return out.join("\n");
}

/**
 * Adds one bar of metronome clicks before the music: every voice gets an empty first bar and a new
 * "Click" voice plays the beats on a wood block. Returns the new ABC and the beats per bar.
 */
export function withCountIn(abc: string): string {
  const score = parseScore(abc);
  const { units, beats, beatUnits } = barUnits(score.header);
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.round(n * 1000)}/1000`);
  const seen = new Set<string>();
  const lines = abc.split("\n").map((line) => {
    const inline = /^(\s*\[V:\s*([^\]\s]+)[^\]]*\]\s*)(.*)$/.exec(line);
    if (!inline || seen.has(inline[2]!)) return line;
    seen.add(inline[2]!);
    return `${inline[1]}z${fmt(units)} | ${inline[3]}`;
  });
  const clicks = Array.from({ length: beats }, (_, i) => `${i === 0 ? "c'" : "c"}${fmt(beatUnits)}`).join(" ");
  const kIdx = lines.findIndex((l) => /^K:/.test(l));
  const firstBody = lines.findIndex((l, i) => i > kIdx && /^\s*\[V:/.test(l));
  const insertAt = firstBody < 0 ? lines.length : firstBody;
  lines.splice(insertAt, 0, "V:CLICK clef=treble", "%%MIDI program 115", `[V:CLICK] ${clicks} |`);
  return lines.map((l) => (/^%%score/.test(l) ? `${l} CLICK` : l)).join("\n");
}

/**
 * Sustain pedal for piano playback: each piano note keeps sounding until the harmony changes
 * (the lowest piano note changes) or the same key is struck again. Works on abcjs's note map,
 * whatever time unit it uses. Notes of other instruments are left alone.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pedalPiano(tracks: any[]): any[] {
  type N = { pitch: number; instrument: number; start: number; end: number };
  const isPiano = (n: N) => n && n.instrument === 0 && typeof n.start === "number" && typeof n.end === "number";
  const piano: N[] = tracks.flatMap((t: N[]) => (Array.isArray(t) ? t.filter(isPiano) : []));
  if (!piano.length) return tracks;
  const eps = 1e-6;
  // lowest piano note sounding at each onset (with the written lengths), i.e. the bass of the harmony
  const onsets = [...new Set(piano.map((n) => n.start))].sort((a, b) => a - b);
  const bassAt = new Map<number, number>();
  for (const t of onsets) {
    let low = Infinity;
    for (const n of piano) if (n.start <= t + eps && n.end > t + eps) low = Math.min(low, n.pitch);
    bassAt.set(t, low);
  }
  const lastEnd = Math.max(...piano.map((n) => n.end));
  const changes = onsets.filter((t, i) => i === 0 || bassAt.get(t) !== bassAt.get(onsets[i - 1]!));
  for (const t of tracks) {
    if (!Array.isArray(t)) continue;
    const notes = (t as N[]).filter(isPiano).sort((a, b) => a.start - b.start);
    notes.forEach((n, i) => {
      const nextChange = changes.find((c) => c > n.start + eps) ?? Infinity;
      let nextSame = Infinity;
      for (let j = i + 1; j < notes.length; j++) if (notes[j]!.pitch === n.pitch && notes[j]!.start > n.start + eps) { nextSame = notes[j]!.start; break; }
      const cap = Math.min(n.start + (n.end - n.start) * 8, Math.max(n.end, lastEnd));
      const end = Math.min(nextChange, nextSame, cap);
      if (Number.isFinite(end) && end > n.end) n.end = end;
    });
  }
  return tracks;
}
