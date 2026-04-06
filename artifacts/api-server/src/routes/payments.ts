import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router = Router();

const PaypalSuccessBody = z.object({
  subscriptionID: z.string().min(1),
  plan: z.enum(["pro", "premium"]),
});

const PLAN_CREDITS: Record<string, number> = {
  pro: 50,
  premium: 200,
};

/* ══════════════════════════════════════
   POST /api/paypal-success
   Called after user completes PayPal subscription.
   Updates their plan + credits in the DB.
══════════════════════════════════════ */
router.post("/paypal-success", requireAuth, async (req, res) => {
  const parse = PaypalSuccessBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body. Provide subscriptionID and plan." });
    return;
  }

  const { plan } = parse.data;
  const credits = PLAN_CREDITS[plan];

  const [updated] = await db
    .update(usersTable)
    .set({ plan, credits })
    .where(eq(usersTable.id, req.user!.id))
    .returning({ credits: usersTable.credits, plan: usersTable.plan, email: usersTable.email });

  if (!updated) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  res.json({ success: true, credits: updated.credits, plan: updated.plan });
});

export default router;
