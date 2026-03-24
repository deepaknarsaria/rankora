import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Lightbulb, 
  Zap, 
  Copy, 
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { useAnalyzeContent, useOptimizeContent } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ScoreRing } from "@/components/ScoreRing";
import { CategoryBadge } from "@/components/CategoryBadge";

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

export default function Home() {
  const [content, setContent] = useState("");
  const [optimizedText, setOptimizedText] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
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
      onSuccess: (data) => setOptimizedText(data.optimizedContent),
      onError: (err: any) => toast({ 
        title: "Optimization Failed", 
        description: err.message || "An error occurred during optimization.", 
        variant: "destructive" 
      })
    }
  });

  const handleAnalyze = () => {
    if (!content.trim()) return;
    analyzeMutation.mutate({ data: { content } });
  };

  const handleOptimize = () => {
    if (!content.trim()) return;
    optimizeMutation.mutate({ data: { content } });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(optimizedText);
    toast({ 
      title: "Copied successfully!", 
      description: "Optimized content copied to clipboard." 
    });
  };

  const handleReanalyze = () => {
    setContent(optimizedText);
    setOptimizedText("");
    setHasAnalyzed(false);
    // Slight delay to ensure state flush before triggering mutation again
    setTimeout(() => {
      analyzeMutation.mutate({ data: { content: optimizedText } });
    }, 100);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (hasAnalyzed) {
      setHasAnalyzed(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background selection:bg-primary/30 selection:text-white">
      {/* Background Atmosphere */}
      <img 
        src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
        alt="Hero Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none" 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />

      {/* Abstract Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        {/* Header section */}
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

        {/* Primary Input Section */}
        {!optimizedText && (
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

        {/* Results Section */}
        <AnimatePresence>
          {hasAnalyzed && analyzeMutation.data && !optimizedText && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="space-y-12"
            >
              {/* Scores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreRing 
                  score={analyzeMutation.data.seoScore} 
                  label="SEO Score" 
                  colorClass="stroke-violet-500" 
                />
                <ScoreRing 
                  score={analyzeMutation.data.aeoScore} 
                  label="AEO Score" 
                  colorClass="stroke-blue-500" 
                />
                <ScoreRing 
                  score={analyzeMutation.data.geoScore} 
                  label="GEO Score" 
                  colorClass="stroke-teal-500" 
                />
              </div>

              {/* Issues & Suggestions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Critical Issues */}
                <div className="glass-panel p-8 rounded-[2rem] flex flex-col">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
                    <AlertTriangle className="w-7 h-7 text-destructive" /> 
                    Critical Issues
                  </h3>
                  {analyzeMutation.data.issues.length > 0 ? (
                    <ul className="space-y-4 flex-1">
                      {analyzeMutation.data.issues.map((issue, i) => (
                        <motion.li 
                          initial={{ opacity: 0, x: -20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.1 }} 
                          key={i} 
                          className="flex items-start gap-4 bg-destructive/10 text-destructive-foreground p-5 rounded-2xl border border-destructive/20"
                        >
                          <div className="mt-1.5 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                          </div>
                          <p className="text-base leading-relaxed">{issue}</p>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                     <div className="flex items-center gap-4 text-emerald-400 bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 flex-1">
                        <CheckCircle2 className="w-8 h-8" />
                        <p className="text-lg font-medium">No critical issues found! Great job.</p>
                     </div>
                  )}
                </div>

                {/* Optimization Suggestions */}
                <div className="glass-panel p-8 rounded-[2rem] flex flex-col">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
                    <Lightbulb className="w-7 h-7 text-yellow-500" /> 
                    Opportunities
                  </h3>
                  {analyzeMutation.data.suggestions.length > 0 ? (
                    <ul className="space-y-5 flex-1">
                      {analyzeMutation.data.suggestions.map((sug, i) => (
                        <motion.li 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.1 }} 
                          key={i} 
                          className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <CategoryBadge category={sug.category} />
                            <h4 className="font-bold text-foreground text-lg">{sug.title}</h4>
                          </div>
                          <p className="text-base text-muted-foreground leading-relaxed">{sug.explanation}</p>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-4 text-muted-foreground bg-white/5 p-6 rounded-2xl border border-white/10 flex-1">
                      <p className="text-lg italic">No further suggestions. Your content looks fully optimized.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fix Everything Action */}
              <div className="flex justify-center pt-8">
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
                    ? (inputIsUrl ? "Fetching & optimizing website..." : "Optimizing Content...")
                    : "Fix Everything Automatically"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optimized Content Display */}
        <AnimatePresence>
          {optimizedText && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="glass-panel p-3 rounded-[2rem] relative overflow-hidden shadow-2xl border-primary/30"
            >
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-500 to-teal-400" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-white/10 mb-2">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" /> 
                  Optimized Content
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={copyToClipboard} 
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-foreground font-semibold transition-colors border border-white/10"
                  >
                    <Copy className="w-4 h-4" /> Copy Text
                  </button>
                  <button 
                    onClick={handleReanalyze} 
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-foreground hover:bg-primary font-semibold transition-all border border-primary/20"
                  >
                    <RefreshCw className="w-4 h-4" /> Re-analyze
                  </button>
                </div>
              </div>

              <textarea
                value={optimizedText}
                onChange={(e) => setOptimizedText(e.target.value)}
                className="w-full h-[600px] bg-transparent border-0 resize-none px-6 pb-6 text-lg md:text-xl placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 text-foreground leading-relaxed"
                placeholder="Your optimized content will appear here..."
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
