// Arrangements saved in this browser (localStorage) until accounts and a database are added.
import { useEffect, useState } from "react";

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

export function loadLibrary(): SavedScore[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedScore[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: SavedScore[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // storage full or blocked: the score still shows, it just isn't kept
  }
}

/** Adds a new score, or updates it in place when the id already exists. */
export function saveScore(s: SavedScore) {
  const list = loadLibrary().filter((x) => x.id !== s.id);
  write([s, ...list]);
}

export function findScore(id: string) {
  return loadLibrary().find((s) => s.id === id) ?? null;
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
