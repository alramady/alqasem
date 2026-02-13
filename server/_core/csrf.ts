import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { ENV } from "./env";

/**
 * CSRF Protection using the Double-Submit Cookie pattern.
 *
 * How it works:
 * 1. Server generates a cryptographic random token
 * 2. Token is set in two cookies:
 *    - `__csrf_token` (HttpOnly, Secure) — the source of truth
 *    - `csrf_token` (non-HttpOnly, Secure) — readable by JavaScript
 * 3. Client reads `csrf_token` from document.cookie and sends it
 *    as the `x-csrf-token` header on every mutation request
 * 4. Server middleware compares the header value against the HttpOnly cookie
 * 5. If they don't match (or either is missing), the mutation is rejected
 */

const CSRF_COOKIE_NAME = "__csrf_token";
const CSRF_READABLE_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_BYTES = 32;

/** Generate a cryptographically secure random token. */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

/** Determine if the request is over HTTPS (direct or behind proxy). */
function isSecure(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwarded = req.headers["x-forwarded-proto"];
  if (!forwarded) return false;
  const protos = Array.isArray(forwarded) ? forwarded : forwarded.split(",");
  return protos.some((p) => p.trim().toLowerCase() === "https");
}

/**
 * Set (or refresh) the CSRF token cookies on the response.
 * Called once per session or when the token is missing.
 */
export function setCsrfCookies(req: Request, res: Response, token: string): void {
  const secure = isSecure(req);
  const commonOpts = {
    path: "/",
    sameSite: "lax" as const,
    secure,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours, matches session expiry
  };

  // HttpOnly cookie — server-side source of truth
  res.cookie(CSRF_COOKIE_NAME, token, {
    ...commonOpts,
    httpOnly: true,
  });

  // Readable cookie — client JavaScript reads this to set the header
  res.cookie(CSRF_READABLE_COOKIE_NAME, token, {
    ...commonOpts,
    httpOnly: false,
  });
}

/**
 * Parse a specific cookie value from the raw Cookie header.
 * We avoid pulling in a full cookie-parser dependency.
 */
function parseCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const match = header.split(";").find((c) => c.trim().startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=")[1]?.trim() ?? "");
}

/**
 * Express middleware that:
 * - Issues CSRF cookies on every response if not already present
 * - Validates the CSRF token on tRPC mutation requests (POST to /api/trpc)
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed through.
 * The admin.localLogin and admin.localRegister mutations are exempt
 * on the *first* request (when no CSRF cookie exists yet) to allow
 * the initial login flow to bootstrap the token.
 */
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    const existingToken = parseCookie(req, CSRF_COOKIE_NAME);

    // Always ensure CSRF cookies exist — issue them if missing
    if (!existingToken) {
      const newToken = generateCsrfToken();
      setCsrfCookies(req, res, newToken);

      // If this is a safe method or a login/register bootstrap, allow through
      if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
        return next();
      }

      // Allow login/register mutations to bootstrap without a token
      const url = req.originalUrl || req.url;
      if (
        url.includes("admin.localLogin") ||
        url.includes("admin.localRegister") ||
        url.includes("auth.logout")
      ) {
        return next();
      }

      // For public form submissions, also allow bootstrap
      if (
        url.includes("public.submitInquiry") ||
        url.includes("public.submitProperty") ||
        url.includes("public.submitPropertyRequest")
      ) {
        return next();
      }
    }

    // Safe methods don't need CSRF validation
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }

    // Only validate CSRF on tRPC mutation paths (POST requests)
    const url = req.originalUrl || req.url;
    if (!url.startsWith("/api/trpc")) {
      return next();
    }

    // Validate: header token must match the HttpOnly cookie token
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
    const cookieToken = existingToken || parseCookie(req, CSRF_COOKIE_NAME);

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        error: {
          message: "CSRF token missing. Please refresh the page and try again.",
          code: "CSRF_TOKEN_MISSING",
        },
      });
    }

    // Constant-time comparison to prevent timing attacks
    if (
      cookieToken.length !== headerToken.length ||
      !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
    ) {
      return res.status(403).json({
        error: {
          message: "CSRF token mismatch. Please refresh the page and try again.",
          code: "CSRF_TOKEN_INVALID",
        },
      });
    }

    next();
  };
}

/**
 * Express route handler for GET /api/csrf-token.
 * Returns the current token (or generates a new one) so the SPA
 * can fetch it on app initialization.
 */
export function csrfTokenEndpoint(req: Request, res: Response): void {
  let token = parseCookie(req, CSRF_COOKIE_NAME);
  if (!token) {
    token = generateCsrfToken();
    setCsrfCookies(req, res, token);
  }
  res.json({ csrfToken: token });
}
