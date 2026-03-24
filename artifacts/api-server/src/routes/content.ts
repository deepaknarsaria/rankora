import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  AnalyzeContentBody,
  OptimizeContentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzeContentBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content } = parseResult.data;

  if (!content || content.trim().length < 10) {
    res.status(400).json({ error: "Content must be at least 10 characters long" });
    return;
  }

  try {
    const prompt = `You are an expert SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization) analyst. Analyze the following content and return a structured JSON response.

Analyze for:
- SEO (Search Engine Optimization): keyword usage, headings, meta-friendly structure, readability
- AEO (Answer Engine Optimization): direct answers, FAQ structure, featured snippet potential, question-based content
- GEO (Generative Engine Optimization): LLM-friendly structure, factual clarity, entity mentions, source-worthiness

Return ONLY valid JSON in this exact format:
{
  "seoScore": <number 0-100>,
  "aeoScore": <number 0-100>,
  "geoScore": <number 0-100>,
  "issues": [<string>, <string>, ...],
  "suggestions": [
    {"title": <string>, "explanation": <string>, "category": "SEO"|"AEO"|"GEO"},
    ...
  ]
}

Content to analyze:
${content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: "You are an expert content optimization analyst. Always respond with valid JSON only, no markdown, no code blocks.",
        },
        { role: "user", content: prompt },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? "{}";
    const cleanedContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleanedContent);

    res.json({
      seoScore: Number(analysis.seoScore) || 0,
      aeoScore: Number(analysis.aeoScore) || 0,
      geoScore: Number(analysis.geoScore) || 0,
      issues: Array.isArray(analysis.issues) ? analysis.issues : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze content");
    res.status(500).json({ error: "Failed to analyze content. Please try again." });
  }
});

router.post("/optimize", async (req, res) => {
  const parseResult = OptimizeContentBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content } = parseResult.data;

  if (!content || content.trim().length < 10) {
    res.status(400).json({ error: "Content must be at least 10 characters long" });
    return;
  }

  try {
    const prompt = `Rewrite and optimize the following content for SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

Make the rewritten content:
- Clear and well-structured with proper headings
- Answer-focused with direct, concise answers to likely questions
- Keyword optimized naturally (no keyword stuffing)
- LLM-friendly: factual, entity-rich, authoritative
- Featured snippet ready: include short direct answers
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
          content: "You are an expert content writer and SEO specialist. Return only the optimized content, nothing else.",
        },
        { role: "user", content: prompt },
      ],
    });

    const optimizedContent = response.choices[0]?.message?.content ?? "";

    res.json({ optimizedContent });
  } catch (err) {
    req.log.error({ err }, "Failed to optimize content");
    res.status(500).json({ error: "Failed to optimize content. Please try again." });
  }
});

export default router;
