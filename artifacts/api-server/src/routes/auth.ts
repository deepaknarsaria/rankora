import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { createToken, requireAuth } from "../middlewares/auth.js";

const router = Router();

const SALT_ROUNDS = 12;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "throwaway.email",
  "yopmail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "trashmail.com",
  "sharklasers.com",
]);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return DISPOSABLE_DOMAINS.has(domain);
}

/* ── POST /api/signup ── */
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== "string" || !isValidEmail(email.trim())) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isDisposableEmail(normalizedEmail)) {
      res.status(400).json({ error: "Disposable email addresses are not allowed." });
      return;
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db
      .insert(usersTable)
      .values({ email: normalizedEmail, passwordHash, credits: 5, plan: "free" })
      .returning();

    const token = await createToken({ id: user.id, email: user.email, plan: user.plan });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, plan: user.plan, credits: user.credits },
    });
  } catch (err) {
    req.log.error({ err }, "Signup failed");
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

/* ── POST /api/login ── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, String(email).trim().toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = await createToken({ id: user.id, email: user.email, plan: user.plan });

    res.json({
      token,
      user: { id: user.id, email: user.email, plan: user.plan, credits: user.credits },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/* ── GET /api/me ── */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        plan: usersTable.plan,
        credits: usersTable.credits,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ user });
  } catch (err) {
    req.log.error({ err }, "Me endpoint failed");
    res.status(500).json({ error: "Failed to fetch user data." });
  }
});

/* ── POST /api/logout ── */
router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

export default router;
