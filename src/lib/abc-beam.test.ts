import { describe, expect, it } from "vitest";
import { beamAbc } from "./abc-beam";

const last = (abc: string) => beamAbc(abc).split("\n").pop();

describe("beamAbc", () => {
  it("beams eighths within each beat in 3/4", () => {
    expect(last('X:1\nM:3/4\nL:1/8\nK:Ebm\n!mp!"^cantabile" g f g2 f e | d e f2 B d |')).toBe('!mp!"^cantabile"gf g2 fe | de f2 Bd |');
  });
  it("groups in dotted quarters in 6/8 and leaves triplets alone", () => {
    expect(last("X:1\nM:6/8\nL:1/8\nK:G\nG A B c d e | (3GAB c2 d |")).toBe("GAB cde | (3GAB c2 d |");
  });
  it("keeps rests, longer notes and chord symbols correct", () => {
    expect(last('X:1\nM:4/4\nL:1/8\nK:C\n"C" c d "G7" e f g2 g2 | c>d e2 z4 |')).toBe('"C"cd "G7"ef g2 g2 | c>d e2 z4 |');
  });
  it("handles inline voice tags and sixteenth-note units", () => {
    expect(last("X:1\nM:4/4\nL:1/16\nK:G\n[V:V5] G,,2 D,2 G,2 B,2 [G,D]8 |]")).toBe("[V:V5] G,,2D,2 G,2B,2 [G,D]8 |]");
  });
});
