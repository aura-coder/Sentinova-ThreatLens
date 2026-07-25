// Simple token storage + authenticated fetch wrapper.
// Token lives in localStorage so it survives page refresh (but not
// browser close on some browsers with private mode - fine for this project).

const TOKEN_KEY = "threatlens_token";
const API_BASE = "http://127.0.0.1:8000";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

/**
 * Wrapper around fetch() that automatically attaches the JWT token
 * and points at the backend base URL. Use this instead of raw fetch()
 * for any call to the ThreatLens API.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return res;
}

export type CurrentUser = {
  id: string;
  email: string;
  role: string;
};

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await apiFetch("/api/v1/auth/me");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}