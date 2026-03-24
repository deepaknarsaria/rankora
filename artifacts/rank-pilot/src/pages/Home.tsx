import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Zap,
  Copy,
  CheckCircle2,
  Bot,
  ArrowRight,
  Search,
  MessageCircleQuestion,
  Globe,
  Eye,
  Link2,
  HelpCircle,
  FileText,
  Tag,
  ChevronRight,
  XCircle,
  Download,
  TrendingUp,
  Check,
  Star,
  Users,
  Shield,
  BarChart2,
  Menu,
  X,
  Upload,
  Paperclip,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Loading step messages ── */
const ANALYZE_STEPS = [
  "Reading your content...",
  "Checking SEO structure...",
  "Evaluating answer-engine readiness...",
  "Scoring AI visibility...",
  "Identifying opportunities...",
  "Wrapping up the report...",
];
const ANALYZE_URL_STEPS = [
  "Fetching the webpage...",
  "Extracting content & metadata...",
  "Checking SEO structure...",
  "Evaluating answer-engine readiness...",
  "Scoring AI visibility...",
  "Building your report...",
];
const OPTIMIZE_STEPS = [
  "Studying your content...",
  "Crafting an optimized title & meta...",
  "Rewriting with keyword-rich language...",
  "Structuring headings and bullet points...",
  "Writing FAQ answers for featured snippets...",
  "Adding internal linking suggestions...",
  "Finalizing your content...",
];
const FILE_STEPS = [
  "Reading your file...",
  "Extracting text content...",
  "Checking SEO structure...",
  "Evaluating answer-engine readiness...",
  "Scoring AI visibility...",
  "Building your report...",
];

/* ── Animated Loading Panel ── */
function LoadingPanel({ mode, isUrl }: { mode: "analyze" | "optimize" | "file"; isUrl: boolean }) {
  const [stepIdx, setStepIdx] = useState(0);
  const steps =
    mode === "optimize" ? OPTIMIZE_STEPS :
    mode === "file"     ? FILE_STEPS :
    isUrl               ? ANALYZE_URL_STEPS : ANALYZE_STEPS;

  useEffect(() => {
    setStepIdx(0);
    const id = setInterval(() => setStepIdx(prev => Math.min(prev + 1, steps.length - 1)), 3200);
    return () => clearInterval(id);
  }, [mode, isUrl, steps.length]);

  const label =
    mode === "optimize" ? "Optimizing your content..." :
    mode === "file"     ? "Processing your file..." :
    isUrl               ? "Analyzing website..." : "Analyzing content...";

  return (
    <motion.div
      key="loading-panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white border border-gray-200 shadow-sm rounded-2xl p-10 flex flex-col items-center gap-8 text-center"
    >
      <div className="relative flex items-center justify-center w-20 h-20">
        <svg className="w-full h-full animate-spin" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="34" stroke="url(#spin-grad)" strokeWidth="6" fill="none"
            strokeLinecap="round" strokeDasharray="213" strokeDashoffset="160" />
          <defs>
            <linearGradient id="spin-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4d44e3" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {mode === "optimize"
            ? <Zap className="w-7 h-7 text-[#4d44e3]" />
            : <Sparkles className="w-7 h-7 text-[#4d44e3]" />}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xl font-bold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">This usually takes 15–30 seconds</p>
      </div>
      <div className="w-full max-w-sm">
        <div className="relative h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 text-sm text-[#4d44e3] font-medium text-center"
            >
              {steps[stepIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {steps.map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i === stepIdx ? 1.3 : 1, backgroundColor: i <= stepIdx ? "#4d44e3" : "#e5e7eb" }}
              transition={{ duration: 0.25 }}
              className="w-1.5 h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Inline Error Card (unchanged) ── */
function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      key="error-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-2xl p-6"
    >
      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-red-700 mb-1">Something went wrong</p>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
      >
        Try again
      </button>
    </motion.div>
  );
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function Home() {
  const { user, logout, authFetch } = useAuth();
  const [content, setContent] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fileAnalysisError, setFileAnalysisError] = useState<string | null>(null);
  const [isFileAnalyzing, setIsFileAnalyzing] = useState(false);
  const [, navigate] = useLocation();

  /* ── File upload state ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  /* ── Keyword state ── */
  const [targetKeywords, setTargetKeywords] = useState("");

  /* ── Credits & currency ── */
  const [credits, setCredits] = useState<{ remaining: number; total: number }>({ remaining: 5, total: 5 });
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  const { toast } = useToast();
  const inputIsUrl = isUrl(content);

  /* ── Locale detection + initial credits fetch ── */
  useEffect(() => {
    const locale = navigator.language ?? "";
    if (locale.startsWith("en-IN") || locale.startsWith("hi") || locale.startsWith("bn") || locale.startsWith("ta")) {
      setCurrency("INR");
    } else {
      setCurrency("USD");
    }
    authFetch("/api/credits")
      .then(r => r.json())
      .then((d: any) => {
        if (typeof d.creditsRemaining === "number" && typeof d.creditsTotal === "number") {
          setCredits({ remaining: d.creditsRemaining, total: d.creditsTotal });
        }
      })
      .catch(() => {});
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (uploadedFile) setUploadedFile(null);
  };

  /* ── File upload handlers ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setContent("");
    setFileAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── File analysis: call API here, then redirect with result ── */
  const handleAnalyzeFile = async (file: File) => {
    setIsFileAnalyzing(true);
    setFileAnalysisError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (targetKeywords.trim()) formData.append("keywords", targetKeywords.trim());
      const resp = await authFetch("/api/analyze-file", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Failed to analyze file.");
      localStorage.setItem("rankpilot_analysis_input", JSON.stringify({
        type: "precomputed",
        content: data.extractedContent ?? "",
        keywords: targetKeywords.trim(),
        result: data,
      }));
      navigate("/dashboard");
    } catch (err: any) {
      setFileAnalysisError(err.message ?? "An error occurred while analyzing the file.");
      setIsFileAnalyzing(false);
    }
  };

  /* Unified analyze entry point: save to localStorage + redirect */
  const handleAnalyzeClick = () => {
    if (credits.remaining <= 0) return;
    if (uploadedFile) {
      handleAnalyzeFile(uploadedFile);
    } else {
      if (!content.trim()) return;
      localStorage.setItem("rankpilot_analysis_input", JSON.stringify({
        type: "pending",
        content: content.trim(),
        keywords: targetKeywords.trim(),
      }));
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Rankora AI" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-gray-900 text-lg font-display">
              Rankora <span className="text-gradient">AI</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </nav>

          {/* CTA + auth + mobile toggle */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4d44e3]/8 rounded-lg text-xs font-semibold text-[#4d44e3] border border-[#4d44e3]/20">
                  {user.credits} credits
                </span>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a
                  href={`${import.meta.env.BASE_URL}login`}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </a>
                <a
                  href={`${import.meta.env.BASE_URL}signup`}
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Try Free
                </a>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1"
            >
              {["#features", "#how-it-works", "#pricing"].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {["Features", "How it Works", "Pricing"][i]}
                </a>
              ))}
              {user ? (
                <>
                  <button onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }}
                    className="block w-full text-left mt-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                    Dashboard
                  </button>
                  <button onClick={() => { setMobileMenuOpen(false); logout(); navigate("/"); }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-500">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <a href={`${import.meta.env.BASE_URL}login`} onClick={() => setMobileMenuOpen(false)}
                    className="block mt-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 text-center">
                    Sign in
                  </a>
                  <a href={`${import.meta.env.BASE_URL}signup`} onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 bg-[#4d44e3] text-white rounded-xl text-sm font-semibold text-center">
                    Try Free
                  </a>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO + ANALYZER (above the fold) ── */}
      <section id="analyzer" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        {/* Hero text */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4d44e3]/8 border border-[#4d44e3]/20 rounded-full text-xs font-semibold text-[#4d44e3] uppercase tracking-wide">
            <Star className="w-3 h-3" /> SEO · AEO · GEO · AI Visibility
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-gray-900 tracking-tighter leading-[1.1]">
            Your Competitors Are Already Using <span className="text-gradient">AI SEO</span><br className="hidden sm:block" /> Don't Fall Behind.
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Rankora <span className="font-semibold text-gray-700">AI</span> analyzes and optimizes your content for SEO, AEO, GEO, and AI visibility so you rank faster and stay ahead.
          </p>
        </motion.div>

        {/* Credits indicator */}
        <div className="flex items-center justify-end mb-4">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border ${
            credits.remaining === 0
              ? "bg-red-50 border-red-200 text-red-700"
              : credits.remaining <= 2
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${credits.remaining === 0 ? "bg-red-500" : credits.remaining <= 2 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            Credits left: {credits.remaining} / {credits.total}
          </div>
        </div>

        {/* Out-of-credits banner */}
        <AnimatePresence>
          {credits.remaining === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <p className="font-bold text-amber-900 text-sm">You've reached your limit.</p>
                <p className="text-amber-700 text-xs mt-0.5">Upgrade to continue analyzing and optimizing content.</p>
              </div>
              <a
                href="#pricing"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#4d44e3] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#4338ca] transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" /> Upgrade Plan
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
            {/* File chip */}
            {uploadedFile && (
              <div className="mb-3 flex items-center gap-2.5 px-4 py-2.5 bg-[#4d44e3]/8 border border-[#4d44e3]/25 rounded-xl w-fit">
                <Paperclip className="w-4 h-4 text-[#4d44e3]" />
                <span className="text-sm font-medium text-[#4d44e3] max-w-xs truncate">{uploadedFile.name}</span>
                <button
                  onClick={handleRemoveFile}
                  className="ml-1 text-[#4d44e3]/60 hover:text-[#4d44e3] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Keyword input */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#4d44e3]" /> Target Keywords <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={targetKeywords}
                onChange={e => setTargetKeywords(e.target.value)}
                placeholder="e.g. home remodel Hamilton, renovation contractor"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d44e3]/30 focus:border-[#4d44e3]/50 transition-all"
              />
              <p className="text-xs text-gray-400 mt-1.5 pl-1">We'll analyze and optimize your content for these keywords</p>

            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#4d44e3]/30 focus-within:border-[#4d44e3]/50 transition-all">
              <textarea
                value={content}
                onChange={handleContentChange}
                disabled={!!uploadedFile}
                className="w-full h-52 md:h-64 bg-transparent border-0 resize-none p-5 text-base md:text-lg placeholder:text-gray-400 focus:outline-none focus:ring-0 text-gray-900 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder={uploadedFile ? `File ready: ${uploadedFile.name}` : "Paste your content OR a website URL (https://...)..."}
              />
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {/* File upload button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx,.doc"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-[#4d44e3] border border-gray-200 hover:border-[#4d44e3]/40 bg-white rounded-lg transition-all"
                    title="Upload .txt, .pdf, or .docx"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <span className="text-xs text-gray-300">.txt · .pdf · .docx</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-400">
                    {!uploadedFile && content.length > 0 && (
                      inputIsUrl ? (
                        <span className="flex items-center gap-1.5 text-[#4d44e3] font-medium">
                          <span className="w-2 h-2 rounded-full bg-[#4d44e3] animate-pulse" />
                          URL detected
                        </span>
                      ) : (
                        <span>{content.trim().split(/\s+/).length} words</span>
                      )
                    )}
                  </div>
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={(!content.trim() && !uploadedFile) || isFileAnalyzing || credits.remaining <= 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isFileAnalyzing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                        <RefreshCw className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isFileAnalyzing
                      ? "Processing file..."
                      : credits.remaining <= 0
                      ? "No Credits Left"
                      : "Get My SEO Score"}
                  </button>
                </div>
              </div>
            </div>
        </motion.div>

        {/* Microcopy */}
        <p className="text-center text-sm text-gray-400 mt-3">
          Supports URL, text, PDF, DOCX &nbsp;·&nbsp; Get results in 10–15 seconds
        </p>
        <p className="text-center text-xs text-amber-600 font-medium mt-1.5 mb-2 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
          Early users are gaining rankings faster — don't miss out.
        </p>

        {/* File loading */}
        <AnimatePresence mode="wait">
          {isFileAnalyzing && <LoadingPanel key="file-loading" mode="file" isUrl={false} />}
        </AnimatePresence>

        {/* File error */}
        <AnimatePresence>
          {fileAnalysisError && !isFileAnalyzing && (
            <ErrorCard
              key="file-error"
              message={fileAnalysisError}
              onRetry={() => { setFileAnalysisError(null); if (uploadedFile) handleAnalyzeFile(uploadedFile); }}
            />
          )}
        </AnimatePresence>

      </section>

      {/* ── TRUST / SOCIAL PROOF ── */}
      <section className="border-y border-gray-200 bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Trusted by marketers and founders</p>
            <p className="text-sm text-gray-500">Used by 100+ marketers, founders, and content teams worldwide</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: "This tool made SEO insanely simple. Got results in minutes and knew exactly what to fix.",
                name: "Priya Mehta",
                role: "Content Strategist, SaaS startup",
                initial: "P",
                color: "bg-violet-100 text-violet-700",
              },
              {
                quote: "I replaced three separate tools with Rankora AI. The AI Visibility score alone is worth it.",
                name: "Rahul Desai",
                role: "Indie Hacker & Blogger",
                initial: "R",
                color: "bg-blue-100 text-blue-700",
              },
              {
                quote: "Our organic traffic doubled after using the Fix Everything feature. Unbelievable ROI.",
                name: "Anika Torres",
                role: "Head of Growth, eCommerce",
                initial: "A",
                color: "bg-teal-100 text-teal-700",
              },
            ].map(({ quote, name, role, initial, color }) => (
              <div key={name} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">"{quote}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${color}`}>
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Category row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { label: "Growth Teams", icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { label: "Content Agencies", icon: <FileText className="w-3.5 h-3.5" /> },
              { label: "SaaS Founders", icon: <Sparkles className="w-3.5 h-3.5" /> },
              { label: "SEO Experts", icon: <Search className="w-3.5 h-3.5" /> },
              { label: "E-commerce Brands", icon: <BarChart2 className="w-3.5 h-3.5" /> },
              { label: "Indie Hackers", icon: <Users className="w-3.5 h-3.5" /> },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                <span className="text-gray-300">{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW — "See what you get" ── */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-widest">Live Example</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              See what you get
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Here's a real sample output from a blog post analysis — scores, issues, and an actionable fix in seconds.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Scores row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
              {[
                { label: "SEO Score", score: 78, color: "text-violet-600", bg: "bg-violet-50", bar: "bg-violet-500" },
                { label: "AEO Score", score: 70, color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-500" },
                { label: "GEO Score", score: 72, color: "text-teal-600", bg: "bg-teal-50", bar: "bg-teal-500" },
                { label: "AI Visibility", score: 65, color: "text-indigo-600", bg: "bg-indigo-50", bar: "bg-indigo-500" },
              ].map(({ label, score, color, bg, bar }) => (
                <div key={label} className={`flex flex-col items-center py-8 px-4 ${bg}`}>
                  <p className={`text-4xl font-extrabold font-display ${color}`}>{score}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1 mb-3">{label}</p>
                  <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Sample suggestions */}
            <div className="p-6 sm:p-8 space-y-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Sample Issues &amp; Suggestions</p>
              {[
                {
                  type: "issue",
                  label: "High",
                  labelClass: "bg-red-100 text-red-700 border-red-200",
                  dotClass: "bg-red-500",
                  title: "Missing FAQ section",
                  desc: "No FAQ section detected. Adding one significantly improves featured snippet chances on Google.",
                },
                {
                  type: "opportunity",
                  label: "High",
                  labelClass: "bg-violet-100 text-violet-700 border-violet-200",
                  dotClass: "bg-violet-500",
                  title: "Add structured data (FAQ schema)",
                  desc: 'Mark up FAQ content with JSON-LD schema to appear in AI Overviews and voice search results.',
                },
                {
                  type: "opportunity",
                  label: "Medium",
                  labelClass: "bg-blue-100 text-blue-700 border-blue-200",
                  dotClass: "bg-amber-500",
                  title: "Improve meta description length",
                  desc: "Meta description is 48 chars — aim for 120–155 chars with a clear value proposition and CTA.",
                },
              ].map(({ label, labelClass, dotClass, title, desc }, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{title}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${labelClass}`}>{label}</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}

              {/* Fix Everything CTA teaser */}
              <div className="mt-6 flex items-center justify-between bg-[#4d44e3]/6 border border-[#4d44e3]/20 rounded-xl px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">Fix Everything — AI Rewrite</p>
                  <p className="text-xs text-gray-500 mt-0.5">Click to get fully optimized content, FAQs, meta tags &amp; more.</p>
                </div>
                <a href="#analyzer" className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#4d44e3] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#4338ca] transition-colors">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" /> Try it free
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="bg-white border-t border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-widest">Features</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              One tool. Every score that matters.
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Stop juggling separate tools. Rankora AI covers every channel in a single analysis.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Search className="w-6 h-6 text-violet-600" />,
                bg: "bg-violet-50 border-violet-200",
                iconBg: "bg-violet-100",
                title: "SEO Optimization",
                desc: "Improve rankings on Google with keyword structure, meta tags, and content depth analysis.",
              },
              {
                icon: <MessageCircleQuestion className="w-6 h-6 text-blue-600" />,
                bg: "bg-blue-50 border-blue-200",
                iconBg: "bg-blue-100",
                title: "AEO Optimization",
                desc: "Get featured in answer engines like Bing AI and Google's AI Overviews.",
              },
              {
                icon: <Globe className="w-6 h-6 text-teal-600" />,
                bg: "bg-teal-50 border-teal-200",
                iconBg: "bg-teal-100",
                title: "GEO Optimization",
                desc: "Optimize for AI platforms like ChatGPT, Perplexity, and Claude that cite sources.",
              },
              {
                icon: <Eye className="w-6 h-6 text-indigo-600" />,
                bg: "bg-indigo-50 border-indigo-200",
                iconBg: "bg-indigo-100",
                title: "AI Visibility Score",
                desc: "Know if AI will pick your content when users ask questions in your niche.",
              },
            ].map(({ icon, bg, iconBg, title, desc }) => (
              <div key={title} className={`bg-white border rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 ${bg}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-widest">How it Works</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              From paste to publish in 3 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line on desktop */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#4d44e3]/20 via-[#4d44e3]/40 to-[#4d44e3]/20" />
            {[
              {
                step: "01",
                icon: <FileText className="w-7 h-7 text-[#4d44e3]" />,
                title: "Paste Content or URL",
                desc: "Drop in your article, blog post, product page, or just a website URL. We handle the rest.",
              },
              {
                step: "02",
                icon: <BarChart2 className="w-7 h-7 text-blue-600" />,
                title: "Get SEO + AI Scores",
                desc: "Receive four instant scores — SEO, AEO, GEO, and AI Visibility — with detailed issues and opportunities.",
              },
              {
                step: "03",
                icon: <Zap className="w-7 h-7 text-teal-600" />,
                title: "Fix Everything Instantly",
                desc: 'Click "Fix Everything" and get fully rewritten, AI-optimized content ready to copy and publish.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex items-center justify-center w-20 h-20 bg-white border-2 border-gray-200 rounded-2xl shadow-sm mb-5">
                  {icon}
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#4d44e3] text-white text-[10px] font-extrabold flex items-center justify-center">
                    {step.replace("0", "")}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY RANKPILOT AI ── */}
      <section className="bg-white border-t border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-widest">Why Rankora AI?</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Stop using five tools.<br />Use one.
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Most teams cobble together separate tools for SEO, answer engines, and AI optimization. Rankora AI gives you every signal in a single, actionable report.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: <Shield className="w-4 h-4 text-[#4d44e3]" />, text: "One tool instead of many — Ahrefs, Surfer, Clearscope, and more, combined." },
                  { icon: <TrendingUp className="w-4 h-4 text-[#4d44e3]" />, text: "SEO + AEO + GEO combined — the only tool that covers all four modern signals." },
                  { icon: <Lightbulb className="w-4 h-4 text-[#4d44e3]" />, text: "Simple and actionable — no dashboards to learn, no jargon. Just clear fixes." },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-[#4d44e3]/10 border border-[#4d44e3]/20 flex items-center justify-center">
                      {icon}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "4×", label: "More AI visibility", color: "text-[#4d44e3]" },
                { value: "30s", label: "Average analysis time", color: "text-teal-600" },
                { value: "100%", label: "AI-generated fixes", color: "text-blue-600" },
                { value: "Free", label: "To get started", color: "text-emerald-600" },
              ].map(({ value, label, color }) => (
                <div key={label} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                  <p className={`text-4xl font-extrabold ${color} font-display`}>{value}</p>
                  <p className="mt-1 text-xs text-gray-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-widest">Pricing</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-3 text-gray-500">Start free. Upgrade as you grow.</p>

            {/* Credit info note */}
            <div className="mt-4 inline-flex items-center gap-4 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-5 py-2">
              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#4d44e3]" /> 1 analysis = 1 credit</span>
              <span className="w-px h-3 bg-gray-200" />
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#4d44e3]" /> 1 optimization = 3 credits</span>
            </div>

            {/* Currency toggle */}
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full p-1">
                <button
                  onClick={() => setCurrency("INR")}
                  className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    currency === "INR"
                      ? "bg-[#4d44e3] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ₹ INR
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    currency === "USD"
                      ? "bg-[#4d44e3] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  $ USD
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Free</p>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-gray-900 font-display">
                  {currency === "INR" ? "₹0" : "$0"}
                </span>
                <span className="text-sm text-gray-400 ml-1">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">Forever free, no credit card needed</p>
              <div className="flex items-center gap-1.5 mb-6 text-xs font-semibold text-[#4d44e3]">
                <Zap className="w-3 h-3" /> 5 credits / month
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "5 monthly credits",
                  "SEO, AEO, GEO & AI Visibility scores",
                  "Issues & opportunities report",
                  "Basic analysis",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
                {[
                  "Fix Everything (AI rewrite)",
                  "File upload",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-400 line-through">
                    <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#analyzer"
                className="block text-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-colors">
                Get Started Free
              </a>
            </div>

            {/* Pro — highlighted */}
            <div className="relative bg-[#4d44e3] rounded-2xl p-8 shadow-xl overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 m-4">
                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">Most Popular</span>
              </div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Pro</p>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-white font-display">
                  {currency === "INR" ? "₹999" : "$12"}
                </span>
                <span className="text-sm text-white/60 ml-1">/month</span>
              </div>
              <p className="text-sm text-white/60 mb-1">Everything you need to dominate search</p>
              <div className="flex items-center gap-1.5 mb-6 text-xs font-semibold text-yellow-300">
                <Zap className="w-3 h-3" /> 50 credits / month
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "50 monthly credits",
                  "Full SEO, AEO, GEO analysis",
                  "Fix Everything (AI rewrite)",
                  "File upload (.txt, .pdf, .docx)",
                  "Faster processing",
                  "Priority support",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
                    <Check className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#analyzer"
                className="block text-center px-6 py-3 bg-white hover:bg-gray-100 text-[#4d44e3] rounded-xl font-bold text-sm transition-colors shadow-sm">
                Start Pro Trial
              </a>
            </div>

            {/* Premium */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Premium</p>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-gray-900 font-display">
                  {currency === "INR" ? "₹2,999" : "$39"}
                </span>
                <span className="text-sm text-gray-400 ml-1">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">For power users and agencies</p>
              <div className="flex items-center gap-1.5 mb-6 text-xs font-semibold text-[#4d44e3]">
                <Zap className="w-3 h-3" /> 150 credits / month
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "150 monthly credits",
                  "Priority processing",
                  "Advanced insights",
                  "Export features",
                  "Future API access",
                  "Dedicated support",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#analyzer"
                className="block text-center px-6 py-3 bg-[#4d44e3]/8 hover:bg-[#4d44e3]/15 text-[#4d44e3] border border-[#4d44e3]/20 rounded-xl font-bold text-sm transition-colors">
                Get Premium
              </a>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            * Prices may vary based on your region. Credits reset monthly.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Rankora AI" className="w-7 h-7 rounded-lg" />
                <span className="font-bold text-gray-900 font-display">
                  Rankora <span className="text-gradient">AI</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                AI-powered SEO optimization platform
              </p>
            </div>
            {/* Links */}
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Product</p>
                <ul className="space-y-2">
                  {[["#features", "Features"], ["#how-it-works", "How it Works"], ["#pricing", "Pricing"], ["#analyzer", "Try Free"]].map(([href, label]) => (
                    <li key={href}><a href={href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{label}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Company</p>
                <ul className="space-y-2">
                  {[["#", "About"], ["#", "Blog"], ["#", "Contact"]].map(([href, label]) => (
                    <li key={label}><a href={href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{label}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">© 2026 Rankora AI. All rights reserved.</p>
            <div className="flex items-center gap-5 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Twitter / X</a>
              <a href="#" className="hover:text-gray-700 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
