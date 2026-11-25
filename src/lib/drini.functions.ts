import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const arrangeInput = z.object({
  description: z.string().max(2000),
  ensemble: z.string().max(60),
  level: z.string().max(30),
  key: z.string().max(30),
  style: z.string().max(30),
  source: z.string().max(30000).optional(),
});

const fileInput = z.object({
  data: z.string().min(1).max(12_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  fileName: z.string().max(200),
  description: z.string().max(2000),
  ensemble: z.string().max(60),
  level: z.string().max(30),
  key: z.string().max(30),
  style: z.string().max(30),
});

const reviseInput = z.object({
  abc: z.string().min(1).max(20000),
  message: z.string().min(1).max(4000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(20),
});

export const arrange = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => arrangeInput.parse(d))
  .handler(async ({ data }) => {
    const { runDrini } = await import("./drini.server");
    return runDrini([
      {
        role: "user",
        content:
          `Write a new arrangement.\nDescription: ${data.description || "(none: arrange the source score below)"}\nEnsemble: ${data.ensemble}\nLevel: ${data.level}\nKey: ${data.key}\nStyle: ${data.style}` +
          (data.source
            ? `\n\nSOURCE SCORE, imported from the user's file (ABC; rhythms rounded to sixteenths, so tidy obvious slips). ` +
              `Keep its melody and harmony recognisable and arrange it for the requested ensemble, level and key ("Keep original" means its own key):\n${data.source}`
            : ""),
      },
    ]);
  });

/** Arrange from a photo or PDF of sheet music: Drini reads the page, then arranges it. */
export const arrangeFromFile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => fileInput.parse(d))
  .handler(async ({ data }) => {
    const { runDrini } = await import("./drini.server");
    return runDrini([
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `The attached ${data.mediaType === "application/pdf" ? "PDF" : "photo"} ("${data.fileName}") is sheet music the user wants arranged. ` +
              `First read it carefully: title, key, time signature, the melody, and the harmony or bass if shown (use at most the first 32 bars). ` +
              `Then write a new arrangement of it.\nDescription: ${data.description || "(none)"}\nEnsemble: ${data.ensemble}\nLevel: ${data.level}\nKey: ${data.key} ("Keep original" means the key on the page)\nStyle: ${data.style}\n` +
              `If parts of the page are unreadable, arrange what you can read and say so in "summary". If it is not sheet music, explain that in "summary" and return a short placeholder score.`,
          },
          { type: "file", data: data.data, mediaType: data.mediaType, filename: data.fileName },
        ],
      },
    ]);
  });

export const revise = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reviseInput.parse(d))
  .handler(async ({ data }) => {
    const { runDrini } = await import("./drini.server");
    return runDrini([
      ...data.history.map((h) => ({ role: h.role, content: h.content })),
      {
        role: "user",
        content: `Here is the current score in ABC:\n${data.abc}\n\nRevise it: ${data.message}\n\nReturn the full revised score. In "summary", explain exactly what changed.`,
      },
    ]);
  });
