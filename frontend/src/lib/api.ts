// Thin client for the Flag Nation backend. See backend/README.md for the
// full endpoint reference this talks to.

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";

// The access token lives in memory only (not localStorage) to limit XSS
// blast radius — it's reset on every full page load and restored via the
// httpOnly refresh cookie in `refreshSession()` below.
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function rawRequest(path: string, options: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    // Sends/receives the httpOnly refresh-token cookie.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });
}

// Restores a session from the refresh cookie. Called once on app mount
// (so a browser refresh keeps you logged in on the current page instead
// of bouncing to /login) and transparently whenever a request comes back
// 401 because the short-lived access token expired.
export async function refreshSession(): Promise<{ user: any; accessToken: string } | null> {
  try {
    const res = await rawRequest("/auth/refresh", { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return data;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  _retried = false
): Promise<T> {
  const res = await rawRequest(path, options);

  if (res.status === 401 && !_retried && path !== "/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, options, true);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Something went wrong.");
  return data as T;
}

export function apiGet<T = any>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}
export function apiPost<T = any>(path: string, body?: unknown) {
  return apiFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}
export function apiPatch<T = any>(path: string, body?: unknown) {
  return apiFetch<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined });
}
export function apiDelete<T = any>(path: string) {
  return apiFetch<T>(path, { method: "DELETE" });
}
