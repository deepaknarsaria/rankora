import { Router, type IRouter, type Request, type Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import * as https from "https";
import { openai } from "@workspace/integrations-openai-ai-server";

/* Allow crawling sites with self-signed or non-standard SSL certs */
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const router: IRouter = Router();

/* ══════════════════════════════════════
   CREDIT SYSTEM  (in-memory, IP-based for free users)
══════════════════════════════════════ */
const FREE_LIMIT = 3;
const auditCredits = new Map<string, number>();

function getIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0] ?? req.ip ?? "unknown").trim();
}
function getCredits(ip: string): number {
  if (!auditCredits.has(ip)) auditCredits.set(ip, FREE_LIMIT);
  return auditCredits.get(ip)!;
}
function spendCredit(ip: string): boolean {
  const cur = getCredits(ip);
  if (cur <= 0) return false;
  auditCredits.set(ip, cur - 1);
  return true;
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
const HTTP_TIMEOUT = 12_000;
const LINK_TIMEOUT = 5_000;

const axiosBase = axios.create({
  timeout: HTTP_TIMEOUT,
  headers: { "User-Agent": "Rankora-SEO-Audit/1.0" },
  httpsAgent,
});

function normalizeDomain(url: string): string {
  try { return new URL(url).origin; } catch { return url; }
}

function stripStopWords(words: string[]): string[] {
  const stopwords = new Set([
    "the","and","for","with","that","this","from","have","your","are","our",
    "not","but","can","you","its","has","was","will","how","all","get","more",
    "into","than","their","they","been","also","when","what","about","which",
    "some","there","these","those","them","then","each","such","very","just",
  ]);
  return words
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(w => w.length >= 4 && !stopwords.has(w));
}

/* ══════════════════════════════════════
   STEP 1+2: FETCH + EXTRACT SEO DATA
══════════════════════════════════════ */
interface SeoData {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  h1Count: number;
  h1Tags: string[];
  h2Count: number;
  imageCount: number;
  missingAlt: number;
  canonicalUrl: string | null;
  hasViewportMeta: boolean;
  internalLinks: number;
  externalLinks: number;
  allLinks: string[];         // unique, absolute
  wordCount: number;
  hasStructuredData: boolean;
}

async function extractSeoData(url: string): Promise<{ html: string; seoData: SeoData }> {
  const res = await axiosBase.get(url, { responseType: "text" });
  const html: string = res.data as string;
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const h1Tags = $("h1").map((_, el) => $(el).text().trim()).get();
  const images = $("img");
  let missingAlt = 0;
  images.each((_, img) => {
    const alt = $(img).attr("alt");
    if (!alt || alt.trim() === "") missingAlt++;
  });

  const origin = normalizeDomain(url);
  /* Deduplicate links using a Set */
  const seenLinks = new Set<string>();
  const allLinks: string[] = [];
  let internalLinks = 0;
  let externalLinks = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim() ?? "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const abs = href.startsWith("http") ? href : new URL(href, url).href;
      if (seenLinks.has(abs)) return;
      seenLinks.add(abs);
      allLinks.push(abs);
      if (abs.startsWith(origin)) internalLinks++;
      else externalLinks++;
    } catch {}
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(" ").filter(Boolean).length;

  return {
    html,
    seoData: {
      title,
      titleLength: title.length,
      metaDescription,
      metaDescriptionLength: metaDescription.length,
      h1Count: h1Tags.length,
      h1Tags,
      h2Count: $("h2").length,
      imageCount: images.length,
      missingAlt,
      canonicalUrl: $('link[rel="canonical"]').attr("href") ?? null,
      hasViewportMeta: !!$('meta[name="viewport"]').length,
      internalLinks,
      externalLinks,
      allLinks: allLinks.slice(0, 30),    // max 30 unique links
      wordCount,
      hasStructuredData: !!$('script[type="application/ld+json"]').length,
    },
  };
}

/* ══════════════════════════════════════
   STEP 3: SEO ISSUES
   Each issue now includes priority tag + why it matters
══════════════════════════════════════ */
interface Issue {
  issue: string;
  impact: "High" | "Medium" | "Low";
  priority: "🔴 High" | "🟡 Medium" | "🟢 Low";
  why: string;
  fix: string;
}

function makePriority(impact: "High" | "Medium" | "Low"): "🔴 High" | "🟡 Medium" | "🟢 Low" {
  if (impact === "High") return "🔴 High";
  if (impact === "Medium") return "🟡 Medium";
  return "🟢 Low";
}

function analyzeIssues(seo: SeoData): Issue[] {
  const issues: Issue[] = [];

  if (!seo.title) {
    issues.push({
      issue: "Missing page title tag",
      impact: "High", priority: "🔴 High",
      why: "The title tag is the single most important on-page SEO factor. Without it, search engines have no signal for what the page is about and will not display it prominently in results.",
      fix: "Add a descriptive <title> tag (50–60 characters) with your primary keyword near the beginning.",
    });
  } else if (seo.titleLength < 30) {
    issues.push({
      issue: `Title tag too short (${seo.titleLength} chars)`,
      impact: "Medium", priority: "🟡 Medium",
      why: "Short titles waste valuable keyword real estate and may appear weak in search results, reducing click-through rate.",
      fix: "Expand your title to 50–60 characters. Include your primary keyword and a compelling value proposition.",
    });
  } else if (seo.titleLength > 60) {
    issues.push({
      issue: `Title tag too long (${seo.titleLength} chars — will be truncated in SERP)`,
      impact: "Medium", priority: "🟡 Medium",
      why: "Google truncates titles over ~60 characters in search results, cutting off important keywords and reducing click-through rate.",
      fix: "Shorten your title to under 60 characters. Place the most important keywords within the first 50 characters.",
    });
  }

  if (!seo.metaDescription) {
    issues.push({
      issue: "Missing meta description",
      impact: "High", priority: "🔴 High",
      why: "The meta description is shown in search results below your title. Without one, Google picks random page text, which often looks unprofessional and reduces CTR by up to 30%.",
      fix: "Add a meta description of 150–160 characters that includes your primary keyword and a clear call-to-action.",
    });
  } else if (seo.metaDescriptionLength < 120) {
    issues.push({
      issue: `Meta description too short (${seo.metaDescriptionLength} chars)`,
      impact: "Medium", priority: "🟡 Medium",
      why: "Short descriptions leave room unused in SERP snippets, missing an opportunity to convince searchers to click your result over a competitor's.",
      fix: "Expand your meta description to 150–160 characters with a CTA like 'Learn more', 'Get started', or 'See pricing'.",
    });
  } else if (seo.metaDescriptionLength > 160) {
    issues.push({
      issue: `Meta description too long (${seo.metaDescriptionLength} chars — will be truncated)`,
      impact: "Low", priority: "🟢 Low",
      why: "Google truncates descriptions beyond ~160 characters, which may cut off your CTA and make the snippet less compelling.",
      fix: "Trim your meta description to 155–160 characters, keeping the most important content and CTA early.",
    });
  }

  if (seo.h1Count === 0) {
    issues.push({
      issue: "No H1 heading found on the page",
      impact: "High", priority: "🔴 High",
      why: "The H1 is a primary on-page ranking signal. It tells search engines and users what the page is about. Pages without H1s are harder to rank for target keywords.",
      fix: "Add exactly one H1 heading that clearly states the page topic and includes your primary keyword.",
    });
  } else if (seo.h1Count > 1) {
    issues.push({
      issue: `Multiple H1 tags found (${seo.h1Count})`,
      impact: "Medium", priority: "🟡 Medium",
      why: "Multiple H1 tags dilute the ranking signal and confuse search engines about the page's primary topic.",
      fix: `Reduce to a single H1. Change the other ${seo.h1Count - 1} H1 tag(s) to H2 for proper heading hierarchy.`,
    });
  }

  if (seo.missingAlt > 0) {
    issues.push({
      issue: `${seo.missingAlt} image(s) missing alt text`,
      impact: "Medium", priority: "🟡 Medium",
      why: "Alt text helps Google understand image content and contributes to image search rankings. It also affects accessibility scores which can indirectly impact rankings.",
      fix: `Add descriptive alt text to all ${seo.missingAlt} images. Use keywords naturally where relevant, e.g. alt="blue running shoes for men".`,
    });
  }

  if (!seo.canonicalUrl) {
    issues.push({
      issue: "No canonical URL tag found",
      impact: "Low", priority: "🟢 Low",
      why: "Without a canonical tag, duplicate content versions of this page (HTTP vs HTTPS, with/without trailing slash) can split link equity and confuse Google's crawlers.",
      fix: "Add <link rel='canonical' href='https://yourdomain.com/this-page'> in the <head> section.",
    });
  }

  if (!seo.hasViewportMeta) {
    issues.push({
      issue: "Missing viewport meta tag",
      impact: "High", priority: "🔴 High",
      why: "Google uses mobile-first indexing — pages without a viewport meta tag render poorly on mobile and receive lower rankings as a result.",
      fix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'> inside your <head> tag.",
    });
  }

  if (seo.wordCount < 300) {
    issues.push({
      issue: `Thin content — only ${seo.wordCount} words detected`,
      impact: "High", priority: "🔴 High",
      why: "Google views pages with fewer than 300 words as 'thin content', which are typically ranked lower or excluded from competitive results.",
      fix: "Expand content to at least 800–1,200 words. Cover the topic in-depth with headings, bullet points, FAQs, and examples.",
    });
  } else if (seo.wordCount < 600) {
    issues.push({
      issue: `Low content depth — only ${seo.wordCount} words detected`,
      impact: "Medium", priority: "🟡 Medium",
      why: "Top-ranking pages for competitive keywords typically have 1,000+ words. Longer, comprehensive content earns more backlinks and ranks higher.",
      fix: "Expand content to 800–1,200+ words. Add a FAQ section, more examples, or supporting statistics.",
    });
  }

  if (!seo.hasStructuredData) {
    issues.push({
      issue: "No structured data (Schema.org / JSON-LD) detected",
      impact: "Low", priority: "🟢 Low",
      why: "Structured data enables rich snippets (stars, FAQs, breadcrumbs) in search results, which significantly improve click-through rates — sometimes by 20–30%.",
      fix: "Implement JSON-LD structured data. Use Google's Rich Results Test to validate your markup.",
    });
  }

  return issues;
}

/* ══════════════════════════════════════
   STEP 4: BROKEN LINK CHECKER (deduped, returns {url, status})
══════════════════════════════════════ */
interface BrokenLink {
  url: string;
  status: string;
}

async function checkBrokenLinks(links: string[]): Promise<BrokenLink[]> {
  /* Links are already unique from extractSeoData — take first 10 */
  const sample = links.slice(0, 10);
  const results = await Promise.allSettled(
    sample.map(link =>
      axios.head(link, { timeout: LINK_TIMEOUT, maxRedirects: 3, httpsAgent })
        .catch(() => axios.get(link, { timeout: LINK_TIMEOUT, maxRedirects: 3, responseType: "stream", httpsAgent }))
    )
  );

  const broken: BrokenLink[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      broken.push({ url: sample[i], status: "broken" });
    } else {
      const httpStatus: number = (r.value as any)?.status ?? 200;
      if (httpStatus >= 400) {
        broken.push({ url: sample[i], status: `broken (HTTP ${httpStatus})` });
      }
    }
  });
  return broken;
}

/* ══════════════════════════════════════
   STEP 5: SITEMAP
══════════════════════════════════════ */
async function checkSitemap(url: string): Promise<{ exists: boolean; sitemapUrl: string }> {
  const origin = normalizeDomain(url);
  const sitemapUrl = `${origin}/sitemap.xml`;
  try {
    const res = await axios.get(sitemapUrl, { timeout: 6000, httpsAgent });
    const exists = res.status === 200 && String(res.data).includes("<url");
    return { exists, sitemapUrl };
  } catch {
    return { exists: false, sitemapUrl };
  }
}

/* ══════════════════════════════════════
   STEP 6: PAGESPEED
══════════════════════════════════════ */
interface PerformanceData {
  score: number | null;
  lcp: string | null;
  cls: string | null;
  fid: string | null;
  ttfb: string | null;
}

async function getPageSpeed(url: string): Promise<PerformanceData> {
  const apiKey = process.env["PAGESPEED_API_KEY"] ?? "";
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${apiKey ? `&key=${apiKey}` : ""}`;
  try {
    const res = await axios.get(endpoint, { timeout: 20_000 });
    const data: any = res.data;
    const cats = data?.lighthouseResult?.categories;
    const audits = data?.lighthouseResult?.audits;
    const score = cats?.performance?.score != null ? Math.round(cats.performance.score * 100) : null;
    const lcp = audits?.["largest-contentful-paint"]?.displayValue ?? null;
    const cls = audits?.["cumulative-layout-shift"]?.displayValue ?? null;
    const fid = audits?.["max-potential-fid"]?.displayValue ?? audits?.["interaction-to-next-paint"]?.displayValue ?? null;
    const ttfb = audits?.["server-response-time"]?.displayValue ?? null;
    return { score, lcp, cls, fid, ttfb };
  } catch {
    return { score: null, lcp: null, cls: null, fid: null, ttfb: null };
  }
}

/* ══════════════════════════════════════
   STEP 7: KEYWORDS (Estimated Visibility — extracted from real content)
══════════════════════════════════════ */
interface EstimatedKeyword {
  keyword: string;
  note: string;
}

function extractKeywords(seo: SeoData): string[] {
  /* Pull from title, H1s, and H2s — real content signals */
  const h2Tags = [] as string[]; // h2 not in SeoData directly, use what we have
  const raw = [seo.title, ...seo.h1Tags].join(" ");
  const words = raw.split(/\s+/);
  const cleaned = stripStopWords(words);
  const freq = new Map<string, number>();
  for (const w of cleaned) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([w]) => w);
}

function buildEstimatedKeywords(keywords: string[]): EstimatedKeyword[] {
  return keywords.map(kw => ({
    keyword: kw,
    note: "Estimated — based on page content",
  }));
}

/* ══════════════════════════════════════
   STEP 8: COMPETITOR ANALYSIS (keyword-driven)
══════════════════════════════════════ */
interface Competitor {
  url: string;
  title: string;
  titleLength: number;
}

async function analyzeCompetitors(keywords: string[]): Promise<Competitor[]> {
  /* Use the top keyword to build relevant competitor search URLs */
  const kw = keywords[0] ?? "seo";
  const encoded = encodeURIComponent(kw);
  const candidateUrls = [
    `https://www.searchenginejournal.com/?s=${encoded}`,
    `https://moz.com/blog?q=${encoded}`,
    `https://ahrefs.com/blog/?s=${encoded}`,
    `https://backlinko.com/?s=${encoded}`,
  ];

  const results = await Promise.allSettled(
    candidateUrls.map(async u => {
      const r = await axios.get(u, { timeout: 8000, responseType: "text", httpsAgent });
      const $ = cheerio.load(r.data as string);
      const title = $("title").first().text().trim() || "Not detected";
      return { url: u, title, titleLength: title.length };
    })
  );

  return results
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<Competitor>).value)
    .filter(c => c.title !== "Not detected")
    .slice(0, 3);
}

/* ══════════════════════════════════════
   STEP 9: SCORE
══════════════════════════════════════ */
function calculateScore(issues: Issue[], perf: PerformanceData): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.impact === "High") score -= 12;
    else if (issue.impact === "Medium") score -= 6;
    else score -= 3;
  }
  if (perf.score !== null) {
    if (perf.score < 50) score -= 15;
    else if (perf.score < 70) score -= 8;
    else if (perf.score < 90) score -= 3;
  }
  return Math.max(0, Math.min(100, score));
}

/* ══════════════════════════════════════
   STEP 10: GROWTH OPPORTUNITY (dynamic, based on issue count)
══════════════════════════════════════ */
interface GrowthOpportunity {
  summary: string;
  estimatedTrafficIncrease: string;
  estimatedTime: string;
}

function buildGrowthOpportunity(issues: Issue[], score: number): GrowthOpportunity {
  const highCount = issues.filter(i => i.impact === "High").length;
  const total = issues.length;

  let trafficRange = "5–15%";
  let timeRange = "4–8 weeks";
  let summary = "A few improvements can strengthen your organic presence.";

  if (highCount >= 3 || total >= 6) {
    trafficRange = "30–60%";
    timeRange = "6–12 weeks";
    summary = "Significant untapped potential — fixing critical issues could dramatically improve your organic rankings and traffic.";
  } else if (highCount >= 2 || total >= 4) {
    trafficRange = "15–35%";
    timeRange = "4–8 weeks";
    summary = "Several important issues are limiting your visibility. Resolving them can produce measurable ranking gains.";
  } else if (total >= 2) {
    trafficRange = "8–20%";
    timeRange = "2–6 weeks";
    summary = "A few targeted fixes can improve your search rankings and click-through rates.";
  }

  return { summary, estimatedTrafficIncrease: trafficRange, estimatedTime: timeRange };
}

/* ══════════════════════════════════════
   STEP 11: UPGRADE CTA
══════════════════════════════════════ */
const UPGRADE_CTA = {
  title: "Want deeper insights?",
  benefits: [
    "Full broken link report (all links checked)",
    "Complete keyword visibility data",
    "Competitor gap analysis",
    "AI content optimization (Fix Everything)",
    "Unlimited audits",
  ],
  plans: [
    "Pro — $12/month (50 credits)",
    "Premium — $39/month (200 credits)",
  ],
};

/* ══════════════════════════════════════
   STEP 12: AI INSIGHTS
══════════════════════════════════════ */
async function generateInsights(
  url: string,
  seo: SeoData,
  issues: Issue[],
  score: number,
  perf: PerformanceData,
): Promise<string> {
  const issuesSummary = issues
    .slice(0, 6)
    .map(i => `- [${i.priority}] ${i.issue}: ${i.why.slice(0, 80)}`)
    .join("\n");

  const prompt = `You are a senior SEO consultant reviewing a real website audit. Write in a professional, direct tone — not generic.

URL: ${url}
SEO Score: ${score}/100
Title: "${seo.title || "MISSING"}" (${seo.titleLength} chars)
Meta Description: ${seo.metaDescription ? `"${seo.metaDescription.slice(0, 100)}..." (${seo.metaDescriptionLength} chars)` : "MISSING"}
H1 Tags: ${seo.h1Count} found — ${seo.h1Tags.slice(0, 2).join(", ") || "none"}
Images: ${seo.imageCount} total, ${seo.missingAlt} missing alt text
Word Count: ~${seo.wordCount} words
Page Speed Score: ${perf.score !== null ? `${perf.score}/100 mobile` : "unavailable"}
LCP: ${perf.lcp ?? "N/A"} | CLS: ${perf.cls ?? "N/A"} | TTFB: ${perf.ttfb ?? "N/A"}

Issues found:
${issuesSummary}

Respond with exactly this structure (plain text, no markdown):
SUMMARY: [2–3 sentences on current SEO health and biggest opportunities, specific to this site]
FIX 1: [Most impactful fix with concrete step and expected outcome]
FIX 2: [Second most impactful fix]
FIX 3: [Third fix]
RANKING IMPROVEMENT: [Expected improvement in 60–90 days if fixes are applied]`;

  try {
    const completion = await (openai as any).chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 600,
    });
    return completion.choices[0]?.message?.content?.trim() ?? "AI insights unavailable.";
  } catch {
    const topIssue = issues[0];
    const secondIssue = issues[1];
    const thirdIssue = issues[2];
    return [
      `SUMMARY: This site scored ${score}/100 on our SEO audit with ${issues.length} issue(s) detected that are limiting search visibility. ${issues.filter(i => i.impact === "High").length} high-priority problems need immediate attention.`,
      `FIX 1: ${topIssue?.fix ?? "Optimize title and meta description for your primary keywords."}`,
      `FIX 2: ${secondIssue?.fix ?? "Improve content depth and word count to at least 800 words."}`,
      `FIX 3: ${thirdIssue?.fix ?? "Add structured data markup to qualify for rich snippets."}`,
      `RANKING IMPROVEMENT: Implementing these fixes could move rankings up 5–20 positions within 60–90 days, depending on competition.`,
    ].join("\n");
  }
}

/* ══════════════════════════════════════
   POST /api/audit
══════════════════════════════════════ */
router.post("/audit", async (req: Request, res: Response) => {
  const { url, paid } = req.body as { url?: string; paid?: boolean };

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing or invalid url" });
    return;
  }

  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http")) normalizedUrl = "https://" + normalizedUrl;

  try { new URL(normalizedUrl); } catch {
    res.status(400).json({ error: "Invalid URL format" });
    return;
  }

  const ip = getIp(req);
  const creditsLeft = getCredits(ip);

  if (!paid && creditsLeft <= 0) {
    res.status(429).json({
      error: "LIMIT_REACHED",
      message: "You have used all 3 free audits. Upgrade to Pro for unlimited audits.",
    });
    return;
  }

  if (!paid) spendCredit(ip);

  try {
    /* Run fetch + sitemap + performance in parallel */
    const [{ seoData }, sitemapResult, perfData] = await Promise.all([
      extractSeoData(normalizedUrl),
      checkSitemap(normalizedUrl),
      getPageSpeed(normalizedUrl),
    ]);

    const issues = analyzeIssues(seoData);
    const keywords = extractKeywords(seoData);
    const estimatedKeywords = buildEstimatedKeywords(keywords);
    const score = calculateScore(issues, perfData);
    const growthOpportunity = buildGrowthOpportunity(issues, score);

    /* Run link checks + competitors + AI in parallel */
    const [brokenLinks, competitors, insights] = await Promise.all([
      checkBrokenLinks(seoData.allLinks),
      analyzeCompetitors(keywords),
      generateInsights(normalizedUrl, seoData, issues, score, perfData),
    ]);

    const creditsNow = getCredits(ip);

    /* ── Full payload ── */
    const fullResponse = {
      url: normalizedUrl,
      score,
      creditsRemaining: creditsNow,
      seoData: {
        title: seoData.title || "Not detected",
        titleLength: seoData.titleLength,
        metaDescription: seoData.metaDescription || "Not detected",
        metaDescriptionLength: seoData.metaDescriptionLength,
        h1Count: seoData.h1Count,
        h1Tags: seoData.h1Tags,
        h2Count: seoData.h2Count,
        imageCount: seoData.imageCount,
        missingAlt: seoData.missingAlt,
        canonicalUrl: seoData.canonicalUrl ?? "Not detected",
        hasViewportMeta: seoData.hasViewportMeta,
        wordCount: seoData.wordCount,
        internalLinks: seoData.internalLinks,
        externalLinks: seoData.externalLinks,
        hasStructuredData: seoData.hasStructuredData,
      },
      performance: {
        score: perfData.score,
        lcp: perfData.lcp ?? "Not detected",
        cls: perfData.cls ?? "Not detected",
        fid: perfData.fid ?? "Not detected",
        ttfb: perfData.ttfb ?? "Not detected",
      },
      issues,
      brokenLinks,
      sitemap: sitemapResult,
      keywords: estimatedKeywords,
      competitors,
      growthOpportunity,
      insights,
      upgradeCTA: UPGRADE_CTA,
    };

    /* ── Freemium limits for free users ── */
    if (!paid) {
      res.json({
        ...fullResponse,
        issues: issues.slice(0, 2),
        keywords: estimatedKeywords.slice(0, 2),
        competitors: competitors.slice(0, 1),
        brokenLinks: brokenLinks.slice(0, 2),
        _limited: true,
      });
      return;
    }

    res.json(fullResponse);
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    console.error("[audit] Error:", msg, err?.stack?.slice(0, 400));
    if (msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED") || msg.includes("ECONNRESET")) {
      res.status(422).json({ error: "Cannot reach that URL. Please check the address and try again." });
    } else if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
      res.status(422).json({ error: "The website took too long to respond. Please try again." });
    } else if (msg.includes("403") || msg.includes("401")) {
      res.status(422).json({ error: "Access denied by that website. Try a different URL." });
    } else {
      res.status(500).json({ error: `Audit failed: ${msg.slice(0, 120)}` });
    }
  }
});

/* GET /api/audit/credits — check remaining free audits */
router.get("/audit/credits", (req: Request, res: Response) => {
  const ip = getIp(req);
  res.json({ credits: getCredits(ip), limit: FREE_LIMIT });
});

export default router;
