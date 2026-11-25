import { describe, expect, it } from "vitest";
import { checkVoiceLeading, keyAccidentals, makeSpeller, type VoiceLine } from "./harmony";

/** One note (or chord) per quarter note, in a 4/4 bar of length 1. */
const line = (name: string, notes: (number | number[])[]): VoiceLine => ({
  name,
  events: notes.map((m, i) => ({ t: i / 4, dur: 0.25, midis: Array.isArray(m) ? m : [m] })),
});

describe("checkVoiceLeading", () => {
  it("finds parallel fifths between outer voices", () => {
    const issues = checkVoiceLeading([line("Soprano", [76, 74]), line("Bass", [57, 55])], 1);
    expect(issues[0]?.text).toMatch(/Parallel fifths between Soprano and Bass/);
  });

  it("accepts contrary motion", () => {
    expect(checkVoiceLeading([line("Soprano", [72, 74, 76, 77]), line("Bass", [48, 47, 45, 41])], 1)).toEqual([]);
  });

  it("does not count a held note as parallel motion", () => {
    expect(checkVoiceLeading([line("Primo", [67, 69]), line("Secondo", [43, 43])], 1)).toEqual([]);
  });

  it("treats a line doubled in octaves as deliberate doubling", () => {
    const v1 = line("Violin 1", [72, 74, 76, 77]);
    const vc = line("Cello", [48, 50, 52, 53]);
    expect(checkVoiceLeading([v1, vc], 1)).toEqual([]);
  });

  it("still flags a single parallel octave between the outer voices", () => {
    const issues = checkVoiceLeading([line("Violin 1", [76, 72, 74, 79]), line("Cello", [55, 48, 50, 52])], 1);
    expect(issues.map((i) => i.text).join(" ")).toMatch(/Parallel octaves/);
  });

  it("finds voice crossing and wide spacing in a choir", () => {
    const kinds = checkVoiceLeading(
      [line("Soprano", [72, 72]), line("Alto", [55, 74]), line("Tenor", [52, 52]), line("Bass", [48, 48])],
      1,
    ).map((i) => i.kind);
    expect(kinds).toContain("crossing");
    expect(kinds).toContain("spacing");
  });

  it("finds a piano chord wider than an octave", () => {
    const issues = checkVoiceLeading([line("Primo", [[60, 76]]), line("Secondo", [43])], 1);
    expect(issues.map((i) => i.kind)).toContain("stretch");
  });
});

describe("makeSpeller", () => {
  it("applies the key signature and bar-local accidentals", () => {
    const s = makeSpeller(keyAccidentals([{ acc: "sharp", note: "f" }, { acc: "sharp", note: "c" }])); // D major
    expect(s.midi(3)).toBe(66); // F#4
    expect(s.midi(3, "natural")).toBe(65); // F4
    expect(s.midi(3)).toBe(65); // natural lasts to the barline
    s.newBar();
    expect(s.midi(3)).toBe(66);
    expect(s.midi(0)).toBe(61); // C#4
  });
});
