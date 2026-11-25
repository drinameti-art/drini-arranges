import { describe, expect, it } from "vitest";
import { checkAbc } from "./abc-check";

const ok = `X:1\nM:4/4\nL:1/4\nK:G\n%%score {P S}\nV:P clef=treble name="Primo"\nV:S clef=bass name="Secondo"\n[V:P] G A B d | c B A G | G4 |]\n[V:S] G,2 D,2 | G,2 D,2 | G,4 |]\n`;

describe("checkAbc", () => {
  it("passes a score where every bar fills 4/4 and voices align", async () => {
    const r = await checkAbc(ok);
    expect(r.problems).toEqual([]);
  });
  it("flags a middle bar that is one beat short", async () => {
    const r = await checkAbc(ok.replace("c B A G |", "c B A |"));
    expect(r.problems.join(" ")).toMatch(/don't add up/);
  });
  it("flags voices with different bar counts", async () => {
    const r = await checkAbc(ok.replace("G,2 D,2 | G,4 |]", "G,4 |]"));
    expect(r.problems.join(" ")).toMatch(/different bar counts/);
  });
  it("flags a violin note below G3", async () => {
    const v = `X:1\nM:4/4\nL:1/4\nK:C\nV:1 clef=treble name="Violin"\n[V:1] C, D E F | C4 |]\n`;
    const r = await checkAbc(v);
    expect(r.problems.join(" ")).toMatch(/Violin goes outside G3–A6/);
  });
});
