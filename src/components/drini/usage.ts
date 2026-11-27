// Plan usage comes from the server (it cannot be reset in the browser); demo mode stays local.
import { useEffect, useState } from "react";
import { getUsage } from "@/lib/drini.functions";
import type { Plan } from "@/lib/plan-limits";
import { useAccount } from "./auth";

export const FREE_PER_MONTH = 3;
const EVENT = "drini:usage";

export type PlanLeft = { plan: Plan; limit: number; left: number; resetsAt: string };

/** Ask every usage display to fetch fresh numbers (after an arrangement). */
export function refreshUsage() {
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* ignore */ }
}

/** The signed-in user's plan numbers from the server; null when signed out or not loaded. */
export function useFreeLeft(): PlanLeft | null {
  const { user } = useAccount();
  const [usage, setUsage] = useState<PlanLeft | null>(null);
  useEffect(() => {
    if (!user) { setUsage(null); return; }
    let alive = true;
    const sync = () => {
      getUsage()
        .then((u) => { if (alive) setUsage({ plan: u.plan, limit: u.limit, left: u.left, resetsAt: u.resetsAt }); })
        .catch(() => { /* keep the last numbers */ });
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => { alive = false; window.removeEventListener(EVENT, sync); };
  }, [user]);
  return usage;
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
