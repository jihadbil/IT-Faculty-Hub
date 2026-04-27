import { EXTERNAL_API_BASE_URL } from "./config";
import {
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
  type StoredTokens,
} from "./token-store";
import type { AuthResponseDto } from "./types";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
  }
}

let onUnauthorizedHandler: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorizedHandler = fn;
}

let inflightRefresh: Promise<StoredTokens | null> | null = null;

async function refreshTokens(): Promise<StoredTokens | null> {
  const current = getStoredTokens();
  if (!current?.refreshToken) return null;
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${EXTERNAL_API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(current.refreshToken),
      });
      if (!res.ok) {
        clearStoredTokens();
        return null;
      }
      const data: AuthResponseDto = await res.json();
      const next: StoredTokens = {
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      };
      setStoredTokens(next);
      return next;
    } catch {
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
  rawJsonBody?: string;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${EXTERNAL_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function performRequest<T>(path: string, opts: RequestOptions, isRetry = false): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.rawJsonBody !== undefined) {
    headers["Content-Type"] = "application/json";
    body = opts.rawJsonBody;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const auth = opts.auth !== false;
  if (auth) {
    const tokens = getStoredTokens();
    if (tokens?.token) headers["Authorization"] = `Bearer ${tokens.token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method || "GET",
      headers,
      body,
      signal: opts.signal,
    });
  } catch (err) {
    throw new NetworkError(
      `تعذّر الاتصال بـ API على ${EXTERNAL_API_BASE_URL}. تأكد من تشغيل الخادم وأن النطاق مسموح به (CORS).`,
    );
  }

  if (res.status === 401 && auth && !isRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return performRequest<T>(path, opts, true);
    }
    if (onUnauthorizedHandler) onUnauthorizedHandler();
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  let data: unknown = undefined;
  if (contentType.includes("application/json") || contentType.includes("text/json")) {
    data = await res.json().catch(() => undefined);
  } else {
    const text = await res.text().catch(() => "");
    data = text;
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.message === "string" && obj.message) message = obj.message;
      else if (typeof obj.title === "string" && obj.title) message = obj.title;
    } else if (typeof data === "string" && data) {
      message = data;
    }
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, opts: Omit<RequestOptions, "method" | "body" | "formData"> = {}) =>
    performRequest<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, opts: Omit<RequestOptions, "method"> = {}) =>
    performRequest<T>(path, { ...opts, method: "POST" }),
  put: <T>(path: string, opts: Omit<RequestOptions, "method"> = {}) =>
    performRequest<T>(path, { ...opts, method: "PUT" }),
  del: <T>(path: string, opts: Omit<RequestOptions, "method" | "body" | "formData"> = {}) =>
    performRequest<T>(path, { ...opts, method: "DELETE" }),
};
