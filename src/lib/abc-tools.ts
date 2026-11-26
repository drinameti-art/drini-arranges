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
  const files: unknown = lib.synth.getMidiFile(visual, { midiOutputType: "binary" });
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

export function downloadAbc(abc: string, fileBase: string) {
  download(new Blob([abc], { type: "text/vnd.abc;charset=utf-8" }), `${fileBase}.abc`);
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
