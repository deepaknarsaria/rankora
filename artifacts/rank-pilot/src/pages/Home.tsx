import { useState } from "react";
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
} from "lucide-react";
import { useAnalyzeContent, useOptimizeContent } from "@workspace/api-client-react";
import type { ContentSection, FaqItem, Issue, Opportunity } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ScoreRing } from "@/components/ScoreRing";

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

export default function Home() {
  const [content, setContent] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const inputIsUrl = isUrl(content);

  const analyzeMutation = useAnalyzeContent({
    mutation: {
      onSuccess: () => setHasAnalyzed(true),
      onError: (err: any) => toast({ 
        title: "Analysis Failed", 
        description: err.message || "An error occurred during analysis.", 
        variant: "destructive" 
      })
    }
  });

  const optimizeMutation = useOptimizeContent({
    mutation: {
      onError: (err: any) => toast({ 
        title: "Optimization Failed", 
        description: err.message || "An error occurred during optimization.", 
        variant: "destructive" 
      })
    }
  });

  const handleAnalyze = () => {
    if (!content.trim()) return;
    optimizeMutation.reset();
    analyzeMutation.mutate({ data: { content } });
  };

  const handleOptimize = () => {
    if (!content.trim()) return;
    optimizeMutation.mutate({ data: { content } });
  };

  const handleCopy = () => {
    const raw = optimizeMutation.data?.rawContent ?? "";
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Optimized content copied to clipboard." });
  };

  const handleReanalyze = () => {
    const raw = optimizeMutation.data?.rawContent ?? "";
    setContent(raw);
    setHasAnalyzed(false);
    optimizeMutation.reset();
    setTimeout(() => {
      analyzeMutation.mutate({ data: { content: raw } });
    }, 100);
  };

  const handleStartOver = () => {
    setContent("");
    setHasAnalyzed(false);
    analyzeMutation.reset();
    optimizeMutation.reset();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (hasAnalyzed) {
      setHasAnalyzed(false);
      analyzeMutation.reset();
    }
  };

  const showOptimized = !!optimizeMutation.data;
  const showResults = hasAnalyzed && analyzeMutation.data && !showOptimized;

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background selection:bg-primary/30 selection:text-white">
      {/* Background Atmosphere */}
      <img 
        src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none" 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="inline-flex items-center justify-center p-3 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md mb-2"
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/logo.png`} 
              alt="RankPilot AI Logo" 
              className="w-14 h-14 rounded-2xl" 
            />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.1 }} 
            className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tighter"
          >
            Rank<span className="text-gradient">Pilot</span> AI
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium"
          >
            Elevate your content for search engines, answer engines, and generative AI with a single click.
          </motion.p>
        </div>

        {/* Input Section — hidden while showing optimized output */}
        {!showOptimized && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.3 }} 
            className="glass-panel rounded-[2rem] p-3 mb-16 relative group transition-all duration-500 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 shadow-2xl"
          >
            <textarea
              value={content}
              onChange={handleContentChange}
              className="w-full h-64 md:h-80 bg-transparent border-0 resize-none p-6 text-lg md:text-xl placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 text-foreground leading-relaxed"
              placeholder="Paste your content OR a website URL (https://...)..."
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              {content.length > 0 && (
                inputIsUrl ? (
                  <span className="text-sm text-primary/80 font-medium mr-2 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                    URL detected
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground font-medium mr-2">
                    {content.trim().split(/\s+/).length} words
                  </span>
                )
              )}
              <button
                onClick={handleAnalyze}
                disabled={!content.trim() || analyzeMutation.isPending}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
              >
                {analyzeMutation.isPending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {analyzeMutation.isPending
                  ? (inputIsUrl ? "Analyzing website..." : "Analyzing text...")
                  : "Analyze Content"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Analysis Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="space-y-10"
            >
              {/* Summary bar */}
              <div className="flex items-center justify-between glass-panel px-6 py-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">Analysis Complete</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />High</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />Low</span>
                </div>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <ScoreRing score={analyzeMutation.data!.seoScore} label="SEO Score" colorClass="stroke-violet-500" glowColor="bg-violet-600/10" icon={<Search className="w-4 h-4" />} description="Search engine ranking potential" />
                <ScoreRing score={analyzeMutation.data!.aeoScore} label="AEO Score" colorClass="stroke-blue-500" glowColor="bg-blue-600/10" icon={<MessageCircleQuestion className="w-4 h-4" />} description="Answer engine readiness" />
                <ScoreRing score={analyzeMutation.data!.geoScore} label="GEO Score" colorClass="stroke-teal-500" glowColor="bg-teal-600/10" icon={<Globe className="w-4 h-4" />} description="Generative engine optimization" />
                <ScoreRing score={analyzeMutation.data!.aiVisibilityScore} label="AI Visibility" colorClass="stroke-fuchsia-500" glowColor="bg-fuchsia-600/10" icon={<Eye className="w-4 h-4" />} description="Overall AI discovery score" />
              </div>

              {/* Issues */}
              <div className="glass-panel p-8 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-7">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-destructive/15 border border-destructive/25">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground leading-none">Issues Found</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Problems that need your attention</p>
                  </div>
                  <span className="ml-auto flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-full bg-destructive/15 text-destructive text-xs font-bold border border-destructive/25">
                    {(analyzeMutation.data!.issues ?? []).length}
                  </span>
                </div>
                {(analyzeMutation.data!.issues ?? []).length > 0 ? (
                  <div className="space-y-4">
                    {(analyzeMutation.data!.issues ?? []).map((issue: Issue, i: number) => {
                      const priorityStyles: Record<string, string> = {
                        High: "bg-red-500/15 text-red-400 border-red-500/30",
                        Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                        Low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
                      };
                      const dotColors: Record<string, string> = {
                        High: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
                        Medium: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
                        Low: "bg-slate-500",
                      };
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                          className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.06] transition-colors">
                          <div className="flex items-start gap-3 mb-2">
                            <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${dotColors[issue.priority] ?? dotColors.Medium}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold text-foreground text-base">{issue.title}</h4>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${priorityStyles[issue.priority] ?? priorityStyles.Medium}`}>{issue.priority}</span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
                            </div>
                          </div>
                          <div className="ml-5 mt-3 flex items-start gap-2 text-sm text-muted-foreground/70 bg-white/[0.03] rounded-xl px-4 py-2.5 border border-white/5">
                            <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
                            <span><span className="text-primary/80 font-medium">Impact: </span>{issue.impact}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-emerald-400 bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                    <p className="text-lg font-medium">No issues found! Your content is in great shape.</p>
                  </div>
                )}
              </div>

              {/* Opportunities */}
              <div className="glass-panel p-8 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-7">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-yellow-500/15 border border-yellow-500/25">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground leading-none">Opportunities</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Actionable wins to boost your scores</p>
                  </div>
                  <span className="ml-auto flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-bold border border-yellow-500/25">
                    {(analyzeMutation.data!.opportunities ?? []).length}
                  </span>
                </div>
                {(analyzeMutation.data!.opportunities ?? []).length > 0 ? (
                  <div className="space-y-5">
                    {(analyzeMutation.data!.opportunities ?? []).map((opp: Opportunity, i: number) => {
                      const priorityStyles: Record<string, string> = {
                        High: "bg-violet-500/15 text-violet-300 border-violet-500/30",
                        Medium: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                        Low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
                      };
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                          className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.06] transition-colors">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h4 className="font-semibold text-foreground text-base">{opp.title}</h4>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${priorityStyles[opp.priority] ?? priorityStyles.Medium}`}>{opp.priority}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{opp.description}</p>
                          {opp.example && (
                            <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 mb-3">
                              <p className="text-xs text-primary/70 font-semibold uppercase tracking-wide mb-1">Example</p>
                              <p className="text-sm text-foreground/80 leading-relaxed">{opp.example}</p>
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-sm text-muted-foreground/70">
                            <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-teal-400/70" />
                            <span><span className="text-teal-400/90 font-medium">Expected impact: </span>{opp.impact}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-muted-foreground bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="text-lg italic">No further opportunities. Your content looks fully optimized.</p>
                  </div>
                )}
              </div>

              {/* Fix Everything CTA */}
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={handleOptimize}
                  disabled={optimizeMutation.isPending}
                  className="group relative overflow-hidden flex items-center gap-3 px-12 py-5 bg-foreground text-background hover:bg-white rounded-2xl font-bold text-xl shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                  {optimizeMutation.isPending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                      <RefreshCw className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <Zap className="w-6 h-6 group-hover:text-yellow-500 transition-colors" />
                  )}
                  {optimizeMutation.isPending
                    ? (inputIsUrl ? "Fetching & optimizing..." : "Optimizing Content...")
                    : "Fix Everything Automatically"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Optimized Content Display ── */}
        <AnimatePresence>
          {showOptimized && optimizeMutation.data && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-6"
            >
              {/* Toolbar */}
              <div className="glass-panel rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 border border-primary/25">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Optimized Content Ready</p>
                    <p className="text-xs text-muted-foreground">SEO · AEO · GEO optimized — ready to publish</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-colors border border-primary/20"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy All"}
                  </button>
                  <button
                    onClick={handleReanalyze}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-foreground text-sm font-semibold transition-colors border border-white/10"
                  >
                    <RefreshCw className="w-4 h-4" /> Re-analyze
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground text-sm font-semibold transition-colors border border-white/10"
                  >
                    Start Over
                  </button>
                </div>
              </div>

              {/* Document body */}
              <div className="glass-panel rounded-[2rem] overflow-hidden relative">
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-teal-400" />

                <div className="p-8 md:p-12 space-y-10">

                  {/* Title + Meta */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary/70 uppercase tracking-widest">
                      <Tag className="w-3.5 h-3.5" /> Optimized Title
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
                      {optimizeMutation.data.title}
                    </h1>

                    <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl px-5 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400/80 uppercase tracking-widest mb-2">
                        <Search className="w-3.5 h-3.5" /> Meta Description
                        <span className="ml-auto font-normal text-blue-400/50 normal-case tracking-normal">
                          {optimizeMutation.data.metaDescription.length} / 160 chars
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{optimizeMutation.data.metaDescription}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/8" />

                  {/* Introduction */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                      <FileText className="w-3.5 h-3.5" /> Introduction
                    </div>
                    <p className="text-base md:text-lg text-foreground/80 leading-relaxed">{optimizeMutation.data.introduction}</p>
                  </div>

                  <div className="border-t border-white/8" />

                  {/* Content Sections */}
                  {optimizeMutation.data.sections.length > 0 && (
                    <div className="space-y-8">
                      {optimizeMutation.data.sections.map((section: ContentSection, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="space-y-3"
                        >
                          {section.level <= 2 ? (
                            <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-blue-500 flex-shrink-0" />
                              {section.heading}
                            </h2>
                          ) : (
                            <h3 className="text-lg font-semibold text-foreground/90 flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-primary/60 flex-shrink-0" />
                              {section.heading}
                            </h3>
                          )}
                          {section.content && (
                            <p className="text-base text-foreground/70 leading-relaxed pl-3">{section.content}</p>
                          )}
                          {section.bullets.length > 0 && (
                            <ul className="space-y-2 pl-3">
                              {section.bullets.map((bullet: string, bi: number) => (
                                <li key={bi} className="flex items-start gap-2.5 text-sm text-foreground/70">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-white/8" />

                  {/* FAQ Section */}
                  {optimizeMutation.data.faq.length > 0 && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                        <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
                      </div>
                      <div className="space-y-4">
                        {optimizeMutation.data.faq.map((item: FaqItem, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5"
                          >
                            <p className="font-semibold text-foreground mb-2 flex items-start gap-2">
                              <span className="text-primary font-black text-lg leading-none mt-[-1px]">Q</span>
                              {item.question}
                            </p>
                            <p className="text-sm text-foreground/70 leading-relaxed pl-6">{item.answer}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internal Links */}
                  {optimizeMutation.data.internalLinks.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                        <Link2 className="w-3.5 h-3.5" /> Internal Linking Suggestions
                      </div>
                      <div className="bg-teal-500/8 border border-teal-500/20 rounded-2xl p-5 space-y-2">
                        {optimizeMutation.data.internalLinks.map((link: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/70">
                            <Link2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-teal-400/60" />
                            {link}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/8" />

                  {/* Conclusion */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conclusion
                    </div>
                    <p className="text-base md:text-lg text-foreground/80 leading-relaxed">{optimizeMutation.data.conclusion}</p>
                  </div>

                </div>
              </div>

              {/* Bottom copy bar */}
              <div className="flex justify-center pb-8">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? "Copied to Clipboard!" : "Copy Full Content"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
