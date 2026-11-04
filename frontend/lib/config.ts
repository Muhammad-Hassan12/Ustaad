/**
 * Central API base URL configuration.
 *
 * - In development the backend defaults to http://localhost:8000.
 * - In production an empty value means "same origin" is NOT assumed for
 *   fetch helpers: `apiUrl()` throws a clear error when the URL is missing
 *   so a misconfigured deployment fails loudly instead of calling `undefined/...`.
 */
export const API_URL: string = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000")
).replace(/\/+$/, "");

/** Build an absolute backend URL for `path` (which should start with "/"). */
export function apiUrl(path: string): string {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
