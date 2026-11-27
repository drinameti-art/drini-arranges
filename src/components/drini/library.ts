// Synchronous public API, with account-scoped cloud synchronization behind the cache.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { tr } from "@/lib/i18n";

export type SavedScore = {
  id: string;
  title: string;
  ensemble: string;
  level: string;
  key: string;
  meter: string;
  bars: number;
  abc: string;
  notes: { bar: number; text: string }[];
  createdAt: number;
};

const KEY = "drini:library";
const EVENT = "drini:library";
const MAX = 50;
let userId: string | null = null;
let generation = 0;
let ready: Promise<void> = Promise.resolve();
let queue: Promise<unknown> = Promise.resolve();
const misses = new Set<string>();
const memory = new Map<string, SavedScore[]>();
const cacheKey = () => userId ? `${KEY}:${userId}` : KEY;

function read(key: string): SavedScore[] {
  try {
    const raw = localStorage.getItem(key);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list as SavedScore[] : [];
  } catch { return memory.get(key) ?? []; }
}

export function loadLibrary(): SavedScore[] {
  return read(cacheKey());
}

function write(list: SavedScore[], key = cacheKey()) {
  memory.set(key, list.slice(0, MAX));
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
  } catch { /* Cache remains available in memory. */ }
  window.dispatchEvent(new Event(EVENT));
}

type ScoreRow = Database["public"]["Tables"]["scores"]["Row"];
function fromRow(row: ScoreRow): SavedScore {
  const notes = Array.isArray(row.notes) ? row.notes.flatMap((note) => {
    if (!note || typeof note !== "object" || Array.isArray(note)) return [];
    return typeof note["bar"] === "number" && typeof note["text"] === "string" ? [{ bar: note["bar"], text: note["text"] }] : [];
  }) : [];
  return { id: row.id, title: row.title, ensemble: row.ensemble, level: row.level, key: row.key, meter: row.meter, bars: row.bars, abc: row.abc, notes, createdAt: Date.parse(row.created_at) };
}
function toRow(s: SavedScore, owner: string) {
  return { id: s.id, user_id: owner, title: s.title, ensemble: s.ensemble, level: s.level, key: s.key, meter: s.meter, bars: s.bars, abc: s.abc, notes: s.notes, created_at: new Date(s.createdAt).toISOString() };
}
function warn() { toast.error(tr("auth.syncError")); }
const pendingKey = (owner: string) => `${KEY}:${owner}:pending`;
function acknowledge(s: SavedScore, owner: string) {
  const pending = read(pendingKey(owner));
  write(pending.filter((p) => p.id !== s.id || JSON.stringify(p) !== JSON.stringify(s)), pendingKey(owner));
}

async function refreshLibrary(owner: string, version: number) {
  const { data, error } = await supabase.from("scores").select("*").eq("user_id", owner).order("created_at", { ascending: false }).limit(MAX);
  if (version !== generation || owner !== userId) return;
  if (error) { warn(); return; }
  const pending = read(pendingKey(owner));
  const pendingIds = new Set(pending.map((s) => s.id));
  write([...pending, ...(data ?? []).map(fromRow).filter((s) => !pendingIds.has(s.id))].sort((a, b) => b.createdAt - a.createdAt));
}

/** Called only by the root account provider, never from an auth callback lock. */
export function setLibraryUser(owner: string | null): Promise<void> {
  if (owner === userId) return ready;
  userId = owner;
  const version = ++generation;
  misses.clear();
  window.dispatchEvent(new Event(EVENT));
  ready = (async () => {
    if (!owner) return;
    try {
      // Move browser-only scores once; never copy a different account's cache.
      if (!localStorage.getItem(`${KEY}:migrated`)) {
        const guest = read(KEY);
        if (guest.length) {
          const { error } = await supabase.from("scores").upsert(guest.map((s) => toRow(s, owner)), { onConflict: "id" });
          if (error) throw error;
        }
        if (version !== generation) return;
        localStorage.setItem(`${KEY}:migrated`, "1");
        write([], KEY);
      }
      for (const score of read(pendingKey(owner))) {
        if (version !== generation) return;
        const { error } = await supabase.from("scores").upsert(toRow(score, owner), { onConflict: "id" });
        if (error) throw error;
        acknowledge(score, owner);
      }
      await refreshLibrary(owner, version);
    } catch { warn(); }
  })();
  return ready;
}

/** Adds a new score, or updates it in place when the id already exists. */
export function saveScore(s: SavedScore) {
  const list = loadLibrary().filter((x) => x.id !== s.id);
  write([s, ...list]);
  const owner = userId;
  const version = generation;
  if (!owner) return;
  write([s, ...read(pendingKey(owner)).filter((p) => p.id !== s.id)], pendingKey(owner));
  queue = queue.catch(() => {}).then(async () => {
    await ready;
    if (owner !== userId || version !== generation) return;
    const { error } = await supabase.from("scores").upsert(toRow(s, owner), { onConflict: "id" });
    if (error) { warn(); return; }
    acknowledge(s, owner);
    await refreshLibrary(owner, version);
  }).catch(warn);
}

export function findScore(id: string) {
  const cached = loadLibrary().find((s) => s.id === id) ?? null;
  const owner = userId;
  const version = generation;
  if (cached || !owner || misses.has(id)) return cached;
  misses.add(id);
  void ready.then(async () => {
    if (owner !== userId || version !== generation) return;
    const { data, error } = await supabase.from("scores").select("*").eq("user_id", owner).eq("id", id).maybeSingle();
    if (owner !== userId || version !== generation) return;
    if (error) { misses.delete(id); warn(); return; }
    if (data) write([fromRow(data), ...loadLibrary().filter((s) => s.id !== id)]);
  }).catch(() => { misses.delete(id); warn(); });
  return null;
}

export async function deleteScore(id: string) {
  const owner = userId;
  const version = generation;
  if (owner) {
    await ready;
    await queue;
    if (owner !== userId || version !== generation) return;
    const { error } = await supabase.from("scores").delete().eq("user_id", owner).eq("id", id);
    if (error) throw error;
    if (owner !== userId || version !== generation) return;
    write(read(pendingKey(owner)).filter((s) => s.id !== id), pendingKey(owner));
  }
  write(loadLibrary().filter((s) => s.id !== id));
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Live list of saved scores; empty during server render, filled after mount. */
export function useLibrary() {
  const [list, setList] = useState<SavedScore[]>([]);
  useEffect(() => {
    const sync = () => setList(loadLibrary());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

export function relativeDay(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const days = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
