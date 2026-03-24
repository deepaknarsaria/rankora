import { Router, type IRouter } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  AnalyzeContentBody,
  OptimizeContentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
  const h1s = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .join(" | ");
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const combined = [
    title ? `Title: ${title}` : "",
    metaDesc ? `Meta Description: ${metaDesc}` : "",
    h1s ? `H1 Headings: ${h1s}` : "",
    bodyText,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (combined.length < 50) {
    throw new Error("Could not extract meaningful content from this URL");
  }

  return combined.slice(0, 12000);
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzeContentBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content: rawInput } = parseResult.data;

  if (!rawInput || rawInput.trim().length < 3) {
    res.status(400).json({ error: "Please provide content or a URL to analyze." });
    return;
  }

  let content: string;
  const inputIsUrl = isUrl(rawInput);

  try {
    content = inputIsUrl ? await extractContentFromUrl(rawInput.trim()) : rawInput;
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (content.trim().length < 10) {
    res.status(400).json({ error: "Content is too short to analyze meaningfully." });
    return;
  }

  try {
    const prompt = `Analyze the following content for SEO, AEO, and GEO optimization.

Return ONLY JSON in this format:

{
  "seoScore": number (0-100),
  "aeoScore": number (0-100),
  "geoScore": number (0-100),
  "aiVisibilityScore": number (0-100),

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
* Keep language simple and beginner-friendly
* Make suggestions actionable
* Include real examples wherever possible
* Prioritize high-impact SEO and AI optimization

Content:
${content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content:
            "You are an expert content optimization analyst. Always respond with valid JSON only, no markdown, no code blocks.",
        },
        { role: "user", content: prompt },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? "{}";
    const cleanedContent = rawContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const analysis = JSON.parse(cleanedContent);

    const normalizePriority = (p: string) => {
      const v = String(p ?? "").trim();
      if (v === "High" || v === "Medium" || v === "Low") return v;
      return "Medium";
    };

    res.json({
      seoScore: Number(analysis.seoScore) || 0,
      aeoScore: Number(analysis.aeoScore) || 0,
      geoScore: Number(analysis.geoScore) || 0,
      aiVisibilityScore: Number(analysis.aiVisibilityScore) || 0,
      issues: Array.isArray(analysis.issues)
        ? analysis.issues.map((issue: any) => ({
            title: String(issue.title ?? ""),
            description: String(issue.description ?? ""),
            impact: String(issue.impact ?? ""),
            priority: normalizePriority(issue.priority),
          }))
        : [],
      opportunities: Array.isArray(analysis.opportunities)
        ? analysis.opportunities.map((opp: any) => ({
            title: String(opp.title ?? ""),
            description: String(opp.description ?? ""),
            example: String(opp.example ?? ""),
            impact: String(opp.impact ?? ""),
            priority: normalizePriority(opp.priority),
          }))
        : [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze content");
    res
      .status(500)
      .json({ error: "Failed to analyze content. Please try again." });
  }
});

router.post("/optimize", async (req, res) => {
  const parseResult = OptimizeContentBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content: rawInput } = parseResult.data;

  if (!rawInput || rawInput.trim().length < 3) {
    res.status(400).json({ error: "Please provide content or a URL to optimize." });
    return;
  }

  let content: string;
  const inputIsUrl = isUrl(rawInput);

  try {
    content = inputIsUrl ? await extractContentFromUrl(rawInput.trim()) : rawInput;
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (content.trim().length < 10) {
    res.status(400).json({ error: "Content is too short to optimize." });
    return;
  }

  try {
    const prompt = `Rewrite and optimize the following content for SEO, AEO, and GEO.

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
          content:
            "You are an expert content writer and SEO specialist. Always respond with valid JSON only, no markdown, no code blocks.",
        },
        { role: "user", content: prompt },
      ],
    });

    const rawOutput = response.choices[0]?.message?.content ?? "{}";
    const cleanedOutput = rawOutput
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const optimized = JSON.parse(cleanedOutput);

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
    res
      .status(500)
      .json({ error: "Failed to optimize content. Please try again." });
  }
});

export default router;
