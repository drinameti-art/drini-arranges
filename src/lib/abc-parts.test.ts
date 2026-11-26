import { describe, expect, it } from "vitest";
import { parseScore, partAbc, pedalPiano, playerGroups, withCountIn, withoutVoices, writtenPitch } from "./abc-parts";

const score = `X:1\nT:Carol\nT:For Piano and Strings\nM:3/4\nL:1/8\nK:Gm\n%%score [V1 V2] {V4 V5}\nV:V1 clef=treble name="Violin 1"\nV:V2 clef=treble name="Clarinet"\nV:V4 clef=treble name="Piano RH"\nV:V5 clef=bass name="Piano LH"\n[V:V1] B2 AB G2 | z6 | z6 | z6 |\n[V:V2] z6 | z6 | z6 | z6 |\n[V:V4] b6 | b6 | b6 | b6 |\n[V:V5] G,6 | G,6 | F,6 | E,6 |\n[V:V1] z6 | z6 | d6 | G6 |]\n[V:V2] z6 | c2 d2 e2 | d6 | B6 |]\n[V:V4] b6 | a6 | g6 | g6 |]\n[V:V5] D,6 | D,6 | G,6 | G,,6 |]\n`;

describe("parts", () => {
  it("groups the two piano hands into one player", () => {
    expect(playerGroups(parseScore(score)).map((g) => g.name)).toEqual(["Violin 1", "Clarinet", "Piano"]);
  });
  it("compresses empty bars into a multi-bar rest", () => {
    const part = partAbc(score, ["V1"], "Violin 1");
    expect(part).toContain("T:Violin 1");
    expect(part).toContain("Z5");
    expect(part).not.toContain("[V:V2]");
  });
  it("keeps both piano staves together", () => {
    const part = partAbc(score, ["V4", "V5"], "Piano");
    expect(part).toContain("%%score {V4 V5}");
    expect(part).toContain("[V:V5] G,6");
  });
  it("knows the written pitch of transposing instruments", () => {
    expect(writtenPitch("Clarinet")?.semitones).toBe(2);
    expect(writtenPitch("Horn")?.semitones).toBe(7);
    expect(writtenPitch("Alto Sax")?.semitones).toBe(9);
    expect(writtenPitch("Violin 1")).toBeNull();
  });
});

describe("playback helpers", () => {
  it("removes muted voices and their place in the score line", () => {
    const out = withoutVoices(score, ["V1", "V4"]);
    expect(out).not.toContain("[V:V1]");
    expect(out).toContain("%%score [V2] {V5}");
  });
  it("adds a bar of clicks before the music", () => {
    const out = withCountIn(score);
    expect(out).toContain("[V:CLICK] c'2 c2 c2 |");
    expect(out).toContain("[V:V1] z6 | B2 AB G2");
  });
  it("holds piano notes until the bass changes", () => {
    const tracks = [[{ pitch: 64, instrument: 0, start: 0, end: 0.5 }], [{ pitch: 48, instrument: 0, start: 0, end: 1 }, { pitch: 43, instrument: 0, start: 1, end: 2 }]];
    pedalPiano(tracks);
    expect(tracks[0]![0]!.end).toBe(1);
  });
});
