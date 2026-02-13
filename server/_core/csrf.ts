import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

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
 *
 * Bootstrap handling:
 * - On first visit, no cookies exist. The middleware issues fresh tokens
 *   and allows specific "bootstrap-safe" mutations through (login, register,
 *   logout, and all public form submissions).
 * - The SPA eagerly fetches /api/csrf-token on initialization to ensure
 *   cookies are set before any form is rendered.
 */

const CSRF_COOKIE_NAME = "__csrf_token";
const CSRF_READABLE_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_BYTES = 32;

/**
 * Mutations that are allowed to proceed without a valid CSRF token.
 * These are either authentication bootstrapping endpoints or public
 * form submissions that a first-time visitor needs to use.
 */
const BOOTSTRAP_SAFE_MUTATIONS = [
  "admin.localLogin",
  "admin.localRegister",
  "admin.requestPasswordReset",
  "admin.resetPassword",
  "auth.logout",
  "public.submitInquiry",
  "public.submitProperty",
  "public.submitPropertyRequest",
];

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
 */
function parseCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const match = header.split(";").find((c) => c.trim().startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=")[1]?.trim() ?? "");
}

/**
 * Check if a tRPC URL contains any of the bootstrap-safe mutation names.
 * tRPC batch URLs look like: /api/trpc/public.submitInquiry?batch=1
 * or /api/trpc/public.submitInquiry,auth.me?batch=1
 */
function isBootstrapSafeMutation(url: string): boolean {
  return BOOTSTRAP_SAFE_MUTATIONS.some((name) => url.includes(name));
}

/**
 * Express middleware that:
 * - Issues CSRF cookies on every response if not already present
 * - Validates the CSRF token on tRPC mutation requests (POST to /api/trpc)
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed through.
 * Bootstrap-safe mutations are allowed when no CSRF cookie exists yet
 * (first visit scenario).
 */
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    const existingToken = parseCookie(req, CSRF_COOKIE_NAME);

    // If no CSRF cookie exists, issue fresh tokens
    if (!existingToken) {
      const newToken = generateCsrfToken();
      setCsrfCookies(req, res, newToken);

      // Safe methods always pass through
      if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
        return next();
      }

      // Check the URL for bootstrap-safe or non-tRPC paths
      const url = req.originalUrl || req.url;

      // Non-tRPC POST requests (e.g., /api/oauth/callback) don't need CSRF
      if (!url.startsWith("/api/trpc")) {
        return next();
      }

      // Allow bootstrap-safe mutations on first visit (no cookie yet)
      if (isBootstrapSafeMutation(url)) {
        return next();
      }

      // Non-bootstrap tRPC mutations without any cookie → reject
      return res.status(403).json({
        error: {
          message: "CSRF token missing. Please refresh the page and try again.",
          code: "CSRF_TOKEN_MISSING",
        },
      });
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

    if (!headerToken) {
      // No header token — check if this is a bootstrap-safe mutation
      if (isBootstrapSafeMutation(url)) {
        return next();
      }
      return res.status(403).json({
        error: {
          message: "CSRF token missing. Please refresh the page and try again.",
          code: "CSRF_TOKEN_MISSING",
        },
      });
    }

    // Constant-time comparison to prevent timing attacks
    try {
      const cookieBuffer = Buffer.from(existingToken);
      const headerBuffer = Buffer.from(headerToken);

      if (
        cookieBuffer.length !== headerBuffer.length ||
        !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
      ) {
        // Token mismatch — but if it's a bootstrap-safe mutation, allow it
        // This handles the case where the client has a stale cached token
        if (isBootstrapSafeMutation(url)) {
          return next();
        }
        return res.status(403).json({
          error: {
            message: "CSRF token mismatch. Please refresh the page and try again.",
            code: "CSRF_TOKEN_INVALID",
          },
        });
      }
    } catch {
      // Buffer creation or comparison failed — allow bootstrap-safe mutations
      if (isBootstrapSafeMutation(url)) {
        return next();
      }
      return res.status(403).json({
        error: {
          message: "CSRF token validation error. Please refresh the page and try again.",
          code: "CSRF_TOKEN_ERROR",
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
