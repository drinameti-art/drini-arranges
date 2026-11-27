import { createFileRoute } from "@tanstack/react-router";
import { paddleEnvironment, PADDLE_EVENTS, subscriptionEventSchema } from "@/lib/paddle-rules";

export const Route = createFileRoute("/api/public/paddle-webhook")({
  server: { handlers: {
    POST: async ({ request }) => {
      const secret = process.env["PADDLE_WEBHOOK_SECRET"];
      if (!secret) return new Response("Webhook unavailable", { status: 503 });
      if (Number(request.headers.get("content-length")) > 262144) return new Response("Payload too large", { status: 413 });
      const reader = request.body?.getReader();
      if (!reader) return new Response("Missing body", { status: 400 });
      const chunks: Uint8Array[] = [];
      let length = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 262144) { await reader.cancel(); return new Response("Payload too large", { status: 413 }); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const rawBody = new TextDecoder().decode(bytes);
      const { verifyPaddleSignature } = await import("@/lib/paddle-signature.server");
      if (!verifyPaddleSignature(rawBody, request.headers.get("Paddle-Signature"), secret)) return new Response("Invalid signature", { status: 401 });
      let input: unknown;
      try { input = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }
      const type = input && typeof input === "object" && "event_type" in input ? input.event_type : null;
      if (!PADDLE_EVENTS.some((event) => event === type)) return new Response("Ignored", { status: 200 });
      const parsed = subscriptionEventSchema.safeParse(input);
      if (!parsed.success) return new Response("Invalid event", { status: 400 });
      try {
        const environment = paddleEnvironment(process.env["PADDLE_ENV"]);
        const { applySubscriptionEvent } = await import("@/lib/paddle.server");
        await applySubscriptionEvent(parsed.data, environment);
        return new Response("OK", { status: 200 });
      } catch { return new Response("Please retry", { status: 503 }); }
    },
  } },
});