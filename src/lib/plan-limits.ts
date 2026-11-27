// Plan limits for new arrangements. Pure rules, shared by the server check and its tests.
export type Plan = "free" | "pro" | "studio";
export const PLAN_LIMITS: Record<Plan, number> = { free: 3, pro: 15, studio: 30 };
const WEEK = 7 * 24 * 60 * 60 * 1000;

export type Usage = { plan: Plan; limit: number; used: number; left: number; resetsAt: string };

export function toPlan(p: unknown): Plan {
  return p === "pro" || p === "studio" ? p : "free";
}

/** Start of the counting window: rolling 7 days for pro, the calendar month (UTC) otherwise. */
export function periodStart(plan: Plan, now: Date): Date {
  if (plan === "pro") return new Date(now.getTime() - WEEK);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Usage from the arrangement times inside the window (any order). */
export function computeUsage(plan: Plan, times: Date[], now: Date): Usage {
  const start = periodStart(plan, now).getTime();
  const inWindow = times.map((d) => d.getTime()).filter((t) => t >= start && t <= now.getTime()).sort((a, b) => a - b);
  const limit = PLAN_LIMITS[plan];
  const used = inWindow.length;
  let resets: number;
  if (plan === "pro") {
    // the next arrangement frees up 7 days after the oldest one in the window
    resets = (inWindow[0] ?? now.getTime()) + WEEK;
  } else {
    resets = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  }
  return { plan, limit, used, left: Math.max(0, limit - used), resetsAt: new Date(resets).toISOString() };
}

export const LIMIT_REACHED = "LIMIT_REACHED";

/** Error text the client can read back: LIMIT_REACHED:{plan,limit,resetsAt}. */
export function limitError(u: Usage) {
  const e = new Error(`${LIMIT_REACHED}:${JSON.stringify({ plan: u.plan, limit: u.limit, resetsAt: u.resetsAt })}`);
  (e as Error & { code?: string }).code = LIMIT_REACHED;
  return e;
}

export function parseLimitError(err: unknown): Pick<Usage, "plan" | "limit" | "resetsAt"> | null {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const i = msg.indexOf(`${LIMIT_REACHED}:`);
  if (i < 0) return null;
  try { return JSON.parse(msg.slice(i + LIMIT_REACHED.length + 1)); } catch { return null; }
}

/** Check the limit, run the AI, and count it only when it succeeded. */
export async function meterArrangement<T extends { ok: boolean }>(
  deps: { usage: () => Promise<Usage>; record: () => Promise<void> },
  run: () => Promise<T>,
): Promise<T> {
  const u = await deps.usage();
  if (u.left <= 0) throw limitError(u);
  const res = await run();
  if (res.ok) await deps.record();
  return res;
}
