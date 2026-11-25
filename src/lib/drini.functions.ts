import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const arrangeInput = z.object({
  description: z.string().min(1).max(2000),
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
        content: `Write a new arrangement.\nDescription: ${data.description}\nEnsemble: ${data.ensemble}\nLevel: ${data.level}\nKey: ${data.key}\nStyle: ${data.style}`,
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
