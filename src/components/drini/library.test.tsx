import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { SavedScore } from "./library";

const backend = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], calls: [] as { action: string; filters: Record<string, unknown>; limit?: number; ascending?: boolean }[], fail: false }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => {
  let action = "select";
  const filters: Record<string, unknown> = {};
  let max = 1000;
  let ascending = false;
  let single = false;
  let rows: Record<string, unknown>[] = [];
  const builder = {
    select: () => builder,
    eq: (key: string, value: unknown) => { filters[key] = value; return builder; },
    order: (_key: string, options: { ascending: boolean }) => { ascending = options.ascending; return builder; },
    limit: (n: number) => { max = n; return builder; },
    maybeSingle: () => { single = true; return builder; },
    upsert: (input: Record<string, unknown> | Record<string, unknown>[]) => { action = "upsert"; rows = Array.isArray(input) ? input : [input]; return builder; },
    delete: () => { action = "delete"; return builder; },
    then: (resolve: (value: { data: unknown; error: unknown }) => unknown) => {
      backend.calls.push({ action, filters, limit: max, ascending });
      if (backend.fail) return Promise.resolve(resolve({ data: null, error: new Error("offline") }));
      if (action === "upsert") for (const row of rows) { backend.rows = backend.rows.filter((r) => r["id"] !== row["id"]); backend.rows.push({ ...row, updated_at: new Date().toISOString() }); }
      const match = (row: Record<string, unknown>) => Object.entries(filters).every(([key, value]) => row[key] === value);
      if (action === "delete") backend.rows = backend.rows.filter((r) => !match(r));
      const data = backend.rows.filter(match).sort((a, b) => String(b["created_at"]).localeCompare(String(a["created_at"]))).slice(0, max);
      return Promise.resolve(resolve({ data: single ? data[0] ?? null : data, error: null }));
    },
  };
  return builder;
} } }));

const score = (id: string, createdAt = 1000): SavedScore => ({ id, title: id, ensemble: "Solo piano", level: "Easy", key: "C major", meter: "4/4", bars: 1, abc: "X:1\nM:4/4\nL:1/4\nK:C\nC D E F|", notes: [{ bar: 1, text: "Gentle" }], createdAt });
const row = (id: string, owner: string, time = 1000) => ({ ...score(id, time), user_id: owner, created_at: new Date(time).toISOString(), updated_at: new Date(time).toISOString() });

beforeEach(() => { vi.resetModules(); localStorage.clear(); backend.rows = []; backend.calls = []; backend.fail = false; });

describe("Cloud score library", () => {
  it("keeps guest saves synchronous in the original browser storage", async () => {
    const lib = await import("./library");
    lib.saveScore(score("guest"));
    expect(lib.findScore("guest")?.id).toBe("guest");
    expect(JSON.parse(localStorage.getItem("drini:library") ?? "[]")).toHaveLength(1);
    expect(backend.calls).toHaveLength(0);
  });
  it("moves browser scores by id on the first sign-in only", async () => {
    const lib = await import("./library");
    lib.saveScore(score("guest"));
    await lib.setLibraryUser("owner-a");
    expect(backend.rows.find((r) => r["id"] === "guest")?.["user_id"]).toBe("owner-a");
    expect(localStorage.getItem("drini:library")).toBe("[]");
    await lib.setLibraryUser(null);
    lib.saveScore(score("later-guest"));
    await lib.setLibraryUser("owner-a");
    expect(backend.rows.some((r) => r["id"] === "later-guest")).toBe(false);
  });
  it("lists only the current user's newest 50 database scores", async () => {
    const lib = await import("./library");
    backend.rows = Array.from({ length: 55 }, (_, i) => row(`own-${i}`, "owner-a", i * 1000));
    backend.rows.push(row("private-other", "owner-b", 999999));
    await lib.setLibraryUser("owner-a");
    expect(lib.loadLibrary()).toHaveLength(50);
    expect(lib.loadLibrary()[0]?.id).toBe("own-54");
    expect(lib.loadLibrary().some((s) => s.id === "private-other")).toBe(false);
    expect(backend.calls.at(-1)).toMatchObject({ filters: { user_id: "owner-a" }, limit: 50, ascending: false });
  });
  it("upserts account scores without changing the synchronous save API", async () => {
    const lib = await import("./library");
    await lib.setLibraryUser("owner-a");
    expect(lib.saveScore(score("new"))).toBeUndefined();
    expect(lib.findScore("new")?.title).toBe("new");
    await waitFor(() => expect(backend.rows.find((r) => r["id"] === "new")?.["user_id"]).toBe("owner-a"));
  });
  it("uses the cache first and asynchronously reads an uncached score by owner and id", async () => {
    const lib = await import("./library");
    await lib.setLibraryUser("owner-a");
    backend.rows.push(row("remote", "owner-a"));
    const { result } = renderHook(() => lib.useLibrary());
    act(() => { expect(lib.findScore("remote")).toBeNull(); });
    await waitFor(() => expect(result.current[0]?.id).toBe("remote"));
    const count = backend.calls.length;
    expect(lib.findScore("remote")?.id).toBe("remote");
    expect(backend.calls).toHaveLength(count);
    expect(backend.calls.at(-1)?.filters).toEqual({ user_id: "owner-a", id: "remote" });
  });
  it("deletes only the selected owner's score and removes its cache", async () => {
    const lib = await import("./library");
    backend.rows = [row("own", "owner-a"), row("other", "owner-b")];
    await lib.setLibraryUser("owner-a");
    await lib.deleteScore("own");
    expect(lib.findScore("own")).toBeNull();
    expect(backend.rows.map((r) => r["id"])).toEqual(["other"]);
    expect(backend.calls.find((c) => c.action === "delete")?.filters).toEqual({ user_id: "owner-a", id: "own" });
  });
  it("keeps account caches separate from other accounts and signed-out storage", async () => {
    const lib = await import("./library");
    backend.rows = [row("private-a", "owner-a"), row("private-b", "owner-b")];
    await lib.setLibraryUser("owner-a");
    await lib.setLibraryUser("owner-b");
    expect(lib.loadLibrary().map((s) => s.id)).toEqual(["private-b"]);
    await lib.setLibraryUser(null);
    expect(lib.loadLibrary()).toEqual([]);
  });
  it("retains a failed cloud save in the cache and retries it after signing in again", async () => {
    const lib = await import("./library");
    await lib.setLibraryUser("owner-a");
    backend.fail = true;
    lib.saveScore(score("offline"));
    await waitFor(() => expect(backend.calls.some((c) => c.action === "upsert")).toBe(true));
    expect(lib.findScore("offline")?.id).toBe("offline");
    await lib.setLibraryUser(null);
    backend.fail = false;
    await lib.setLibraryUser("owner-a");
    expect(backend.rows.some((r) => r["id"] === "offline")).toBe(true);
  });
});