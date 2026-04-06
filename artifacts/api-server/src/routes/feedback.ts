import { Router } from "express";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import nodemailer from "nodemailer";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

/* ── Email transporter (optional — skipped if env vars not set) ── */
function getMailer() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/* ══════════════════════════════════════
   POST /api/feedback
   Public — anyone can submit feedback.
══════════════════════════════════════ */
const FeedbackBody = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  message: z.string().min(5, "Message must be at least 5 characters").max(2000),
});

router.post("/feedback", async (req, res) => {
  const parse = FeedbackBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors[0].message });
    return;
  }

  const { name, email, message } = parse.data;

  const [created] = await db
    .insert(feedbackTable)
    .values({ name, email, message, status: "pending" })
    .returning();

  res.status(201).json({ success: true, id: created.id });
});

/* ══════════════════════════════════════
   GET /api/feedback
   Protected — requires auth (admin).
══════════════════════════════════════ */
router.get("/feedback", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt));

  res.json(rows);
});

/* ══════════════════════════════════════
   POST /api/feedback/reply
   Protected — requires auth (admin).
   Body: { id: number, reply: string }
══════════════════════════════════════ */
const ReplyBody = z.object({
  id: z.number().int().positive(),
  reply: z.string().min(1, "Reply cannot be empty"),
});

router.post("/feedback/reply", requireAdmin, async (req, res) => {
  const parse = ReplyBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors[0].message });
    return;
  }

  const { id, reply } = parse.data;

  const [updated] = await db
    .update(feedbackTable)
    .set({ reply, status: "replied" })
    .where(eq(feedbackTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  /* Send email reply if mailer is configured */
  const mailer = getMailer();
  if (mailer) {
    try {
      await mailer.sendMail({
        from: `"Rankora AI" <${process.env.EMAIL_USER}>`,
        to: updated.email,
        subject: "Reply to your feedback - Rankora",
        text: [
          `Hi ${updated.name},`,
          "",
          "Thank you for your feedback. Here is our reply:",
          "",
          reply,
          "",
          "Best regards,",
          "The Rankora AI Team",
        ].join("\n"),
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto">
            <h2 style="color:#4d44e3">Rankora AI</h2>
            <p>Hi <strong>${updated.name}</strong>,</p>
            <p>Thank you for your feedback. Here is our reply:</p>
            <blockquote style="border-left:3px solid #4d44e3;padding-left:16px;color:#333">
              ${reply.replace(/\n/g, "<br>")}
            </blockquote>
            <p style="color:#888;font-size:12px;margin-top:32px">
              — The Rankora AI Team
            </p>
          </div>
        `,
      });
      console.log(`Reply email sent to ${updated.email}`);
    } catch (err) {
      console.error("Failed to send reply email:", err);
    }
  } else {
    console.log("EMAIL_USER/EMAIL_PASS not set — skipping email");
  }

  res.json({ success: true, feedback: updated });
});

export default router;
