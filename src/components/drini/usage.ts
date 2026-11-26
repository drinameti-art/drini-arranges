// Free-plan counter, kept in this browser until accounts exist (easy to reset, so it's a guide, not a lock).
import { useEffect, useState } from "react";

export const FREE_PER_MONTH = 5;
const KEY = "drini:usage";
const EVENT = "drini:usage";
const month = () => new Date().toISOString().slice(0, 7);

function read(): number {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as { month: string; used: number } | null;
    return raw && raw.month === month() ? raw.used : 0;
  } catch {
    return 0;
  }
}

export function freeLeft() {
  return Math.max(0, FREE_PER_MONTH - read());
}

/** Count one AI arrangement (demo mode and revisions are not counted). */
export function countArrangement() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ month: month(), used: read() + 1 }));
    window.dispatchEvent(new Event(EVENT));
  } catch { /* ignore */ }
}

export function useFreeLeft() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const sync = () => setLeft(freeLeft());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return left;
}

const DEMO_KEY = "drini:demo";
const DEMO_EVENT = "drini:demo";

export function getDemo() {
  try { return localStorage.getItem(DEMO_KEY) === "1"; } catch { return false; }
}

export function setDemo(on: boolean) {
  try { localStorage.setItem(DEMO_KEY, on ? "1" : "0"); window.dispatchEvent(new Event(DEMO_EVENT)); } catch { /* ignore */ }
}

export function useDemo() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(getDemo());
    sync();
    window.addEventListener(DEMO_EVENT, sync);
    return () => window.removeEventListener(DEMO_EVENT, sync);
  }, []);
  return on;
}
