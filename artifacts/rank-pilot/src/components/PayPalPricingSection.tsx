import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { CheckCircle2, Zap, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;
const PRO_PLAN_ID = import.meta.env.VITE_PAYPAL_PRO_PLAN_ID as string;
const PREMIUM_PLAN_ID = import.meta.env.VITE_PAYPAL_PREMIUM_PLAN_ID as string;

interface Props {
  isLoggedIn: boolean;
  onSuccess: (plan: "pro" | "premium", credits: number) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  currentPlan?: string;
}

interface PlanButtonProps {
  planId: string;
  planName: "pro" | "premium";
  onSuccess: (plan: "pro" | "premium", credits: number) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  buttonColor?: "gold" | "blue" | "silver" | "white" | "black";
}

function PlanPayPalButton({ planId, planName, onSuccess, authFetch, buttonColor = "gold" }: PlanButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  return (
    <div className="w-full">
      {error && (
        <p className="text-xs text-red-500 text-center mb-2">{error}</p>
      )}
      {processing && (
        <p className="text-xs text-center text-gray-400 mb-2 animate-pulse">Processing your subscription…</p>
      )}
      <PayPalButtons
        style={{ layout: "vertical", color: buttonColor, shape: "rect", label: "subscribe", height: 44 }}
        createSubscription={(_data, actions) => {
          setError(null);
          return actions.subscription.create({ plan_id: planId });
        }}
        onApprove={async (data) => {
          setProcessing(true);
          setError(null);
          try {
            const res = await authFetch("/api/paypal-success", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscriptionID: data.subscriptionID, plan: planName }),
            });
            const result = await res.json();
            if (result.success) {
              onSuccess(planName, result.credits);
            } else {
              setError(result.error ?? "Payment recorded but update failed. Contact support.");
            }
          } catch {
            setError("Network error. Please try again.");
          } finally {
            setProcessing(false);
          }
        }}
        onError={() => {
          setError("PayPal encountered an error. Please try again.");
          setProcessing(false);
        }}
        onCancel={() => {
          setProcessing(false);
        }}
      />
    </div>
  );
}

export default function PayPalPricingSection({ isLoggedIn, onSuccess, authFetch, currentPlan }: Props) {
  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        vault: true,
        intent: "subscription",
      }}
    >
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        {/* Pro */}
        <div className="relative bg-[#4d44e3] rounded-2xl p-7 shadow-xl overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 m-4">
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">Most Popular</span>
          </div>
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Pro</p>
          <div className="mb-1">
            <span className="text-3xl font-extrabold text-white">$12</span>
            <span className="text-sm text-white/60 ml-1">/month</span>
          </div>
          <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-yellow-300">
            <Zap className="w-3 h-3" /> 50 credits / month
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {["50 monthly credits", "Full SEO, AEO, GEO analysis", "Fix Everything (AI rewrite)", "File upload support", "Priority support"].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          {currentPlan === "pro" ? (
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400/20 border border-yellow-400/40 rounded-xl text-yellow-200 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Current Plan
            </div>
          ) : isLoggedIn ? (
            <PlanPayPalButton
              planId={PRO_PLAN_ID}
              planName="pro"
              onSuccess={onSuccess}
              authFetch={authFetch}
              buttonColor="gold"
            />
          ) : (
            <a href="/signup" className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-100 text-[#4d44e3] rounded-xl font-bold text-sm transition-colors shadow-sm">
              <Lock className="w-4 h-4" /> Sign in to Subscribe
            </a>
          )}
        </div>

        {/* Premium */}
        <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Premium</p>
          <div className="mb-1">
            <span className="text-3xl font-extrabold text-gray-900">$39</span>
            <span className="text-sm text-gray-400 ml-1">/month</span>
          </div>
          <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-[#4d44e3]">
            <Zap className="w-3 h-3" /> 150 credits / month
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {["150 monthly credits", "Priority processing", "Advanced insights", "Export features", "Future API access", "Dedicated support"].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          {currentPlan === "premium" ? (
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#4d44e3]/8 border border-[#4d44e3]/20 rounded-xl text-[#4d44e3] text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Current Plan
            </div>
          ) : isLoggedIn ? (
            <PlanPayPalButton
              planId={PREMIUM_PLAN_ID}
              planName="premium"
              onSuccess={onSuccess}
              authFetch={authFetch}
              buttonColor="blue"
            />
          ) : (
            <a href="/signup" className="flex items-center justify-center gap-2 px-4 py-3 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-bold text-sm transition-colors">
              <Lock className="w-4 h-4" /> Sign in to Subscribe
            </a>
          )}
        </div>
      </div>

      {/* Not logged in notice */}
      {!isLoggedIn && (
        <p className="text-center text-xs text-gray-400 mt-4">
          <a href="/signup" className="text-[#4d44e3] font-semibold hover:underline">Create a free account</a> to subscribe — takes 30 seconds.
        </p>
      )}
    </PayPalScriptProvider>
  );
}

export function PaymentSuccessBanner({ plan, credits, onDismiss }: { plan: string; credits: number; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Subscription Successful!</h2>
          <p className="text-gray-500 text-sm mb-1">
            You're now on the <span className="font-bold text-[#4d44e3] capitalize">{plan}</span> plan.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 mb-6 px-5 py-3 bg-[#4d44e3]/8 border border-[#4d44e3]/20 rounded-xl">
            <Sparkles className="w-4 h-4 text-[#4d44e3]" />
            <span className="font-bold text-[#4d44e3] text-lg">{credits} credits</span>
            <span className="text-gray-500 text-sm">added to your account</span>
          </div>
          <button
            onClick={onDismiss}
            className="w-full px-6 py-3 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-bold text-sm transition-colors"
          >
            Start Analyzing
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
