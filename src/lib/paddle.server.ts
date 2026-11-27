import { z } from "zod";
import { PAID_PLANS, planForPrice, subscriptionPlan, type PaidPlan, type PaddleEnvironment, type SubscriptionEvent } from "./paddle-rules";

const entitySchema = z.object({ id: z.string(), name: z.string().nullish(), email: z.string().nullish(), status: z.string().optional(), custom_data: z.record(z.string(), z.unknown()).nullish(),
  billing_cycle: z.object({ interval: z.string(), frequency: z.number() }).nullish(),
  unit_price: z.object({ amount: z.string(), currency_code: z.string() }).optional(), product_id: z.string().optional(), tax_mode: z.string().optional(),
});
type Entity = z.infer<typeof entitySchema>;
export type PaddleConfig = { apiKey: string; environment: PaddleEnvironment };

export async function paddleRequest(config: PaddleConfig, path: string, method = "GET", body?: unknown): Promise<unknown> {
  const base = config.environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
  const response = await fetch(`${base}${path}`, {
    method, headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Paddle-Version": "1" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), redirect: "manual", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Paddle request failed"); // Never expose provider bodies/credentials.
  return response.json();
}
async function entity(config: PaddleConfig, path: string, method = "GET", body?: unknown) {
  return z.object({ data: entitySchema }).parse(await paddleRequest(config, path, method, body)).data;
}
async function list(config: PaddleConfig, path: string): Promise<Entity[]> {
  const results: Entity[] = [];
  let next: string | null = path;
  for (let page = 0; next && page < 100; page++) {
    const response = z.object({
      data: z.array(entitySchema), meta: z.object({ pagination: z.object({ has_more: z.boolean(), next: z.string().nullable() }).optional() }).optional(),
    }).parse(await paddleRequest(config, next));
    results.push(...response.data);
    const pagination = response.meta?.pagination;
    if (pagination?.has_more && pagination.next) {
      const url = new URL(pagination.next);
      const expected = config.environment === "sandbox" ? "sandbox-api.paddle.com" : "api.paddle.com";
      if (url.hostname !== expected || url.protocol !== "https:") throw new Error("Invalid Paddle pagination");
      next = `${url.pathname}${url.search}`;
    } else next = null;
  }
  if (next) throw new Error("Catalog exceeds pagination limit");
  return results;
}

/** Serialized first-use setup with persisted IDs; retry reuses Paddle products/prices after partial failures. */
export async function ensureCatalog(config: PaddleConfig, plan: PaidPlan): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cached, error } = await supabaseAdmin.from("paddle_catalog").select("price_id").eq("environment", config.environment).eq("plan", plan).maybeSingle();
  if (error) throw new Error("Could not read catalog");
  if (cached?.price_id) return cached.price_id;
  const token = crypto.randomUUID();
  const { data: claimed, error: claimError } = await supabaseAdmin.rpc("claim_paddle_catalog", { p_environment: config.environment, p_plan: plan, p_token: token });
  if (claimError || !claimed) throw new Error("Catalog setup is busy; try again shortly");
  const spec = PAID_PLANS[plan];
  try {
    const products = await list(config, "/products?status=active&per_page=200");
    let product = products.find((p) => p.name === spec.name || (p.custom_data?.["app"] === "DriniArranges" && p.custom_data["plan"] === plan));
    if (!product) product = await entity(config, "/products", "POST", { name: spec.name, description: "AI sheet-music arranging subscription", tax_category: "saas", custom_data: { app: "DriniArranges", plan } });
    const prices = await list(config, `/prices?product_id=${encodeURIComponent(product.id)}&status=active&per_page=200`);
    let price = prices.find((p) => p.unit_price?.amount === spec.amount && p.unit_price.currency_code === "EUR" && p.billing_cycle?.interval === spec.interval && p.billing_cycle.frequency === 1 && p.tax_mode === "account_setting" && (p.name === spec.name || p.custom_data?.["plan"] === plan));
    if (!price) price = await entity(config, "/prices", "POST", {
      product_id: product.id, name: spec.name, description: `${spec.name} — every ${spec.interval}`,
      unit_price: { amount: spec.amount, currency_code: "EUR" }, billing_cycle: { interval: spec.interval, frequency: 1 },
      tax_mode: "account_setting", quantity: { minimum: 1, maximum: 1 }, custom_data: { plan },
    });
    const { data, error: saveError } = await supabaseAdmin.from("paddle_catalog").update({ product_id: product.id, price_id: price.id, lease_until: null }).eq("environment", config.environment).eq("plan", plan).eq("lease_token", token).select("price_id").single();
    if (saveError || !data.price_id) throw new Error("Could not save catalog");
    return data.price_id;
  } catch (error) {
    await supabaseAdmin.from("paddle_catalog").update({ lease_until: null }).eq("environment", config.environment).eq("plan", plan).eq("lease_token", token);
    throw error;
  }
}

export async function createCheckout(config: PaddleConfig, userId: string, email: string, plan: PaidPlan) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile, error } = await supabaseAdmin.from("profiles").select("plan,paddle_customer_id,paddle_environment").eq("id", userId).single();
  if (error) throw new Error("Could not read account");
  if (profile.plan !== "free") throw new Error("Use the customer portal for an existing subscription");
  // Both catalog products are prepared on first checkout, not on page load.
  const pro = await ensureCatalog(config, "pro");
  const studio = await ensureCatalog(config, "studio");
  let customerId = profile.paddle_environment === config.environment ? profile.paddle_customer_id : null;
  if (!customerId) {
    const customers = await list(config, `/customers?email=${encodeURIComponent(email)}&status=active&per_page=200`);
    const customer = customers.find((entry) => entry.email?.toLowerCase() === email.toLowerCase()) ?? await entity(config, "/customers", "POST", { email, custom_data: { user_id: userId } });
    customerId = customer.id;
    const { error: saveError } = await supabaseAdmin.from("profiles").update({ paddle_customer_id: customerId, paddle_environment: config.environment }).eq("id", userId);
    if (saveError) throw new Error("Could not link billing account");
  }
  // Prepare the transaction on the server so browser-provided user IDs cannot grant somebody else's plan.
  const transaction = await entity(config, "/transactions", "POST", {
    items: [{ price_id: plan === "pro" ? pro : studio, quantity: 1 }], customer_id: customerId,
    collection_mode: "automatic", custom_data: { user_id: userId },
  });
  return transaction.id;
}

export async function applySubscriptionEvent(event: SubscriptionEvent, environment: PaddleEnvironment) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: catalog, error } = await supabaseAdmin.from("paddle_catalog").select("price_id,plan").eq("environment", environment);
  if (error) throw new Error("Could not read catalog");
  const plans = event.data.items.map((item) => planForPrice(item.price.id, catalog ?? []));
  const paidPlan = plans[0];
  if (!paidPlan || plans.some((plan) => plan !== paidPlan)) throw new Error("Unexpected subscription items");
  const { data, error: applyError } = await supabaseAdmin.rpc("apply_paddle_billing", { p_payload: {
    event_id: event.event_id, occurred_at: event.occurred_at, user_id: event.data.custom_data.user_id,
    environment, customer_id: event.data.customer_id, subscription_id: event.data.id,
    plan: subscriptionPlan(event.data.status, paidPlan), status: event.data.status, next_billed_at: event.data.next_billed_at,
  } });
  if (applyError) throw new Error("Could not apply subscription event");
  return data;
}

export async function customerPortal(config: PaddleConfig, customerId: string, subscriptionId: string | null) {
  const result = z.object({ data: z.object({ urls: z.object({ general: z.object({ overview: z.string().url() }) }) }) }).parse(
    await paddleRequest(config, `/customers/${encodeURIComponent(customerId)}/portal-sessions`, "POST", { subscription_ids: subscriptionId ? [subscriptionId] : [] }),
  );
  const url = new URL(result.data.urls.general.overview);
  if (url.protocol !== "https:" || !(url.hostname === "paddle.com" || url.hostname.endsWith(".paddle.com"))) throw new Error("Invalid portal URL");
  return url.href;
}