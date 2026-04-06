import { useEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════
   PaypalButtons — loads the PayPal SDK once via a
   <script> tag injected by useEffect (never a raw JSX
   script tag), then renders subscription buttons using
   window.paypal.Buttons(). Safe for React/Vite.
══════════════════════════════════════════════════════ */

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: PayPalButtonOptions) => {
        isEligible: () => boolean;
        render: (container: HTMLElement) => Promise<void>;
        close: () => void;
      };
    };
  }
}

interface PayPalButtonOptions {
  style?: Record<string, unknown>;
  createSubscription: (data: unknown, actions: PayPalActions) => Promise<string>;
  onApprove: (data: { subscriptionID?: string }) => void;
  onCancel?: () => void;
  onError?: (err: unknown) => void;
}

interface PayPalActions {
  subscription: {
    create: (opts: { plan_id: string }) => Promise<string>;
  };
}

const CLIENT_ID = "AXpxri0Crt0mUeUyRldDAoarmzRA02CfRUP5VqmctsQ_I5roPHcqGfQovMcUx0VbnOfBV2gL4REsM1Uc";
const SDK_URL = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`;

const PLAN_IDS = {
  pro: "P-375427898Y7862427NHJHTHY",
  premium: "P-00B848669A0462238NHJHVXY",
} as const;

/* Singleton promise so the script is only injected once */
let sdkReady: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (sdkReady) return sdkReady;

  sdkReady = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => { sdkReady = null; reject(); });
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => { sdkReady = null; reject(new Error("SDK load failed")); };
    document.head.appendChild(script);
  });

  return sdkReady;
}

/* ── Props ── */
export interface PaypalButtonsProps {
  plan: "pro" | "premium";
  color?: "gold" | "blue";
  onSuccess: (subscriptionID: string) => void;
  onError?: () => void;
}

export default function PaypalButtons({
  plan,
  color = "gold",
  onSuccess,
  onError,
}: PaypalButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsInstance = useRef<ReturnType<NonNullable<Window["paypal"]>["Buttons"]> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;

    loadSdk()
      .then(() => {
        if (!alive || !containerRef.current || !window.paypal) return;

        /* Tear down any previously rendered instance */
        if (buttonsInstance.current) {
          try { buttonsInstance.current.close(); } catch { /* ignore */ }
          buttonsInstance.current = null;
        }
        containerRef.current.innerHTML = "";

        const buttons = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color,
            shape: "rect",
            label: "subscribe",
            height: 44,
          },
          createSubscription: (_data, actions) =>
            actions.subscription.create({ plan_id: PLAN_IDS[plan] }),
          onApprove: (data) => {
            if (alive && data.subscriptionID) onSuccess(data.subscriptionID);
          },
          onCancel: () => { /* user dismissed — no-op */ },
          onError: () => {
            if (alive) {
              setStatus("error");
              onError?.();
            }
          },
        });

        if (!buttons.isEligible()) {
          if (alive) setStatus("error");
          return;
        }

        buttonsInstance.current = buttons;
        buttons
          .render(containerRef.current!)
          .then(() => { if (alive) setStatus("ready"); })
          .catch(() => { if (alive) setStatus("error"); });
      })
      .catch(() => {
        if (alive) setStatus("error");
      });

    return () => {
      alive = false;
      if (buttonsInstance.current) {
        try { buttonsInstance.current.close(); } catch { /* ignore */ }
        buttonsInstance.current = null;
      }
    };
  }, [plan, color]); /* re-run only if plan or color changes */

  return (
    <div className="w-full min-h-[44px]">
      {status === "loading" && (
        <div className="h-11 rounded-xl bg-gray-200 animate-pulse" />
      )}
      {status === "error" && (
        <p className="text-xs text-red-500 text-center py-3">
          PayPal unavailable — please refresh the page.
        </p>
      )}
      {/* PayPal renders its iframe into this div */}
      <div ref={containerRef} className={status !== "ready" ? "hidden" : ""} />
    </div>
  );
}
