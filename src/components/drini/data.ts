export type Arrangement = { id: string; title: string; meta: string };

export const recentArrangements: Arrangement[] = [
  { id: "folk", title: "Folk melody, piano 4 hands", meta: "Today · G major · Easy" },
  { id: "quartet", title: "Hummed theme, string quartet", meta: "Yesterday · D minor" },
  { id: "choir", title: "Children's choir, SA + piano", meta: "Mon · F major" },
  { id: "ballad", title: "Pop ballad, solo guitar", meta: "Nov 20 · E major" },
];

export const sampleScoreAbc = `X:1
M:4/4
L:1/4
Q:1/4=96
K:G
%%score {P S}
V:P clef=treble name="Primo"
V:S clef=bass name="Secondo"
[V:P] G A B d | c B A G | B g e d | c B A2 | G A B d | e d c B | A B c A | G4 |]
[V:S] G,2 D,2 | G,2 D,2 | G,2 D,2 | D,2 D,2 | G,2 D,2 | G,2 G,2 | D,2 D,2 | G,4 |]
`;

export const cannedReplies = [
  "Got it. I've updated the draft — have a listen and tell me what you'd like next.",
  "Done. I kept the melody intact and adjusted only the accompaniment.",
  "Good idea. I've marked the change in the score so you can compare it with Draft 2.",
];
