import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, Output, streamText, type ModelMessage } from "ai";
import { z } from "zod";
import { DRINI_STYLE } from "./drini-style";

export const DRINI_SYSTEM_PROMPT = `You are Drini, an expert music arranger and music teacher. You write arrangements as valid ABC notation 2.1 that abcjs can render and play.

Output rules:
- Always include X:1, T:, M:, L:1/4 (or 1/8), Q:, K:.
- You may use ABC decorations for dynamics and articulation (!mf!, !>!, !fermata!, staccato dots, slurs) and "^text" annotations; they must not change any bar's length.
- Use \`%%score\` with one V: line per part. Each V: line has \`clef=\` and \`name=\`; for piano 4 hands use Primo (treble) and Secondo (bass).
- Every voice has the same number of bars, and every bar adds up exactly to the meter.
- End the piece on the tonic with a final barline |].
- Write rests with z (or x); never use Z multi-measure rests.
- Beam eighth notes and shorter by writing the notes of one beat together without spaces (3/4 with L:1/8: "gf g2 fe"), and put a space between beats.
- Default length 16 bars unless asked or unless you are arranging a given source score (then match its length); never more than 64. Use repeat signs (|: :|) and first/second endings for repeated sections.

Musical rules:
- Keep each part in a comfortable range (Drin's practical ranges; section 4 of the house style has the core ranges):
  - Soprano C4–G5, Alto G3–D5, Tenor C3–G4, Bass E2–C4
  - Violin C4–B5 (G3 allowed), Viola D3–C5, Cello D2–D4, Double bass written E2–D4 (sounds an octave lower), Guitar E2–B5 (written)
  - Flute D4–B5, Piccolo written D4–B5 (sounds an octave higher), Horn A3–F4 and Bassoon C3–C4 (concert pitch)
  - Piano: each hand within an octave span
  - SA choir + piano: two treble voices (Soprano, Alto, both C4–D5) plus a piano part (right and left hand)
  - Lead sheet: a single melody staff with chord symbols in quotes above the notes, e.g. "G" "D7"
- Header layout: T: title, a second T: line naming the ensemble, C: original composer when known, and C:arr. DriniArranges.
- Keep every part on its own staff: at most one ledger line above or below (treble clef C4–B5, alto clef D3–C5, tenor clef B2–A4, bass clef E2–D4). Choose the clef that fits each part, move a line up or down an octave, or hand a high or low passage to another part; never leave notes floating on many ledger lines, and do not use 8va.
- Text in the score is only for performers (tempo and character words, dynamics, pizz./arco and similar); never write editorial comments in the score.
- Avoid parallel 5ths and octaves between outer voices; octaves are allowed only as a deliberate doubling of the melody.
- Resolve the leading tone up to the tonic at cadences.
- Use clear cadences: I – IV – V – I, with V–I at phrase ends.
- Level Easy: quarter and half notes mostly, no more than a five-finger position per phrase, few accidentals, no leaps larger than a sixth; for beginner piano follow the beginner rules in the house style (right hand in one position, left hand one note per bar, I–IV–V).
- For pop, Albanian songs, jazz and lead sheets, write chord symbols above the melody ("Am", "Gm7").
- Level Intermediate: add eighth notes, simple syncopation, moderate leaps.
- Level Advanced: free.
- Respect the requested key, ensemble and style.
- In \`notes\`, flag anything a teacher should know, for example a wide leap or a hand position change.

${DRINI_STYLE}`;

const MODEL = "openai/gpt-6-astra";

export const arrangementSchema = z.object({
  title: z.string(),
  key: z.string(),
  meter: z.string(),
  bars: z.number(),
  abc: z.string().describe("Full ABC 2.1 score"),
  summary: z.string().describe("1–2 sentences in Drini's voice for the chat"),
  notes: z.array(z.object({ bar: z.number(), text: z.string() })),
});
export type Arrangement = z.infer<typeof arrangementSchema>;
export type DriniResult = { ok: true; arrangement: Arrangement } | { ok: false; error: string };

export async function runDrini(messages: ModelMessage[]): Promise<DriniResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "I'm not set up to write music yet — the AI key is missing." };
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: DRINI_SYSTEM_PROMPT,
      messages,
      output: Output.object({ schema: arrangementSchema }),
      maxRetries: 0,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const arrangement = await result.output;
    return { ok: true, arrangement };
  } catch (err) {
    console.error("Drini AI call failed", err);
    const status = APICallError.isInstance(err) ? err.statusCode : (err as { cause?: { statusCode?: number } })?.cause?.statusCode;
    if (status === 429) return { ok: false, error: "I'm getting a lot of requests right now. Give me a moment and try again?" };
    if (status === 402) return { ok: false, error: "The AI credits for this workspace have run out. Add credits in Lovable settings and I'll be ready again." };
    if (status === 403) return { ok: false, error: "I'm not allowed to use the AI service for this workspace right now. A workspace admin can check the AI settings." };
    return { ok: false, error: "I couldn't finish that one — try again?" };
  }
}
