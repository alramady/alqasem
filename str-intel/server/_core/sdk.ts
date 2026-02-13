import { COOKIE_NAME, SESSION_MAX_AGE_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

// Safe user type without passwordHash
export type SafeUser = {
  id: number;
  username: string | null;
  name: string | null;
  displayName: string | null;
  email: string | null;
  mobile: string | null;
  role: "viewer" | "user" | "admin";
  isActive: boolean;
  lastLoginIp: string | null;
  lastSignedIn: Date;
  createdAt: Date;
  updatedAt: Date;
  openId: string | null;
  loginMethod: string | null;
};

export type SessionPayload = {
  userId: number;
  username: string;
  role: string;
  name: string;
};

class AuthService {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a JWT session token for a local user
   */
  async createSessionToken(payload: SessionPayload): Promise<string> {
    const issuedAt = Date.now();
    const expirationSeconds = Math.floor((issuedAt + SESSION_MAX_AGE_MS) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a JWT session token and return the payload
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) return null;

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });

      const { userId, username, role, name } = payload as Record<string, unknown>;

      if (typeof userId !== "number" || typeof username !== "string") {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        userId: userId as number,
        username: username as string,
        role: (role as string) || "viewer",
        name: (name as string) || "",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate a request by parsing the JWT cookie and looking up the user
   */
  async authenticateRequest(req: Request): Promise<SafeUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    // Import db lazily to avoid circular dependency
    const db = await import("../db");
    const user = await db.getUserById(session.userId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    if (!user.isActive) {
      throw ForbiddenError("Account is deactivated");
    }

    return user;
  }
}

export const sdk = new AuthService();
