import { COOKIE_NAME, SESSION_MAX_AGE_MS, BCRYPT_SALT_ROUNDS, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MINUTES } from "@shared/const";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { notifyNewLogin, notifySuspiciousActivity } from "../notifications";

// In-memory rate limiting store
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkRateLimit(username: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(username);

  if (!record) return { allowed: true };

  const windowMs = LOGIN_LOCKOUT_MINUTES * 60 * 1000;
  if (now - record.firstAttempt > windowMs) {
    loginAttempts.delete(username);
    return { allowed: true };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

function recordFailedAttempt(username: string) {
  const now = Date.now();
  const record = loginAttempts.get(username);
  if (!record) {
    loginAttempts.set(username, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

function clearAttempts(username: string) {
  loginAttempts.delete(username);
}

export function registerOAuthRoutes(app: Express) {
  // POST /api/auth/login — local username/password login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      // Rate limiting check
      const rateCheck = checkRateLimit(username);
      if (!rateCheck.allowed) {
        res.status(429).json({
          error: `Too many login attempts. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        });
        return;
      }

      // Look up user by username (includes passwordHash for verification)
      const user = await db.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        recordFailedAttempt(username);
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }

      // Check if account is active
      if (!user.isActive) {
        res.status(403).json({ error: "Account is deactivated. Contact your administrator." });
        return;
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        recordFailedAttempt(username);
        const record = loginAttempts.get(username);
        // Notify on suspicious activity (3+ failed attempts)
        if (record && record.count >= 3) {
          const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "";
          notifySuspiciousActivity(username, record.count, clientIp).catch(() => {});
        }
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }

      // Clear rate limit on success
      clearAttempts(username);

      // Create JWT session
      const sessionToken = await sdk.createSessionToken({
        userId: user.id,
        username: user.username || "",
        role: user.role,
        name: user.displayName || user.name || "",
      });

      // Update last sign-in
      const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "";
      await db.updateUserLogin(user.id, clientIp);

      // Audit log
      await db.insertAuditLog({
        userId: user.id,
        action: "login",
        target: username,
        ipAddress: clientIp,
      });

      // Check if first login (lastSignedIn close to createdAt means first time)
      const isFirstLogin = !user.lastSignedIn || (user.lastSignedIn.getTime() - user.createdAt.getTime() < 60000);
      notifyNewLogin({ id: user.id, username: user.username, displayName: user.displayName, role: user.role }, clientIp, isFirstLogin).catch(() => {});

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });

      // Return user info (without passwordHash)
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          displayName: user.displayName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      // Try to get user for audit log
      try {
        const user = await sdk.authenticateRequest(req);
        if (user) {
          const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "";
          await db.insertAuditLog({
            userId: user.id,
            action: "logout",
            target: user.username || undefined,
            ipAddress: clientIp,
          });
        }
      } catch {
        // Ignore auth errors during logout
      }

      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // GET /api/auth/me — return current user from JWT cookie
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isActive: user.isActive,
        lastSignedIn: user.lastSignedIn,
        createdAt: user.createdAt,
      });
    } catch {
      res.json(null);
    }
  });
}
