import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Sparkles, RefreshCw, AlertTriangle, Lightbulb, Zap, Copy, CheckCircle2,
  Bot, ArrowRight, Search, MessageCircleQuestion, Globe, Eye, Link2, HelpCircle,
  FileText, Tag, XCircle, Download, TrendingUp, Check, BarChart2, Menu, X,
  Home, ChevronRight, Plus, Target, Layers, Wand2, LogOut, User,
} from "lucide-react";
import { useAnalyzeContent, useOptimizeContent } from "@workspace/api-client-react";
import type { Issue, Opportunity, KeywordAnalysisItem, DetectedKeywords, ContentSection, FaqItem } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ScoreRing } from "@/components/ScoreRing";
import { useAuth } from "@/contexts/AuthContext";

/* ── Stored input schema ── */
interface StoredInput {
  type: "pending" | "precomputed";
  content: string;
  keywords: string;
  result?: AnalysisResult;
}

interface AnalysisResult {
  seoScore: number; aeoScore: number; geoScore: number; aiVisibilityScore: number;
  detectedKeywords?: DetectedKeywords;
  keywordAnalysis?: KeywordAnalysisItem[];
  suggestedKeywords?: string[];
  issues: Issue[];
  opportunities: Opportunity[];
  creditsRemaining?: number; creditsTotal?: number;
}

/* ── Animated count-up hook ── */
function useCountUp(target: number, enabled: boolean, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    setValue(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, enabled, duration]);
  return value;
}

/* ── Score card ── */
function ScoreCard({ score, label, icon, colorClass, strokeColor, description, enabled }: {
  score: number; label: string; icon: React.ReactNode; colorClass: string;
  strokeColor: string; description: string; enabled: boolean;
}) {
  const displayed = useCountUp(score, enabled);
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-500";
  const barColor = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-400" : "bg-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm cursor-default group transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${colorClass} text-white shadow-sm`}>
          {icon}
        </div>
        <span className={`text-3xl font-extrabold tabular-nums ${scoreColor}`}>{displayed}</span>
      </div>
      <p className="text-sm font-bold text-gray-900 mb-0.5">{label}</p>
      <p className="text-xs text-gray-400 mb-4">{description}</p>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: enabled ? `${score}%` : "0%" }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ── Loading panel ── */
const LOAD_STEPS = [
  "Reading your content...", "Checking SEO structure...",
  "Evaluating answer-engine readiness...", "Detecting keywords...",
  "Scoring AI visibility...", "Wrapping up the report...",
];
function DashboardLoading() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full animate-spin" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="34" stroke="url(#dash-grad)" strokeWidth="6" fill="none"
            strokeLinecap="round" strokeDasharray="213" strokeDashoffset="160" />
          <defs>
            <linearGradient id="dash-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4d44e3" /><stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-[#4d44e3]" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-bold text-gray-900">Analyzing your content...</p>
        <motion.p key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-gray-500">
          {LOAD_STEPS[step]}
        </motion.p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_STEPS.map((_, i) => (
          <motion.span key={i}
            animate={{ scale: i === step ? 1.4 : 1, backgroundColor: i <= step ? "#4d44e3" : "#e5e7eb" }}
            className="w-1.5 h-1.5 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/* ── Optimize loading ── */
const OPT_STEPS = [
  "Studying your content...", "Crafting optimized title & meta...",
  "Weaving in your keywords naturally...", "Structuring headings & bullets...",
  "Writing snippet-ready FAQ answers...", "Finalizing your content...",
];
function OptimizeLoading({ keywords }: { keywords: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(p => Math.min(p + 1, OPT_STEPS.length - 1)), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center py-12 gap-6">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
        <Wand2 className="w-8 h-8 text-[#4d44e3]" />
      </motion.div>
      <div className="text-center space-y-1">
        <p className="font-bold text-gray-900">Optimizing content{keywords ? ` for "${keywords.split(",")[0].trim()}..."` : "..."}</p>
        <motion.p key={step} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-gray-500">
          {OPT_STEPS[step]}
        </motion.p>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "overview",      label: "Overview",     icon: <BarChart2 className="w-4 h-4" /> },
  { id: "keywords",      label: "Keywords",     icon: <Tag className="w-4 h-4" /> },
  { id: "issues",        label: "Issues",       icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "opportunities", label: "Opportunities",icon: <Lightbulb className="w-4 h-4" /> },
  { id: "optimize",      label: "Optimize",     icon: <Zap className="w-4 h-4" /> },
];

/* ══════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════ */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout, authFetch } = useAuth();

  /* ── Stored data ── */
  const [storedInput, setStoredInput] = useState<StoredInput | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [initialScores, setInitialScores] = useState<{ seo: number; aeo: number; geo: number; ai: number } | null>(null);
  const [content, setContent] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [credits, setCredits] = useState({ remaining: 5, total: 5 });
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Keyword selection ── */
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState("");

  /* ── Copy state ── */
  const [copied, setCopied] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [scoresEnabled, setScoresEnabled] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* ── Read localStorage on mount ── */
  useEffect(() => {
    const raw = localStorage.getItem("rankpilot_analysis_input");
    if (!raw) return;
    try {
      const parsed: StoredInput = JSON.parse(raw);
      setStoredInput(parsed);
      setTargetKeywords(parsed.keywords ?? "");
      setContent(parsed.content ?? "");
      if (parsed.type === "precomputed" && parsed.result) {
        setAnalysisData(parsed.result);
        setInitialScores({ seo: parsed.result.seoScore, aeo: parsed.result.aeoScore, geo: parsed.result.geoScore, ai: parsed.result.aiVisibilityScore });
        if (parsed.result.creditsRemaining !== undefined) {
          setCredits({ remaining: parsed.result.creditsRemaining, total: parsed.result.creditsTotal ?? 5 });
        }
        setTimeout(() => setScoresEnabled(true), 200);
      }
    } catch {
      /* ignore malformed data */
    }
  }, []);

  /* ── Fetch initial credits (auth-aware) ── */
  useEffect(() => {
    authFetch("/api/credits").then(r => r.json()).then((d: any) => {
      if (typeof d.creditsRemaining === "number") {
        setCredits({ remaining: d.creditsRemaining, total: d.creditsTotal ?? 5 });
      }
    }).catch(() => {});
  }, []);

  /* ── Analyze mutation (for text/URL) ── */
  const analyzeMutation = useAnalyzeContent({
    mutation: {
      onSuccess: (data: any) => {
        setAnalysisData(data);
        setInitialScores({ seo: data.seoScore, aeo: data.aeoScore, geo: data.geoScore, ai: data.aiVisibilityScore });
        setAnalyzeError(null);
        if (typeof data?.creditsRemaining === "number") {
          setCredits({ remaining: data.creditsRemaining, total: data.creditsTotal ?? 5 });
        }
        /* Persist result so returning to the page doesn't re-trigger analysis */
        try {
          const existing = JSON.parse(localStorage.getItem("rankpilot_analysis_input") ?? "{}");
          localStorage.setItem("rankpilot_analysis_input", JSON.stringify({
            ...existing,
            type: "precomputed",
            result: data,
          }));
        } catch { /* ignore */ }
        setTimeout(() => setScoresEnabled(true), 200);
        toast({ title: "Analysis complete!", description: "Your content has been fully scored." });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || "Analysis failed.";
        if (err?.response?.data?.creditsRemaining === 0) {
          setCredits({ remaining: 0, total: err?.response?.data?.creditsTotal ?? 5 });
        }
        setAnalyzeError(msg);
      },
    },
  });

  /* ── Trigger analysis for text/URL once stored input is ready ── */
  useEffect(() => {
    if (!storedInput || storedInput.type !== "pending" || !storedInput.content) return;
    analyzeMutation.mutate({ data: { content: storedInput.content, keywords: storedInput.keywords || undefined } });
  }, [storedInput]);

  /* ── Optimize mutation ── */
  const optimizeMutation = useOptimizeContent({
    mutation: {
      onSuccess: () => {
        setOptimizeError(null);
        toast({ title: "Content optimized!", description: "Your AI-optimized content is ready." });
        setTimeout(() => {
          sectionRefs.current["optimize-output"]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || "Optimization failed.";
        if (err?.response?.data?.creditsRemaining !== undefined) {
          setCredits({ remaining: err?.response?.data?.creditsRemaining, total: err?.response?.data?.creditsTotal ?? 5 });
        }
        setOptimizeError(msg);
      },
    },
  });

  /* ── Keyword helpers ── */
  const toggleKeyword = (kw: string) =>
    setSelectedKeywords(prev => prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]);

  const addCustomKeyword = () => {
    const kw = customKeyword.trim();
    if (!kw) return;
    if (!selectedKeywords.includes(kw)) setSelectedKeywords(prev => [...prev, kw]);
    setCustomKeyword("");
  };

  /* ── Optimize handler ── */
  const handleOptimize = (kw?: string) => {
    if (!content.trim()) return;
    setOptimizeError(null);
    const kwStr = kw ?? (selectedKeywords.length > 0 ? selectedKeywords.join(", ") : targetKeywords.trim() || undefined);
    optimizeMutation.mutate({ data: { content, keywords: kwStr || undefined } });
  };

  /* ── Copy & Download ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(optimizeMutation.data?.rawContent ?? "");
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
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    a.href = url; a.download = `${slug || "optimized-content"}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!" });
  };

  /* ── Dashboard-level analyze (inline form) ── */
  function handleDashboardAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setAnalyzeError(null);
    setAnalysisData(null);
    setInitialScores(null);
    setScoresEnabled(false);
    localStorage.setItem("rankpilot_analysis_input", JSON.stringify({ type: "pending", content, keywords: targetKeywords }));
    analyzeMutation.mutate({ data: { content, keywords: targetKeywords.trim() || undefined } });
  }

  /* ── Scroll spy ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [analysisData]);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  };

  const isLoading = analyzeMutation.isPending;
  const isOptimizing = optimizeMutation.isPending;
  const optimizeData = optimizeMutation.data;
  const kwStr = selectedKeywords.length > 0 ? selectedKeywords.join(", ") : targetKeywords.trim();

  /* ── Priority helpers ── */
  const priorityBadge: Record<string, string> = {
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const dotColor: Record<string, string> = { High: "bg-red-500", Medium: "bg-amber-400", Low: "bg-gray-400" };

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ══ STICKY TOP BAR ══ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Rankora AI" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-gray-900 text-base hidden sm:block">
              Rankora <span className="text-[#4d44e3]">AI</span>
            </span>
          </a>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-1">
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-gray-700">Analysis Dashboard</span>
          </div>

          <div className="flex-1" />

          {/* User plan badge */}
          {user && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#4d44e3]/8 border-[#4d44e3]/20 text-[#4d44e3]">
              {user.plan}
            </span>
          )}

          {/* Credits */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            credits.remaining === 0 ? "bg-red-50 border-red-200 text-red-700"
            : credits.remaining <= 2 ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${credits.remaining === 0 ? "bg-red-500" : credits.remaining <= 2 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            {credits.remaining} / {credits.total} credits
          </div>

          {/* New Analysis */}
          <button
            onClick={() => {
              localStorage.removeItem("rankpilot_analysis_input");
              setAnalysisData(null);
              setInitialScores(null);
              setContent("");
              setTargetKeywords("");
              setScoresEnabled(false);
              setAnalyzeError(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> New Analysis
          </button>

          {/* User menu */}
          {user && (
            <button
              onClick={() => { logout(); navigate("/"); }}
              title={`Sign out (${user.email})`}
              className="hidden sm:flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Mobile sidebar toggle */}
          <button onClick={() => setSidebarOpen(o => !o)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ══ SIDEBAR ══ */}
          <>
            {/* Mobile overlay */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 z-30 bg-black/20 lg:hidden" />
              )}
            </AnimatePresence>

            {/* Sidebar panel */}
            <motion.aside
              className={`fixed lg:sticky lg:top-22 top-14 left-0 z-40 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem-2rem)] w-56 bg-white lg:bg-transparent border-r lg:border-0 border-gray-200 flex flex-col gap-1 p-4 lg:p-0 transition-transform duration-200 overflow-y-auto ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
              }`}
              style={{ top: sidebarOpen ? "3.5rem" : undefined }}
            >
              {/* Title */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">Navigation</p>
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  disabled={!analysisData && item.id !== "overview"}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                    activeSection === item.id
                      ? "bg-[#4d44e3]/10 text-[#4d44e3] font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  <span className={activeSection === item.id ? "text-[#4d44e3]" : "text-gray-400"}>{item.icon}</span>
                  {item.label}
                  {item.id === "issues" && analysisData && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                      {analysisData.issues.length}
                    </span>
                  )}
                  {item.id === "opportunities" && analysisData && (
                    <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                      {analysisData.opportunities.length}
                    </span>
                  )}
                </button>
              ))}

              {/* Keywords in sidebar */}
              {selectedKeywords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">Optimizing for</p>
                  <div className="flex flex-wrap gap-1.5 px-3">
                    {selectedKeywords.map(kw => (
                      <span key={kw} className="flex items-center gap-1 px-2 py-0.5 bg-[#4d44e3]/10 text-[#4d44e3] text-xs font-semibold rounded-full">
                        {kw.length > 14 ? kw.slice(0, 12) + "…" : kw}
                        <button onClick={() => toggleKeyword(kw)} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.aside>
          </>

          {/* ══ MAIN CONTENT ══ */}
          <main className="flex-1 min-w-0 space-y-8">

            {/* ── LOADING ── */}
            {isLoading && <DashboardLoading />}

            {/* ── ERROR ── */}
            {analyzeError && !isLoading && (
              <div className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-2xl p-6">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 mb-1">Analysis failed</p>
                  <p className="text-sm text-gray-600">{analyzeError}</p>
                </div>
                <button onClick={() => navigate("/")}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors">
                  Try again
                </button>
              </div>
            )}

            {/* ── INLINE ANALYZE FORM (shown when no analysis yet) ── */}
            {!analysisData && !isLoading && !analyzeError && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-0.5">Analyze content</h2>
                  <p className="text-sm text-gray-500">Paste your content or enter a URL below to get your SEO scores.</p>
                </div>
                <form onSubmit={handleDashboardAnalyze} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
                  {/* Target keywords */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Target className="w-4 h-4 text-[#4d44e3]" />
                      Target Keywords <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={targetKeywords}
                      onChange={e => setTargetKeywords(e.target.value)}
                      placeholder="e.g. SEO tools, content optimization, keyword research"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 transition-colors"
                    />
                  </div>
                  {/* Content / URL */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 text-[#4d44e3]" />
                      Content or URL
                    </label>
                    <textarea
                      rows={7}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Paste your article, blog post, landing page text... or enter a website URL (https://...)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 resize-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#4d44e3] hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Search className="w-4 h-4" />
                    Analyze Content
                  </button>
                </form>
              </motion.div>
            )}

            {/* ══ ANALYSIS RESULTS ══ */}
            <AnimatePresence>
              {analysisData && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

                  {/* ── SECTION 1: OVERVIEW (Score Cards) ── */}
                  <section id="overview" ref={el => { sectionRefs.current["overview"] = el; }}>
                    {/* Section header */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <h2 className="text-xl font-bold text-gray-900">Analysis Complete</h2>
                        </div>
                        <p className="text-sm text-gray-500">Your content scored across 4 optimization dimensions</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />80+</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />60–79</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />&lt;60</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <ScoreCard score={analysisData.seoScore} label="SEO Score" description="Search engine ranking potential"
                        icon={<Search className="w-5 h-5" />} colorClass="bg-violet-500" strokeColor="stroke-violet-500" enabled={scoresEnabled} />
                      <ScoreCard score={analysisData.aeoScore} label="AEO Score" description="Answer engine readiness"
                        icon={<MessageCircleQuestion className="w-5 h-5" />} colorClass="bg-blue-500" strokeColor="stroke-blue-500" enabled={scoresEnabled} />
                      <ScoreCard score={analysisData.geoScore} label="GEO Score" description="Generative engine optimization"
                        icon={<Globe className="w-5 h-5" />} colorClass="bg-teal-500" strokeColor="stroke-teal-500" enabled={scoresEnabled} />
                      <ScoreCard score={analysisData.aiVisibilityScore} label="AI Visibility" description="Overall AI discovery score"
                        icon={<Eye className="w-5 h-5" />} colorClass="bg-indigo-500" strokeColor="stroke-indigo-500" enabled={scoresEnabled} />
                    </div>
                  </section>

                  {/* ── SECTION 2: KEYWORD PANEL ── */}
                  {(analysisData.detectedKeywords || (analysisData.suggestedKeywords ?? []).length > 0) && (
                    <section id="keywords" ref={el => { sectionRefs.current["keywords"] = el; }}>
                      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#4d44e3]/10 border border-[#4d44e3]/20">
                            <Tag className="w-4 h-4 text-[#4d44e3]" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900">Keyword Intelligence</h3>
                            <p className="text-xs text-gray-500">Detected · scored · recommended</p>
                          </div>
                          {selectedKeywords.length > 0 && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#4d44e3]/10 border border-[#4d44e3]/20 rounded-full text-xs font-semibold text-[#4d44e3]">
                              <Check className="w-3 h-3" /> {selectedKeywords.length} selected
                            </span>
                          )}
                        </div>

                        <div className="p-6 space-y-7">
                          {/* Selected keywords bar */}
                          {(selectedKeywords.length > 0 || targetKeywords.trim()) && (
                            <div className="bg-[#4d44e3]/5 border border-[#4d44e3]/15 rounded-xl px-4 py-3">
                              <p className="text-xs font-semibold text-[#4d44e3] mb-2 flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" /> Optimizing for:
                              </p>
                              <div className="flex flex-wrap gap-2 items-center">
                                {selectedKeywords.map(kw => (
                                  <span key={kw} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#4d44e3]/25 text-[#4d44e3] text-xs font-semibold rounded-full shadow-sm">
                                    {kw}
                                    <button onClick={() => toggleKeyword(kw)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                  </span>
                                ))}
                                {!selectedKeywords.length && targetKeywords.trim() && (
                                  <span className="text-xs text-[#4d44e3]/70">{targetKeywords}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Detected keywords */}
                          {analysisData.detectedKeywords && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Detected in Content</p>
                              <div className="flex flex-wrap gap-2">
                                {analysisData.detectedKeywords.primary && (
                                  <button onClick={() => toggleKeyword(analysisData.detectedKeywords!.primary)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                                      selectedKeywords.includes(analysisData.detectedKeywords.primary)
                                        ? "bg-[#4d44e3] text-white border-[#4d44e3]"
                                        : "bg-[#4d44e3]/8 text-[#4d44e3] border-[#4d44e3]/30 hover:bg-[#4d44e3]/15"
                                    }`}>
                                    <TrendingUp className="w-3 h-3" />
                                    {analysisData.detectedKeywords.primary}
                                    {selectedKeywords.includes(analysisData.detectedKeywords.primary)
                                      ? <X className="w-3 h-3 opacity-70" />
                                      : <span className="opacity-60 font-normal">Primary</span>}
                                  </button>
                                )}
                                {(analysisData.detectedKeywords.secondary ?? []).map((kw, i) => (
                                  <button key={i} onClick={() => toggleKeyword(kw)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                                      selectedKeywords.includes(kw)
                                        ? "bg-[#4d44e3] text-white border-[#4d44e3]"
                                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                    }`}>
                                    {kw}{selectedKeywords.includes(kw) && <X className="w-3 h-3 opacity-70" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Keyword optimization scores */}
                          {(analysisData.keywordAnalysis ?? []).length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                {targetKeywords.trim() ? "Your Keyword Optimization Scores" : "Keyword Coverage"}
                              </p>
                              <div className="space-y-2.5">
                                {(analysisData.keywordAnalysis ?? []).map((item, i) => {
                                  const statusColor = item.status === "Good" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : item.status === "Missing" ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200";
                                  const barColor = item.status === "Good" ? "bg-emerald-500" : item.status === "Missing" ? "bg-red-400" : "bg-amber-400";
                                  const label = item.status === "Good" ? "optimized" : item.status === "Missing" ? "not found" : "needs work";
                                  return (
                                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                      <div className="flex items-center justify-between gap-3 mb-2.5">
                                        <span className="text-sm font-semibold text-gray-800 truncate flex-1">{item.keyword}</span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="text-sm font-bold text-gray-700">{item.score}%</span>
                                          <span className="text-xs text-gray-400 hidden sm:block">{label}</span>
                                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>{item.status}</span>
                                        </div>
                                      </div>
                                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div className={`h-full rounded-full ${barColor}`}
                                          initial={{ width: 0 }}
                                          animate={{ width: `${item.score}%` }}
                                          transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Recommended keywords to rank */}
                          {(analysisData.suggestedKeywords ?? []).length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recommended Keywords to Rank</p>
                                <span className="text-xs text-gray-400">Click Add → optimize</span>
                              </div>
                              <div className="space-y-2">
                                {(analysisData.suggestedKeywords ?? []).map((kw, i) => {
                                  const wc = kw.trim().split(/\s+/).length;
                                  const difficulty = wc >= 4 ? "Easy" : wc === 3 ? "Medium" : "Hard";
                                  const potential = i < 2 ? "High" : i < 4 ? "Medium" : "Low";
                                  const diffColor = difficulty === "Easy" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : difficulty === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-red-100 text-red-700 border-red-200";
                                  const potColor = potential === "High" ? "bg-violet-100 text-violet-700 border-violet-200"
                                    : potential === "Medium" ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200";
                                  const isSelected = selectedKeywords.includes(kw);
                                  return (
                                    <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                                      isSelected ? "bg-[#4d44e3]/5 border-[#4d44e3]/25" : "bg-white border-gray-100 hover:border-gray-200"
                                    }`}>
                                      <p className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{kw}</p>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full border ${diffColor}`}>{difficulty}</span>
                                        <span className={`hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full border ${potColor}`}>{potential}</span>
                                        <button onClick={() => toggleKeyword(kw)}
                                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                            isSelected
                                              ? "bg-[#4d44e3] text-white"
                                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-[#4d44e3]/40 hover:text-[#4d44e3]"
                                          }`}>
                                          {isSelected ? <><Check className="w-3 h-3" /> Added</> : <>+ Add</>}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Add custom keyword + helper text */}
                          <div className="space-y-3 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-400">We'll optimize your content for these keywords</p>
                            <div className="flex gap-2">
                              <input type="text" value={customKeyword}
                                onChange={e => setCustomKeyword(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addCustomKeyword()}
                                placeholder="Add your own keyword..."
                                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d44e3]/30 focus:border-[#4d44e3]/50 transition-all" />
                              <button onClick={addCustomKeyword} disabled={!customKeyword.trim()}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 transition-colors disabled:opacity-50 active:scale-95">
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── SECTION 3: ISSUES ── */}
                  <section id="issues" ref={el => { sectionRefs.current["issues"] = el; }}>
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 border border-red-200">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900">Issues Found</h3>
                          <p className="text-xs text-gray-500">Problems that need your attention</p>
                        </div>
                        <span className="flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                          {(analysisData.issues ?? []).length}
                        </span>
                      </div>
                      <div className="p-6">
                        {(analysisData.issues ?? []).length > 0 ? (
                          <div className="space-y-3">
                            {(analysisData.issues ?? []).map((issue, i) => (
                              <motion.div key={i}
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                className="bg-red-50 border border-red-100 rounded-xl p-4 hover:border-red-200 transition-all">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor[issue.priority] ?? "bg-gray-400"}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <h4 className="font-semibold text-gray-900 text-sm">{issue.title}</h4>
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityBadge[issue.priority] ?? priorityBadge.Medium}`}>
                                        {issue.priority}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                                    <div className="mt-2 flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-red-100">
                                      <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#4d44e3]" />
                                      <span className="text-xs text-gray-600"><span className="text-[#4d44e3] font-semibold">Impact: </span>{issue.impact}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium">No issues found! Your content is in great shape.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── SECTION 4: OPPORTUNITIES ── */}
                  <section id="opportunities" ref={el => { sectionRefs.current["opportunities"] = el; }}>
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-200">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900">Opportunities</h3>
                          <p className="text-xs text-gray-500">Actionable wins to boost your scores</p>
                        </div>
                        <span className="flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                          {(analysisData.opportunities ?? []).length}
                        </span>
                      </div>
                      <div className="p-6">
                        {(analysisData.opportunities ?? []).length > 0 ? (
                          <div className="space-y-4">
                            {(analysisData.opportunities ?? []).map((opp, i) => {
                              const oppBadge: Record<string, string> = {
                                High: "bg-violet-100 text-violet-700 border-violet-200",
                                Medium: "bg-blue-100 text-blue-700 border-blue-200",
                                Low: "bg-gray-100 text-gray-600 border-gray-200",
                              };
                              return (
                                <motion.div key={i}
                                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                  className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <h4 className="font-semibold text-gray-900 text-sm">{opp.title}</h4>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${oppBadge[opp.priority] ?? oppBadge.Medium}`}>
                                      {opp.priority}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{opp.description}</p>
                                  {opp.example && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-3">
                                      <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">Example</p>
                                      <p className="text-sm text-gray-700 leading-relaxed">{opp.example}</p>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2 text-xs text-gray-500">
                                    <Bot className="w-3.5 h-3.5 mt-0.5 text-teal-600 flex-shrink-0" />
                                    <span><span className="text-teal-700 font-semibold">Expected impact: </span>{opp.impact}</span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <p className="italic text-sm">No further opportunities — your content is looking great!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── SECTION 5: OPTIMIZE ── */}
                  <section id="optimize" ref={el => { sectionRefs.current["optimize"] = el; }}>
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#4d44e3]/10 border border-[#4d44e3]/20">
                          <Zap className="w-4 h-4 text-[#4d44e3]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900">Optimization Engine</h3>
                          <p className="text-xs text-gray-500">AI rewrites your content for maximum SEO impact</p>
                        </div>
                        {user?.plan === "free" ? (
                          <span className="text-xs text-[#4d44e3] bg-[#4d44e3]/8 border border-[#4d44e3]/20 rounded-lg px-2 py-1 font-semibold">
                            Pro feature
                          </span>
                        ) : credits.remaining < 3 ? (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 font-semibold">
                            Requires 3 credits
                          </span>
                        ) : null}
                      </div>
                      <div className="p-6 space-y-5">
                        {/* Keyword context */}
                        {kwStr && !optimizeData && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-[#4d44e3]/5 border border-[#4d44e3]/15 rounded-xl px-4 py-3">
                            <Target className="w-4 h-4 text-[#4d44e3] flex-shrink-0" />
                            <span>Optimizing for: <span className="font-semibold text-[#4d44e3]">{kwStr}</span></span>
                          </div>
                        )}

                        {/* Optimize loading */}
                        {isOptimizing && <OptimizeLoading keywords={kwStr} />}

                        {/* Optimize error */}
                        {optimizeError && !isOptimizing && (
                          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700 flex-1">{optimizeError}</p>
                            <button onClick={() => handleOptimize()} className="text-xs font-bold px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                              Retry
                            </button>
                          </div>
                        )}

                        {/* CTA button (shown when no optimize data yet) */}
                        {!optimizeData && !isOptimizing && (
                          user?.plan === "free" ? (
                            <div className="w-full flex flex-col items-center gap-3 px-8 py-6 bg-gradient-to-br from-[#4d44e3]/5 to-[#4d44e3]/10 border-2 border-dashed border-[#4d44e3]/30 rounded-xl text-center">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#4d44e3]/10">
                                <Zap className="w-5 h-5 text-[#4d44e3]" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">Optimization requires Pro or Premium</p>
                                <p className="text-xs text-gray-500 mt-1">Upgrade to unlock AI rewrites, "Fix Everything", and 3-credit optimizations.</p>
                              </div>
                              <a href="/#pricing" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-bold text-sm shadow-sm transition-colors">
                                <Sparkles className="w-4 h-4 text-yellow-300" /> Upgrade to Pro
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <button
                                onClick={() => handleOptimize()}
                                disabled={isOptimizing || credits.remaining < 3}
                                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#4d44e3] hover:bg-[#4338ca] text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                              >
                                <Zap className="w-5 h-5 text-yellow-300" />
                                {kwStr ? `Optimize for "${kwStr.split(",")[0].trim()}${kwStr.includes(",") ? "..." : ""}"` : "Fix Everything Automatically"}
                              </button>
                              <p className="text-center text-xs text-gray-400">Uses 3 credits &nbsp;·&nbsp; You have {credits.remaining} remaining</p>
                            </div>
                          )
                        )}

                        {/* Before/After comparison banner */}
                        {optimizeData && initialScores && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" /> Optimization Complete — Expected Score Improvement
                            </p>
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { label: "SEO", before: initialScores.seo },
                                { label: "AEO", before: initialScores.aeo },
                                { label: "GEO", before: initialScores.geo },
                                { label: "AI", before: initialScores.ai },
                              ].map(({ label, before }) => {
                                const est = Math.min(100, before + Math.round((100 - before) * 0.35));
                                const delta = est - before;
                                return (
                                  <div key={label} className="text-center">
                                    <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-sm text-gray-500 line-through">{before}</span>
                                      <ArrowRight className="w-3 h-3 text-emerald-500" />
                                      <span className="text-sm font-bold text-emerald-700">{est}</span>
                                    </div>
                                    <span className="text-xs text-emerald-600 font-semibold">+{delta}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── SECTION 6: OPTIMIZED OUTPUT ── */}
                  <AnimatePresence>
                    {optimizeData && (
                      <motion.section
                        id="optimize-output"
                        ref={el => { sectionRefs.current["optimize-output"] = el; }}
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {/* Toolbar */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4d44e3]/10 border border-[#4d44e3]/20">
                              <Sparkles className="w-4 h-4 text-[#4d44e3]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">Optimized Content Ready</p>
                              <p className="text-xs text-gray-500">
                                {kwStr ? `Optimized for: ${kwStr}` : "SEO · AEO · GEO optimized — ready to publish"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={handleCopy}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4d44e3]/10 hover:bg-[#4d44e3]/15 text-[#4d44e3] text-sm font-semibold transition-all border border-[#4d44e3]/20 active:scale-95">
                              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              {copied ? "Copied!" : "Copy"}
                            </button>
                            <button onClick={handleDownload}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold transition-all border border-teal-200 active:scale-95">
                              <Download className="w-4 h-4" /> Download .txt
                            </button>
                            <button onClick={() => handleOptimize()}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all border border-gray-200 active:scale-95">
                              <RefreshCw className="w-4 h-4" /> Re-optimize
                            </button>
                          </div>
                        </div>

                        {/* Document */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4d44e3] via-blue-500 to-teal-500" />
                          <div className="p-8 md:p-12 space-y-10">
                            {/* Title + Meta */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#4d44e3]/70 uppercase tracking-widest">
                                <Tag className="w-3.5 h-3.5" /> Optimized Title
                              </div>
                              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{optimizeData.title}</h1>
                              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                                  <Search className="w-3.5 h-3.5" /> Meta Description
                                  <span className="ml-auto font-normal text-blue-400 normal-case tracking-normal">
                                    {optimizeData.metaDescription.length} / 160 chars
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{optimizeData.metaDescription}</p>
                              </div>
                            </div>
                            <div className="border-t border-gray-100" />

                            {/* Intro */}
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Introduction</p>
                              <p className="text-base text-gray-700 leading-relaxed">{optimizeData.introduction}</p>
                            </div>

                            {/* Sections */}
                            {(optimizeData.sections ?? []).map((sec: ContentSection, i: number) => (
                              <div key={i} className="space-y-3">
                                {sec.level <= 2
                                  ? <h2 className="text-xl font-bold text-gray-900">{sec.heading}</h2>
                                  : <h3 className="text-lg font-semibold text-gray-800">{sec.heading}</h3>}
                                <p className="text-base text-gray-700 leading-relaxed">{sec.content}</p>
                                {(sec.bullets ?? []).length > 0 && (
                                  <ul className="space-y-1.5 pl-1">
                                    {sec.bullets.map((b, j) => (
                                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4d44e3] flex-shrink-0" />
                                        {b}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}

                            {/* FAQ */}
                            {(optimizeData.faq ?? []).length > 0 && (
                              <div className="space-y-4 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                  <HelpCircle className="w-3.5 h-3.5" /> FAQ
                                </div>
                                {(optimizeData.faq ?? []).map((q: FaqItem, i: number) => (
                                  <div key={i} className="space-y-1">
                                    <p className="font-semibold text-gray-900 text-sm">{q.question}</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Internal links */}
                            {(optimizeData.internalLinks ?? []).length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                  <Link2 className="w-3.5 h-3.5" /> Internal Link Suggestions
                                </div>
                                <ul className="space-y-1">
                                  {(optimizeData.internalLinks ?? []).map((link: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-[#4d44e3]">
                                      <Link2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60" />{link}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Conclusion */}
                            <div className="space-y-2 pt-4 border-t border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conclusion</p>
                              <p className="text-base text-gray-700 leading-relaxed">{optimizeData.conclusion}</p>
                            </div>
                          </div>
                        </div>
                      </motion.section>
                    )}
                  </AnimatePresence>

                  {/* Bottom padding */}
                  <div className="h-16" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state when no stored input */}
            {!isLoading && !analyzeError && !analysisData && (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <BarChart2 className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Start by analyzing content</p>
                <button onClick={() => navigate("/")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#4d44e3] text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-[#4338ca] transition-all">
                  <Plus className="w-4 h-4" /> New Analysis
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
