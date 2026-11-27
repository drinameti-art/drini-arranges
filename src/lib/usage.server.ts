import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { computeUsage, periodStart, toPlan, type Usage } from "./plan-limits";

/** The signed-in user's plan and usage, read with their own (RLS-scoped) client. */
export async function fetchUsage(supabase: SupabaseClient<Database>, userId: string, now = new Date()): Promise<Usage> {
  const { data: profile, error } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if (error) throw new Error("Could not read your plan");
  const plan = toPlan(profile?.plan);
  const { data: rows, error: e2 } = await supabase
    .from("arrangement_usage")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", periodStart(plan, now).toISOString())
    .order("created_at", { ascending: true })
    .limit(200);
  if (e2) throw new Error("Could not read your usage");
  return computeUsage(plan, (rows ?? []).map((r) => new Date(r.created_at)), now);
}

/** Count one new arrangement (service role: users cannot insert usage rows). */
export async function recordUsage(userId: string, scoreId?: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("arrangement_usage").insert({ user_id: userId, score_id: scoreId ?? null });
  if (error) console.error("[usage] insert failed", error.message);
}
