import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

/* ══════════════════════════════════════════════════════════
   POST /api/paypal-webhook
   Receives PayPal webhook events and keeps the DB in sync.

   Primary event handled:
     PAYMENT.SALE.COMPLETED — fires each billing cycle.
     Amount is used to determine the plan:
       $12 → pro  (50 credits)
       $39 → premium (200 credits)

   We always return 200 so PayPal doesn't retry endlessly.
   The user's credits are INCREMENTED (not replaced) so they
   accumulate properly on each renewal cycle.
══════════════════════════════════════════════════════════ */

const AMOUNT_TO_PLAN: Record<string, { plan: string; credits: number }> = {
  "12.00": { plan: "pro",     credits: 50  },
  "12":    { plan: "pro",     credits: 50  },
  "39.00": { plan: "premium", credits: 200 },
  "39":    { plan: "premium", credits: 200 },
};

router.post("/paypal-webhook", async (req, res) => {
  try {
    const event = req.body ?? {};
    const eventType: string = event?.event_type ?? "UNKNOWN";

    logger.info({ eventType }, "PayPal webhook received");
    console.log("Webhook received:", eventType);

    /* ── PAYMENT.SALE.COMPLETED ── */
    if (eventType === "PAYMENT.SALE.COMPLETED") {
      const resource = event?.resource ?? {};

      /* Extract amount (PayPal sends it as a string like "12.00") */
      const amountTotal: string =
        resource?.amount?.total ??
        resource?.amount?.value ??
        "0";

      /* Extract subscription ID */
      const subscriptionId: string | null =
        resource?.billing_agreement_id ?? null;

      /* PayPal puts payer email in different places depending on API version */
      const payerEmail: string | null =
        resource?.payer_info?.payer_email ??
        resource?.payer?.email_address ??
        null;

      console.log(
        `PAYMENT.SALE.COMPLETED | amount=$${amountTotal} | email=${payerEmail} | subId=${subscriptionId}`
      );

      const planInfo = AMOUNT_TO_PLAN[amountTotal];

      if (!planInfo) {
        console.log(`Unknown amount $${amountTotal} — ignoring`);
        res.status(200).json({ received: true, note: "unknown_amount" });
        return;
      }

      if (!payerEmail) {
        console.log("No payer email in event — cannot update user");
        res.status(200).json({ received: true, note: "no_email" });
        return;
      }

      /* Find user */
      const [user] = await db
        .select({ id: usersTable.id, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.email, payerEmail))
        .limit(1);

      if (!user) {
        console.log(`No user found for email: ${payerEmail} — ignoring`);
        res.status(200).json({ received: true, note: "user_not_found" });
        return;
      }

      /* Increment credits and ensure plan is set correctly */
      await db
        .update(usersTable)
        .set({
          plan: planInfo.plan,
          credits: sql`${usersTable.credits} + ${planInfo.credits}`,
        })
        .where(eq(usersTable.id, user.id));

      console.log(
        `Updated user ${payerEmail}: plan=${planInfo.plan}, +${planInfo.credits} credits (subId=${subscriptionId})`
      );

      res.status(200).json({ received: true, updated: true });
      return;
    }

    /* ── All other events — acknowledge and ignore ── */
    console.log(`Event ${eventType} not handled — ignoring`);
    res.status(200).json({ received: true, note: "event_not_handled" });
  } catch (err) {
    /* Never let PayPal see a 500 — it will keep retrying */
    console.error("Webhook handler error:", err);
    res.status(200).json({ received: true, note: "internal_error" });
  }
});

export default router;
