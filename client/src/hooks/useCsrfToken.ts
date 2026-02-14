/**
 * CSRF Token Module
 *
 * Provides the CSRF token for tRPC mutation requests.
 *
 * Strategy:
 * 1. On module load, immediately fetch /api/csrf-token to bootstrap
 *    the CSRF cookies (both HttpOnly and readable).
 * 2. On each request, re-read the `csrf_token` cookie (not a stale cache)
 *    so that server-side token rotations are always picked up.
 * 3. If the cookie is somehow missing, fall back to the bootstrapped value.
 * 4. On 403 CSRF errors, force a fresh fetch from the server.
 */

/** Read a cookie value by name from document.cookie. */
function getCookie(name: string): string | undefined {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=")[1] ?? "");
}

/** Fetch the CSRF token from the server endpoint. */
async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch CSRF token: ${res.status}`);
  }
  const data = await res.json();
  return data.csrfToken;
}

// Eagerly bootstrap the CSRF token on module load.
// This ensures cookies are set before any mutation can fire.
let bootstrapPromise: Promise<string> | null = null;
let bootstrapToken: string | null = null;

function ensureBootstrapped(): Promise<string> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetchCsrfToken()
      .then((token) => {
        bootstrapToken = token;
        return token;
      })
      .catch((err) => {
        console.warn("[CSRF] Bootstrap fetch failed:", err);
        bootstrapPromise = null; // Allow retry
        return "";
      });
  }
  return bootstrapPromise;
}

// Start bootstrap immediately when this module is imported
ensureBootstrapped();

/**
 * Get the current CSRF token for use in request headers.
 *
 * Always re-reads the cookie to pick up server-side rotations.
 * Falls back to the bootstrapped token if the cookie isn't available yet.
 * Waits for the bootstrap fetch to complete if it's still in flight.
 */
export async function getCsrfToken(): Promise<string> {
  // Always try the fresh cookie value first (handles rotations)
  const cookieToken = getCookie("csrf_token");
  if (cookieToken) {
    return cookieToken;
  }

  // Cookie not available yet — wait for bootstrap to complete
  await ensureBootstrapped();

  // Try cookie again after bootstrap (the fetch response sets the cookie)
  const freshCookie = getCookie("csrf_token");
  if (freshCookie) {
    return freshCookie;
  }

  // Last resort: use the token value returned by the bootstrap fetch
  if (bootstrapToken) {
    return bootstrapToken;
  }

  return "";
}

/**
 * Reset the CSRF token state. Call this after a 403 CSRF error
 * to force a fresh token fetch on the next request.
 */
export function resetCsrfToken(): void {
  bootstrapToken = null;
  bootstrapPromise = null;
  // Re-bootstrap immediately so the next mutation has a valid token
  ensureBootstrapped();
}
