import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

/* ══════════════════════════════════════════════════════════
   PaypalButtons — Self-contained PayPal subscription widget.

   Iframe detection:
   PayPal's checkout popup is blocked by browsers when launched
   from inside a sandboxed iframe (e.g. Replit's preview pane).
   If we detect we're inside an iframe we render a fallback link
   that opens the page in a real browser tab so PayPal can work.
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
  subscription: {
    create: (opts: {
      plan_id: string;
      application_context?: {
        shipping_preference?: string;
        user_action?: string;
      };
    }) => Promise<string>;
  };
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
  pro: "P-2CX02696AA6399419NHJWIPA",
  premium: "P-8ME89068SD671434GNHJWJLA",
};

/* ── Returns true when running inside any iframe ── */
function isInsideIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin parent — definitely an iframe
  }
}

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
      existing.addEventListener("error", () => {
        sdkPromise = null;
        reject(new Error("Script error"));
      });
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
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  /* Detect iframe once on mount */
  const inIframe = isInsideIframe();

  useEffect(() => {
    /* If inside an iframe, skip SDK loading entirely — PayPal can't work here */
    if (inIframe) {
      setStatus("ready"); // skip skeleton, show the fallback link below
      return;
    }

    let mounted = true;

    async function init() {
      try {
        await loadPayPalSdk();
        if (!mounted || !containerRef.current) return;
        if (!window.paypal) throw new Error("window.paypal missing after SDK load");

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
            actions.subscription.create({
              plan_id: PLAN_IDS[plan],
              application_context: {
                shipping_preference: "NO_SHIPPING",
                user_action: "SUBSCRIBE_NOW",
              },
            }),
          onApprove: (data) => {
            if (mounted && data.subscriptionID) {
              onSuccess(data.subscriptionID);
            }
          },
          onCancel: () => { /* user closed popup — no action */ },
          onError: (err) => {
            /* Fires when the checkout popup fails (invalid plan, sandbox mismatch, etc.) */
            console.error("[PaypalButtons] PayPal checkout error:", err);
            const msg = typeof err === "string"
              ? err
              : (err as { message?: string })?.message ?? JSON.stringify(err);
            if (mounted) setCheckoutError(msg);
          },
        });

        instanceRef.current = buttons;
        await buttons.render(containerRef.current!);
        if (mounted) setStatus("ready");
      } catch (err) {
        console.error("[PaypalButtons] render failed:", err);
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
  }, [plan, color, inIframe]);

  /* ── Iframe fallback: redirect to standalone page ── */
  if (inIframe) {
    const href = `${window.location.origin}${window.location.pathname}#pricing`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-xl font-semibold text-sm transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open to Subscribe with PayPal
      </a>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Loading skeleton */}
      {status === "loading" && (
        <div className="h-11 rounded-xl bg-gray-200/70 animate-pulse" />
      )}

      {/* Only shown when render() itself threw */}
      {status === "error" && (
        <div className="text-center py-3 px-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 font-medium">
            PayPal could not load. Please refresh the page or try again later.
          </p>
        </div>
      )}

      {/* Checkout-level error: shown when popup closes with an error (bad plan ID, etc.) */}
      {checkoutError && (
        <div className="py-2 px-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 font-semibold mb-1">PayPal checkout failed</p>
          <p className="text-xs text-amber-600 break-all">{checkoutError}</p>
          <p className="text-xs text-amber-500 mt-1">
            Check that your Plan IDs are active in the correct PayPal environment (sandbox vs live).
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ display: status === "loading" ? "none" : "block" }}
      />
    </div>
  );
}
