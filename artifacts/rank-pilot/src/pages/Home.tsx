import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useAnalyzeContent, useOptimizeContent } from "@workspace/api-client-react";
import type { ContentSection, FaqItem, Issue, Opportunity } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ScoreRing } from "@/components/ScoreRing";

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
  const [content, setContent] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── File upload state ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isFileAnalyzing, setIsFileAnalyzing] = useState(false);
  const [fileAnalysisError, setFileAnalysisError] = useState<string | null>(null);
  const [fileAnalysisData, setFileAnalysisData] = useState<{
    seoScore: number; aeoScore: number; geoScore: number; aiVisibilityScore: number;
    issues: Issue[]; opportunities: Opportunity[];
  } | null>(null);

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
    fetch("/api/credits")
      .then(r => r.json())
      .then((d: any) => {
        if (typeof d.creditsRemaining === "number" && typeof d.creditsTotal === "number") {
          setCredits({ remaining: d.creditsRemaining, total: d.creditsTotal });
        }
      })
      .catch(() => {});
  }, []);

  const analyzeMutation = useAnalyzeContent({
    mutation: {
      onSuccess: (data: any) => {
        setHasAnalyzed(true);
        setAnalyzeError(null);
        if (typeof data?.creditsRemaining === "number") {
          setCredits({ remaining: data.creditsRemaining, total: data.creditsTotal ?? 5 });
        }
        toast({ title: "Analysis complete!", description: "Your content has been fully scored." });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || "An error occurred during analysis.";
        if (err?.response?.data?.creditsRemaining === 0) {
          setCredits({ remaining: 0, total: err?.response?.data?.creditsTotal ?? 5 });
        }
        setAnalyzeError(msg);
      },
    },
  });

  const optimizeMutation = useOptimizeContent({
    mutation: {
      onSuccess: () => setOptimizeError(null),
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || "An error occurred during optimization.";
        if (err?.response?.data?.creditsRemaining !== undefined) {
          setCredits({ remaining: err?.response?.data?.creditsRemaining, total: err?.response?.data?.creditsTotal ?? 5 });
        }
        setOptimizeError(msg);
      },
    },
  });

  const handleAnalyze = () => {
    if (!content.trim()) return;
    optimizeMutation.reset();
    setAnalyzeError(null);
    setOptimizeError(null);
    analyzeMutation.mutate({ data: { content } });
  };

  const handleOptimize = () => {
    if (!content.trim()) return;
    setOptimizeError(null);
    optimizeMutation.mutate({ data: { content } });
  };

  const handleCopy = () => {
    const raw = optimizeMutation.data?.rawContent ?? "";
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Optimized content copied to clipboard." });
  };

  const handleDownload = () => {
    const data = optimizeMutation.data;
    if (!data) return;
    const blob = new Blob([data.rawContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    a.href = url;
    a.download = `${slug || "optimized-content"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Your optimized content has been saved as a .txt file." });
  };

  const handleReanalyze = () => {
    const raw = optimizeMutation.data?.rawContent ?? "";
    setContent(raw);
    setHasAnalyzed(false);
    optimizeMutation.reset();
    setTimeout(() => analyzeMutation.mutate({ data: { content: raw } }), 100);
  };

  const handleStartOver = () => {
    setContent("");
    setHasAnalyzed(false);
    setUploadedFile(null);
    setFileAnalysisData(null);
    setFileAnalysisError(null);
    analyzeMutation.reset();
    optimizeMutation.reset();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (hasAnalyzed) {
      setHasAnalyzed(false);
      analyzeMutation.reset();
      setFileAnalysisData(null);
    }
    if (uploadedFile) {
      setUploadedFile(null);
    }
  };

  /* ── File upload handlers ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setContent("");
    setHasAnalyzed(false);
    setFileAnalysisData(null);
    setFileAnalysisError(null);
    analyzeMutation.reset();
    optimizeMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileAnalysisData(null);
    setFileAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyzeFile = async (file: File) => {
    setIsFileAnalyzing(true);
    setFileAnalysisError(null);
    setFileAnalysisData(null);
    setAnalyzeError(null);
    optimizeMutation.reset();

    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/analyze-file", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) {
        if (data.creditsRemaining !== undefined) {
          setCredits({ remaining: data.creditsRemaining, total: data.creditsTotal ?? 5 });
        }
        throw new Error(data.error ?? "Failed to analyze file.");
      }
      if (typeof data.creditsRemaining === "number") {
        setCredits({ remaining: data.creditsRemaining, total: data.creditsTotal ?? 5 });
      }
      setFileAnalysisData(data);
      if (data.extractedContent) setContent(data.extractedContent);
      setHasAnalyzed(true);
      toast({ title: "Analysis complete!", description: "Your file has been fully scored." });
    } catch (err: any) {
      setFileAnalysisError(err.message ?? "An error occurred while analyzing the file.");
    } finally {
      setIsFileAnalyzing(false);
    }
  };

  /* Unified analyze entry point */
  const handleAnalyzeClick = () => {
    if (credits.remaining <= 0) return;
    if (uploadedFile) {
      handleAnalyzeFile(uploadedFile);
    } else {
      handleAnalyze();
    }
  };

  const analysisData = fileAnalysisData ?? analyzeMutation.data ?? null;

  const showOptimized = !!optimizeMutation.data;
  const showResults = hasAnalyzed && analysisData && !showOptimized;

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="RankPilot AI" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-gray-900 text-lg font-display">
              Rank<span className="text-gradient">Pilot</span> AI
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#analyzer"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Try Free
            </a>
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
              <a href="#analyzer" onClick={() => setMobileMenuOpen(false)}
                className="block mt-2 px-3 py-2.5 bg-[#4d44e3] text-white rounded-xl text-sm font-semibold text-center">
                Try Free
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4d44e3]/8 border border-[#4d44e3]/20 rounded-full text-xs font-semibold text-[#4d44e3] uppercase tracking-wide">
            <Star className="w-3 h-3" /> SEO · AEO · GEO · AI Visibility
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tighter leading-[1.05]">
            Rank<span className="text-gradient">Pilot</span> AI
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Paste content or a URL. Get AI-powered SEO, AEO, GEO, and AI Visibility scores — then fix everything automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="#analyzer"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 text-yellow-300" /> Analyze Content Free
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-base border border-gray-200 shadow-sm transition-all duration-200"
            >
              See how it works <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section className="border-y border-gray-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-7">
            Trusted by marketers and founders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { label: "Growth Teams", icon: <TrendingUp className="w-4 h-4" /> },
              { label: "Content Agencies", icon: <FileText className="w-4 h-4" /> },
              { label: "SaaS Founders", icon: <Sparkles className="w-4 h-4" /> },
              { label: "SEO Experts", icon: <Search className="w-4 h-4" /> },
              { label: "E-commerce Brands", icon: <BarChart2 className="w-4 h-4" /> },
              { label: "Indie Hackers", icon: <Users className="w-4 h-4" /> },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-2 text-gray-400 font-semibold text-sm">
                <span className="text-gray-300">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANALYZER TOOL ── */}
      <section id="analyzer" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Credits indicator */}
        {!showOptimized && (
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
        )}

        {/* Out-of-credits banner */}
        <AnimatePresence>
          {credits.remaining === 0 && !showOptimized && !showResults && (
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
        {!showOptimized && (
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
                    disabled={(!content.trim() && !uploadedFile) || analyzeMutation.isPending || isFileAnalyzing || credits.remaining <= 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {(analyzeMutation.isPending || isFileAnalyzing) ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                        <RefreshCw className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {analyzeMutation.isPending || isFileAnalyzing
                      ? (uploadedFile ? "Processing file..." : inputIsUrl ? "Analyzing website..." : "Analyzing...")
                      : credits.remaining <= 0
                      ? "No Credits Left"
                      : "Analyze Content"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        <AnimatePresence mode="wait">
          {isFileAnalyzing && <LoadingPanel key="file-loading" mode="file" isUrl={false} />}
          {analyzeMutation.isPending && <LoadingPanel key="analyze-loading" mode="analyze" isUrl={inputIsUrl} />}
          {optimizeMutation.isPending && <LoadingPanel key="optimize-loading" mode="optimize" isUrl={inputIsUrl} />}
        </AnimatePresence>

        {/* Errors */}
        <AnimatePresence>
          {(analyzeError || fileAnalysisError) && !analyzeMutation.isPending && !isFileAnalyzing && (
            <ErrorCard
              key="analyze-error"
              message={analyzeError ?? fileAnalysisError ?? ""}
              onRetry={() => { setAnalyzeError(null); setFileAnalysisError(null); handleAnalyzeClick(); }}
            />
          )}
          {optimizeError && !optimizeMutation.isPending && (
            <ErrorCard key="optimize-error" message={optimizeError} onRetry={() => { setOptimizeError(null); handleOptimize(); }} />
          )}
        </AnimatePresence>

        {/* Analysis Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-8"
            >
              {/* Summary bar */}
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Analysis Complete</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />High</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />Low</span>
                </div>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreRing score={analysisData!.seoScore} label="SEO Score" colorClass="stroke-violet-500" glowColor="" icon={<Search className="w-4 h-4" />} description="Search engine ranking potential" />
                <ScoreRing score={analysisData!.aeoScore} label="AEO Score" colorClass="stroke-blue-500" glowColor="" icon={<MessageCircleQuestion className="w-4 h-4" />} description="Answer engine readiness" />
                <ScoreRing score={analysisData!.geoScore} label="GEO Score" colorClass="stroke-teal-500" glowColor="" icon={<Globe className="w-4 h-4" />} description="Generative engine optimization" />
                <ScoreRing score={analysisData!.aiVisibilityScore} label="AI Visibility" colorClass="stroke-indigo-500" glowColor="" icon={<Eye className="w-4 h-4" />} description="Overall AI discovery score" />
              </div>

              {/* Issues */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 border border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-none">Issues Found</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Problems that need your attention</p>
                  </div>
                  <span className="ml-auto flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                    {(analysisData!.issues ?? []).length}
                  </span>
                </div>

                {(analysisData!.issues ?? []).length > 0 ? (
                  <div className="space-y-3">
                    {(analysisData!.issues ?? []).map((issue: Issue, i: number) => {
                      const priorityBadge: Record<string, string> = {
                        High:   "bg-red-100 text-red-700 border-red-200",
                        Medium: "bg-amber-100 text-amber-700 border-amber-200",
                        Low:    "bg-gray-100 text-gray-600 border-gray-200",
                      };
                      const dotColor: Record<string, string> = {
                        High: "bg-red-500", Medium: "bg-amber-500", Low: "bg-gray-400",
                      };
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="bg-red-50 border border-red-100 rounded-xl p-4 hover:border-red-200 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor[issue.priority] ?? dotColor.Medium}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold text-gray-900 text-sm">{issue.title}</h4>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityBadge[issue.priority] ?? priorityBadge.Medium}`}>
                                  {issue.priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                            </div>
                          </div>
                          <div className="mt-3 ml-5 flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-red-100">
                            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#4d44e3]" />
                            <span className="text-xs text-gray-600">
                              <span className="text-[#4d44e3] font-semibold">Impact: </span>{issue.impact}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                    <p className="font-medium">No issues found! Your content is in great shape.</p>
                  </div>
                )}
              </div>

              {/* Opportunities */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-200">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-none">Opportunities</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Actionable wins to boost your scores</p>
                  </div>
                  <span className="ml-auto flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                    {(analysisData!.opportunities ?? []).length}
                  </span>
                </div>

                {(analysisData!.opportunities ?? []).length > 0 ? (
                  <div className="space-y-4">
                    {(analysisData!.opportunities ?? []).map((opp: Opportunity, i: number) => {
                      const priorityBadge: Record<string, string> = {
                        High:   "bg-violet-100 text-violet-700 border-violet-200",
                        Medium: "bg-blue-100 text-blue-700 border-blue-200",
                        Low:    "bg-gray-100 text-gray-600 border-gray-200",
                      };
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{opp.title}</h4>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityBadge[opp.priority] ?? priorityBadge.Medium}`}>
                              {opp.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">{opp.description}</p>
                          {opp.example && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-3">
                              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">Example</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{opp.example}</p>
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                            <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-teal-600" />
                            <span><span className="text-teal-700 font-semibold">Expected impact: </span>{opp.impact}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <p className="italic">No further opportunities. Your content looks fully optimized.</p>
                  </div>
                )}
              </div>

              {/* Fix Everything CTA */}
              <div className="flex justify-center pb-4">
                <button
                  onClick={handleOptimize}
                  disabled={optimizeMutation.isPending}
                  className="flex items-center gap-3 px-10 py-4 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {optimizeMutation.isPending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Zap className="w-5 h-5 text-yellow-300" />
                  )}
                  {optimizeMutation.isPending
                    ? (inputIsUrl ? "Fetching & optimizing..." : "Optimizing Content...")
                    : "Fix Everything Automatically"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optimized Content Display */}
        <AnimatePresence>
          {showOptimized && optimizeMutation.data && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-5"
            >
              {/* Toolbar */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4d44e3]/10 border border-[#4d44e3]/20">
                    <Sparkles className="w-4 h-4 text-[#4d44e3]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Optimized Content Ready</p>
                    <p className="text-xs text-gray-500">SEO · AEO · GEO optimized — ready to publish</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4d44e3]/10 hover:bg-[#4d44e3]/15 text-[#4d44e3] text-sm font-semibold transition-colors border border-[#4d44e3]/20">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold transition-colors border border-teal-200">
                    <Download className="w-4 h-4" /> Download .txt
                  </button>
                  <button onClick={handleReanalyze}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors border border-gray-200">
                    <RefreshCw className="w-4 h-4" /> Re-analyze
                  </button>
                  <button onClick={handleStartOver}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-semibold transition-colors border border-gray-200">
                    Start Over
                  </button>
                </div>
              </div>

              {/* Document card */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4d44e3] via-blue-500 to-teal-500" />
                <div className="p-8 md:p-12 space-y-10">
                  {/* Title + Meta */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4d44e3]/70 uppercase tracking-widest">
                      <Tag className="w-3.5 h-3.5" /> Optimized Title
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                      {optimizeMutation.data.title}
                    </h1>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                        <Search className="w-3.5 h-3.5" /> Meta Description
                        <span className="ml-auto font-normal text-blue-400 normal-case tracking-normal">
                          {optimizeMutation.data.metaDescription.length} / 160 chars
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{optimizeMutation.data.metaDescription}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Introduction */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <FileText className="w-3.5 h-3.5" /> Introduction
                    </div>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed">{optimizeMutation.data.introduction}</p>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Content Sections */}
                  {optimizeMutation.data.sections.length > 0 && (
                    <div className="space-y-8">
                      {optimizeMutation.data.sections.map((section: ContentSection, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="space-y-3">
                          {section.level <= 2 ? (
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                              <span className="w-1 h-6 rounded-full bg-[#4d44e3] flex-shrink-0" />
                              {section.heading}
                            </h2>
                          ) : (
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-[#4d44e3] flex-shrink-0" />
                              {section.heading}
                            </h3>
                          )}
                          {section.content && <p className="text-base text-gray-600 leading-relaxed pl-3">{section.content}</p>}
                          {section.bullets.length > 0 && (
                            <ul className="space-y-2 pl-3">
                              {section.bullets.map((bullet: string, bi: number) => (
                                <li key={bi} className="flex items-start gap-2.5 text-sm text-gray-600">
                                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#4d44e3] flex-shrink-0" />
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-100" />

                  {/* FAQ */}
                  {optimizeMutation.data.faq.length > 0 && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
                      </div>
                      <div className="space-y-3">
                        {optimizeMutation.data.faq.map((item: FaqItem, i: number) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                            <p className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                              <span className="text-[#4d44e3] font-black text-base leading-tight">Q</span>
                              {item.question}
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed pl-5">{item.answer}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internal Links */}
                  {optimizeMutation.data.internalLinks.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Link2 className="w-3.5 h-3.5" /> Internal Linking Suggestions
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-2">
                        {optimizeMutation.data.internalLinks.map((link: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <Link2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-teal-600" />
                            {link}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100" />

                  {/* Conclusion */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conclusion
                    </div>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed">{optimizeMutation.data.conclusion}</p>
                  </div>
                </div>
              </div>

              {/* Bottom export bar */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-4">
                <button onClick={handleCopy}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5" /> Copied to Clipboard!
                      </motion.span>
                    ) : (
                      <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2.5">
                        <Copy className="w-5 h-5" /> Copy Full Content
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button onClick={handleDownload}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-bold text-base shadow-sm hover:shadow-md border border-gray-200 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                  <Download className="w-5 h-5 text-teal-600" />
                  Download as .txt
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              Stop juggling separate tools. RankPilot AI covers every channel in a single analysis.
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
              <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-widest">Why RankPilot AI?</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Stop using five tools.<br />Use one.
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Most teams cobble together separate tools for SEO, answer engines, and AI optimization. RankPilot AI gives you every signal in a single, actionable report.
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
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-gray-500">Credit-based. Pay for what you use. Upgrade anytime.</p>

            {/* Credit info note */}
            <div className="mt-4 inline-flex items-center gap-4 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-5 py-2">
              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#4d44e3]" /> 1 analysis = 1 credit</span>
              <span className="w-px h-3 bg-gray-200" />
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#4d44e3]" /> 1 optimization = 2 credits</span>
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
                <Zap className="w-3 h-3" /> 100 credits / month
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "100 monthly credits",
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
                <Zap className="w-3 h-3" /> 300 credits / month
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "300 monthly credits",
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
                <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="RankPilot AI" className="w-7 h-7 rounded-lg" />
                <span className="font-bold text-gray-900 font-display">
                  Rank<span className="text-gradient">Pilot</span> AI
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                AI-powered content optimization for SEO, answer engines, and generative AI platforms.
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
            <p className="text-xs text-gray-400">© 2025 RankPilot AI. All rights reserved.</p>
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
