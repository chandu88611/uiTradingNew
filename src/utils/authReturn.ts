// src/utils/authReturn.ts
const KEY = "auth:returnTo";

export function setAuthReturnTo(path: string) {
  if (path) localStorage.setItem(KEY, path);
}

export function consumeAuthReturnTo(fallback = "/dashboard") {
  const path = localStorage.getItem(KEY);
  if (path) {
    localStorage.removeItem(KEY);
    return path;
  }
  return fallback;
}
