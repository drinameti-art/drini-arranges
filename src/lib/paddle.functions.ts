import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { paddleEnvironment } from "./paddle-rules";

export const beginPaddleCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan: z.enum(["pro", "studio"]) }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const environment = paddleEnvironment(process.env["PADDLE_ENV"]);
      const apiKey = process.env["PADDLE_API_KEY"];
      const clientToken = process.env["PADDLE_CLIENT_TOKEN"];
      if (!apiKey || !clientToken || !process.env["PADDLE_WEBHOOK_SECRET"]) return { ok: false as const, reason: "unconfigured" as const };
      // Auth revalidates the bearer; do not trust an email or user id from the browser.
      const { data: auth, error } = await context.supabase.auth.getUser();
      if (error || !auth.user?.email || auth.user.id !== context.userId) throw new Error("Account unavailable");
      const { createCheckout } = await import("./paddle.server");
      const transactionId = await createCheckout({ environment, apiKey }, context.userId, auth.user.email, data.plan);
      return { ok: true as const, transactionId, clientToken, environment, email: auth.user.email, userId: context.userId };
    } catch { return { ok: false as const, reason: "failed" as const }; }
  });

export const openPaddlePortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const environment = paddleEnvironment(process.env["PADDLE_ENV"]);
      const apiKey = process.env["PADDLE_API_KEY"];
      if (!apiKey) throw new Error("Payments unavailable");
      const { data: profile, error } = await context.supabase.from("profiles").select("plan,paddle_customer_id,paddle_subscription_id,paddle_environment").eq("id", context.userId).single();
      if (error || !profile.paddle_customer_id || profile.plan === "free" || profile.paddle_environment !== environment) throw new Error("Subscription unavailable");
      const { customerPortal } = await import("./paddle.server");
      return { ok: true as const, url: await customerPortal({ environment, apiKey }, profile.paddle_customer_id, profile.paddle_subscription_id) };
    } catch { return { ok: false as const }; }
  });