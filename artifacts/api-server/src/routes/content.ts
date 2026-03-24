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
    const prompt = `You are an expert SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization) analyst.

Analyze the following content and return a structured JSON response.

Analyze for:
- SEO: keyword usage, headings, meta-friendly structure, readability, internal linking signals
- AEO: direct answers, FAQ structure, featured snippet potential, question-based content
- GEO: LLM-friendly structure, factual clarity, entity mentions, source-worthiness, structured data potential

Return ONLY valid JSON in this exact format:
{
  "seoScore": <number 0-100>,
  "aeoScore": <number 0-100>,
  "geoScore": <number 0-100>,
  "issues": [<string>, ...],
  "suggestions": [
    {"title": <string>, "explanation": <string>, "category": "SEO"|"AEO"|"GEO"},
    ...
  ]
}

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

    res.json({
      seoScore: Number(analysis.seoScore) || 0,
      aeoScore: Number(analysis.aeoScore) || 0,
      geoScore: Number(analysis.geoScore) || 0,
      issues: Array.isArray(analysis.issues) ? analysis.issues : [],
      suggestions: Array.isArray(analysis.suggestions)
        ? analysis.suggestions
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
    const prompt = `Rewrite and optimize the following content for SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

Make the rewritten content:
- Clear and well-structured with proper H1/H2/H3 headings
- Answer-focused: include direct answers to common questions
- Keyword optimized naturally (no keyword stuffing)
- LLM-friendly: factual, entity-rich, authoritative
- Featured snippet ready: include short direct answers
- Include bullet points and an FAQ section where useful
- Readable and engaging for humans

Return ONLY the optimized content as plain text. No JSON, no markdown code blocks, just the improved content itself.

Original content:
${content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content:
            "You are an expert content writer and SEO specialist. Return only the optimized content, nothing else.",
        },
        { role: "user", content: prompt },
      ],
    });

    const optimizedContent = response.choices[0]?.message?.content ?? "";

    res.json({ optimizedContent });
  } catch (err) {
    req.log.error({ err }, "Failed to optimize content");
    res
      .status(500)
      .json({ error: "Failed to optimize content. Please try again." });
  }
});

export default router;
