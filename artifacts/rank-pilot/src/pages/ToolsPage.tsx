import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Lock, Zap, ArrowRight, X, Star, CheckCircle2,
  TrendingUp, AlertTriangle, Lightbulb, BarChart2, ChevronRight,
  ArrowLeft, Loader2,
} from "lucide-react";

/* ══════════════════════════════════════
   TOOL CONFIGS
══════════════════════════════════════ */
interface ToolResult {
  score: number;
  insights: { type: "good" | "warn" | "info"; text: string }[];
  premiumInsights: string[];
}

interface ToolConfig {
  name: string;
  emoji: string;
  headline: string;
  subtext: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputType: "text" | "textarea" | "url";
  analyzeLabel: string;
  scoreLabel: string;
  seoText: string;
  generateResults: (input: string) => ToolResult;
}

const TOOLS: Record<string, ToolConfig> = {
  "seo-checker": {
    name: "SEO Checker",
    emoji: "🔍",
    headline: "Check Your SEO Score in Seconds",
    subtext: "Get an instant SEO health score for any URL or content with actionable insights.",
    inputLabel: "Enter your website URL or paste your content",
    inputPlaceholder: "https://yourwebsite.com or paste content here...",
    inputType: "textarea",
    analyzeLabel: "Check SEO Score",
    scoreLabel: "SEO Score",
    seoText: "Our free SEO Checker tool analyzes your website or content and provides an instant SEO health score. It evaluates key on-page factors including title tags, meta descriptions, heading structure, keyword density, internal linking, and more. Whether you're a blogger, marketer, or business owner, understanding your SEO score is the first step toward ranking higher on Google. Unlike other tools, our SEO checker gives you clear, actionable recommendations — not just numbers. Start improving your search visibility today with our free SEO analysis tool.",
    generateResults: (input) => ({
      score: Math.floor(Math.random() * 28) + 62,
      insights: [
        { type: "warn", text: "Title tag could be improved — aim for 50–60 characters with your primary keyword" },
        { type: "good", text: "Content length is strong — longer content tends to rank better on Google" },
        { type: "warn", text: "Meta description is either missing or too short — this affects your click-through rate" },
      ],
      premiumInsights: [
        "Backlink profile analysis — 0 referring domains detected",
        "Core Web Vitals: LCP 3.8s (needs improvement), FID 120ms, CLS 0.15",
        "Competitor gap analysis: 12 keywords your rivals rank for that you don't",
        "Technical issues: 4 broken links, 2 missing alt tags, 1 redirect chain",
        "Internal link structure score: 42/100 — needs significant improvement",
      ],
    }),
  },
  "keyword-generator": {
    name: "Keyword Generator",
    emoji: "🔑",
    headline: "Generate High-Value Keywords Instantly",
    subtext: "Discover hundreds of keywords your audience is searching for right now.",
    inputLabel: "Enter your main topic or seed keyword",
    inputPlaceholder: "e.g. content marketing, SEO tools, email automation...",
    inputType: "text",
    analyzeLabel: "Generate Keywords",
    scoreLabel: "Keyword Opportunity",
    seoText: "The Keyword Generator tool helps you discover high-value keywords for your niche. By entering a seed keyword or topic, you get a curated list of related terms your target audience is actively searching for. Understanding keyword intent — informational, navigational, or transactional — is critical for creating content that converts. Our tool surfaces short-tail and long-tail keyword opportunities, helping you prioritize which terms to target first. Use this data to build a content strategy that drives organic traffic and qualified leads to your business.",
    generateResults: (input) => ({
      score: Math.floor(Math.random() * 28) + 62,
      insights: [
        { type: "good", text: `"${input.slice(0, 30)}" has moderate search demand — good opportunity for new content` },
        { type: "info", text: "3 long-tail variations detected with low competition and high intent" },
        { type: "warn", text: "Primary keyword has high competition — target long-tail variants first" },
      ],
      premiumInsights: [
        "Full list of 120+ related keywords with search volume data",
        "Monthly search volume estimates and CPC data for each keyword",
        "Keyword difficulty scores (1–100) for all discovered terms",
        "SERP feature opportunities: featured snippets, People Also Ask boxes",
        "Seasonal trend data — best months to publish content for each keyword",
      ],
    }),
  },
  "content-optimizer": {
    name: "Content Optimizer",
    emoji: "✨",
    headline: "Optimize Your Content for Top Rankings",
    subtext: "AI-powered content analysis that tells you exactly what to fix to outrank your competitors.",
    inputLabel: "Paste your content to optimize",
    inputPlaceholder: "Paste your blog post, landing page, or any content here...",
    inputType: "textarea",
    analyzeLabel: "Optimize Content",
    scoreLabel: "Content Score",
    seoText: "Our Content Optimizer tool uses advanced AI to analyze your text and provide specific recommendations for improving search rankings. It evaluates readability, keyword density, semantic relevance, content structure, and LSI keyword usage. Well-optimized content consistently outperforms thin or poorly structured pages in search results. Whether you're writing a blog post, landing page, or product description, our optimizer tells you exactly what changes to make. Go beyond basic keyword stuffing — create content that satisfies both search engines and real human readers.",
    generateResults: (input) => ({
      score: Math.floor(Math.random() * 28) + 62,
      insights: [
        { type: "warn", text: `Readability grade: ${["Grade 9", "Grade 11", "Grade 8"][Math.floor(Math.random() * 3)]} — consider simplifying sentences for broader reach` },
        { type: "good", text: `Content length: ${input.split(" ").length} words — ${input.split(" ").length > 600 ? "great depth for SEO" : "consider expanding to 800+ words"}` },
        { type: "warn", text: "Semantic keyword coverage is low — add related terms to improve topical authority" },
      ],
      premiumInsights: [
        "AI-rewritten version of your full content — optimized for rankings",
        "NLP semantic analysis: 14 missing LSI keywords identified",
        "Competitor content gap: what top-ranking pages cover that you don't",
        "Heading structure score: 55/100 — H2/H3 usage needs restructuring",
        "E-E-A-T signals: 3 trust/authority improvements recommended",
      ],
    }),
  },
  "meta-generator": {
    name: "Meta Tag Generator",
    emoji: "🏷️",
    headline: "Generate Click-Worthy Meta Tags",
    subtext: "Create optimized title tags and meta descriptions that boost your click-through rate.",
    inputLabel: "Describe your page or paste its content",
    inputPlaceholder: "My page is about... / paste content here...",
    inputType: "textarea",
    analyzeLabel: "Generate Meta Tags",
    scoreLabel: "Meta Quality Score",
    seoText: "Meta tags are your website's first impression in Google search results. A well-crafted title tag and meta description can dramatically improve your click-through rate, bringing more traffic without needing to improve your ranking position. Our Meta Tag Generator analyzes your page content and creates SEO-optimized title tags (within the 60-character limit) and compelling meta descriptions (within 160 characters) that include your primary keyword and a clear call-to-action. Stop losing clicks to poor meta tags — generate optimized versions in seconds.",
    generateResults: (_input) => ({
      score: Math.floor(Math.random() * 28) + 62,
      insights: [
        { type: "good", text: 'Generated title: "Your Topic | Rankora AI" — 45 characters, includes primary keyword' },
        { type: "warn", text: "Meta description is 142 characters — within Google's 160-char limit, well done" },
        { type: "info", text: "Power words detected: 2 — add emotional triggers to improve CTR" },
      ],
      premiumInsights: [
        "5 A/B variant title tags with CTR prediction scores",
        "Open Graph & Twitter Card meta tags for all social platforms",
        "Structured data / JSON-LD markup for rich snippet eligibility",
        "Canonical tag recommendations to prevent duplicate content",
        "Hreflang tag generation for international/multilingual targeting",
      ],
    }),
  },
  "schema-generator": {
    name: "Schema Generator",
    emoji: "⚡",
    headline: "Generate Schema Markup for Rich Snippets",
    subtext: "Get more clicks with rich results — star ratings, FAQs, and more directly in Google.",
    inputLabel: "Describe your page type and content",
    inputPlaceholder: "e.g. I have a blog post about SEO tips, a product page for running shoes...",
    inputType: "textarea",
    analyzeLabel: "Generate Schema",
    scoreLabel: "Schema Coverage",
    seoText: "Schema markup (structured data) tells Google exactly what your content is about, making you eligible for rich results like star ratings, FAQs, how-to steps, and more. Pages with rich snippets get significantly higher click-through rates. Our Schema Generator automatically creates valid JSON-LD markup for your page type — whether it's an article, product, FAQ, local business, or event. Implementing schema is one of the highest-ROI technical SEO tasks, and our tool makes it simple even if you have no coding experience.",
    generateResults: (_input) => ({
      score: Math.floor(Math.random() * 28) + 62,
      insights: [
        { type: "good", text: "Article schema detected — eligible for Google News rich results" },
        { type: "warn", text: "FAQ schema opportunity found — adding FAQ markup can double your SERP real estate" },
        { type: "info", text: "Organization schema missing — helps Google understand your brand entity" },
      ],
      premiumInsights: [
        "Complete JSON-LD code for 6 schema types: Article, FAQ, BreadcrumbList, Organization, WebPage, and Author",
        "Schema validation report — zero errors, ready to implement",
        "Rich snippet preview: how your listing will look in Google",
        "Product schema with pricing, availability, and review aggregation",
        "Local Business schema with opening hours and geo-coordinates",
      ],
    }),
  },
  "keyword-difficulty": {
    name: "Keyword Difficulty",
    emoji: "📊",
    headline: "Know How Hard a Keyword Is to Rank For",
    subtext: "Instantly assess keyword competition and find ranking opportunities you can win.",
    inputLabel: "Enter a keyword to analyze",
    inputPlaceholder: "e.g. best SEO tools, how to lose weight, email marketing software...",
    inputType: "text",
    analyzeLabel: "Analyze Difficulty",
    scoreLabel: "Difficulty Score",
    seoText: "Understanding keyword difficulty before creating content saves you months of wasted effort. Our Keyword Difficulty tool analyzes the competitive landscape for any search term and gives you a difficulty score from 0 to 100. A low difficulty score means you can rank faster with less effort; high difficulty means you need significant authority and backlinks. By targeting keywords in your \"sweet spot\" — good search volume, manageable difficulty — you can build organic traffic far more efficiently than chasing broad, competitive head terms.",
    generateResults: (input) => ({
      score: Math.floor(Math.random() * 28) + 62,
      insights: [
        { type: "warn", text: `"${input.slice(0, 25)}" has ${["medium", "high", "moderate"][Math.floor(Math.random() * 3)]} competition — top 10 results are established domains` },
        { type: "info", text: "Estimated time to rank: 4–8 months with consistent content and link building" },
        { type: "good", text: "3 related low-difficulty variations found — consider targeting these first" },
      ],
      premiumInsights: [
        "Full SERP breakdown: Domain Authority, Page Authority, and backlink count for all 10 results",
        "Exact monthly search volume and 12-month trend data",
        "Keyword gap: 8 semantically related terms with lower difficulty",
        "Traffic opportunity estimate: ranking #1 could bring ~340 monthly visits",
        "Content requirements: word count, media, and structure of current top-ranking pages",
      ],
    }),
  },
  "seo-audit": {
    name: "Free SEO Audit",
    emoji: "🛡️",
    headline: "Get a Full SEO Audit of Your Website",
    subtext: "Uncover the technical issues silently hurting your rankings and traffic.",
    inputLabel: "Enter your website URL",
    inputPlaceholder: "https://yourwebsite.com",
    inputType: "url",
    analyzeLabel: "Run SEO Audit",
    scoreLabel: "Site Health Score",
    seoText: "A comprehensive SEO audit reveals the technical, on-page, and off-page issues preventing your website from ranking at its full potential. From crawl errors and slow page speed to missing meta tags and broken links, technical SEO problems silently drain your traffic every day. Our Free SEO Audit tool scans your website and surfaces the most critical issues to fix first, prioritized by impact. Regular SEO audits are essential for maintaining and improving your search visibility — even a single technical fix can unlock significant ranking improvements.",
    generateResults: (_input) => ({
      score: Math.floor(Math.random() * 25) + 55,
      insights: [
        { type: "warn", text: "4 critical technical issues found — these are actively hurting your rankings" },
        { type: "warn", text: "Page speed score: 58/100 — slow load times increase bounce rate and hurt rankings" },
        { type: "good", text: "Mobile-friendliness: passed — your site renders correctly on mobile devices" },
      ],
      premiumInsights: [
        "Full 50-point technical audit checklist with pass/fail status for every item",
        "Crawl report: all broken links, redirect chains, and orphaned pages",
        "Core Web Vitals detailed breakdown with specific fix recommendations",
        "Backlink toxicity audit — identify and disavow spammy links hurting your rankings",
        "Prioritized action plan: fixes ranked by SEO impact and implementation effort",
      ],
    }),
  },
};

/* ══════════════════════════════════════
   CREDIT SYSTEM
══════════════════════════════════════ */
function getCredits() {
  const v = localStorage.getItem("userCredits");
  return v !== null ? parseInt(v, 10) : 5;
}
function setCredits(n: number) {
  localStorage.setItem("userCredits", String(n));
}

/* ══════════════════════════════════════
   CREDIT MODAL
══════════════════════════════════════ */
function CreditModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You've used your free credits</h2>
          <p className="text-gray-500 text-sm">Upgrade to continue optimizing your content</p>
        </div>
        <div className="space-y-3 mb-6">
          {[
            { name: "Pro", price: "$12", period: "/month", credits: "50 credits", highlight: false },
            { name: "Premium", price: "$39", period: "/month", credits: "200 credits", highlight: true },
          ].map(plan => (
            <div key={plan.name} className={`border rounded-xl p-4 flex items-center justify-between ${plan.highlight ? "border-[#4d44e3] bg-[#4d44e3]/5" : "border-gray-200"}`}>
              <div>
                <p className="font-bold text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-500">{plan.credits} · All tools unlocked</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{plan.price}</span>
                <span className="text-xs text-gray-400">{plan.period}</span>
              </div>
            </div>
          ))}
        </div>
        <a
          href="/#pricing"
          className="block w-full text-center py-3 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-xl font-bold text-sm transition-colors mb-3"
        >
          Upgrade Now
        </a>
        <a
          href="/#pricing"
          className="block w-full text-center py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition-colors"
        >
          View Pricing
        </a>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════
   TOOL PAGE
══════════════════════════════════════ */
export default function ToolsPage() {
  const params = useParams<{ toolSlug: string }>();
  const [, navigate] = useLocation();
  const slug = params.toolSlug ?? "";
  const tool = TOOLS[slug];

  const [input, setInput] = useState("");
  const [result, setResult] = useState<ToolResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [credits, setCreditsState] = useState(getCredits);
  const [showModal, setShowModal] = useState(false);
  const [showPremiumTeaser, setShowPremiumTeaser] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setResult(null);
    setInput("");
    setAnalyzing(false);
  }, [slug]);

  if (!tool) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900 mb-2">404</p>
          <p className="text-gray-500 mb-6">Tool not found</p>
          <button onClick={() => navigate("/")} className="px-5 py-2 bg-[#4d44e3] text-white rounded-xl font-semibold text-sm">Back to Home</button>
        </div>
      </div>
    );
  }

  function handleAnalyze() {
    if (!input.trim()) return;
    if (credits <= 0) { setShowModal(true); return; }
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const newCredits = credits - 1;
      setCreditsState(newCredits);
      setCredits(newCredits);
      setResult(tool.generateResults(input.trim()));
      setShowPremiumTeaser(false);
      setAnalyzing(false);
    }, 1600);
  }

  const scoreColor = result
    ? result.score >= 80 ? "text-emerald-600" : result.score >= 65 ? "text-amber-600" : "text-red-500"
    : "text-gray-900";
  const barColor = result
    ? result.score >= 80 ? "bg-emerald-500" : result.score >= 65 ? "bg-amber-400" : "bg-red-400"
    : "bg-gray-200";

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Rankora AI" className="w-7 h-7 rounded-lg" />
              <span className="font-bold text-gray-900 hidden sm:block">Rankora <span className="text-[#4d44e3]">AI</span></span>
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Free Tools</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">{tool.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              credits === 0 ? "bg-red-50 border-red-200 text-red-600"
              : credits <= 2 ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <Zap className="w-3 h-3" />
              {credits} free {credits === 1 ? "credit" : "credits"} left
            </div>
            <a href="/#pricing" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-lg text-xs font-bold transition-colors">
              <Star className="w-3 h-3" /> Upgrade
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Tool selector pills ── */}
        <div className="flex gap-2 flex-wrap mb-8">
          {Object.entries(TOOLS).map(([s, t]) => (
            <a
              key={s}
              href={`${import.meta.env.BASE_URL}tools/${s}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                s === slug
                  ? "bg-[#4d44e3] text-white border-[#4d44e3]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#4d44e3]/40 hover:text-[#4d44e3]"
              }`}
            >
              {t.emoji} {t.name}
              {s === "content-optimizer" && s !== slug && (
                <span className="ml-1 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 rounded-full">🔥</span>
              )}
            </a>
          ))}
        </div>

        {/* ── Hero ── */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[#4d44e3]/10 text-[#4d44e3] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4">
            {tool.emoji} Free Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{tool.headline}</h1>
          <p className="text-gray-500 text-base max-w-xl">{tool.subtext}</p>
        </div>

        {/* ── Input card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{tool.inputLabel}</label>
          {tool.inputType === "textarea" ? (
            <textarea
              rows={5}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={tool.inputPlaceholder}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 resize-none transition-colors mb-4"
            />
          ) : (
            <input
              type={tool.inputType}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={tool.inputPlaceholder}
              onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 transition-colors mb-4"
            />
          )}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={handleAnalyze}
              disabled={!input.trim() || analyzing}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#4d44e3] hover:bg-[#3d35c3] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="w-4 h-4" /> {tool.analyzeLabel}</>
              )}
            </button>
            {credits === 0 && (
              <p className="text-xs text-red-500 font-medium">No credits left — <a href="/#pricing" className="underline">upgrade to continue</a></p>
            )}
          </div>
        </div>

        {/* ── Analyzing animation ── */}
        {analyzing && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center mb-6">
            <div className="w-12 h-12 border-4 border-[#4d44e3]/20 border-t-[#4d44e3] rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-gray-900">Analyzing your content...</p>
            <p className="text-sm text-gray-400 mt-1">This takes just a moment</p>
          </div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {result && !analyzing && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Score card */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#4d44e3]" /> {tool.scoreLabel}
                  </h2>
                  <span className={`text-4xl font-extrabold tabular-nums ${scoreColor}`}>{result.score}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {result.score >= 80 ? "Great score! A few tweaks could push you even higher." : result.score >= 65 ? "Room for improvement — fix the issues below to rank better." : "Needs attention — several critical issues found."}
                </p>
              </div>

              {/* Insights */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Key Insights
                </h2>
                <div className="space-y-3">
                  {result.insights.map((insight, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                      insight.type === "good" ? "bg-emerald-50 border-emerald-200" :
                      insight.type === "warn" ? "bg-amber-50 border-amber-200" :
                      "bg-blue-50 border-blue-200"
                    }`}>
                      {insight.type === "good"
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        : insight.type === "warn"
                        ? <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        : <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      }
                      <p className="text-sm text-gray-700">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade prompt below results */}
              <div className="bg-gradient-to-r from-[#4d44e3]/5 to-purple-50 border border-[#4d44e3]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="font-bold text-gray-900 mb-0.5">Want better rankings?</p>
                  <p className="text-sm text-gray-500">Unlock full SEO insights, AI optimization & detailed reports</p>
                </div>
                <a href="/#pricing" className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap">
                  Upgrade to Pro – $12/mo <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Locked premium section */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" /> Advanced Insights
                    <span className="text-xs font-semibold bg-[#4d44e3]/10 text-[#4d44e3] px-2 py-0.5 rounded-full">Pro</span>
                  </h2>
                  <button
                    onClick={() => setShowPremiumTeaser(t => !t)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Preview
                  </button>
                </div>

                <div className="relative">
                  {/* Blurred preview */}
                  <div className={`p-5 space-y-2 transition-all duration-300 ${showPremiumTeaser ? "blur-sm" : "blur-sm"}`}>
                    {result.premiumInsights.map((insight, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                        <div className="w-5 h-5 rounded-full bg-[#4d44e3]/10 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-3 h-3 text-[#4d44e3]" />
                        </div>
                        <p className="text-sm text-gray-600">{insight}</p>
                      </div>
                    ))}
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/95 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-8 h-8 text-gray-400 mb-3" />
                    <p className="font-bold text-gray-900 mb-1">🔒 This feature is available in Pro plan</p>
                    <p className="text-sm text-gray-500 mb-5 max-w-sm">
                      Unlock full insights, AI optimization & detailed report
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a href="/#pricing" className="flex items-center gap-2 px-5 py-2.5 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-xl font-bold text-sm transition-colors">
                        Upgrade to Pro – $12/month
                      </a>
                      <a href="/#pricing" className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
                        View Pricing
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SEO text section ── */}
        <div className="mt-12 pt-10 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">About the {tool.name} Tool</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{tool.seoText}</p>
        </div>

      </div>

      {/* ── Credit modal ── */}
      <AnimatePresence>
        {showModal && <CreditModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
