import { createHmac } from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { verifyPaddleSignature } from "./paddle-signature.server";
import { PAID_PLANS, subscriptionPlan, subscriptionEventSchema, planForPrice, loginDestination, paddleEnvironment } from "./paddle-rules";
import { applySubscriptionEvent, ensureCatalog } from "./paddle.server";

const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: mock }));
const fixtureKey = "public-test-fixture-not-a-real-credential";
const now = Date.parse("2026-11-27T16:00:00Z");
const body = '{"event_type":"subscription.updated"}';
const timestamp = String(now / 1000);
const signed = (text = body, ts = timestamp) => `ts=${ts};h1=${createHmac("sha256", fixtureKey).update(`${ts}:${text}`).digest("hex")}`;

describe("Paddle signature verification", () => {
  it("accepts HMAC-SHA256 of ts:rawBody", () => expect(verifyPaddleSignature(body, signed(), fixtureKey, now)).toBe(true));
  it("rejects a modified raw body", () => expect(verifyPaddleSignature(`${body} `, signed(), fixtureKey, now)).toBe(false));
  it("rejects a wrong signing key", () => expect(verifyPaddleSignature(body, signed(), "different-public-test-fixture", now)).toBe(false));
  it("rejects missing or malformed signatures", () => {
    expect(verifyPaddleSignature(body, null, fixtureKey, now)).toBe(false);
    expect(verifyPaddleSignature(body, `ts=${timestamp};h1=invalid`, fixtureKey, now)).toBe(false);
    expect(verifyPaddleSignature(body, `${signed()};ts=${timestamp}`, fixtureKey, now)).toBe(false);
  });
  it("rejects replay timestamps older than the tolerance", () => expect(verifyPaddleSignature(body, signed(body, String(now / 1000 - 301)), fixtureKey, now)).toBe(false));
  it("rejects future timestamps outside the tolerance", () => expect(verifyPaddleSignature(body, signed(body, String(now / 1000 + 301)), fixtureKey, now)).toBe(false));
  it("accepts any valid h1 when Paddle rotates signatures", () => expect(verifyPaddleSignature(body, `${signed()};h1=${"0".repeat(64)}`, fixtureKey, now)).toBe(true));
});

const priceId = `pri_${"a".repeat(26)}`;
const event = subscriptionEventSchema.parse({
  event_id: `evt_${"a".repeat(26)}`, event_type: "subscription.updated", occurred_at: "2026-11-27T16:00:00Z",
  data: { id: `sub_${"a".repeat(26)}`, customer_id: `ctm_${"a".repeat(26)}`, status: "active", next_billed_at: "2026-12-04T16:00:00Z", custom_data: { user_id: "11111111-1111-4111-8111-111111111111" }, items: [{ price: { id: priceId } }] },
});

describe("subscription to plan mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.from.mockReturnValue({ select: () => ({ eq: async () => ({ data: [{ plan: "pro", price_id: priceId }], error: null }) }) });
    mock.rpc.mockResolvedValue({ data: "applied", error: null });
  });
  it.each(["active", "trialing", "past_due"] as const)("retains Pro during %s", (status) => expect(subscriptionPlan(status, "pro")).toBe("pro"));
  it("maps active Studio to studio", () => expect(subscriptionPlan("active", "studio")).toBe("studio"));
  it.each(["canceled", "paused"] as const)("reverts %s to free", (status) => expect(subscriptionPlan(status, "studio")).toBe("free"));
  it("looks up the plan by stored price id and rejects unknown prices", () => {
    expect(planForPrice(priceId, [{ price_id: priceId, plan: "studio" }])).toBe("studio");
    expect(() => planForPrice("unknown", [{ price_id: priceId, plan: "pro" }])).toThrow("Unrecognized");
  });
  it("passes authenticated customer matching, plan and renewal to atomic processing", async () => {
    await applySubscriptionEvent(event, "production");
    expect(mock.rpc).toHaveBeenCalledWith("apply_paddle_billing", { p_payload: {
      event_id: event.event_id, occurred_at: event.occurred_at, user_id: event.data.custom_data.user_id,
      environment: "production", customer_id: event.data.customer_id, subscription_id: event.data.id,
      plan: "pro", status: "active", next_billed_at: "2026-12-04T16:00:00Z",
    } });
  });
  it("applies effective cancellation with a null renewal", async () => {
    await applySubscriptionEvent({ ...event, data: { ...event.data, status: "canceled", next_billed_at: null } }, "production");
    expect(mock.rpc).toHaveBeenCalledWith("apply_paddle_billing", { p_payload: expect.objectContaining({ plan: "free", next_billed_at: null }) });
  });
  it("does not apply unrecognized catalog items", async () => {
    mock.from.mockReturnValue({ select: () => ({ eq: async () => ({ data: [], error: null }) }) });
    await expect(applySubscriptionEvent(event, "production")).rejects.toThrow("Unrecognized");
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it("rejects an event without a valid account id", () => {
    expect(subscriptionEventSchema.safeParse({ ...event, data: { ...event.data, custom_data: { user_id: "not-an-account" } } }).success).toBe(false);
  });
});

describe("catalog and navigation rules", () => {
  it("Pro costs EUR 29.99 every single week", () => expect(PAID_PLANS.pro).toEqual({ name: "DriniArranges Pro", amount: "2999", interval: "week" }));
  it("Studio costs EUR 59.99 every single month", () => expect(PAID_PLANS.studio).toEqual({ name: "DriniArranges Studio", amount: "5999", interval: "month" }));
  it("keeps production and sandbox explicit", () => {
    expect(paddleEnvironment("production")).toBe("production");
    expect(paddleEnvironment("sandbox")).toBe("sandbox");
    expect(() => paddleEnvironment(undefined)).toThrow();
  });
  it("returns pricing checkouts to pricing and refuses external redirects", () => {
    expect(loginDestination("/pricing")).toBe("/pricing");
    expect(loginDestination("/studio")).toBe("/studio");
    expect(loginDestination("https://external.example")).toBe("/scores");
  });
  it("reuses persisted catalog ids without making any API call", async () => {
    mock.from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { price_id: priceId }, error: null }) }) }) }) });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    try {
      expect(await ensureCatalog({ environment: "production", apiKey: fixtureKey }, "pro")).toBe(priceId);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { fetchMock.mockRestore(); }
  });
  it("reuses matching Paddle products and prices after interrupted setup", async () => {
    const chain = {
      select: () => chain, eq: () => chain, update: () => chain,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: { price_id: priceId }, error: null }),
    };
    mock.from.mockReturnValue(chain); mock.rpc.mockResolvedValue({ data: true, error: null });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      return new Response(JSON.stringify({ data: path.includes("/products?") ? [{ id: "pro_existing", name: "DriniArranges Pro" }] : [{ id: priceId, name: "DriniArranges Pro", unit_price: { amount: "2999", currency_code: "EUR" }, billing_cycle: { interval: "week", frequency: 1 }, tax_mode: "account_setting", custom_data: { plan: "pro" } }] }), { status: 200 });
    });
    try {
      expect(await ensureCatalog({ environment: "production", apiKey: fixtureKey }, "pro")).toBe(priceId);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
    } finally { fetchMock.mockRestore(); }
  });
  it("creates the exact weekly EUR price when no catalog exists", async () => {
    const chain = {
      select: () => chain, eq: () => chain, update: () => chain,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: { price_id: priceId }, error: null }),
    };
    mock.from.mockReturnValue(chain); mock.rpc.mockResolvedValue({ data: true, error: null });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      const data = init?.method === "GET" ? [] : path.endsWith("/products") ? { id: "pro_created", name: "DriniArranges Pro" } : { id: priceId };
      return new Response(JSON.stringify({ data }), { status: 200 });
    });
    try {
      expect(await ensureCatalog({ environment: "production", apiKey: fixtureKey }, "pro")).toBe(priceId);
      const priceCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/prices") && init?.method === "POST");
      expect(priceCall).toBeDefined();
      expect(JSON.parse(String(priceCall?.[1]?.body))).toMatchObject({ unit_price: { amount: "2999", currency_code: "EUR" }, billing_cycle: { interval: "week", frequency: 1 }, tax_mode: "account_setting", custom_data: { plan: "pro" } });
    } finally { fetchMock.mockRestore(); }
  });
  it("does not create duplicate products when another request holds the setup lease", async () => {
    mock.from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) });
    mock.rpc.mockResolvedValue({ data: false, error: null });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    try {
      await expect(ensureCatalog({ environment: "production", apiKey: fixtureKey }, "pro")).rejects.toThrow("busy");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { fetchMock.mockRestore(); }
  });
});