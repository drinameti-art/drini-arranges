// Reads sheet-music files in the browser and turns them into an ABC "source score" for Drini.
// Supports MusicXML (.musicxml/.xml/.mxl), MuseScore (.mscz/.mscx), MIDI (.mid/.midi) and ABC.
// Photos and PDFs are not read here: they go to Drini as images/documents (see readImageOrPdf).

export type ImportedNote = { t: number; d: number; p: number[] }; // quarters from the start, MIDI pitches
export type ImportedPart = { name: string; events: ImportedNote[] };
export type ImportedScore = { title: string; fifths: number; num: number; den: number; tempo: number | null; parts: ImportedPart[] };

export type ScoreSource =
  | { kind: "abc"; fileName: string; abc: string; info: string }
  | { kind: "image" | "pdf"; fileName: string; mediaType: string; data: string; previewUrl: string | null; info: string };

import { beamAbc } from "./abc-beam";

const MAX_BARS = 64;
const MAX_PARTS = 8;

// ---------- entry point ----------

export async function importScoreFile(file: File): Promise<ScoreSource> {
  const name = file.name;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext)) return readImage(file);
  if (file.type === "application/pdf" || ext === "pdf") return readPdf(file);
  let score: ImportedScore;
  if (ext === "abc") {
    const abc = (await file.text()).slice(0, 30000);
    return { kind: "abc", fileName: name, abc, info: "ABC notation" };
  } else if (ext === "mid" || ext === "midi") {
    score = parseMidi(new Uint8Array(await file.arrayBuffer()));
  } else if (ext === "mxl" || ext === "mscz") {
    const files = await unzip(new Uint8Array(await file.arrayBuffer()));
    const entry = ext === "mscz"
      ? [...files.keys()].find((k) => k.endsWith(".mscx"))
      : findMxlRoot(files);
    if (!entry) throw new Error("No score found inside the file.");
    const xml = new TextDecoder().decode(files.get(entry)!);
    score = ext === "mscz" ? parseMscx(xml) : parseMusicXml(xml);
  } else if (ext === "mscx") {
    score = parseMscx(await file.text());
  } else if (ext === "musicxml" || ext === "xml") {
    score = parseMusicXml(await file.text());
  } else {
    throw new Error("Unsupported file type.");
  }
  if (!score.title) score.title = name.replace(/\.[^.]+$/, "");
  score.parts = score.parts.filter((p) => p.events.length).slice(0, MAX_PARTS);
  if (!score.parts.length) throw new Error("No notes found in the file.");
  const abc = toAbc(score);
  const barLen = (score.num * 4) / score.den;
  const end = Math.max(...score.parts.flatMap((p) => p.events.map((e) => e.t + e.d)));
  const bars = Math.min(MAX_BARS, Math.ceil(end / barLen - 1e-6));
  const info = `${bars} bars · ${score.parts.length} part${score.parts.length > 1 ? "s" : ""} · ${keyLabel(score.fifths)} · ${score.num}/${score.den}`;
  return { kind: "abc", fileName: name, abc, info };
}

// ---------- photos and PDFs ----------

async function readImage(file: File): Promise<ScoreSource> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("That image couldn't be opened. Try a JPG or PNG."));
      i.src = url;
    });
    const scale = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing isn't available in this browser.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return {
      kind: "image",
      fileName: file.name,
      mediaType: "image/jpeg",
      data: dataUrl.slice(dataUrl.indexOf(",") + 1),
      previewUrl: dataUrl,
      info: `Photo · ${canvas.width}×${canvas.height}`,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readPdf(file: File): Promise<ScoreSource> {
  if (file.size > 4 * 1024 * 1024) throw new Error("That PDF is over 4 MB. Try fewer pages, or a photo of the first page.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { kind: "pdf", fileName: file.name, mediaType: "application/pdf", data: btoa(bin), previewUrl: null, info: `PDF · ${(file.size / 1024).toFixed(0)} KB` };
}

// ---------- zip (for .mxl and .mscz) ----------

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") throw new Error("This browser can't open compressed scores. Export as uncompressed MusicXML.");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function unzip(buf: Uint8Array): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // find the end-of-central-directory record
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("The file isn't a valid compressed score.");
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out = new Map<string, Uint8Array>();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const csize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nameLen));
    const lNameLen = view.getUint16(local + 26, true);
    const lExtraLen = view.getUint16(local + 28, true);
    const start = local + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + csize);
    if (/\.(xml|musicxml|mscx)$/i.test(name)) out.set(name, method === 0 ? raw : await inflateRaw(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function findMxlRoot(files: Map<string, Uint8Array>) {
  const container = files.get("META-INF/container.xml");
  if (container) {
    const m = /full-path="([^"]+)"/.exec(new TextDecoder().decode(container));
    if (m?.[1] && files.has(m[1])) return m[1];
  }
  return [...files.keys()].find((k) => !k.startsWith("META-INF") && /\.(xml|musicxml)$/i.test(k));
}

// ---------- MusicXML ----------

const STEP_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function parseMusicXml(xml: string): ImportedScore {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const txt = (el: Element | null | undefined, sel: string) => el?.querySelector(sel)?.textContent?.trim() ?? "";
  const names = new Map<string, string>();
  doc.querySelectorAll("part-list score-part").forEach((sp) => names.set(sp.getAttribute("id") ?? "", txt(sp, "part-name") || "Part"));
  const score: ImportedScore = {
    title: txt(doc.documentElement, "work work-title") || txt(doc.documentElement, "movement-title"),
    fifths: 0, num: 4, den: 4, tempo: null, parts: [],
  };
  let first = true;
  doc.querySelectorAll("part").forEach((part) => {
    const byStaff = new Map<number, Map<number, { d: number; p: number[] }>>();
    let divisions = 1, t = 0, lastStart = 0;
    for (const measure of Array.from(part.querySelectorAll(":scope > measure"))) {
      for (const el of Array.from(measure.children)) {
        if (el.tagName === "attributes") {
          const dv = Number(txt(el, "divisions")); if (dv) divisions = dv;
          if (first) {
            const f = txt(el, "key fifths"); if (f) score.fifths = Number(f);
            const b = txt(el, "time beats"), bt = txt(el, "time beat-type");
            if (b && bt) { score.num = Number(b.split("+")[0]); score.den = Number(bt); }
          }
        } else if (el.tagName === "direction" && first && score.tempo === null) {
          const tempo = el.querySelector("sound")?.getAttribute("tempo"); if (tempo) score.tempo = Math.round(Number(tempo));
        } else if (el.tagName === "backup") {
          t -= Number(txt(el, "duration")) / divisions;
        } else if (el.tagName === "forward") {
          t += Number(txt(el, "duration")) / divisions;
        } else if (el.tagName === "note") {
          if (el.querySelector("grace")) continue;
          const d = Number(txt(el, "duration")) / divisions;
          const isChord = !!el.querySelector("chord");
          const start = isChord ? lastStart : t;
          const staff = Number(txt(el, "staff") || "1");
          if (!el.querySelector("rest")) {
            const step = txt(el, "pitch step"), oct = Number(txt(el, "pitch octave")), alter = Number(txt(el, "pitch alter") || "0");
            if (step in STEP_PC) {
              const midi = 12 * (oct + 1) + STEP_PC[step]! + alter;
              const map = byStaff.get(staff) ?? new Map();
              byStaff.set(staff, map);
              const key = Math.round(start * 1000) / 1000;
              const cur = map.get(key);
              if (cur) { cur.p.push(midi); cur.d = Math.max(cur.d, d); } else map.set(key, { d, p: [midi] });
            }
          }
          if (!isChord) { lastStart = t; t += d; }
        }
      }
    }
    first = false;
    const base = names.get(part.getAttribute("id") ?? "") ?? "Part";
    const staves = [...byStaff.keys()].sort();
    for (const s of staves) {
      const name = staves.length > 1 ? `${base} ${s === staves[0] ? "RH" : "LH"}` : base;
      score.parts.push({ name, events: flatten(byStaff.get(s)!) });
    }
  });
  return score;
}

// ---------- MuseScore (.mscx inside .mscz) ----------

const MSCORE_DUR: Record<string, number> = { breve: 8, whole: 4, half: 2, quarter: 1, eighth: 0.5, "16th": 0.25, "32nd": 0.125, "64th": 0.0625 };

export function parseMscx(xml: string): ImportedScore {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const sc = doc.querySelector("Score");
  if (!sc) throw new Error("This doesn't look like a MuseScore file.");
  const child = (el: Element, tag: string) => Array.from(el.children).filter((c) => c.tagName === tag);
  const text = (el: Element, tag: string) => child(el, tag)[0]?.textContent?.trim() ?? "";
  const frac = (s: string) => { const [a, b] = s.split("/").map(Number); return b ? (a ?? 0) / b : (a ?? 0); };
  const names: string[] = [];
  for (const p of child(sc, "Part")) {
    const nm = text(p, "trackName") || p.querySelector("Instrument longName")?.textContent?.trim() || "Part";
    const n = child(p, "Staff").length;
    for (let k = 0; k < n; k++) names.push(n > 1 ? `${nm} ${k === 0 ? "RH" : "LH"}` : nm);
  }
  const titleEl = Array.from(sc.querySelectorAll("VBox Text")).find((t) => (t.querySelector("style")?.textContent ?? "").trim().toLowerCase() === "title");
  const score: ImportedScore = { title: titleEl?.querySelector("text")?.textContent?.trim() ?? "", fifths: 0, num: 4, den: 4, tempo: null, parts: [] };
  child(sc, "Staff").forEach((st, si) => {
    const map = new Map<number, { d: number; p: number[] }>();
    let mstart = 0;
    for (const m of child(st, "Measure")) {
      const mlen = m.getAttribute("len") ? frac(m.getAttribute("len")!) * 4 : null;
      let maxEnd = 0;
      for (const v of child(m, "voice")) {
        let t = 0;
        const tup: number[] = [];
        for (const el of Array.from(v.children)) {
          const tag = el.tagName;
          if (tag === "location") t += frac(el.querySelector("fractions")?.textContent ?? "0") * 4;
          else if (tag === "Tuplet") tup.push(Number(text(el, "normalNotes")) / Number(text(el, "actualNotes")));
          else if (tag === "endTuplet") tup.pop();
          else if (tag === "KeySig" && si === 0 && mstart === 0) score.fifths = Number(text(el, "concertKey") || text(el, "accidental") || "0");
          else if (tag === "TimeSig" && si === 0 && mstart === 0) { score.num = Number(text(el, "sigN")) || 4; score.den = Number(text(el, "sigD")) || 4; }
          else if (tag === "Tempo" && si === 0 && score.tempo === null) score.tempo = Math.round(Number(text(el, "tempo")) * 60);
          else if (tag === "Chord" || tag === "Rest") {
            const dt = text(el, "durationType");
            let d: number;
            if (dt === "measure") d = text(el, "duration") ? frac(text(el, "duration")) * 4 : (mlen ?? (score.num * 4) / score.den);
            else {
              d = MSCORE_DUR[dt] ?? 1;
              let add = d;
              for (let k = 0; k < Number(text(el, "dots") || "0"); k++) { add /= 2; d += add; }
            }
            for (const r of tup) d *= r;
            const isGrace = child(el, "acciaccatura").length || child(el, "appoggiatura").length || child(el, "grace4").length || child(el, "grace8after").length || child(el, "grace16").length;
            if (tag === "Chord" && !isGrace) {
              const p = child(el, "Note").map((n) => Number(text(n, "pitch"))).filter((x) => !Number.isNaN(x));
              const key = Math.round((mstart + t) * 1000) / 1000;
              const cur = map.get(key);
              if (cur) { cur.p.push(...p); cur.d = Math.max(cur.d, d); } else if (p.length) map.set(key, { d, p });
            }
            if (!isGrace) t += d;
          }
        }
        maxEnd = Math.max(maxEnd, t);
      }
      mstart += mlen ?? maxEnd;
    }
    score.parts.push({ name: names[si] ?? `Part ${si + 1}`, events: flatten(map) });
  });
  return score;
}

// ---------- MIDI ----------

export function parseMidi(b: Uint8Array): ImportedScore {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const str = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));
  if (str(0, 4) !== "MThd") throw new Error("Not a MIDI file.");
  const ntracks = dv.getUint16(10);
  const division = dv.getUint16(12);
  if (division & 0x8000) throw new Error("This MIDI timing format isn't supported.");
  const score: ImportedScore = { title: "", fifths: 0, num: 4, den: 4, tempo: null, parts: [] };
  let p = 14;
  for (let tr = 0; tr < ntracks && p < b.length; tr++) {
    if (str(p, 4) !== "MTrk") break;
    const len = dv.getUint32(p + 4);
    let i = p + 8;
    const end = i + len;
    let tick = 0, status = 0, name = "";
    const open = new Map<number, number>();
    const map = new Map<number, { d: number; p: number[] }>();
    let drum = false;
    const vlq = () => { let v = 0, c; do { c = b[i++]!; v = (v << 7) | (c & 0x7f); } while (c & 0x80); return v; };
    while (i < end) {
      tick += vlq();
      let s = b[i]!;
      if (s & 0x80) { status = s; i++; } else s = status;
      const type = s & 0xf0;
      if (s === 0xff) {
        const meta = b[i++]!; const ml = vlq(); const data = b.subarray(i, i + ml); i += ml;
        if (meta === 0x03) name = new TextDecoder().decode(data);
        else if (meta === 0x51 && score.tempo === null) score.tempo = Math.round(60000000 / ((data[0]! << 16) | (data[1]! << 8) | data[2]!));
        else if (meta === 0x58 && tick === 0) { score.num = data[0]!; score.den = 2 ** data[1]!; }
        else if (meta === 0x59 && tick === 0) score.fifths = (data[0]! << 24) >> 24;
      } else if (s === 0xf0 || s === 0xf7) { i += vlq(); }
      else if (type === 0x90 || type === 0x80) {
        const note = b[i++]!, vel = b[i++]!;
        if ((s & 0x0f) === 9) drum = true;
        if (type === 0x90 && vel > 0) open.set(note, tick);
        else if (open.has(note)) {
          const st = open.get(note)!; open.delete(note);
          const t = st / division, d = Math.max(1 / 16, (tick - st) / division);
          const key = Math.round(t * 1000) / 1000;
          const cur = map.get(key);
          if (cur) { cur.p.push(note); cur.d = Math.max(cur.d, d); } else map.set(key, { d, p: [note] });
        }
      } else if (type === 0xc0 || type === 0xd0) i += 1;
      else i += 2;
    }
    if (map.size && !drum) score.parts.push({ name: name || `Track ${score.parts.length + 1}`, events: flatten(map) });
    p = end;
  }
  // order parts high to low
  const avg = (pt: ImportedPart) => pt.events.reduce((s, e) => s + e.p[0]!, 0) / pt.events.length;
  score.parts.sort((a, c) => avg(c) - avg(a));
  return score;
}

/** Onset map → sorted, non-overlapping events (a later onset cuts the previous note short). */
function flatten(map: Map<number, { d: number; p: number[] }>): ImportedNote[] {
  const evs = [...map.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => ({ t, d: v.d, p: [...new Set(v.p)].sort((x, y) => x - y) }));
  for (let k = 0; k + 1 < evs.length; k++) evs[k]!.d = Math.min(evs[k]!.d, evs[k + 1]!.t - evs[k]!.t);
  return evs.filter((e) => e.d > 1e-6);
}

// ---------- ABC writer ----------

const LETTERS = "CDEFGAB";
const STEPS = [0, 2, 4, 5, 7, 9, 11];
const SHARPS = "FCGDAEB", FLATS = "BEADGCF";
const MAJOR_KEYS = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"];

export const keyLabel = (f: number) => `${MAJOR_KEYS[Math.max(-7, Math.min(7, f)) + 7]} major / ${["Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#"][Math.max(-7, Math.min(7, f)) + 7]} minor`;

function keySig(f: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (f > 0) for (const l of SHARPS.slice(0, f)) out[l] = 1;
  else for (const l of FLATS.slice(0, -f)) out[l] = -1;
  return out;
}

function spell(m: number, f: number, ks: Record<string, number>) {
  const pc = ((m % 12) + 12) % 12, oct = Math.floor(m / 12) - 1;
  let best = { l: "C", a: 0, o: oct, c: Infinity };
  for (let i = 0; i < 7; i++) {
    const l = LETTERS[i]!;
    for (const a of [0, 1, -1]) {
      const v = STEPS[i]! + a;
      if (((v % 12) + 12) % 12 !== pc) continue;
      const o = oct + (v < 0 ? 1 : 0) - (v > 11 ? 1 : 0);
      const c = (ks[l] ?? 0) === a ? 0 : a === 0 ? 1 : (a === 1 && f >= 0) || (a === -1 && f < 0) ? 2 : 2.5;
      if (c < best.c) best = { l, a, o, c };
    }
  }
  return best;
}

function durStr(units: number) { return units === 1 ? "" : String(units); } // L:1/16
const SIMPLE = [64, 48, 32, 24, 16, 12, 8, 6, 4, 3, 2, 1];
function splitUnits(u: number) { const out: number[] = []; for (const s of SIMPLE) while (u >= s) { out.push(s); u -= s; } return out; }

export function toAbc(score: ImportedScore): string {
  const ks = keySig(score.fifths);
  const barQ = (score.num * 4) / score.den;
  const barU = Math.round(barQ * 4);
  const end = Math.max(...score.parts.flatMap((p) => p.events.map((e) => e.t + e.d)));
  const nbars = Math.min(MAX_BARS, Math.max(1, Math.ceil(end / barQ - 1e-6)));
  const head = [
    "X:1",
    `T:${score.title.replace(/\n/g, " ").slice(0, 80) || "Imported score"}`,
    `M:${score.num}/${score.den}`,
    "L:1/16",
    ...(score.tempo ? [`Q:1/4=${score.tempo}`] : []),
    `K:${MAJOR_KEYS[Math.max(-7, Math.min(7, score.fifths)) + 7]}`,
    `%%score ${score.parts.map((_, i) => `V${i + 1}`).join(" ")}`,
  ];
  const bodies: string[] = [];
  score.parts.forEach((part, pi) => {
    const avg = part.events.reduce((s, e) => s + (e.p[0] ?? 60), 0) / part.events.length;
    const clef = /viola|alto/i.test(part.name) ? "alto"
      : /cello|bass|bassoon|tuba|trombone|\bLH\b|left/i.test(part.name) || avg < 52 ? "bass" : "treble";
    head.push(`V:V${pi + 1} clef=${clef} name="${part.name.replace(/"/g, "")}"`);
    // quantise to 16ths on a grid of units
    const q = part.events.map((e) => ({ s: Math.round(e.t * 4), e: Math.round((e.t + e.d) * 4), p: e.p })).filter((e) => e.e > e.s);
    const bars: string[] = [];
    for (let b = 0; b < nbars; b++) {
      const bs = b * barU, be = bs + barU;
      const acc: Record<string, number> = {};
      const toks: string[] = [];
      let cur = bs;
      const note = (m: number) => {
        const { l, a, o } = spell(m, score.fifths, ks);
        const k = `${l}${o}`;
        const want = a, have = acc[k] ?? ks[l] ?? 0;
        let pre = "";
        if (want !== have) { pre = want === 1 ? "^" : want === -1 ? "_" : "="; acc[k] = want; }
        return pre + (o >= 5 ? l.toLowerCase() + "'".repeat(o - 5) : l + ",".repeat(Math.max(0, 4 - o)));
      };
      for (const ev of q) {
        if (ev.e <= bs || ev.s >= be) continue;
        const s = Math.max(ev.s, bs, cur), e = Math.min(ev.e, be);
        if (e <= s) continue;
        if (s > cur) splitUnits(s - cur).forEach((u) => toks.push("z" + durStr(u)));
        const pitch = ev.p.length === 1 ? note(ev.p[0]!) : `[${ev.p.map(note).join("")}]`;
        const pieces = splitUnits(e - s);
        pieces.forEach((u, k) => toks.push(pitch + durStr(u) + (k < pieces.length - 1 || ev.e > be ? "-" : "")));
        cur = e;
      }
      if (cur < be) splitUnits(be - cur).forEach((u) => toks.push("z" + durStr(u)));
      bars.push(toks.join(" "));
    }
    bodies.push(`[V:V${pi + 1}] ${bars.join(" | ")} |]`);
  });
  return beamAbc([...head, ...bodies].join("\n"));
}
