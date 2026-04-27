const ACCESS_KEY = "cp.ext.token";
const REFRESH_KEY = "cp.ext.refresh";
const EXPIRES_KEY = "cp.ext.expires";

export interface StoredTokens {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export function getStoredTokens(): StoredTokens | null {
  try {
    const token = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const expiresAt = localStorage.getItem(EXPIRES_KEY);
    if (!token || !refreshToken) return null;
    return { token, refreshToken, expiresAt: expiresAt || "" };
  } catch {
    return null;
  }
}

export function setStoredTokens(t: StoredTokens) {
  try {
    localStorage.setItem(ACCESS_KEY, t.token);
    localStorage.setItem(REFRESH_KEY, t.refreshToken);
    localStorage.setItem(EXPIRES_KEY, t.expiresAt);
  } catch {
    /* ignore */
  }
}

export function clearStoredTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  } catch {
    /* ignore */
  }
}
