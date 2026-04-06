import { useEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════
   PaypalButtons — Self-contained PayPal subscription widget.

   Design decisions:
   - SDK is injected once (singleton guard on sdkPromise).
   - Buttons are rendered into a stable useRef div.
   - onError from PayPal only logs — it does NOT set error
     state because PayPal fires onError for non-fatal events
     (e.g. secondary funding source load failures, popup
     dismissals, etc.) while the primary button still works.
   - Only a thrown render() call shows the error UI.
══════════════════════════════════════════════════════════ */

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

/* ── Singleton SDK loader ── */
let sdkPromise: Promise<void> | null = null;

function loadPayPalSdk(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-sdk="rankora"]'
    );
    if (existing) {
      if (window.paypal) { resolve(); return; }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => { sdkPromise = null; reject(new Error("Script error")); });
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.dataset.paypalSdk = "rankora";
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

  /* "loading" → SDK not yet ready; "ready" → buttons rendered; "error" → render() threw */
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadPayPalSdk();
        if (!mounted || !containerRef.current) return;

        if (!window.paypal) throw new Error("window.paypal missing after SDK load");

        /* Tear down previous instance if props changed */
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
          onCancel: () => {
            /* user closed PayPal popup — no action needed */
          },
          onError: (err) => {
            /*
             * PayPal calls onError for many non-fatal reasons:
             *   - a secondary funding source (Venmo, etc.) fails
             *   - popup blocked by browser
             *   - network hiccup during checkout
             *
             * We intentionally do NOT change the UI here.
             * The primary PayPal button will still work for the user.
             * Only log so we can debug if needed.
             */
            console.warn("[PaypalButtons] PayPal reported an error (non-fatal):", err);
          },
        });

        instanceRef.current = buttons;

        /* render() is the only call that can actually fail to show buttons */
        await buttons.render(containerRef.current!);

        if (mounted) setStatus("ready");
      } catch (err) {
        console.error("[PaypalButtons] Failed to render PayPal buttons:", err);
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
  }, [plan, color]);

  return (
    <div className="w-full">
      {/* Loading skeleton */}
      {status === "loading" && (
        <div className="h-11 rounded-xl bg-gray-200/70 animate-pulse" />
      )}

      {/* Only shown when render() itself threw — not when onError fires */}
      {status === "error" && (
        <div className="text-center py-3 px-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 font-medium">
            PayPal could not load. Please refresh the page or try again later.
          </p>
        </div>
      )}

      {/*
        Container is hidden while loading, shown once render() resolves.
        It is NEVER hidden by the error state — if render() throws we never
        reach setStatus("ready") so the container stays hidden anyway.
      */}
      <div
        ref={containerRef}
        style={{ display: status === "loading" ? "none" : "block" }}
      />
    </div>
  );
}
