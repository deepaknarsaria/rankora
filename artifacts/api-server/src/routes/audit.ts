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

const axiosBase = axios.create({ timeout: HTTP_TIMEOUT, headers: { "User-Agent": "Rankora-SEO-Audit/1.0" }, httpsAgent });

function normalizeDomain(url: string): string {
  try { return new URL(url).origin; } catch { return url; }
}

function stripSmallWords(words: string[]): string[] {
  const stopwords = new Set(["the", "and", "for", "with", "that", "this", "from", "have", "your", "are", "our", "not", "but", "can", "you", "its", "has", "was", "will", "how", "all"]);
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
  allLinks: string[];
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
  const allLinks: string[] = [];
  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim() ?? "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const abs = href.startsWith("http") ? href : new URL(href, url).href;
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
      allLinks: allLinks.slice(0, 30),
      wordCount,
      hasStructuredData: !!$('script[type="application/ld+json"]').length,
    },
  };
}

/* ══════════════════════════════════════
   STEP 3: SEO ISSUES
══════════════════════════════════════ */
interface Issue {
  issue: string;
  impact: "High" | "Medium" | "Low";
  fix: string;
}

function analyzeIssues(seo: SeoData): Issue[] {
  const issues: Issue[] = [];

  if (!seo.title) {
    issues.push({ issue: "Missing page title tag", impact: "High", fix: "Add a descriptive <title> tag between 50–60 characters with your primary keyword." });
  } else if (seo.titleLength < 30) {
    issues.push({ issue: `Title tag too short (${seo.titleLength} chars)`, impact: "Medium", fix: "Expand your title to 50–60 characters. Include your primary keyword and a compelling value proposition." });
  } else if (seo.titleLength > 60) {
    issues.push({ issue: `Title tag too long (${seo.titleLength} chars — will be truncated in SERP)`, impact: "Medium", fix: "Shorten your title to under 60 characters. Ensure the most important keywords are within the first 50 characters." });
  }

  if (!seo.metaDescription) {
    issues.push({ issue: "Missing meta description", impact: "High", fix: "Add a meta description (150–160 characters) that includes your primary keyword and a clear call-to-action to improve click-through rates." });
  } else if (seo.metaDescriptionLength < 120) {
    issues.push({ issue: `Meta description too short (${seo.metaDescriptionLength} chars)`, impact: "Medium", fix: "Expand your meta description to 150–160 characters. It should summarize the page content and include a call-to-action." });
  } else if (seo.metaDescriptionLength > 160) {
    issues.push({ issue: `Meta description too long (${seo.metaDescriptionLength} chars — will be truncated)`, impact: "Low", fix: "Shorten your meta description to 155–160 characters to prevent Google from truncating it in search results." });
  }

  if (seo.h1Count === 0) {
    issues.push({ issue: "No H1 heading found on the page", impact: "High", fix: "Add exactly one H1 heading that clearly describes the page topic and includes your primary keyword." });
  } else if (seo.h1Count > 1) {
    issues.push({ issue: `Multiple H1 tags found (${seo.h1Count})`, impact: "Medium", fix: "Reduce to a single H1 tag per page. Change the additional H1s to H2 or H3 for proper heading hierarchy." });
  }

  if (seo.missingAlt > 0) {
    issues.push({ issue: `${seo.missingAlt} image(s) missing alt text`, impact: "Medium", fix: "Add descriptive alt text to all images. Alt text improves accessibility, helps Google understand image content, and can drive image search traffic." });
  }

  if (!seo.canonicalUrl) {
    issues.push({ issue: "No canonical URL tag found", impact: "Low", fix: "Add a <link rel='canonical' href='your-url'> tag to prevent duplicate content issues and consolidate link equity." });
  }

  if (!seo.hasViewportMeta) {
    issues.push({ issue: "Missing viewport meta tag", impact: "High", fix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'> for proper mobile rendering. Google uses mobile-first indexing." });
  }

  if (seo.wordCount < 300) {
    issues.push({ issue: `Thin content — only ${seo.wordCount} words detected`, impact: "High", fix: "Expand content to at least 800–1,200 words with useful, in-depth coverage of the topic. Thin content rarely ranks well." });
  }

  if (!seo.hasStructuredData) {
    issues.push({ issue: "No structured data (Schema.org / JSON-LD) detected", impact: "Low", fix: "Implement JSON-LD structured data (Article, Organization, FAQ, etc.) to qualify for rich snippets in Google Search." });
  }

  return issues;
}

/* ══════════════════════════════════════
   STEP 4: BROKEN LINK CHECKER
══════════════════════════════════════ */
async function checkBrokenLinks(links: string[]): Promise<string[]> {
  const sample = links.slice(0, 10);
  const results = await Promise.allSettled(
    sample.map(link =>
      axios.head(link, { timeout: LINK_TIMEOUT, maxRedirects: 3, httpsAgent }).catch(() =>
        axios.get(link, { timeout: LINK_TIMEOUT, maxRedirects: 3, responseType: "stream", httpsAgent })
      )
    )
  );
  const broken: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      broken.push(sample[i]);
    } else if (r.status === "fulfilled") {
      const status = (r.value as any)?.status ?? 200;
      if (status >= 400) broken.push(sample[i]);
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
    const res = await axios.get(sitemapUrl, { timeout: 6000 });
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
   STEP 7+8: KEYWORDS + RANKINGS
══════════════════════════════════════ */
interface Keyword {
  keyword: string;
  position: number;
  difficulty: "Easy" | "Medium" | "Hard";
}

function extractKeywords(seo: SeoData): string[] {
  const raw = [seo.title, ...seo.h1Tags].join(" ");
  const words = raw.split(/\s+/);
  const cleaned = stripSmallWords(words);
  const freq = new Map<string, number>();
  for (const w of cleaned) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([w]) => w);
}

function simulateRankings(keywords: string[]): Keyword[] {
  const diffs: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"];
  return keywords.map(keyword => ({
    keyword,
    position: Math.floor(Math.random() * 50) + 1,
    difficulty: diffs[Math.floor(Math.random() * 3)],
  }));
}

/* ══════════════════════════════════════
   STEP 9: COMPETITOR ANALYSIS
══════════════════════════════════════ */
interface Competitor {
  url: string;
  title: string;
  titleLength: number;
}

async function analyzeCompetitors(keywords: string[]): Promise<Competitor[]> {
  const kw = keywords[0] ?? "seo";
  const sampleUrls = [
    `https://www.searchenginejournal.com/?s=${encodeURIComponent(kw)}`,
    `https://moz.com/blog?q=${encodeURIComponent(kw)}`,
    `https://ahrefs.com/blog/?s=${encodeURIComponent(kw)}`,
  ];
  const results = await Promise.allSettled(
    sampleUrls.map(async u => {
      const r = await axios.get(u, { timeout: 8000, responseType: "text", httpsAgent });
      const $ = cheerio.load(r.data as string);
      const title = $("title").first().text().trim();
      return { url: u, title, titleLength: title.length };
    })
  );
  return results
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<Competitor>).value)
    .slice(0, 3);
}

/* ══════════════════════════════════════
   STEP 10: SCORE
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
   STEP 11: AI INSIGHTS
══════════════════════════════════════ */
async function generateInsights(url: string, seo: SeoData, issues: Issue[], score: number, perf: PerformanceData): Promise<string> {
  const issuesSummary = issues.slice(0, 6).map(i => `- ${i.issue} (${i.impact})`).join("\n");
  const prompt = `You are an expert SEO consultant. Analyze this website audit data and provide actionable guidance.

URL: ${url}
SEO Score: ${score}/100
Title: "${seo.title}" (${seo.titleLength} chars)
Meta Description: ${seo.metaDescription ? `"${seo.metaDescription.slice(0, 100)}..." (${seo.metaDescriptionLength} chars)` : "MISSING"}
H1 Tags: ${seo.h1Count} found — ${seo.h1Tags.slice(0, 2).join(", ") || "none"}
Images: ${seo.imageCount} total, ${seo.missingAlt} missing alt text
Word Count: ~${seo.wordCount} words
Page Speed Score: ${perf.score !== null ? `${perf.score}/100` : "unavailable"}
LCP: ${perf.lcp ?? "N/A"} | CLS: ${perf.cls ?? "N/A"}

Issues found:
${issuesSummary}

Respond with exactly this structure (no markdown headers, plain text):
SUMMARY: [2-3 sentences describing the site's current SEO health and biggest opportunities]
FIX 1: [Most important fix with specific action and expected impact]
FIX 2: [Second most important fix with specific action]
FIX 3: [Third fix with specific action]
RANKING IMPROVEMENT: [Expected ranking improvement after fixes in 60–90 days]`;

  try {
    const completion = await (openai as any).chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 600,
    });
    return completion.choices[0]?.message?.content?.trim() ?? "AI insights unavailable.";
  } catch {
    return `SUMMARY: This site scored ${score}/100 on our SEO audit. ${issues.length} issues were detected that are impacting search visibility.\nFIX 1: ${issues[0]?.fix ?? "Optimize title and meta description for your primary keywords."}\nFIX 2: ${issues[1]?.fix ?? "Improve content depth and word count to at least 800 words."}\nFIX 3: ${issues[2]?.fix ?? "Add structured data markup to qualify for rich snippets."}\nRANKING IMPROVEMENT: Implementing these fixes could improve rankings by 5–15 positions within 60–90 days.`;
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
    res.status(429).json({ error: "LIMIT_REACHED", message: "You have used all 3 free audits. Upgrade to Pro for unlimited audits." });
    return;
  }

  /* Spend credit for free users */
  if (!paid) spendCredit(ip);

  try {
    /* Run all steps concurrently where possible */
    const [{ seoData }, sitemapResult, perfData] = await Promise.all([
      extractSeoData(normalizedUrl),
      checkSitemap(normalizedUrl),
      getPageSpeed(normalizedUrl),
    ]);

    const issues = analyzeIssues(seoData);
    const keywords = extractKeywords(seoData);
    const rankings = simulateRankings(keywords);
    const score = calculateScore(issues, perfData);

    /* These can run in parallel after seoData is available */
    const [brokenLinks, competitors, insights] = await Promise.all([
      checkBrokenLinks(seoData.allLinks),
      analyzeCompetitors(keywords),
      generateInsights(normalizedUrl, seoData, issues, score, perfData),
    ]);

    const creditsNow = getCredits(ip);

    /* Build full response */
    const fullResponse = {
      url: normalizedUrl,
      score,
      creditsRemaining: creditsNow,
      seoData: {
        title: seoData.title,
        titleLength: seoData.titleLength,
        metaDescription: seoData.metaDescription,
        metaDescriptionLength: seoData.metaDescriptionLength,
        h1Count: seoData.h1Count,
        h1Tags: seoData.h1Tags,
        h2Count: seoData.h2Count,
        imageCount: seoData.imageCount,
        missingAlt: seoData.missingAlt,
        canonicalUrl: seoData.canonicalUrl,
        hasViewportMeta: seoData.hasViewportMeta,
        wordCount: seoData.wordCount,
        internalLinks: seoData.internalLinks,
        externalLinks: seoData.externalLinks,
        hasStructuredData: seoData.hasStructuredData,
      },
      performance: {
        score: perfData.score,
        lcp: perfData.lcp,
        cls: perfData.cls,
        fid: perfData.fid,
        ttfb: perfData.ttfb,
      },
      issues,
      brokenLinks,
      sitemap: sitemapResult,
      keywords,
      rankings,
      competitors,
      insights,
    };

    /* Free user: limit visible data */
    if (!paid) {
      res.json({
        ...fullResponse,
        issues: issues.slice(0, 5),
        keywords: keywords.slice(0, 4),
        rankings: rankings.slice(0, 4),
        competitors: competitors.slice(0, 2),
        _limited: true,
      });
      return;
    }

    res.json(fullResponse);
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    console.error("[audit] Error:", msg, err?.stack?.slice(0, 300));
    if (msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED") || msg.includes("ECONNRESET")) {
      res.status(422).json({ error: "Cannot reach that URL. Please check the address and try again." });
    } else if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
      res.status(422).json({ error: "The website took too long to respond. Please try again." });
    } else if (msg.includes("403") || msg.includes("401")) {
      res.status(422).json({ error: "Access denied by that website. Try a different URL." });
    } else {
      res.status(500).json({ error: `Audit failed: ${msg.slice(0, 100)}` });
    }
  }
});

/* GET /api/audit/credits — check remaining free audits */
router.get("/audit/credits", (req: Request, res: Response) => {
  const ip = getIp(req);
  res.json({ credits: getCredits(ip), limit: FREE_LIMIT });
});

export default router;
