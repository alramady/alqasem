export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the local admin login URL.
 * All authentication is handled via local username/password — no OAuth.
 */
export const getLoginUrl = (returnPath?: string) => {
  const base = "/admin/login";
  if (returnPath) {
    return `${base}?returnTo=${encodeURIComponent(returnPath)}`;
  }
  return base;
};
