// Small helpers on top of abcjs: transposing a score and exporting MIDI.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function abcjs(): Promise<any> {
  const mod = await import("abcjs");
  return mod.default ?? mod;
}

const KEY_NAMES: Record<string, string> = { m: "minor", min: "minor", maj: "major", "": "major", dor: "Dorian", phr: "Phrygian", lyd: "Lydian", mix: "Mixolydian", loc: "Locrian", aeo: "minor", ion: "major" };

/** Reads the K: field of an ABC score as a readable key name, e.g. "Bb major" or "F# minor". */
export function keyName(abc: string): string | null {
  const k = /^K:\s*([A-Ga-g])([#b]?)\s*([A-Za-z]*)/m.exec(abc);
  if (!k) return null;
  const mode = KEY_NAMES[(k[3] ?? "").slice(0, 3).toLowerCase()] ?? "major";
  return `${(k[1] ?? "C").toUpperCase()}${k[2] ?? ""} ${mode}`;
}

/** Transposes the whole score by a number of semitones and returns the new ABC. */
export async function transposeAbc(abc: string, semitones: number): Promise<string> {
  const lib = await abcjs();
  const [visual] = lib.renderAbc("*", abc);
  const out: unknown = lib.strTranspose(abc, visual, semitones);
  if (typeof out !== "string" || !out.trim()) throw new Error("transpose failed");
  return out;
}

/** Downloads the score as a standard MIDI file. */
export async function downloadMidi(abc: string, fileBase: string) {
  const lib = await abcjs();
  const [visual] = lib.renderAbc("*", abc);
  const files: unknown = lib.synth.getMidiFile(lib.renderAbc("*", withInstruments(abc))[0], { midiOutputType: "binary", chordsOff: playbackOptions(abc).chordsOff });
  const data = Array.isArray(files) ? files[0] : files;
  if (!data) throw new Error("midi failed");
  download(new Blob([data as BlobPart], { type: "audio/midi" }), `${fileBase}.mid`);
}

/** Downloads the score as MusicXML for MuseScore, Sibelius, Finale or Dorico. */
export async function downloadMusicXml(abc: string, title: string, fileBase: string) {
  const lib = await abcjs();
  const { abcToMusicXml } = await import("./musicxml");
  const xml = abcToMusicXml(lib, abc, title);
  download(new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" }), `${fileBase}.musicxml`);
}

/** The copyright line printed at the bottom of every generated piece. */
export const COPYRIGHT = "© DriniArranges";

export function downloadAbc(abc: string, fileBase: string) {
  // %%footer puts the label at the bottom of every page in ABC tools that print pages (abcm2ps and similar)
  const withFooter = /^%%footer/m.test(abc) ? abc : abc.replace(/^(X:.*)$/m, `$1\n%%footer \t${COPYRIGHT}\t`);
  download(new Blob([withFooter], { type: "text/vnd.abc;charset=utf-8" }), `${fileBase}.abc`);
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fileSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "drini-score";
}

/** Print just the score in its own window: one image per system so pages break between systems, no app chrome. */
export async function printScore(title: string, meta: string, abc: string) {
  const w = window.open("", "_blank"); // open first, inside the click, so pop-up blockers allow it
  const lib = await abcjs();
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:-10000px;top:0;width:800px";
  document.body.appendChild(box);
  lib.renderAbc(box, oneLabelPerInstrument(abc), { oneSvgPerLine: true, staffwidth: 720, paddingtop: 8, paddingbottom: 8, foregroundColor: "#17162B" });
  const svgs = Array.from(box.querySelectorAll("svg")).map((svg) => {
    svg.removeAttribute("style");
    svg.setAttribute("width", "100%");
    return svg.outerHTML;
  });
  box.remove();
  if (!w) { window.print(); return; }
  const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@page{margin:14mm 14mm 18mm}body{font-family:Georgia,serif;color:#17162B;margin:0;padding-bottom:10mm}h1{font-size:20px;margin:0 0 2px}p{font:12px Inter,Arial,sans-serif;color:#5C5868;margin:0 0 8px}svg{display:block;max-width:100%;height:auto;break-inside:avoid;page-break-inside:avoid}
.copy{position:fixed;left:0;right:0;bottom:0;text-align:center;font:10px Inter,Arial,sans-serif;letter-spacing:.04em;color:#5C5868}</style>
</head><body><h1>${esc(title)}</h1><p>${esc(meta)}</p>${svgs.join("")}<div class="copy">${esc(COPYRIGHT)}</div></body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// General MIDI programs per instrument. Sections (plural names: "Violins 1", "Violas") use the string ensemble
// sound, solo parts (string quartet, piano and strings) the solo instrument.
const PROGRAMS: [RegExp, number][] = [
  [/piccolo/i, 72], [/flute|flaut/i, 73], [/oboe/i, 68], [/english horn|cor anglais/i, 69], [/clarinet|klarinet/i, 71],
  [/bassoon|fagot/i, 70], [/horn|korno/i, 60], [/trumpet|trumbet/i, 56], [/trombone|trombon/i, 57], [/tuba/i, 58],
  [/sax/i, 65], [/recorder|fyell/i, 74],
  [/contrabass|double bass|kontrabas/i, 43],
  [/violins|violas|cellos|violoncellos|strings|harqe/i, 48],
  [/cello|violonçel/i, 42], [/viola|violë/i, 41], [/violin|violinë/i, 40],
  [/soprano|alto|tenor|baritone|choir|kor|^bass$|^bass\b|voice|zë/i, 52],
  [/guitar|kitar/i, 24], [/harp|harpë/i, 46], [/organ|organo/i, 19], [/accordion|fizarmonik/i, 21],
  [/piano|pno|keys|\b(rh|lh)\b|primo|secondo|player/i, 0],
];

/**
 * Sound sets for playback, best first. MuseScore_General (MuseScore's own sound font, MIT) is rendered
 * note by note into public/soundfonts and served with the app; Musyng Kite is the online fallback,
 * and abcjs's built-in set is the last resort (no soundFontUrl).
 */
export const SOUND_FONT_URLS = [
  "/soundfonts/MuseScoreGeneral/",
  "https://paulrosen.github.io/midi-js-soundfonts/MusyngKite/",
];
export const SOUND_FONT_URL = SOUND_FONT_URLS[0]!;

/** Where each part sits left to right, like players on a stage (-1 left … 1 right). */
const SEATING: [RegExp, number][] = [
  [/violins? ?1|violin i\b|first violin|primo/i, -0.55], [/violins? ?2|violin ii\b|second violin/i, -0.25],
  [/viola|violë/i, 0.2], [/cello|violonçel/i, 0.4], [/contrabass|double bass|kontrabas/i, 0.6],
  [/piccolo|flute ?1|flaut/i, -0.3], [/flute ?2|oboe/i, 0.1], [/clarinet/i, -0.15], [/bassoon|fagot/i, 0.25], [/horn/i, 0.45],
  [/soprano/i, -0.45], [/alto/i, -0.15], [/tenor/i, 0.15], [/bass/i, 0.45],
  [/piano|pno|\b(rh|lh)\b|secondo|player/i, 0],
];

/** Synth options for the score: better samples, stereo seating, and no extra chord-symbol accompaniment in ensembles. */
export function playbackOptions(abc: string): { soundFontUrl: string; pan: number[]; chordsOff: boolean } {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const m of abc.matchAll(/^V:\s*(\S+)([^\n]*)$/gm)) {
    if (seen.has(m[1]!)) continue;
    seen.add(m[1]!);
    names.push(/(?:name|nm)="([^"]+)"/.exec(m[2] ?? "")?.[1] ?? m[1]!);
  }
  const n = names.length;
  const pan = names.map((name, i) => {
    const seat = SEATING.find(([re]) => re.test(name))?.[1];
    if (seat !== undefined) return seat;
    return n > 1 ? Math.round((-0.5 + i / (n - 1)) * 100) / 100 : 0; // spread unknown parts evenly
  });
  // chord symbols ("Am", "G7") are for reading; abcjs would otherwise add a chord track on top of the written parts
  return { soundFontUrl: SOUND_FONT_URL, pan, chordsOff: n > 1 };
}

/**
 * Display only: a piano (or other two-hand instrument) is labelled once, on the right-hand staff,
 * the way it is in Drin's scores — not "Piano RH" and "Piano LH" on both staves.
 * The stored ABC keeps RH/LH names because checks and playback rely on them.
 */
export function oneLabelPerInstrument(abc: string): string {
  const HAND = /^(.*?)[\s-]*(?:\b(?:RH|LH)\b|right hand|left hand|dora e djathtë|dora e majtë)$/i;
  const done = new Set<string>();
  return abc.replace(/^(V:\s*\S+)(.*)$/gm, (line, head: string, rest: string) => {
    const name = /\b(?:name|nm)="([^"]*)"/.exec(rest)?.[1];
    const m = name ? HAND.exec(name.trim()) : null;
    if (!m) return line;
    const inst = (m[1] ?? "").trim() || "Piano";
    const clean = rest.replace(/\s*\b(?:name|nm|subname|snm)="[^"]*"/g, "");
    if (done.has(inst)) return head + clean; // second hand: no label
    done.add(inst);
    const short = /piano/i.test(inst) ? "Pno." : inst;
    return `${head}${clean} name="${inst}" snm="${short}"`;
  });
}

/** Adds a MIDI instrument per voice so playback sounds like the ensemble (violins, cello, flute…) instead of piano. */
export function withInstruments(abc: string): string {
  if (/%%MIDI\s+program/.test(abc)) return abc;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of abc.split("\n")) {
    out.push(line);
    const m = /^V:\s*(\S+)(.*)$/.exec(line);
    if (!m || seen.has(m[1]!)) continue;
    seen.add(m[1]!);
    const name = /(?:name|nm)="([^"]+)"/.exec(m[2] ?? "")?.[1] ?? "";
    const prog = PROGRAMS.find(([re]) => re.test(name))?.[1];
    if (prog !== undefined) out.push(`%%MIDI program ${prog}`); // directly after the voice's first V: line
    // parts written at a different octave from the sound
    if (/piccolo/i.test(name)) out.push("%%MIDI transpose 12");
    else if (/contrabass|double bass|kontrabas/i.test(name)) out.push("%%MIDI transpose -12");
  }
  return out.join("\n");
}
