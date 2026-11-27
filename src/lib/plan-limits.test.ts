import { describe, expect, it, vi } from "vitest";
import { computeUsage, meterArrangement, parseLimitError, type Usage } from "./plan-limits";

const now = new Date("2026-11-27T13:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

describe("plan periods", () => {
  it("pro counts the last 7 days (rolling)", () => {
    const u = computeUsage("pro", [daysAgo(1), daysAgo(6.9), daysAgo(7.1), daysAgo(20)], now);
    expect(u.limit).toBe(15);
    expect(u.used).toBe(2);
    expect(u.resetsAt).toBe(new Date(daysAgo(6.9).getTime() + 7 * 86400000).toISOString());
  });
  it("free counts the calendar month in UTC", () => {
    const u = computeUsage("free", [new Date("2026-11-01T00:00:00Z"), new Date("2026-10-31T23:59:59Z"), daysAgo(2)], now);
    expect(u).toMatchObject({ limit: 3, used: 2, left: 1, resetsAt: "2026-12-01T00:00:00.000Z" });
  });
  it("studio counts the calendar month with 30", () => {
    const u = computeUsage("studio", [daysAgo(1), daysAgo(40)], now);
    expect(u).toMatchObject({ limit: 30, used: 1, left: 29, resetsAt: "2026-12-01T00:00:00.000Z" });
  });
});

describe("metering", () => {
  const full: Usage = { plan: "free", limit: 3, used: 3, left: 0, resetsAt: "2026-12-01T00:00:00.000Z" };
  it("blocks the AI call when the limit is reached", async () => {
    const run = vi.fn(async () => ({ ok: true }));
    const record = vi.fn(async () => {});
    const err = await meterArrangement({ usage: async () => full, record }, run).catch((e) => e);
    expect(parseLimitError(err)).toEqual({ plan: "free", limit: 3, resetsAt: full.resetsAt });
    expect(run).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });
  it("a failed AI call does not count", async () => {
    const record = vi.fn(async () => {});
    const usage = async () => ({ ...full, used: 0, left: 3 });
    await meterArrangement({ usage, record }, async () => ({ ok: false }));
    await expect(meterArrangement({ usage, record }, async () => { throw new Error("AI down"); })).rejects.toThrow("AI down");
    expect(record).not.toHaveBeenCalled();
    await meterArrangement({ usage, record }, async () => ({ ok: true }));
    expect(record).toHaveBeenCalledTimes(1);
  });
});
