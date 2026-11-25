import { describe, expect, it } from "vitest";
import { analyseMelody } from "./melody";

/** Synthesise a hummed line: harmonics, slight vibrato, short gaps and a little noise. */
function hum(notes: [midi: number, beats: number][], bpm: number, sr = 44100, noise = 0.01) {
  const q = 60 / bpm;
  const total = notes.reduce((s, [, b]) => s + b, 0) * q + 0.5;
  const x = new Float32Array(Math.ceil(total * sr));
  let t0 = 0.25;
  for (const [midi, beats] of notes) {
    const f = 440 * 2 ** ((midi - 69) / 12);
    const d = beats * q - 0.05;
    let ph = 0;
    for (let i = 0; i < d * sr; i++) {
      const t = i / sr;
      ph += (2 * Math.PI * f * (1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t))) / sr;
      const env = Math.min(1, t / 0.02, (d - t) / 0.03);
      const k = Math.floor(t0 * sr) + i;
      x[k] = (x[k] ?? 0) + 0.5 * env * (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph)) + noise * (Math.random() - 0.5);
    }
    t0 += beats * q;
  }
  return x;
}

describe("analyseMelody", () => {
  it("hears a G major line at 96 BPM", () => {
    const r = analyseMelody(hum([[67, 1], [69, 1], [71, 1], [74, 1], [72, 1], [71, 1], [69, 1], [67, 2]], 96), 44100);
    expect(r.names.join(" ")).toBe("G A B D C B A G");
    expect(r.key).toBe("G major");
    expect(r.bpm).toBe(96);
    expect(r.text).toContain("G4 (half)");
  });

  it("hears a low D minor line at 72 BPM with more noise", () => {
    const r = analyseMelody(hum([[50, 1], [52, 1], [53, 2], [57, 1], [55, 1], [53, 1], [52, 1], [50, 2]], 72, 44100, 0.06), 44100);
    expect(r.names.join(" ")).toBe("D E F A G F E D");
    expect(r.key).toBe("D minor");
  });
});
