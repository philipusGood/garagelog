import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";

// ── Config ────────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn(
    "[auth] WARNING: JWT_SECRET env var is not set. " +
    "Using an insecure fallback. Set JWT_SECRET before exposing this app to the internet."
  );
}
const SECRET = JWT_SECRET ?? "garagelog-insecure-fallback-do-not-use-in-prod";

export const COOKIE_NAME = "gl_auth";
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

export function signToken(username: string): string {
  return jwt.sign({ sub: username }, SECRET, { expiresIn: "30d" });
}

function verifyToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, SECRET) as { sub: string };
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME);
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

// ── Boot-time user init ───────────────────────────────────────────────────────
// If ADMIN_USER + ADMIN_PASSWORD are set, upsert that user on every startup.
// This doubles as the "reset by env var + restart" mechanism.

export async function initAdminUser(): Promise<void> {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;

  if (ADMIN_USER && ADMIN_PASSWORD) {
    const hash = await hashPassword(ADMIN_PASSWORD);
    (db.prepare(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
      ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash
    `) as any).run(ADMIN_USER, hash);
    console.log(`[auth] Admin user "${ADMIN_USER}" is ready.`);
    return;
  }

  const { c } = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (c === 0) {
    console.warn(
      "[auth] No users exist and ADMIN_USER/ADMIN_PASSWORD are not set. " +
      "Nobody can log in until you set credentials. " +
      "Either set ADMIN_USER + ADMIN_PASSWORD env vars and restart, or run: " +
      "docker exec -it garagelog node /app/reset-auth.mjs <username> <password>"
    );
  }
}
