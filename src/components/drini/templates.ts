import type { ArrangeRequest } from "./ArrangeForm";

export type Template = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  request: Partial<ArrangeRequest>;
};

/** Ready-made briefs. "Use template" fills the Studio form with `request`. */
export const templates: Template[] = [
  {
    id: "piano-duet",
    title: "Piano duet for students",
    desc: "Two players, one piano. A simple secondo under a singing primo.",
    tags: ["Easy", "4 hands"],
    request: {
      mode: "text",
      prompt: "An easy piano duet for two students. The primo sings a simple, memorable melody; the secondo plays steady half notes and simple broken chords, no hand position changes. 16 bars with a clear ending.",
      ensemble: "Piano 4 hands", level: "Easy", key: "C major", style: "Lyrical",
    },
  },
  {
    id: "satb-hymn",
    title: "SATB hymn",
    desc: "Four-part chorale writing with clean voice leading and tidy ranges.",
    tags: ["Choir", "Intermediate"],
    request: {
      mode: "text",
      prompt: "A four-part SATB hymn in chorale style, 16 bars in two phrases of 8. Melody in the soprano, mostly note-against-note, clear cadences at the end of each phrase (half cadence, then perfect cadence).",
      ensemble: "SATB choir", level: "Intermediate", key: "D major", style: "Classical",
    },
  },
  {
    id: "quartet-wedding",
    title: "String quartet wedding",
    desc: "A warm, lyrical setting for processionals and signing moments.",
    tags: ["Strings", "Advanced"],
    request: {
      mode: "text",
      prompt: "A warm, lyrical piece for string quartet for a wedding signing. Violin 1 carries the melody, violin 2 and viola fill the harmony with gentle movement, cello holds a singing bass line. 24 bars, slow and flowing.",
      ensemble: "String quartet", level: "Advanced", key: "D major", style: "Lyrical",
    },
  },
  {
    id: "guitar-solo",
    title: "Fingerstyle guitar solo",
    desc: "Melody on top with a gentle bass and arpeggios underneath.",
    tags: ["Guitar", "Intermediate"],
    request: {
      mode: "text",
      prompt: "A fingerstyle solo guitar piece: melody on the top strings, open-string bass notes on the beat, gentle arpeggios in between. Keep it playable in first position where possible. 16 bars.",
      ensemble: "Guitar", level: "Intermediate", key: "G major", style: "Folk",
    },
  },
  {
    id: "children-choir",
    title: "Children's choir, SA + piano",
    desc: "Two treble parts in comfortable ranges with a supportive piano.",
    tags: ["Choir", "Easy"],
    request: {
      mode: "text",
      prompt: "A cheerful song for children's choir in two parts (soprano and alto, both between C4 and D5) with a simple piano accompaniment that doubles the tune where helpful. Mostly stepwise, easy to learn by ear. 16 bars.",
      ensemble: "SA choir + piano", level: "Easy", key: "F major", style: "Folk",
    },
  },
  {
    id: "lead-sheet",
    title: "Lead sheet from a hum",
    desc: "Hum a tune and get the melody with chord symbols above it.",
    tags: ["Any", "Quick"],
    request: {
      mode: "audio",
      prompt: "Write a lead sheet: just the melody on one staff with chord symbols above it.",
      ensemble: "Lead sheet", level: "Intermediate", key: "Keep original", style: "Pop",
    },
  },
];

export const findTemplate = (id: string) => templates.find((t) => t.id === id) ?? null;
