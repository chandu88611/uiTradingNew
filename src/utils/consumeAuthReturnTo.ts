// src/utils/consumeAuthReturnTo.ts
export const AUTH_RETURN_TO_KEY = "auth:returnTo";

export function setAuthReturnTo(path: string) {
  if (!path) return;
  localStorage.setItem(AUTH_RETURN_TO_KEY, path);
}

export function peekAuthReturnTo(): string | null {
  return localStorage.getItem(AUTH_RETURN_TO_KEY);
}

/**
 * Reads and removes returnTo. Also blocks external URLs for safety.
 */
export function consumeAuthReturnTo(fallback = "/profile"): string {
  const raw = localStorage.getItem(AUTH_RETURN_TO_KEY);
  localStorage.removeItem(AUTH_RETURN_TO_KEY);

  if (!raw) return fallback;

  // allow only internal routes
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;

  return fallback;
}
