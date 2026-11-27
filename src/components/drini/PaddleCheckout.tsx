import { useRef, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Paddle, PaddleEventData } from "@paddle/paddle-js";
import { Button } from "@/components/ui/button";
import { beginPaddleCheckout } from "@/lib/paddle.functions";
import { getUsage } from "@/lib/drini.functions";
import type { PaidPlan } from "@/lib/paddle-rules";
import { useLang, tr } from "@/lib/i18n";
import { useAccount } from "./auth";
import { refreshUsage, useFreeLeft } from "./usage";

// Initialize once per page, and load the browser-only SDK only on a user gesture.
let paddlePromise: Promise<Paddle | undefined> | undefined;
const checkoutListeners = new Set<(event: PaddleEventData) => void>();
async function checkoutPaddle(token: string, environment: "production" | "sandbox") {
  if (!paddlePromise) {
    paddlePromise = import("@paddle/paddle-js").then(({ initializePaddle }) => initializePaddle({
      token, environment, eventCallback: (event) => { for (const listener of checkoutListeners) listener(event); },
    })).catch((error: unknown) => { paddlePromise = undefined; throw error; });
  }
  return paddlePromise;
}

export function PaddleCheckoutButton({ plan, className }: { plan: PaidPlan; className?: string }) {
  const { t } = useLang();
  const { user, ready } = useAccount();
  const usage = useFreeLeft();
  const navigate = useNavigate();
  const begin = useServerFn(beginPaddleCheckout);
  const readUsage = useServerFn(getUsage);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const transactionId = useRef<string | null>(null);
  const polling = useRef(false);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onEvent = (event: PaddleEventData) => {
      if (event.data?.transaction_id !== transactionId.current) return;
      if (event.name === "checkout.closed") { if (alive) setBusy(false); return; }
      if (event.name === "checkout.error" || event.name === "checkout.payment.failed") {
        toast.error(tr("pay.error")); if (alive) setBusy(false); return;
      }
      if (event.name !== "checkout.completed" || polling.current) return;
      polling.current = true;
      setBusy(false); setConfirming(true);
      toast.success(tr("pay.success"));
      refreshUsage(); void queryClient.invalidateQueries();
      let attempts = 0;
      const sync = async () => {
        if (!alive) return;
        try {
          const current = await readUsage();
          refreshUsage();
          if (current.plan === plan) { setConfirming(false); toast.success(tr("pay.active")); return; }
        } catch { /* webhook may still be arriving */ }
        if (++attempts < 15) timer = setTimeout(() => void sync(), 2000);
        else if (alive) { setConfirming(false); toast.info(tr("pay.pending")); }
      };
      void sync();
    };
    checkoutListeners.add(onEvent);
    return () => { alive = false; clearTimeout(timer); checkoutListeners.delete(onEvent); };
  }, [plan, queryClient, readUsage]);
  const paid = usage?.plan === "pro" || usage?.plan === "studio";
  async function open() {
    if (!user) {
      try { sessionStorage.setItem("drini:after-login", "/pricing"); } catch { /* use query parameter */ }
      await navigate({ to: "/login", search: { redirect: "/pricing" } });
      return;
    }
    if (busy || confirming) return;
    setBusy(true); polling.current = false;
    try {
      const result = await begin({ data: { plan } });
      if (!result.ok) { toast.error(t(result.reason === "unconfigured" ? "pay.unconfigured" : "pay.error")); setBusy(false); return; }
      const paddle = await checkoutPaddle(result.clientToken, result.environment);
      if (!paddle) throw new Error("Checkout unavailable");
      transactionId.current = result.transactionId;
      paddle.Checkout.open({ transactionId: result.transactionId, customer: { email: result.email }, customData: { user_id: result.userId }, settings: { displayMode: "overlay", allowLogout: false } });
    } catch { toast.error(t("pay.error")); setBusy(false); }
  }
  return <Button variant="ghost" className={className ?? "btn btn-primary mt-6 w-full"} disabled={!ready || busy || confirming || paid} onClick={() => void open()}>
    {t(busy ? "pay.opening" : confirming ? "pay.confirming" : usage?.plan === plan ? "pr.current" : paid ? "pay.usePortal" : "pay.subscribe", { plan: t(plan === "pro" ? "plan.pro" : "plan.studio") })}
  </Button>;
}