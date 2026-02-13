/**
 * CSRF Token Hook
 *
 * Reads the CSRF token from the `csrf_token` cookie (set by the server).
 * Falls back to fetching from /api/csrf-token if the cookie isn't present.
 * The token is cached in module scope so it's only fetched once per page load.
 */

let cachedToken: string | null = null;
let fetchPromise: Promise<string> | null = null;

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

/**
 * Get the current CSRF token. Reads from cookie first, then fetches
 * from the server if needed. Result is cached for the page lifetime.
 */
export async function getCsrfToken(): Promise<string> {
  // Try reading from the readable cookie first
  const cookieToken = getCookie("csrf_token");
  if (cookieToken) {
    cachedToken = cookieToken;
    return cookieToken;
  }

  // Use cached value if available
  if (cachedToken) return cachedToken;

  // Deduplicate concurrent fetch calls
  if (!fetchPromise) {
    fetchPromise = fetchCsrfToken().then((token) => {
      cachedToken = token;
      fetchPromise = null;
      return token;
    });
  }

  return fetchPromise;
}

/**
 * Reset the cached token. Call this after a 403 CSRF error
 * to force a fresh token fetch on the next request.
 */
export function resetCsrfToken(): void {
  cachedToken = null;
  fetchPromise = null;
}
