import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

/* ══════════════════════════════════════
   GET /api/admin/stats
   Returns total users + feedback counts.
══════════════════════════════════════ */
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [feedbackCount] = await db.select({ count: count() }).from(feedbackTable);
  res.json({
    totalUsers: Number(userCount.count),
    totalFeedback: Number(feedbackCount.count),
  });
});

/* ══════════════════════════════════════
   GET /api/admin/users
   Returns all users (no passwords).
══════════════════════════════════════ */
router.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      plan: usersTable.plan,
      credits: usersTable.credits,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(users);
});

/* ══════════════════════════════════════
   DELETE /api/admin/users/:id
   Permanently removes a user account.
══════════════════════════════════════ */
router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [deleted] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, email: usersTable.email });

  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  console.log(`Admin deleted user: ${deleted.email} (id=${deleted.id})`);
  res.json({ success: true, deleted });
});

export default router;
