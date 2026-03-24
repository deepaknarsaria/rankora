import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  AnalyzeContentBody,
  OptimizeContentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

/* ── Credit system ── */
const FREE_CREDITS = 5;
const creditStore = new Map<string, number>();

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded?.split(",")[0] ?? req.ip ?? "unknown");
  return ip.trim();
}

function getCredits(ip: string): number {
  if (!creditStore.has(ip)) creditStore.set(ip, FREE_CREDITS);
  return creditStore.get(ip)!;
}

function deductCredits(ip: string, amount: number): void {
  const current = getCredits(ip);
  creditStore.set(ip, Math.max(0, current - amount));
}

/* ── Multer — memory storage, 10 MB limit ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const extOk = /\.(txt|pdf|docx|doc)$/i.test(file.originalname);
    if (allowed.includes(file.mimetype) || extOk) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload .txt, .pdf, or .docx"));
    }
  },
});

/* ── URL helpers ── */
async function extractContentFromUrl(url: string): Promise<string> {
  let response;
  try {
    response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RankPilotBot/1.0; +https://rankpilot.ai)",
      },
      maxContentLength: 5 * 1024 * 1024,
    });
  } catch (err: any) {
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      throw new Error(`Could not reach URL: ${url}`);
    }
    throw new Error(`Failed to fetch URL: ${err.message}`);
  }

  const contentType = response.headers["content-type"] ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error("URL did not return an HTML page");
  }

  const $ = cheerio.load(response.data as string);
  $("script, style, noscript, nav, footer, header, aside, iframe, svg").remove();

  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content") ?? "";
  const h1s = $("h1").map((_, el) => $(el).text().trim()).get().join(" | ");
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const combined = [
    title ? `Title: ${title}` : "",
    metaDesc ? `Meta Description: ${metaDesc}` : "",
    h1s ? `H1 Headings: ${h1s}` : "",
    bodyText,
  ].filter(Boolean).join("\n\n");

  if (combined.length < 50) {
    throw new Error("Could not extract meaningful content from this URL");
  }
  return combined.slice(0, 12000);
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

/* ── File text extraction ── */
async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "txt") {
    const text = file.buffer.toString("utf-8").trim();
    if (!text) throw new Error("The uploaded .txt file is empty.");
    return text.slice(0, 12000);
  }

  if (ext === "pdf") {
    let parsed;
    try {
      parsed = await pdfParse(file.buffer);
    } catch {
      throw new Error("Could not parse the PDF. Make sure it is not password-protected.");
    }
    const text = parsed.text.trim();
    if (!text) throw new Error("No readable text found in the PDF.");
    return text.slice(0, 12000);
  }

  if (ext === "docx" || ext === "doc") {
    let result;
    try {
      result = await mammoth.extractRawText({ buffer: file.buffer });
    } catch {
      throw new Error("Could not read the Word document. Make sure it is a valid .docx file.");
    }
    const text = result.value.trim();
    if (!text) throw new Error("No readable text found in the Word document.");
    return text.slice(0, 12000);
  }

  throw new Error("Unsupported file type. Please upload .txt, .pdf, or .docx");
}

/* ── Shared AI analysis ── */
function normalizeP(p: string) {
  const v = String(p ?? "").trim();
  return (v === "High" || v === "Medium" || v === "Low") ? v : "Medium";
}

function normalizeKwStatus(s: string): "Good" | "Needs Improvement" | "Missing" {
  if (s === "Good" || s === "Needs Improvement" || s === "Missing") return s;
  return "Needs Improvement";
}

async function runAnalysis(content: string, keywords?: string) {
  const hasKeywords = !!(keywords && keywords.trim().length > 0);

  const prompt = `Analyze the following content for SEO, AEO, and GEO optimization.

${hasKeywords ? `User's target keywords: ${keywords}` : ""}

Return ONLY JSON in this exact format (no markdown, no code blocks):

{
  "seoScore": number (0-100),
  "aeoScore": number (0-100),
  "geoScore": number (0-100),
  "aiVisibilityScore": number (0-100),
  "detectedKeywords": {
    "primary": "the single most important keyword from the content",
    "secondary": ["keyword2", "keyword3", "keyword4"]
  },
  "keywordAnalysis": [
    {
      "keyword": "keyword phrase",
      "score": number (0-100, how well the content is optimized for this keyword),
      "status": "Good | Needs Improvement | Missing"
    }
  ],
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "issues": [
    {
      "title": "Short issue title",
      "description": "What is wrong",
      "impact": "Why this matters for ranking or AI visibility",
      "priority": "High | Medium | Low"
    }
  ],
  "opportunities": [
    {
      "title": "Fix suggestion title",
      "description": "What to do",
      "example": "Give real example or sample implementation",
      "impact": "Expected benefit (ranking, CTR, AI visibility)",
      "priority": "High | Medium | Low"
    }
  ]
}

Rules:
* detectedKeywords: identify primary and 3-5 secondary keywords from the content itself
* keywordAnalysis: ${hasKeywords
    ? "evaluate each of the user's target keywords — score how well the content covers them"
    : "analyze the top 3-5 detected keywords"}
* suggestedKeywords: recommend 5 high-value keyword opportunities the content is missing or under-optimized for
* Keep language simple and beginner-friendly
* Make all suggestions actionable with real examples

Content:
${content}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: "You are an expert SEO content analyst. Always respond with valid JSON only, no markdown, no code blocks.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = (response.choices[0]?.message?.content ?? "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const analysis = JSON.parse(raw);

  return {
    seoScore: Number(analysis.seoScore) || 0,
    aeoScore: Number(analysis.aeoScore) || 0,
    geoScore: Number(analysis.geoScore) || 0,
    aiVisibilityScore: Number(analysis.aiVisibilityScore) || 0,
    detectedKeywords: analysis.detectedKeywords
      ? {
          primary: String(analysis.detectedKeywords.primary ?? ""),
          secondary: Array.isArray(analysis.detectedKeywords.secondary)
            ? analysis.detectedKeywords.secondary.map(String)
            : [],
        }
      : { primary: "", secondary: [] },
    keywordAnalysis: Array.isArray(analysis.keywordAnalysis)
      ? analysis.keywordAnalysis.map((k: any) => ({
          keyword: String(k.keyword ?? ""),
          score: Number(k.score) || 0,
          status: normalizeKwStatus(String(k.status ?? "")),
        }))
      : [],
    suggestedKeywords: Array.isArray(analysis.suggestedKeywords)
      ? analysis.suggestedKeywords.map(String)
      : [],
    issues: Array.isArray(analysis.issues)
      ? analysis.issues.map((issue: any) => ({
          title: String(issue.title ?? ""),
          description: String(issue.description ?? ""),
          impact: String(issue.impact ?? ""),
          priority: normalizeP(issue.priority),
        }))
      : [],
    opportunities: Array.isArray(analysis.opportunities)
      ? analysis.opportunities.map((opp: any) => ({
          title: String(opp.title ?? ""),
          description: String(opp.description ?? ""),
          example: String(opp.example ?? ""),
          impact: String(opp.impact ?? ""),
          priority: normalizeP(opp.priority),
        }))
      : [],
  };
}

/* ══════════════════════════════════════
   GET /credits  — returns remaining credits
══════════════════════════════════════ */
router.get("/credits", (req, res) => {
  const ip = getIp(req);
  res.json({ creditsRemaining: getCredits(ip), creditsTotal: FREE_CREDITS });
});

/* ══════════════════════════════════════
   POST /analyze  (text / URL)
══════════════════════════════════════ */
router.post("/analyze", async (req, res) => {
  const ip = getIp(req);
  if (getCredits(ip) < 1) {
    res.status(429).json({ error: "Credit limit reached", creditsRemaining: 0, creditsTotal: FREE_CREDITS });
    return;
  }

  const parseResult = AnalyzeContentBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content: rawInput, keywords } = parseResult.data;

  if (!rawInput || rawInput.trim().length < 3) {
    res.status(400).json({ error: "Please provide content or a URL to analyze." });
    return;
  }

  let content: string;
  try {
    content = isUrl(rawInput) ? await extractContentFromUrl(rawInput.trim()) : rawInput;
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (content.trim().length < 10) {
    res.status(400).json({ error: "Content is too short to analyze meaningfully." });
    return;
  }

  try {
    const analysis = await runAnalysis(content, keywords);
    deductCredits(ip, 1);
    res.json({ ...analysis, creditsRemaining: getCredits(ip), creditsTotal: FREE_CREDITS });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze content");
    res.status(500).json({ error: "Failed to analyze content. Please try again." });
  }
});

/* ══════════════════════════════════════
   POST /analyze-file  (multipart upload)
══════════════════════════════════════ */
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File is too large. Maximum size is 10 MB." });
      } else {
        res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
};

router.post("/analyze-file", uploadMiddleware, async (req, res) => {
  const ip = getIp(req);
  if (getCredits(ip) < 1) {
    res.status(429).json({ error: "Credit limit reached", creditsRemaining: 0, creditsTotal: FREE_CREDITS });
    return;
  }

  const file = (req as any).file as Express.Multer.File | undefined;

  if (!file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  let extractedContent: string;
  try {
    extractedContent = await extractTextFromFile(file);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (extractedContent.trim().length < 10) {
    res.status(400).json({ error: "The file content is too short to analyze meaningfully." });
    return;
  }

  const keywords = typeof req.body?.keywords === "string" ? req.body.keywords : undefined;

  try {
    const analysis = await runAnalysis(extractedContent, keywords);
    deductCredits(ip, 1);
    res.json({ ...analysis, extractedContent, creditsRemaining: getCredits(ip), creditsTotal: FREE_CREDITS });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze file");
    res.status(500).json({ error: "Failed to analyze the file. Please try again." });
  }
});

/* ══════════════════════════════════════
   POST /optimize  (text / URL)
══════════════════════════════════════ */
router.post("/optimize", async (req, res) => {
  const ip = getIp(req);
  if (getCredits(ip) < 2) {
    res.status(429).json({ error: "Credit limit reached. Optimization costs 2 credits.", creditsRemaining: getCredits(ip), creditsTotal: FREE_CREDITS });
    return;
  }

  const parseResult = OptimizeContentBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content: rawInput, keywords } = parseResult.data;

  if (!rawInput || rawInput.trim().length < 3) {
    res.status(400).json({ error: "Please provide content or a URL to optimize." });
    return;
  }

  let content: string;
  try {
    content = isUrl(rawInput) ? await extractContentFromUrl(rawInput.trim()) : rawInput;
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (content.trim().length < 10) {
    res.status(400).json({ error: "Content is too short to optimize." });
    return;
  }

  const hasKeywords = !!(keywords && keywords.trim().length > 0);

  try {
    const prompt = `Rewrite and optimize the following content for SEO, AEO, and GEO.

${hasKeywords ? `IMPORTANT: Optimize specifically for these target keywords: ${keywords}
Ensure:
- Natural usage of these keywords throughout the content
- Primary keyword placed in the title, introduction, and key headings
- Secondary keywords used in subheadings and body text naturally
- FAQ section addresses questions people search for around these keywords
- Semantic variations of the keywords are used for broader coverage
` : ""}
Return ONLY valid JSON (no markdown, no code blocks) in this exact structure:

{
  "title": "SEO-friendly optimized title (compelling, keyword-rich, under 70 chars)",
  "metaDescription": "Meta description under 160 characters. Clear, keyword-rich, action-oriented.",
  "introduction": "2-3 sentence engaging introduction paragraph that hooks the reader and states what they will learn.",
  "sections": [
    {
      "heading": "Section heading text",
      "level": 2,
      "content": "Paragraph explaining this section clearly and factually.",
      "bullets": ["Key point one", "Key point two", "Key point three"]
    }
  ],
  "faq": [
    {
      "question": "Common question about this topic?",
      "answer": "Direct, clear answer optimized for featured snippets. 2-3 sentences."
    }
  ],
  "internalLinks": [
    "Link to [Related Topic A] — anchor: 'learn more about X'",
    "Link to [Related Topic B] — anchor: 'see our guide on Y'"
  ],
  "conclusion": "Strong closing paragraph summarizing key takeaways and a clear call to action.",
  "rawContent": "The complete formatted content as plain text with all sections combined, suitable for copy-paste."
}

Requirements:
- Include 3-6 sections with H2/H3 headings (use level 2 or 3 in the JSON)
- Include 3-5 FAQ items with direct, snippet-ready answers
- Include 2-4 internal linking suggestions as descriptive placeholders
- Bullet points: 3-5 per section where helpful, otherwise empty array []
- Make all content clear, simple, and keyword-optimized
- rawContent should be the full article as clean plain text

Content to optimize:
${content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: "You are an expert content writer and SEO specialist. Always respond with valid JSON only, no markdown, no code blocks.",
        },
        { role: "user", content: prompt },
      ],
    });

    const rawOutput = (response.choices[0]?.message?.content ?? "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const optimized = JSON.parse(rawOutput);

    deductCredits(ip, 2);
    res.json({
      title: String(optimized.title ?? ""),
      metaDescription: String(optimized.metaDescription ?? ""),
      introduction: String(optimized.introduction ?? ""),
      sections: Array.isArray(optimized.sections)
        ? optimized.sections.map((s: any) => ({
            heading: String(s.heading ?? ""),
            level: Number(s.level ?? 2),
            content: String(s.content ?? ""),
            bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [],
          }))
        : [],
      faq: Array.isArray(optimized.faq)
        ? optimized.faq.map((f: any) => ({
            question: String(f.question ?? ""),
            answer: String(f.answer ?? ""),
          }))
        : [],
      internalLinks: Array.isArray(optimized.internalLinks)
        ? optimized.internalLinks.map(String)
        : [],
      conclusion: String(optimized.conclusion ?? ""),
      rawContent: String(optimized.rawContent ?? ""),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to optimize content");
    res.status(500).json({ error: "Failed to optimize content. Please try again." });
  }
});

export default router;
