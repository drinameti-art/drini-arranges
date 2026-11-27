import { createHmac, timingSafeEqual } from "node:crypto";

/** Raw body, multiple h1 values (rotation), and a bounded delivery timestamp. */
export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header || !secret) return false;
  const fields = header.split(";").map((part) => part.trim().split("="));
  const timestamps = fields.filter(([key]) => key === "ts");
  const timestamp = timestamps[0]?.[1];
  if (timestamps.length !== 1 || !timestamp || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}:${rawBody}`).digest();
  return fields.some(([key, value]) => key === "h1" && typeof value === "string" && /^[a-fA-F0-9]{64}$/.test(value) && timingSafeEqual(expected, Buffer.from(value, "hex")));
}