import { useEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════
   PaypalButtons — Self-contained PayPal subscription widget.

   How it works:
   1. Injects the PayPal JS SDK <script> once (singleton guard).
   2. After the script loads, calls window.paypal.Buttons().render()
      pointed at a useRef div so React never touches PayPal's DOM.
   3. Cleans up the button instance on unmount.
   4. Does NOT call isEligible() — that check fails inside Replit's
      iframe preview but buttons work fine in real browsers.
══════════════════════════════════════════════════════════ */

/* ── TypeScript ambient types for window.paypal ── */
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: ButtonConfig) => ButtonInstance;
    };
  }
}

interface ButtonConfig {
  style?: Record<string, unknown>;
  createSubscription: (data: unknown, actions: PayPalActions) => Promise<string>;
  onApprove: (data: { subscriptionID?: string }) => void;
  onCancel?: () => void;
  onError?: (err: unknown) => void;
}

interface PayPalActions {
  subscription: { create: (opts: { plan_id: string }) => Promise<string> };
}

interface ButtonInstance {
  render: (el: HTMLElement) => Promise<void>;
  close: () => void;
}

/* ── Constants ── */
const CLIENT_ID =
  "AXpxri0Crt0mUeUyRldDAoarmzRA02CfRUP5VqmctsQ_I5roPHcqGfQovMcUx0VbnOfBV2gL4REsM1Uc";

const SDK_URL =
  `https://www.paypal.com/sdk/js` +
  `?client-id=${CLIENT_ID}` +
  `&vault=true` +
  `&intent=subscription` +
  `&components=buttons`;

const PLAN_IDS: Record<"pro" | "premium", string> = {
  pro: "P-375427898Y7862427NHJHTHY",
  premium: "P-00B848669A0462238NHJHVXY",
};

/* ── Singleton SDK loader (only one <script> ever injected) ── */
let sdkPromise: Promise<void> | null = null;

function loadPayPalSdk(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    /* If the script tag was somehow already added, wait for it */
    const already = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-sdk="rankora"]'
    );
    if (already) {
      if (window.paypal) { resolve(); return; }
      already.addEventListener("load", () => resolve());
      already.addEventListener("error", () => { sdkPromise = null; reject(); });
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.dataset.paypalSdk = "rankora";   /* marks it as ours */
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("PayPal SDK failed to load"));
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}

/* ── Props ── */
export interface PaypalButtonsProps {
  plan: "pro" | "premium";
  color?: "gold" | "blue" | "silver" | "white" | "black";
  onSuccess: (subscriptionID: string) => void;
}

/* ── Component ── */
export default function PaypalButtons({
  plan,
  color = "gold",
  onSuccess,
}: PaypalButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ButtonInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadPayPalSdk();

        if (!mounted || !containerRef.current) return;
        if (!window.paypal) throw new Error("window.paypal still undefined after load");

        /* Tear down previous render if plan/color changed */
        if (instanceRef.current) {
          try { instanceRef.current.close(); } catch { /* ignore */ }
          instanceRef.current = null;
        }
        containerRef.current.innerHTML = "";

        const buttons = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color,
            shape: "rect",
            height: 44,
          },
          createSubscription: (_data, actions) =>
            actions.subscription.create({ plan_id: PLAN_IDS[plan] }),
          onApprove: (data) => {
            if (mounted && data.subscriptionID) {
              onSuccess(data.subscriptionID);
            }
          },
          onCancel: () => { /* user dismissed PayPal popup — nothing to do */ },
          onError: (err) => {
            console.error("[PaypalButtons] PayPal error:", err);
            if (mounted) setStatus("error");
          },
        });

        instanceRef.current = buttons;

        await buttons.render(containerRef.current!);

        if (mounted) setStatus("ready");
      } catch (err) {
        console.error("[PaypalButtons] init failed:", err);
        if (mounted) setStatus("error");
      }
    }

    init();

    return () => {
      mounted = false;
      if (instanceRef.current) {
        try { instanceRef.current.close(); } catch { /* ignore */ }
        instanceRef.current = null;
      }
    };
  }, [plan, color]);   /* re-run only when plan or color changes */

  return (
    <div className="w-full">
      {/* Skeleton while SDK loads */}
      {status === "loading" && (
        <div className="h-11 rounded-xl bg-gray-200/70 animate-pulse" />
      )}

      {/* Error fallback */}
      {status === "error" && (
        <div className="text-center py-3 px-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 font-medium">
            PayPal could not load. Please refresh the page or try again later.
          </p>
        </div>
      )}

      {/* PayPal renders its button iframe into this div */}
      <div
        ref={containerRef}
        style={{ display: status === "loading" ? "none" : "block" }}
      />
    </div>
  );
}
