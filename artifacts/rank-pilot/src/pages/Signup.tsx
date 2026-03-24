import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PERKS = [
  "5 free analyses included",
  "SEO, AEO, GEO & AI Visibility scores",
  "Actionable issues & opportunities",
  "AI-powered content optimizer",
];

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(email.trim(), password);
      toast({ title: "Account created!", description: "Welcome to RankPilot AI. You have 5 free credits to get started." });
      const hasAnalysis = !!localStorage.getItem("rankpilot_analysis_input");
      navigate(hasAnalysis ? "/dashboard" : "/");
    } catch (err: any) {
      setError(err.message ?? "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4 py-10">
      {/* Header logo */}
      <a href={import.meta.env.BASE_URL || "/"} className="flex items-center gap-2.5 mb-10">
        <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="RankPilot AI" className="w-9 h-9 rounded-xl" />
        <span className="font-bold text-gray-900 text-xl font-display">
          Rank<span className="text-gradient">Pilot</span> AI
        </span>
      </a>

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-start justify-center">
        {/* Left: perks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden md:flex flex-col gap-6 w-72 pt-6"
        >
          <div>
            <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-widest">Start for free</span>
            <h2 className="text-2xl font-bold text-gray-900 font-display mt-2 leading-tight">
              The AI-powered SEO platform you've been waiting for
            </h2>
          </div>
          <ul className="space-y-3">
            {PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-[#4d44e3] shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
          <div className="p-4 bg-[#4d44e3]/5 border border-[#4d44e3]/20 rounded-xl">
            <p className="text-xs text-gray-600 leading-relaxed">
              No credit card required. Start analyzing your content in seconds.
            </p>
          </div>
        </motion.div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white border border-gray-200 shadow-sm rounded-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#4d44e3]/10 rounded-xl mb-4">
              <Sparkles className="w-6 h-6 text-[#4d44e3]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Join thousands of content creators</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d44e3]/30 focus:border-[#4d44e3] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-gray-400 font-normal">(min. 6 characters)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d44e3]/30 focus:border-[#4d44e3] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mobile perks */}
            <div className="md:hidden space-y-1.5 py-1">
              {PERKS.map(perk => (
                <div key={perk} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4d44e3] shrink-0" />
                  {perk}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4d44e3] hover:bg-[#4338ca] disabled:opacity-60 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 mt-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create free account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <a href={`${import.meta.env.BASE_URL}login`} className="font-semibold text-[#4d44e3] hover:underline">
              Sign in
            </a>
          </p>
        </motion.div>
      </div>

      <p className="mt-8 text-xs text-gray-400">© 2025 RankPilot AI. All rights reserved.</p>
    </div>
  );
}
