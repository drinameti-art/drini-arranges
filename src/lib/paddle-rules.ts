import { z } from "zod";

export const PAID_PLANS = {
  pro: { name: "DriniArranges Pro", amount: "2999", interval: "week" },
  studio: { name: "DriniArranges Studio", amount: "5999", interval: "month" },
} as const;
export type PaidPlan = keyof typeof PAID_PLANS;
export type PaddleEnvironment = "production" | "sandbox";
export function paddleEnvironment(value: string | undefined): PaddleEnvironment {
  if (value !== "production" && value !== "sandbox") throw new Error("Payments are not configured");
  return value;
}
export const PADDLE_EVENTS = ["subscription.created", "subscription.activated", "subscription.updated", "subscription.canceled", "subscription.past_due", "subscription.paused", "subscription.resumed"] as const;
const paddleId = (prefix: string) => z.string().regex(new RegExp(`^${prefix}_[a-z0-9]{26}$`));
export const subscriptionEventSchema = z.object({
  event_id: paddleId("evt"),
  event_type: z.enum(PADDLE_EVENTS),
  occurred_at: z.string().datetime({ offset: true }),
  data: z.object({
    id: paddleId("sub"), customer_id: paddleId("ctm"),
    status: z.enum(["active", "trialing", "past_due", "paused", "canceled"]),
    next_billed_at: z.string().datetime({ offset: true }).nullable(),
    custom_data: z.object({ user_id: z.string().uuid() }).passthrough(),
    items: z.array(z.object({ price: z.object({ id: paddleId("pri") }) })).min(1).max(10),
  }),
});
export type SubscriptionEvent = z.infer<typeof subscriptionEventSchema>;

/** Payment recovery is Paddle's grace period: retain access until actually paused/canceled. */
export function subscriptionPlan(status: SubscriptionEvent["data"]["status"], paidPlan: PaidPlan): "free" | PaidPlan {
  return status === "canceled" || status === "paused" ? "free" : paidPlan;
}

export function planForPrice(priceId: string, catalog: ReadonlyArray<{ price_id: string | null; plan: string }>): PaidPlan {
  const plan = catalog.find((row) => row.price_id === priceId)?.plan;
  if (plan !== "pro" && plan !== "studio") throw new Error("Unrecognized subscription price");
  return plan;
}

/** Only allow app-owned return destinations after authentication. */
export function loginDestination(value: string | null): "/pricing" | "/studio" | "/scores" {
  return value === "/pricing" ? "/pricing" : value === "/studio" ? "/studio" : "/scores";
}