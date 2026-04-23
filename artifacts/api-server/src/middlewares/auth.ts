import type { Request, Response, NextFunction } from "express";
import { jwtVerify, SignJWT } from "jose";

export interface AuthUser {
  id: number;
  email: string;
  plan: string;
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: { id: number; email: string; plan: string }): Promise<string> {
  return new SignJWT({ email: payload.email, plan: payload.plan })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.id))
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, getJwtSecret());
    req.user = {
      id: Number(payload.sub),
      email: payload.email as string,
      plan: payload.plan as string,
    };
  } catch {
    // Invalid or expired token — treat as unauthenticated
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required. Please log in." });
      return;
    }
    next();
  });
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || req.user?.email !== adminEmail) {
      res.status(403).json({ error: "Access denied. Admins only." });
      return;
    }
    next();
  });
}
