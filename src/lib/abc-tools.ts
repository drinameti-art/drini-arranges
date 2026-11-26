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
  const files: unknown = lib.synth.getMidiFile(lib.renderAbc("*", withInstruments(abc))[0], { midiOutputType: "binary" });
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

const PROGRAMS: [RegExp, number][] = [
  [/piccolo/i, 72], [/flute|flaut/i, 73], [/oboe/i, 68], [/clarinet/i, 71], [/bassoon|fagot/i, 70], [/horn/i, 60],
  [/trumpet/i, 56], [/trombone/i, 57], [/tuba/i, 58], [/sax/i, 65],
  [/contrabass|double bass|kontrabas/i, 43], [/cello|violonçel/i, 42], [/viola|violë/i, 41], [/violin|violinë/i, 40],
  [/soprano|alto|tenor|baritone|choir|kor|^bass$|^bass\b/i, 52],
  [/guitar|kitar/i, 24], [/harp/i, 46],
];

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
