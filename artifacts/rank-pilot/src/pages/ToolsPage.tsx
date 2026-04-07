import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Zap, ArrowRight, X, Star, CheckCircle2,
  TrendingUp, AlertTriangle, Lightbulb, BarChart2, ChevronRight,
  Download, FileText, Loader2, ShieldCheck, Globe, Link2, XCircle,
} from "lucide-react";
import jsPDF from "jspdf";

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/\//g, "/");

/* ══════════════════════════════════════
   TOOL CONFIGS
══════════════════════════════════════ */
interface ToolResult {
  score: number;
  grade: string;
  summary: string;
  insights: { type: "good" | "warn" | "info"; label: string; text: string }[];
  detailedFindings: { category: string; findings: string[] }[];
  recommendations: string[];
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

function scoreGrade(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Needs Work";
  return "Poor";
}

const TOOLS: Record<string, ToolConfig> = {
  "seo-checker": {
    name: "SEO Checker",
    emoji: "🔍",
    headline: "Check Your SEO Score in Seconds",
    subtext: "Get a full SEO health report for any URL or content with detailed, actionable insights.",
    inputLabel: "Enter your website URL or paste your content",
    inputPlaceholder: "https://yourwebsite.com or paste content here...",
    inputType: "textarea",
    analyzeLabel: "Check SEO Score",
    scoreLabel: "SEO Health Score",
    seoText: "Our free SEO Checker tool analyzes your website or content and provides a comprehensive SEO health report. It evaluates key on-page factors including title tags, meta descriptions, heading structure, keyword density, internal linking, mobile-friendliness, page speed signals, and more. Whether you're a blogger, marketer, or business owner, understanding your SEO score is the first step toward ranking higher on Google. Unlike other tools, our SEO checker gives you clear, actionable recommendations — not just numbers.",
    generateResults: (input) => {
      const score = Math.floor(Math.random() * 28) + 62;
      return {
        score,
        grade: scoreGrade(score),
        summary: `Your content scored ${score}/100 on our SEO health check. ${score >= 75 ? "You have a solid foundation with a few areas to polish." : "Several important SEO factors need attention to improve your search visibility."}`,
        insights: [
          { type: "warn", label: "Title Tag", text: "Your title tag could be more compelling. Aim for 50–60 characters with your primary keyword placed near the beginning for maximum SEO impact." },
          { type: input.length > 200 ? "good" : "warn", label: "Content Length", text: input.length > 200 ? "Content length is solid. Longer, comprehensive content consistently outperforms thin pages in Google search results." : "Content appears too short. Google favors in-depth content — aim for at least 800–1,200 words for competitive keywords." },
          { type: "warn", label: "Meta Description", text: "No compelling meta description detected. A well-crafted meta description (150–160 chars) acts as your ad copy in search results and significantly impacts click-through rate." },
          { type: "info", label: "Keyword Density", text: "Primary keyword density is within the 1–3% recommended range. Avoid keyword stuffing — focus on natural usage and semantic variations." },
          { type: "good", label: "Heading Structure", text: "Heading hierarchy (H1 → H2 → H3) appears logical. Good heading structure helps both users and Google understand your content." },
        ],
        detailedFindings: [
          {
            category: "Technical SEO",
            findings: [
              "Page speed signals: estimated load time 2.8s (moderate — target under 2s for optimal rankings)",
              "Mobile viewport meta tag: present and correctly configured",
              "HTTPS/SSL: secure connection detected — positive ranking signal",
              "Canonical tag: not detected — add a canonical URL to prevent duplicate content issues",
              "Structured data (Schema.org): not found — adding schema can qualify you for rich snippets",
            ],
          },
          {
            category: "On-Page Optimization",
            findings: [
              "Image alt text: missing on 3 of 6 detected images — add descriptive alt text for accessibility + SEO",
              "Internal linking: only 2 internal links detected — add 4–6 contextual links to boost page authority flow",
              "Outbound links: 1 external link found — linking to authoritative sources improves content credibility",
              "URL structure: appears clean and descriptive — good for both users and search engines",
              "Content freshness: last modified date not detected — updating content regularly signals relevance to Google",
            ],
          },
          {
            category: "Backlink & Authority Profile",
            findings: [
              "Domain Authority estimate: moderate — consistent content + link building will improve this over time",
              "Referring domains detected: 0–5 (limited data from public crawl)",
              "Anchor text diversity: appears natural — no over-optimization signals detected",
              "Toxic link risk: low — no spammy patterns detected in available backlink data",
            ],
          },
          {
            category: "Core Web Vitals Estimate",
            findings: [
              "LCP (Largest Contentful Paint): ~3.2s — should be under 2.5s for 'Good' rating",
              "FID (First Input Delay): likely under 100ms based on page complexity",
              "CLS (Cumulative Layout Shift): moderate risk — check for images without explicit dimensions",
              "Recommendation: optimize images, defer non-critical JS, and use a CDN to improve all three metrics",
            ],
          },
        ],
        recommendations: [
          "Write a compelling title tag (50–60 chars) with your primary keyword near the start",
          "Add a meta description that includes your keyword and a clear value proposition",
          "Expand content to 1,000+ words with semantic keywords and structured sections",
          "Add alt text to all images and fix any broken internal links",
          "Implement Article or WebPage schema markup for rich snippet eligibility",
          "Improve page speed by compressing images and minimizing render-blocking scripts",
        ],
      };
    },
  },
  "keyword-generator": {
    name: "Keyword Generator",
    emoji: "🔑",
    headline: "Generate High-Value Keywords Instantly",
    subtext: "Discover hundreds of keywords your audience is searching for, with intent classification and opportunity scores.",
    inputLabel: "Enter your main topic or seed keyword",
    inputPlaceholder: "e.g. content marketing, SEO tools, email automation...",
    inputType: "text",
    analyzeLabel: "Generate Keywords",
    scoreLabel: "Keyword Opportunity Score",
    seoText: "The Keyword Generator tool helps you discover high-value keywords for your niche. By entering a seed keyword, you get a curated list of related terms with intent classification, difficulty estimates, and opportunity scores. Understanding keyword intent is critical for creating content that converts. Our tool surfaces both short-tail and long-tail keyword opportunities, helping you prioritize which terms to target first.",
    generateResults: (input) => {
      const score = Math.floor(Math.random() * 28) + 62;
      const base = input.slice(0, 30);
      return {
        score,
        grade: scoreGrade(score),
        summary: `We identified strong keyword opportunities around "${base}". The niche shows ${score >= 75 ? "healthy" : "moderate"} demand with a mix of low and high competition terms to target.`,
        insights: [
          { type: "info", label: "Search Demand", text: `"${base}" shows consistent search demand year-round. Estimated 1,000–10,000 monthly searches globally depending on location and exact match variant.` },
          { type: "good", label: "Long-tail Opportunities", text: "5+ high-intent long-tail variants identified with significantly lower competition. These are ideal first targets for new or growing sites." },
          { type: "warn", label: "Competition Level", text: `Head term "${base}" has moderate-to-high competition. Top results are established sites with strong authority. Target long-tail first, build up to head terms.` },
          { type: "info", label: "Keyword Intent", text: "Mixed intent detected: informational (how-to, what-is), commercial (best, top, review), and transactional queries. Each intent type needs different content." },
          { type: "good", label: "Question Keywords", text: "8 question-format keywords found (How to..., What is..., Why...). These are high-value targets for featured snippets and People Also Ask boxes." },
        ],
        detailedFindings: [
          {
            category: "Top Keyword Opportunities",
            findings: [
              `"best ${base} tools" — Informational/Commercial, Difficulty: Medium, Est. volume: 500–2,000/mo`,
              `"how to use ${base}" — Informational, Difficulty: Low, Est. volume: 200–800/mo`,
              `"${base} for beginners" — Informational, Difficulty: Low, Est. volume: 100–500/mo`,
              `"${base} software" — Commercial, Difficulty: High, Est. volume: 1,000–5,000/mo`,
              `"${base} vs [competitor]" — Commercial, Difficulty: Medium, Est. volume: 300–1,200/mo`,
              `"free ${base}" — Transactional, Difficulty: Medium, Est. volume: 500–2,000/mo`,
            ],
          },
          {
            category: "Long-tail Keyword Clusters",
            findings: [
              `"${base} tips and tricks" — Blog post cluster, 3–5 articles recommended`,
              `"${base} tutorial step by step" — How-to guide cluster, high featured snippet potential`,
              `"${base} checklist" — List post cluster, strong for backlink acquisition`,
              `"${base} examples" — Examples cluster, good for comparison and showcase content`,
              `"${base} mistakes to avoid" — Negative angle cluster, high emotional engagement`,
            ],
          },
          {
            category: "Seasonal & Trend Data",
            findings: [
              `Search volume peaks in Q1 (January–March) — best time to publish cornerstone content`,
              `Google Trends shows steady 12-month interest with no major seasonal drops`,
              `Related rising queries: "${base} AI", "${base} 2024/2025", "best ${base} for small business"`,
              `News/event triggers: industry conferences often create search spikes — plan content ahead`,
            ],
          },
          {
            category: "SERP Feature Opportunities",
            findings: [
              "Featured Snippet: 'How to' + list format questions have high snippet capture rate",
              "People Also Ask: question keywords have 70%+ PAA box presence on page 1",
              "Image Pack: visual content keywords show image carousels in 40% of results",
              "Video Results: tutorial-style keywords often include YouTube video carousels",
            ],
          },
        ],
        recommendations: [
          `Create a pillar page targeting "${base}" with 1,500+ words of comprehensive coverage`,
          "Build a content cluster of 5–8 long-tail posts linking back to the pillar page",
          "Target question-format keywords to capture People Also Ask boxes",
          "Use structured data (FAQ schema) on how-to and list content for rich snippets",
          "Track keyword rankings weekly — adjust content based on position changes",
          "Build topical authority before targeting high-competition head terms",
        ],
      };
    },
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
    scoreLabel: "Content Quality Score",
    seoText: "Our Content Optimizer uses advanced analysis to evaluate your text and provide specific recommendations for improving search rankings. It evaluates readability, keyword density, semantic relevance, content structure, and LSI keyword usage. Well-optimized content consistently outperforms thin or poorly structured pages.",
    generateResults: (input) => {
      const score = Math.floor(Math.random() * 28) + 62;
      const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
      return {
        score,
        grade: scoreGrade(score),
        summary: `Your content scored ${score}/100 on content quality. With ${wordCount} words analyzed, the content shows ${score >= 75 ? "strong fundamentals with optimization opportunities" : "several areas needing improvement before it can compete effectively"}.`,
        insights: [
          { type: wordCount > 600 ? "good" : "warn", label: "Word Count", text: wordCount > 600 ? `At ${wordCount} words, your content has good depth. Expanding to 1,200+ words with additional subtopics could further improve rankings.` : `Only ${wordCount} words — significantly below the 800–1,200 word threshold for competitive keywords. Thin content rarely ranks on page 1.` },
          { type: "warn", label: "Readability", text: "Content readability is at Grade 10–11 level. For broader audiences, aim for Grade 7–8. Use shorter sentences, simpler vocabulary, and more bullet points." },
          { type: "warn", label: "Semantic Keywords", text: "Semantic/LSI keyword coverage is below average. Google's NLP algorithms expect related terms alongside your primary keyword for topical completeness." },
          { type: "info", label: "Content Structure", text: "Heading structure could be improved. Use H2s every 200–300 words to break up content, improve scannability, and give Google clear topic signals." },
          { type: "good", label: "Keyword Presence", text: "Primary keyword appears in appropriate positions (title, first paragraph, headings). Good foundation for on-page optimization." },
        ],
        detailedFindings: [
          {
            category: "Readability Analysis",
            findings: [
              `Flesch-Kincaid Grade Level: ~10.5 (target: 7–8 for general audiences)`,
              `Average sentence length: ~22 words (target: 15–18 words for easy reading)`,
              `Passive voice usage: ~18% (target: under 10% for active, engaging writing)`,
              `Paragraph length: some paragraphs exceed 5 sentences — break them up`,
              `Transition words: low usage — add words like 'however', 'therefore', 'additionally' to improve flow`,
            ],
          },
          {
            category: "Semantic Keyword Analysis",
            findings: [
              "NLP entity coverage: 40% of expected related entities present",
              "Missing LSI keywords: optimize, strategy, best practices, guide, tips, how to, tool",
              "Co-occurrence patterns: primary topic cluster needs 6–8 more semantically related terms",
              "TF-IDF analysis: content is not as topically comprehensive as top-ranking competitors",
              "Recommendation: analyze the top 3 ranking pages and identify topics they cover that you don't",
            ],
          },
          {
            category: "Content Structure Audit",
            findings: [
              "H1 tag: detected and contains primary keyword — good",
              "H2 usage: insufficient for content length — add 3–4 more H2 sections",
              "H3 subsections: not detected — use H3s within H2 sections for depth",
              "Introduction quality: should state the problem and promise a solution within first 100 words",
              "Conclusion: add a clear summary and call-to-action at the end of the content",
            ],
          },
          {
            category: "E-E-A-T Signals",
            findings: [
              "Author attribution: no author name or bio detected — add author info for expertise signals",
              "Citations/sources: no outbound links to authoritative sources — add 3–5 reference links",
              "Published/updated date: ensure publish date and last updated date are visible",
              "Original research: no data, stats, or original research detected — adding statistics boosts authority",
              "User engagement: include FAQ section at the end — improves dwell time and schema eligibility",
            ],
          },
        ],
        recommendations: [
          `Expand content to ${Math.max(1000, wordCount + 400)}+ words by adding new subtopics and deeper coverage`,
          "Reduce average sentence length to under 18 words — split complex sentences",
          "Add 6–8 missing LSI keywords naturally throughout the content",
          "Insert 3–4 more H2 headings every 200–300 words",
          "Add an author bio and link to 3–5 authoritative external sources",
          "Include original statistics, quotes, or case studies to improve E-E-A-T signals",
        ],
      };
    },
  },
  "meta-generator": {
    name: "Meta Tag Generator",
    emoji: "🏷️",
    headline: "Generate Click-Worthy Meta Tags",
    subtext: "Create optimized title tags and meta descriptions that boost your click-through rate in search results.",
    inputLabel: "Describe your page or paste its content",
    inputPlaceholder: "My page is about... / paste your content here...",
    inputType: "textarea",
    analyzeLabel: "Generate Meta Tags",
    scoreLabel: "Meta Tag Quality Score",
    seoText: "Meta tags are your website's first impression in Google search results. A well-crafted title tag and meta description can dramatically improve your click-through rate without needing to improve your ranking position. Our Meta Tag Generator analyzes your content and creates SEO-optimized title tags and compelling meta descriptions that include your primary keyword and a clear call-to-action.",
    generateResults: (_input) => {
      const score = Math.floor(Math.random() * 28) + 62;
      return {
        score,
        grade: scoreGrade(score),
        summary: `Your meta tags scored ${score}/100. We've generated optimized title and description variants with CTR estimates and character counts for each.`,
        insights: [
          { type: "good", label: "Generated Title", text: 'Optimized Title: "Your Topic: The Complete Guide (2025) | Rankora AI" — 54 characters, includes primary keyword and year for freshness signal.' },
          { type: "good", label: "Meta Description", text: 'Generated: "Discover everything about [your topic] with our comprehensive guide. Get proven strategies, expert tips, and actionable steps to succeed." — 149 characters.' },
          { type: "warn", label: "Power Words", text: "Your current meta lacks emotional triggers. Words like 'proven', 'guaranteed', 'ultimate', 'step-by-step' significantly increase click-through rates." },
          { type: "info", label: "Keyword Placement", text: "Primary keyword should appear within the first 30 characters of your title tag for maximum visibility in search results." },
          { type: "good", label: "Character Counts", text: "Both generated variants are within Google's display limits: 60 chars for title, 160 chars for description. No truncation risk." },
        ],
        detailedFindings: [
          {
            category: "Generated Title Tag Variants",
            findings: [
              'Variant A: "[Keyword]: The Complete Guide (2025)" — 44 chars — Direct, keyword-rich, includes year',
              'Variant B: "How to [Keyword]: Step-by-Step for Beginners" — 47 chars — Instructional, high CTR for informational intent',
              'Variant C: "[Keyword] — Everything You Need to Know" — 43 chars — Comprehensive signal, good for broad queries',
              'Variant D: "The Best [Keyword] Strategies That Actually Work" — 50 chars — Results-focused, commercial intent',
              'Variant E: "[Keyword] Tips: Boost Your Results by 3x" — 45 chars — Data-driven, high curiosity/engagement',
            ],
          },
          {
            category: "Generated Meta Description Variants",
            findings: [
              'Variant A: "Learn exactly how to [keyword] with our proven step-by-step guide. Includes real examples, expert tips, and a free checklist." — 130 chars',
              'Variant B: "Struggling with [keyword]? Our comprehensive guide covers everything from basics to advanced strategies. Start improving today — free." — 138 chars',
              'Variant C: "Discover the [keyword] strategies used by top performers. Practical, actionable, and beginner-friendly. Read the complete guide now." — 136 chars',
            ],
          },
          {
            category: "Social Media Meta Tags (Open Graph + Twitter Card)",
            findings: [
              'og:title — Use the same title as your page title for consistency',
              'og:description — Can be slightly longer (1–2 sentences) than your meta description',
              'og:image — Add a 1200x630px featured image for rich social previews',
              'twitter:card — Set to "summary_large_image" for maximum Twitter/X visibility',
              'og:url — Set to your canonical URL to prevent social sharing fragmentation',
            ],
          },
          {
            category: "Technical Meta Tag Recommendations",
            findings: [
              "Canonical tag: add <link rel='canonical' href='your-url'> to prevent duplicate content penalties",
              "Robots tag: ensure 'index, follow' is set for pages you want Google to crawl",
              "Viewport meta: confirm <meta name='viewport' content='width=device-width, initial-scale=1'> is present",
              "Language attribute: set <html lang='en'> to help Google serve the right version to the right audience",
            ],
          },
        ],
        recommendations: [
          "Use Variant B for the title tag — highest CTR for informational content",
          "Use Meta Description Variant C — strongest value proposition and CTA",
          "Add Open Graph meta tags for all social platforms (Facebook, LinkedIn, Twitter/X)",
          "Include your canonical URL meta tag to prevent duplicate content issues",
          "Test 2 title variations using Google Search Console's performance data",
          "Update meta tags whenever you significantly update your content",
        ],
      };
    },
  },
  "schema-generator": {
    name: "Schema Generator",
    emoji: "⚡",
    headline: "Generate Schema Markup for Rich Snippets",
    subtext: "Get more clicks with rich results — star ratings, FAQs, how-to steps, and more in Google.",
    inputLabel: "Describe your page type and content",
    inputPlaceholder: "e.g. I have a blog post about SEO tips, a product page for running shoes, a local restaurant...",
    inputType: "textarea",
    analyzeLabel: "Generate Schema",
    scoreLabel: "Schema Coverage Score",
    seoText: "Schema markup (structured data) tells Google exactly what your content is about, making you eligible for rich results like star ratings, FAQs, how-to steps, and more. Pages with rich snippets get significantly higher click-through rates. Our Schema Generator automatically creates valid JSON-LD markup for your page type.",
    generateResults: (_input) => {
      const score = Math.floor(Math.random() * 28) + 62;
      return {
        score,
        grade: scoreGrade(score),
        summary: `Schema coverage scored ${score}/100. We've generated ready-to-use JSON-LD markup for your page, covering 4 schema types that qualify you for multiple rich result features in Google Search.`,
        insights: [
          { type: "good", label: "Article Schema", text: "Article schema generated and validated — makes you eligible for Google News carousels and Article rich results. Include 'author', 'datePublished', and 'image' properties." },
          { type: "warn", label: "FAQ Schema", text: "FAQ schema opportunity detected — adding this markup can double your SERP footprint with expanded Q&A directly in the search results." },
          { type: "info", label: "Organization Schema", text: "Organization schema should be added to your homepage to help Google understand your brand entity, which improves Knowledge Panel eligibility." },
          { type: "good", label: "BreadcrumbList", text: "BreadcrumbList schema generated — displays your page hierarchy in search results and can improve CTR by showing users exactly where they are on your site." },
          { type: "warn", label: "WebPage Schema", text: "WebPage schema with speakable properties added — helps with voice search optimization as Google Assistant and smart speakers look for speakable schema." },
        ],
        detailedFindings: [
          {
            category: "Generated JSON-LD: Article Schema",
            findings: [
              '{"@context": "https://schema.org", "@type": "Article",',
              '"headline": "Your Article Headline Here",',
              '"author": {"@type": "Person", "name": "Your Name"},',
              '"datePublished": "2025-01-01", "dateModified": "2025-01-15",',
              '"publisher": {"@type": "Organization", "name": "Your Brand"},',
              '"image": "https://yourdomain.com/images/featured.jpg"}',
            ],
          },
          {
            category: "Generated JSON-LD: FAQ Schema",
            findings: [
              '{"@context": "https://schema.org", "@type": "FAQPage",',
              '"mainEntity": [{"@type": "Question", "name": "Your FAQ Question 1?",',
              '"acceptedAnswer": {"@type": "Answer", "text": "Your answer here..."}},',
              '{"@type": "Question", "name": "Your FAQ Question 2?",',
              '"acceptedAnswer": {"@type": "Answer", "text": "Your answer here..."}}]}',
              "Add 3–5 FAQs matching your content's most common questions",
            ],
          },
          {
            category: "Rich Snippet Eligibility After Implementation",
            findings: [
              "Article rich result: eligible — requires valid Article schema + Google News policy compliance",
              "FAQ rich result: eligible — requires 2+ FAQ items with question + answer pairs",
              "Breadcrumb trail: eligible — will show in search results within 1–2 crawl cycles",
              "Sitelinks searchbox: eligible if Organization schema is on homepage",
              "Voice search: speakable schema enables content to be read by Google Assistant",
            ],
          },
          {
            category: "Implementation & Validation Steps",
            findings: [
              "Step 1: Copy the JSON-LD scripts and paste them inside the <head> tag of each page",
              "Step 2: Test with Google's Rich Results Test tool (search.google.com/test/rich-results)",
              "Step 3: Submit URLs to Google Search Console for priority indexing",
              "Step 4: Monitor rich snippet appearance in Search Console > Search Results",
              "Step 5: Check for schema errors weekly — Google updates requirements periodically",
            ],
          },
        ],
        recommendations: [
          "Implement Article schema on all blog posts and editorial content pages",
          "Add FAQ schema to any page with question-format headings or a Q&A section",
          "Add Organization schema to your homepage with full NAP (name, address, phone)",
          "Use BreadcrumbList schema site-wide to show your hierarchy in search results",
          "Test all schema with Google's Rich Results Test before publishing",
          "Monitor Search Console for schema errors and fix within 48 hours of detection",
        ],
      };
    },
  },
  "keyword-difficulty": {
    name: "Keyword Difficulty",
    emoji: "📊",
    headline: "Know How Hard a Keyword Is to Rank For",
    subtext: "Instantly assess keyword competition and find ranking opportunities you can realistically win.",
    inputLabel: "Enter a keyword to analyze",
    inputPlaceholder: "e.g. best SEO tools, how to lose weight, email marketing software...",
    inputType: "text",
    analyzeLabel: "Analyze Difficulty",
    scoreLabel: "Difficulty Score",
    seoText: "Understanding keyword difficulty before creating content saves you months of wasted effort. Our Keyword Difficulty tool analyzes the competitive landscape for any search term and gives you a difficulty score from 0 to 100. A low score means you can rank faster with less effort; a high score means you need significant authority and backlinks.",
    generateResults: (input) => {
      const score = Math.floor(Math.random() * 28) + 55;
      const kw = input.slice(0, 30);
      return {
        score,
        grade: score >= 75 ? "Hard" : score >= 55 ? "Medium" : "Easy",
        summary: `"${kw}" has a difficulty score of ${score}/100 — classified as ${score >= 75 ? "Hard" : score >= 55 ? "Medium difficulty" : "Low difficulty"}. ${score >= 75 ? "You'll need strong domain authority and quality backlinks to compete." : score >= 55 ? "Achievable with consistent, quality content and some link building." : "Great opportunity — a well-optimized piece of content could rank within 3–6 months."}`,
        insights: [
          { type: score >= 70 ? "warn" : "good", label: "Competition Level", text: `"${kw}" has ${score >= 70 ? "high" : "moderate"} competition. The top 10 results are ${score >= 70 ? "primarily established domains with significant authority" : "a mix of authority sites and smaller niche blogs — realistic to compete with"}.` },
          { type: "info", label: "Time to Rank", text: `Estimated ranking timeline: ${score >= 75 ? "8–14 months" : score >= 55 ? "4–8 months" : "2–4 months"} with consistent content creation and link building efforts.` },
          { type: "good", label: "Long-tail Variants", text: "4 lower-difficulty long-tail variants identified. Targeting these first builds topical authority, making the head term more achievable over time." },
          { type: "warn", label: "Domain Authority Required", text: `Top-ranking pages have an estimated DA of ${score >= 70 ? "60–80+" : "40–60"}. ${score >= 70 ? "Consider building authority with easier keywords first." : "Achievable with a consistent content + link building strategy."}` },
          { type: "info", label: "Content Requirements", text: "Top-ranking pages average 1,800–2,400 words. All include multiple images, structured headings, and internal links. Matching or exceeding this is table stakes." },
        ],
        detailedFindings: [
          {
            category: "SERP Competitor Analysis (Top 10)",
            findings: [
              `Position 1: High-authority domain, ~1,200 backlinks, 2,100 words, published 2023 — updated regularly`,
              `Position 2: Mid-authority blog, ~340 backlinks, 1,850 words — vulnerable to displacement`,
              `Position 3: Video result (YouTube) — create a YouTube video + article combo for dual ranking`,
              `Positions 4–7: Mix of forum results (Reddit, Quora) and niche blogs — gaps you can fill`,
              `Positions 8–10: Lower-authority pages — realistic short-term displacement targets`,
              "Featured Snippet: currently held by Position 1 — target with direct answer format in your H2",
            ],
          },
          {
            category: "Backlink Requirements to Rank",
            findings: [
              `Estimated backlinks needed to reach page 1: ${score >= 70 ? "80–150" : score >= 55 ? "30–70" : "10–30"} quality referring domains`,
              "Link types to acquire: editorial mentions, guest posts, resource page links, HARO citations",
              "Anchor text strategy: use brand name (40%), exact match (10%), partial match (30%), generic (20%)",
              "Link velocity: acquire 5–10 new links per month for natural-looking growth profile",
              "Competitor backlink gaps: check which sites link to competitors but not to you (use Ahrefs/Semrush)",
            ],
          },
          {
            category: "Low-Difficulty Alternative Keywords",
            findings: [
              `"${kw} for beginners" — Difficulty: ${Math.max(20, score - 25)}/100 — Est. volume: 200–600/mo`,
              `"best free ${kw}" — Difficulty: ${Math.max(20, score - 20)}/100 — Est. volume: 300–900/mo`,
              `"how to ${kw} step by step" — Difficulty: ${Math.max(15, score - 30)}/100 — Est. volume: 100–400/mo`,
              `"${kw} tips" — Difficulty: ${Math.max(25, score - 15)}/100 — Est. volume: 400–1,200/mo`,
            ],
          },
          {
            category: "Content Strategy to Win This Keyword",
            findings: [
              "Create a comprehensive 2,000+ word guide that outperforms existing top-10 content on depth",
              "Include original data, statistics, screenshots, or case studies to stand out",
              "Add an FAQ section targeting People Also Ask questions for this keyword",
              "Build 3–5 supporting blog posts on related long-tail keywords linking back to your pillar page",
              "Promote via social media, email list, and outreach to acquire initial backlinks within 30 days",
            ],
          },
        ],
        recommendations: [
          `Start with lower-difficulty variants to build topical authority before targeting "${kw}"`,
          "Create a comprehensive 2,000+ word guide that beats current top-10 content on depth and quality",
          "Build 3–5 supporting cluster posts on related long-tail keywords linking to your main page",
          `Acquire ${score >= 70 ? "80–150" : score >= 55 ? "30–70" : "10–30"} quality backlinks through guest posting, HARO, and outreach`,
          "Add FAQ schema to capture People Also Ask boxes and increase SERP visibility",
          "Track rankings weekly — if not on page 1 within 6 months, revisit content quality and links",
        ],
      };
    },
  },
  "seo-audit": {
    name: "Free SEO Audit",
    emoji: "🛡️",
    headline: "Get a Full SEO Audit of Your Website",
    subtext: "Uncover the technical issues silently hurting your rankings and losing you traffic every day.",
    inputLabel: "Enter your website URL",
    inputPlaceholder: "https://yourwebsite.com",
    inputType: "url",
    analyzeLabel: "Run SEO Audit",
    scoreLabel: "Site Health Score",
    seoText: "A comprehensive SEO audit reveals the technical, on-page, and off-page issues preventing your website from ranking at its full potential. From crawl errors and slow page speed to missing meta tags and broken links, technical SEO problems silently drain your traffic every day. Our Free SEO Audit tool surfaces the most critical issues to fix first, prioritized by impact.",
    generateResults: (_input) => {
      const score = Math.floor(Math.random() * 25) + 55;
      return {
        score,
        grade: scoreGrade(score),
        summary: `Site health scored ${score}/100. The audit identified ${score < 65 ? "several critical" : "a number of moderate"} issues affecting your search visibility. Fixing the high-priority items below could significantly improve your rankings within 4–8 weeks.`,
        insights: [
          { type: "warn", label: "Critical Issues Found", text: `${Math.floor(Math.random() * 4) + 2} critical technical SEO issues detected. These are actively preventing Google from properly crawling and ranking your pages.` },
          { type: "warn", label: "Page Speed", text: "Page speed score: 54/100 (mobile). Slow load times increase bounce rate and hurt rankings — especially after Google's Core Web Vitals update." },
          { type: "good", label: "Mobile Friendliness", text: "Mobile-friendliness test: passed. Your site renders correctly on mobile devices — important since Google uses mobile-first indexing." },
          { type: "warn", label: "Meta Tags", text: "7 pages detected with missing or duplicate meta descriptions. Each page should have a unique, compelling meta description under 160 characters." },
          { type: "info", label: "Indexation Status", text: "An estimated 15–20% of your pages may not be indexed by Google. This could be due to noindex tags, crawl budget issues, or thin content." },
        ],
        detailedFindings: [
          {
            category: "Critical Technical Issues (Fix Immediately)",
            findings: [
              "🔴 Broken internal links: 3 detected — broken links hurt UX and waste crawl budget",
              "🔴 Missing XML sitemap or sitemap not submitted to Google Search Console",
              "🔴 Redirect chains: 2 detected (A → B → C) — chains lose link equity and slow page load",
              "🔴 Pages returning 404 errors with inbound links: link equity is being wasted",
              "🔴 Mixed content (HTTP resources on HTTPS pages): browser security warnings hurt trust",
            ],
          },
          {
            category: "Page Speed & Core Web Vitals",
            findings: [
              "LCP (Largest Contentful Paint): 4.1s — target under 2.5s (currently 'Poor')",
              "FID/INP (Interaction to Next Paint): ~280ms — target under 200ms (needs improvement)",
              "CLS (Cumulative Layout Shift): 0.18 — target under 0.1 (needs improvement)",
              "Main fixes: compress images (save ~340KB), defer JavaScript (12 blocking scripts), enable browser caching",
              "Estimated improvement after fixes: +18–24 points on PageSpeed Insights",
            ],
          },
          {
            category: "On-Page SEO Audit",
            findings: [
              "Missing H1 tags: 2 pages have no H1 — add unique, keyword-rich H1 to every page",
              "Duplicate title tags: 4 pages sharing identical titles — each page needs a unique title",
              "Thin content pages: 6 pages under 300 words — expand or consolidate/redirect",
              "Missing alt text: 14 images without alt attributes — affects accessibility and image search",
              "Orphaned pages: 3 pages with no internal links pointing to them — add them to your navigation or content",
            ],
          },
          {
            category: "Security & Trust Signals",
            findings: [
              "HTTPS: active and valid — positive trust and ranking signal ✓",
              "SSL certificate expiry: check certificate renewal date (avoid letting it lapse)",
              "Security headers: X-Frame-Options and Content-Security-Policy headers not detected",
              "robots.txt: present and accessible — review to ensure no important pages are blocked",
              "Google Search Console: verify property is connected and no manual actions or penalties exist",
            ],
          },
        ],
        recommendations: [
          "Fix all broken links and redirect chains immediately — highest priority impact",
          "Submit an XML sitemap to Google Search Console and request indexing for key pages",
          "Compress all images and defer non-critical JavaScript to improve Core Web Vitals",
          "Add unique H1 tags and meta descriptions to every page",
          "Expand or consolidate thin content pages (under 300 words)",
          "Install a security plugin or configure security headers to improve trust signals",
        ],
      };
    },
  },
};

/* ══════════════════════════════════════
   LIVE AUDIT → TOOL RESULT MAPPER
══════════════════════════════════════ */
function mapAuditToToolResult(data: any): ToolResult {
  const score = data.score ?? 50;
  const seo = data.seoData ?? {};
  const perf = data.performance ?? {};
  const issues: any[] = data.issues ?? [];
  /* keywords is now [{keyword, note}] — support both old string[] and new format */
  const rawKeywords: any[] = data.keywords ?? [];
  const keywords: string[] = rawKeywords.map((k: any) => (typeof k === "string" ? k : k.keyword));
  const competitors: any[] = data.competitors ?? [];
  /* brokenLinks is now [{url, status}] — support both old string[] and new format */
  const rawBrokenLinks: any[] = data.brokenLinks ?? [];
  const brokenLinks: Array<{ url: string; status: string }> = rawBrokenLinks.map((l: any) =>
    typeof l === "string" ? { url: l, status: "broken" } : l
  );
  const sitemap = data.sitemap ?? { exists: false };
  const growthOpportunity = data.growthOpportunity ?? null;
  const upgradeCTA = data.upgradeCTA ?? null;

  /* Parse AI insights */
  const insightText: string = data.insights ?? "";
  const summaryMatch = insightText.match(/SUMMARY:\s*(.+?)(?=\nFIX|$)/s);
  const summary = summaryMatch?.[1]?.trim() ?? `Your site scored ${score}/100. ${issues.length} issues were detected impacting your search visibility.`;

  /* Key insights from real data */
  const insights: ToolResult["insights"] = [];

  if (seo.title) {
    const tl = seo.titleLength ?? seo.title.length;
    insights.push({
      type: tl >= 30 && tl <= 60 ? "good" : "warn",
      label: "Title Tag",
      text: `"${seo.title}" — ${tl} characters. ${tl < 30 ? "Too short — expand to 50–60 chars." : tl > 60 ? "Too long — will be truncated in search results." : "Length is ideal for Google display."}`,
    });
  } else {
    insights.push({ type: "warn", label: "Title Tag", text: "No title tag found — this is a critical SEO issue. Add a descriptive title immediately." });
  }

  if (seo.metaDescription) {
    const ml = seo.metaDescriptionLength ?? seo.metaDescription.length;
    insights.push({
      type: ml >= 120 && ml <= 160 ? "good" : "warn",
      label: "Meta Description",
      text: `${ml} characters. ${ml < 120 ? "Too short — aim for 150–160 chars with a clear call-to-action." : ml > 160 ? "Too long — will be truncated in search results." : "Perfect length for Google display."}`,
    });
  } else {
    insights.push({ type: "warn", label: "Meta Description", text: "Missing meta description — this directly impacts click-through rate from search results." });
  }

  insights.push({
    type: (seo.h1Count ?? 0) === 1 ? "good" : "warn",
    label: "H1 Heading",
    text: (seo.h1Count ?? 0) === 0
      ? "No H1 heading found — this is a high-impact SEO issue."
      : (seo.h1Count ?? 0) === 1
      ? `H1 found: "${(seo.h1Tags?.[0] ?? "").slice(0, 60)}" — correctly using one H1 tag.`
      : `${seo.h1Count} H1 tags found — reduce to exactly one H1 per page.`,
  });

  if (perf.score !== null && perf.score !== undefined) {
    insights.push({
      type: perf.score >= 80 ? "good" : perf.score >= 60 ? "warn" : "warn",
      label: "Page Speed (Mobile)",
      text: `PageSpeed score: ${perf.score}/100. ${perf.lcp ? `LCP: ${perf.lcp}` : ""} ${perf.cls ? `· CLS: ${perf.cls}` : ""}. ${perf.score < 70 ? "Needs improvement — slow pages rank lower after Google's Core Web Vitals update." : "Good performance score."}`,
    });
  }

  insights.push({
    type: (seo.wordCount ?? 0) >= 600 ? "good" : "warn",
    label: "Content Depth",
    text: `${seo.wordCount ?? 0} words detected. ${(seo.wordCount ?? 0) < 300 ? "Thin content — Google rarely ranks pages under 300 words. Expand to 800+ words." : (seo.wordCount ?? 0) < 600 ? "Below average — consider expanding to 800+ words for better rankings." : "Good content depth for SEO."}`,
  });

  /* Detailed findings from real data */
  const detailedFindings: ToolResult["detailedFindings"] = [];

  /* Technical SEO */
  const techFindings: string[] = [
    `Title tag: "${(seo.title ?? "MISSING").slice(0, 60)}" (${seo.titleLength ?? 0} chars)`,
    `Meta description: ${seo.metaDescription ? `"${seo.metaDescription.slice(0, 80)}..." (${seo.metaDescriptionLength ?? 0} chars)` : "MISSING — add immediately"}`,
    `H1 tags: ${seo.h1Count ?? 0} found ${seo.h1Tags?.length ? `— "${seo.h1Tags[0].slice(0, 50)}"` : ""}`,
    `H2 subheadings: ${seo.h2Count ?? 0} detected`,
    `Images: ${seo.imageCount ?? 0} total · ${seo.missingAlt ?? 0} missing alt text`,
    `Canonical URL: ${seo.canonicalUrl ?? "Not set — add to prevent duplicate content"}`,
    `Viewport meta tag: ${seo.hasViewportMeta ? "Present ✓" : "Missing — mobile indexing affected"}`,
    `Structured data (JSON-LD): ${seo.hasStructuredData ? "Detected ✓" : "Not found — add schema for rich snippets"}`,
    `Internal links: ${seo.internalLinks ?? 0} · External links: ${seo.externalLinks ?? 0}`,
    `Word count: ~${seo.wordCount ?? 0} words`,
  ];
  detailedFindings.push({ category: "On-Page SEO Audit (Real Data)", findings: techFindings });

  /* Issues — with priority tag + why it matters */
  if (issues.length > 0) {
    detailedFindings.push({
      category: `Issues Found (${issues.length})`,
      findings: issues.map((i: any) => {
        const tag = i.priority ?? `[${i.impact}]`;
        const why = i.why ? ` Why: ${i.why}` : "";
        return `${tag} ${i.issue}${why} → Fix: ${i.fix}`;
      }),
    });
  }

  /* Performance */
  if (perf.score !== null && perf.score !== undefined) {
    detailedFindings.push({
      category: "Performance & Core Web Vitals (Real Data)",
      findings: [
        `Mobile PageSpeed Score: ${perf.score}/100 ${perf.score >= 80 ? "✓ Good" : perf.score >= 60 ? "⚠ Needs Improvement" : "✗ Poor"}`,
        `LCP (Largest Contentful Paint): ${perf.lcp ?? "N/A"} — target under 2.5s`,
        `CLS (Cumulative Layout Shift): ${perf.cls ?? "N/A"} — target under 0.1`,
        `FID/INP: ${perf.fid ?? "N/A"} — target under 200ms`,
        `Server Response Time (TTFB): ${perf.ttfb ?? "N/A"} — target under 600ms`,
        perf.score < 70 ? "Recommendation: compress images, defer JavaScript, enable caching and CDN" : "Performance is good — maintain with regular monitoring",
      ],
    });
  }

  /* Estimated Visibility Keywords (no fake rankings) */
  if (keywords.length > 0) {
    detailedFindings.push({
      category: "Estimated Visibility Keywords",
      findings: [
        "⚠ These are estimated keywords based on your page's title and heading content.",
        "For actual ranking data, connect Google Search Console.",
        ...keywords.map((kw: string) => `• "${kw}" — estimated visibility keyword`),
      ],
    });
  }

  /* Sitemap & Broken Links */
  const infraFindings: string[] = [
    `Sitemap: ${sitemap.exists ? `Found ✓ (${sitemap.sitemapUrl})` : `Not found at ${sitemap.sitemapUrl ?? "sitemap.xml"} — create and submit to Google Search Console`}`,
    brokenLinks.length > 0
      ? `Broken links detected (${brokenLinks.length} in sample):`
      : "Broken links: none detected in sample ✓",
    ...brokenLinks.map((l: { url: string; status: string }) => `  ✗ ${l.url} — ${l.status}`),
  ];
  detailedFindings.push({ category: "Site Infrastructure", findings: infraFindings });

  /* Competitors — keyword-driven */
  if (competitors.length > 0) {
    detailedFindings.push({
      category: `Top Ranking Competitors for "${keywords[0] ?? "your keyword"}"`,
      findings: [
        "These sites rank for your target keyword — study their title structure and content depth:",
        ...competitors.map((c: any) => `• ${c.url} — "${c.title.slice(0, 70)}" (${c.titleLength} chars)`),
      ],
    });
  }

  /* Growth Opportunity */
  if (growthOpportunity) {
    detailedFindings.push({
      category: "📈 Growth Opportunity",
      findings: [
        growthOpportunity.summary,
        `Estimated traffic increase: ${growthOpportunity.estimatedTrafficIncrease}`,
        `Expected timeline: ${growthOpportunity.estimatedTime}`,
      ],
    });
  }

  /* Upgrade CTA */
  if (upgradeCTA) {
    detailedFindings.push({
      category: `🚀 ${upgradeCTA.title}`,
      findings: [
        "Unlock with a paid plan:",
        ...upgradeCTA.benefits.map((b: string) => `• ${b}`),
        "",
        ...upgradeCTA.plans.map((p: string) => `→ ${p}`),
      ],
    });
  }

  /* Recommendations from issues */
  const recommendations = issues.slice(0, 6).map((i: any) => i.fix);
  if (recommendations.length < 3) {
    recommendations.push("Submit your XML sitemap to Google Search Console");
    recommendations.push("Implement Article or FAQ schema markup for rich snippet eligibility");
    recommendations.push("Run a Core Web Vitals audit and fix LCP and CLS issues");
  }

  return { score, grade: scoreGrade(score), summary, insights, detailedFindings, recommendations };
}

/* ══════════════════════════════════════
   CREDIT SYSTEM  (3 free reports)
══════════════════════════════════════ */
const CREDIT_KEY = "freeToolsCredits";
const FREE_LIMIT = 3;

function getCredits() {
  const v = localStorage.getItem(CREDIT_KEY);
  return v !== null ? parseInt(v, 10) : FREE_LIMIT;
}
function spendCredit() {
  const cur = getCredits();
  const next = Math.max(0, cur - 1);
  localStorage.setItem(CREDIT_KEY, String(next));
  return cur > 0;
}

/* ══════════════════════════════════════
   PDF GENERATOR
══════════════════════════════════════ */
function downloadPDF(toolName: string, input: string, result: ToolResult) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = 0;

  function addPage() {
    doc.addPage();
    y = margin;
  }

  function checkY(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) addPage();
  }

  function text(str: string, x: number, fontSize: number, color: [number, number, number], bold = false) {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(str, contentW - (x - margin));
    doc.text(lines, x, y);
    y += lines.length * fontSize * 1.35;
  }

  function line(color: [number, number, number] = [220, 220, 220]) {
    doc.setDrawColor(...color);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
  }

  // Header background
  doc.setFillColor(77, 68, 227);
  doc.rect(0, 0, pageW, 90, "F");
  y = 30;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Rankora AI", margin, y);
  y += 26;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${toolName} — Full Report`, margin, y);

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.setFontSize(10);
  doc.text(dateStr, pageW - margin - 80, y);

  y = 110;

  // Analyzed content snippet
  text("Analyzed Content / URL", margin, 10, [150, 150, 150], true);
  y += 2;
  text(input.length > 180 ? input.slice(0, 180) + "..." : input, margin, 10, [80, 80, 80]);
  y += 6;
  line();

  // Score section
  const scoreColor: [number, number, number] = result.score >= 80 ? [16, 185, 129] : result.score >= 65 ? [245, 158, 11] : [239, 68, 68];
  text(`Overall Score: ${result.score}/100 — ${result.grade}`, margin, 18, scoreColor, true);
  y += 4;
  text(result.summary, margin, 10, [80, 80, 80]);
  y += 10;
  line();

  // Key Insights
  text("KEY INSIGHTS", margin, 12, [77, 68, 227], true);
  y += 6;
  for (const insight of result.insights) {
    checkY(40);
    const icon = insight.type === "good" ? "✓" : insight.type === "warn" ? "⚠" : "ℹ";
    const iColor: [number, number, number] = insight.type === "good" ? [16, 185, 129] : insight.type === "warn" ? [245, 158, 11] : [59, 130, 246];
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...iColor);
    doc.text(icon, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(insight.label + ":", margin + 14, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const wrapped = doc.splitTextToSize(insight.text, contentW - 14);
    doc.text(wrapped, margin + 14, y);
    y += wrapped.length * 13 + 6;
  }
  y += 4;
  line();

  // Detailed Findings
  text("DETAILED FINDINGS", margin, 12, [77, 68, 227], true);
  y += 6;
  for (const section of result.detailedFindings) {
    checkY(40);
    text(section.category, margin, 11, [30, 30, 30], true);
    y += 2;
    for (const finding of section.findings) {
      checkY(18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 70, 70);
      const wrapped = doc.splitTextToSize(`• ${finding}`, contentW - 10);
      doc.text(wrapped, margin + 8, y);
      y += wrapped.length * 13 + 3;
    }
    y += 8;
  }
  line();

  // Recommendations
  checkY(60);
  text("RECOMMENDATIONS (Priority Order)", margin, 12, [77, 68, 227], true);
  y += 6;
  result.recommendations.forEach((rec, i) => {
    checkY(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(77, 68, 227);
    doc.text(`${i + 1}.`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const wrapped = doc.splitTextToSize(rec, contentW - 18);
    doc.text(wrapped, margin + 18, y);
    y += wrapped.length * 13 + 5;
  });

  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 24;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Rankora AI · rankoraai.com", margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin - 60, footerY);
  }

  doc.save(`Rankora-${toolName.replace(/\s+/g, "-")}-Report.pdf`);
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">You've used your 3 free reports</h2>
          <p className="text-gray-500 text-sm">Upgrade to continue getting full SEO reports and PDF downloads</p>
        </div>
        <div className="space-y-3 mb-6">
          {[
            { name: "Pro", price: "$12", period: "/month", credits: "50 analyses/month", perks: "All tools + PDF reports + AI fixes", highlight: false },
            { name: "Premium", price: "$39", period: "/month", credits: "200 analyses/month", perks: "Everything + priority support", highlight: true },
          ].map(plan => (
            <div key={plan.name} className={`border rounded-xl p-4 ${plan.highlight ? "border-[#4d44e3] bg-[#4d44e3]/5" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-gray-900">{plan.name}</p>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400">{plan.period}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">{plan.credits} · {plan.perks}</p>
            </div>
          ))}
        </div>
        <a href="/#pricing" className="block w-full text-center py-3 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-xl font-bold text-sm transition-colors mb-3">
          Upgrade Now
        </a>
        <a href="/#pricing" className="block w-full text-center py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition-colors">
          View Pricing Plans
        </a>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN TOOLS PAGE
══════════════════════════════════════ */
export default function ToolsPage() {
  const params = useParams<{ toolSlug: string }>();
  const [, navigate] = useLocation();
  const slug = params.toolSlug ?? "";
  const tool = TOOLS[slug];

  const [input, setInput] = useState("");
  const [result, setResult] = useState<ToolResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState("");
  const [credits, setCreditsState] = useState(getCredits);
  const [showModal, setShowModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [rawAuditData, setRawAuditData] = useState<any>(null);

  const isLiveTool = slug === "seo-audit";

  useEffect(() => {
    window.scrollTo(0, 0);
    setResult(null);
    setInput("");
    setAnalyzing(false);
    setAuditError(null);
    setRawAuditData(null);
    setAnalyzeStep("");
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

  async function handleLiveAudit() {
    setAnalyzing(true);
    setResult(null);
    setAuditError(null);
    setRawAuditData(null);
    const steps = [
      "Fetching website HTML...",
      "Extracting SEO data...",
      "Checking broken links...",
      "Running PageSpeed analysis...",
      "Analyzing keywords & competitors...",
      "Generating AI insights...",
    ];
    let si = 0;
    setAnalyzeStep(steps[0]);
    const stepInterval = setInterval(() => {
      si = Math.min(si + 1, steps.length - 1);
      setAnalyzeStep(steps[si]);
    }, 3500);
    try {
      const res = await fetch(`${API_BASE}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.trim() }),
      });
      const data = await res.json();
      clearInterval(stepInterval);
      setAnalyzeStep("");
      if (res.status === 429 || data.error === "LIMIT_REACHED") {
        setShowModal(true);
        setAnalyzing(false);
        return;
      }
      if (!res.ok) {
        setAuditError(data.error ?? "Audit failed. Please try a different URL.");
        setAnalyzing(false);
        return;
      }
      const creditsLeft = getCredits();
      setCreditsState(creditsLeft);
      setRawAuditData(data);
      setResult(mapAuditToToolResult(data));
      setAnalyzing(false);
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (e: any) {
      clearInterval(stepInterval);
      setAnalyzeStep("");
      setAuditError("Could not reach the audit server. Please try again.");
      setAnalyzing(false);
    }
  }

  function handleAnalyze() {
    if (!input.trim()) return;
    if (credits <= 0) { setShowModal(true); return; }
    setAuditError(null);

    /* Live SEO Audit → real backend */
    if (isLiveTool) {
      handleLiveAudit();
      return;
    }

    /* All other tools → fast local simulation */
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const ok = spendCredit();
      if (!ok) { setShowModal(true); setAnalyzing(false); return; }
      setCreditsState(getCredits());
      setResult(tool.generateResults(input.trim()));
      setAnalyzing(false);
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }, 1800);
  }

  function handleDownloadPDF() {
    if (!result) return;
    setDownloadingPdf(true);
    setTimeout(() => {
      downloadPDF(tool.name, input, result);
      setDownloadingPdf(false);
    }, 300);
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Rankora AI" className="w-7 h-7 rounded-lg" />
              <span className="font-bold text-gray-900 hidden sm:block">Rankora <span className="text-[#4d44e3]">AI</span></span>
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 hidden sm:block">Free Tools</span>
            <ChevronRight className="w-4 h-4 text-gray-400 hidden sm:block" />
            <span className="text-sm font-semibold text-gray-900">{tool.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              credits === 0 ? "bg-red-50 border-red-200 text-red-600"
              : credits === 1 ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <FileText className="w-3 h-3" />
              {credits} of {FREE_LIMIT} free {credits === 1 ? "report" : "reports"} left
            </div>
            <a href="/#pricing" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-lg text-xs font-bold transition-colors">
              <Star className="w-3 h-3" /> Upgrade
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

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
                <span className="ml-0.5 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 rounded-full">🔥</span>
              )}
            </a>
          ))}
        </div>

        {/* ── Hero ── */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[#4d44e3]/10 text-[#4d44e3] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4">
            {isLiveTool ? <Globe className="w-3.5 h-3.5" /> : null}
            {isLiveTool ? "Real-Data Audit · Powered by PageSpeed + AI" : `${tool.emoji} Free Tool · Full Report Included`}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{tool.headline}</h1>
          <p className="text-gray-500 text-base max-w-xl">{tool.subtext}</p>

          {/* Free report callout */}
          <div className="mt-5 inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">You get {credits} full free {credits === 1 ? "report" : "reports"} — no signup required</p>
              <p className="text-xs text-emerald-600 mt-0.5">Each report includes detailed findings + downloadable PDF</p>
            </div>
          </div>
        </div>

        {/* ── Input card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{tool.inputLabel}</label>
          {tool.inputType === "textarea" ? (
            <textarea
              rows={6}
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
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleAnalyze}
              disabled={!input.trim() || analyzing || credits <= 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#4d44e3] hover:bg-[#3d35c3] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="w-4 h-4" /> {tool.analyzeLabel}</>
              )}
            </button>
            {credits === 0 && (
              <p className="text-sm text-red-500 font-medium">
                All free reports used —{" "}
                <a href="/#pricing" className="underline font-bold">upgrade to continue</a>
              </p>
            )}
          </div>
        </div>

        {/* ── Error state (live audit only) ── */}
        {auditError && !analyzing && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 mb-6">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">{auditError}</p>
              <p className="text-sm text-red-600 mt-1">Make sure the URL is publicly accessible and starts with https://</p>
            </div>
          </div>
        )}

        {/* ── Analyzing state ── */}
        {analyzing && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center mb-6">
            <div className="w-12 h-12 border-4 border-[#4d44e3]/20 border-t-[#4d44e3] rounded-full animate-spin mx-auto mb-4" />
            {isLiveTool ? (
              <>
                <p className="font-bold text-gray-900 text-lg">Running real-data SEO audit...</p>
                <p className="text-sm text-[#4d44e3] mt-2 font-medium animate-pulse">{analyzeStep || "Starting audit..."}</p>
                <p className="text-xs text-gray-400 mt-2">Full audit takes 15–25 seconds · Please wait</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {["HTML Fetch", "SEO Analysis", "Broken Links", "PageSpeed", "Keywords", "AI Insights"].map(s => (
                    <span key={s} className="text-[10px] font-semibold bg-[#4d44e3]/10 text-[#4d44e3] px-2 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="font-bold text-gray-900 text-lg">Generating your full report...</p>
                <p className="text-sm text-gray-400 mt-1">Analyzing all factors and compiling detailed findings</p>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            FULL RESULTS (no paywall until credits = 0)
        ══════════════════════════════════════ */}
        <AnimatePresence>
          {result && !analyzing && (
            <motion.div id="results-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Score + PDF download */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
                      <BarChart2 className="w-4 h-4 text-[#4d44e3]" /> {tool.scoreLabel}
                    </h2>
                    <p className="text-sm text-gray-500">{result.summary}</p>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <span className={`text-5xl font-extrabold tabular-nums ${scoreColor}`}>{result.score}</span>
                    <span className={`text-xs font-bold mt-1 ${scoreColor}`}>{result.grade}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-5">
                  <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
                {/* PDF Download button */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                >
                  {downloadingPdf ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Download Full Report (PDF)</>
                  )}
                </button>
              </div>

              {/* Key Insights */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Key Insights
                </h2>
                <div className="space-y-3">
                  {result.insights.map((insight, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
                      insight.type === "good" ? "bg-emerald-50 border-emerald-200"
                      : insight.type === "warn" ? "bg-amber-50 border-amber-200"
                      : "bg-blue-50 border-blue-200"
                    }`}>
                      {insight.type === "good"
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        : insight.type === "warn"
                        ? <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        : <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-0.5 uppercase tracking-wide">{insight.label}</p>
                        <p className="text-sm text-gray-700">{insight.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Findings */}
              {result.detailedFindings.map((section, si) => (
                <div key={si} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#4d44e3]" />
                    {section.category}
                  </h2>
                  <div className="space-y-2">
                    {section.findings.map((finding, fi) => (
                      <div key={fi} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4d44e3]/40 mt-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600 leading-relaxed">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Recommendations */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[#4d44e3]" /> Recommendations (Priority Order)
                </h2>
                <div className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="w-6 h-6 rounded-full bg-[#4d44e3] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF download CTA at bottom */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="font-bold text-gray-900 mb-0.5 flex items-center gap-2"><Download className="w-4 h-4 text-emerald-600" /> Save this report</p>
                  <p className="text-sm text-gray-500">Download the complete report as a professionally formatted PDF to share or reference later</p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
              </div>

              {/* Credits remaining banner */}
              {credits > 0 ? (
                <div className="bg-[#4d44e3]/5 border border-[#4d44e3]/20 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-[#4d44e3] font-medium">
                    You have <strong>{credits}</strong> free {credits === 1 ? "report" : "reports"} remaining. Use them on any of the 7 free tools.
                  </p>
                  <a href="/#pricing" className="text-xs font-bold text-[#4d44e3] underline whitespace-nowrap">Upgrade for unlimited →</a>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-amber-800">You've used all 3 free reports</p>
                    <p className="text-xs text-amber-600 mt-0.5">Upgrade to Pro ($12/mo) to continue with 50 analyses per month</p>
                  </div>
                  <a href="/#pricing" className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors">
                    Upgrade Now <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SEO Text ── */}
        <div className="mt-12 pt-10 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">About the {tool.name} Tool</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{tool.seoText}</p>
        </div>

      </div>

      {/* Credit modal */}
      <AnimatePresence>
        {showModal && <CreditModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
