import type { Locale } from "@/types";

/**
 * Base URL of the Django API.
 *
 * Server-side (React Server Components, route handlers) prefers `API_URL`,
 * which points at the internal Render hostname where CORS does not apply and
 * no extra hop is made. The browser always uses `NEXT_PUBLIC_API_URL`.
 */
function resolveBaseUrl(): string {
  if (typeof window === "undefined") {
    return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(
      /\/$/,
      "",
    );
  }
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
}

export const API_BASE = `${resolveBaseUrl()}/api/v1`;

/**
 * Normalises a Django media URL onto a same-origin `/media/...` path.
 *
 * `next.config.ts` rewrites `/media/*` to the API host, so images stay
 * same-origin for the browser and `next/image` never needs to reach Django
 * directly. Absolute external URLs are left untouched.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url.startsWith("/") ? url : `/${url}`;
  }
  try {
    const parsed = new URL(url);
    const mediaIndex = parsed.pathname.indexOf("/media/");
    if (mediaIndex === -1) return url;
    return parsed.pathname.slice(mediaIndex);
  } catch {
    return url;
  }
}

/** Builds an absolute URL for a path, used by sitemap/robots/metadata. */
export function absoluteUrl(path: string): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${site}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ========================================================================== */
/* Errors                                                                     */
/* ========================================================================== */

export type ErrorField = string | string[];

export interface NormalizedError {
  /** Always a string, safe to show directly in the UI. */
  message: string;
  status: number;
  code: string;
  /** Per-field messages, e.g. `{ email: ["This field is required."] }`. */
  fields: Record<string, string[]>;
  /** True when the request never reached the API. */
  isNetwork: boolean;
}

/** Error thrown by every `apiFetch` call that does not return 2xx. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string[]>;
  readonly isNetwork: boolean;

  constructor(payload: NormalizedError) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.fields = payload.fields;
    this.isNetwork = payload.isNetwork;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }
}

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(toStringArray);
  if (value && typeof value === "object") return Object.values(value).flatMap(toStringArray);
  return [];
}

function normalizeErrorBody(status: number, body: unknown): NormalizedError {
  const fallback = "Something went wrong. Please try again.";

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const rawFields = record.errors;

    if (rawFields && typeof rawFields === "object" && !Array.isArray(rawFields)) {
      const fields: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(rawFields as Record<string, unknown>)) {
        const messages = toStringArray(value);
        if (messages.length) fields[key] = messages;
      }
      if (Object.keys(fields).length) {
        return {
          message: typeof record.detail === "string" ? record.detail : fields[Object.keys(fields)[0]][0],
          status,
          code: typeof record.code === "string" ? record.code : "validation-error",
          fields,
          isNetwork: false,
        };
      }
    }

    if (typeof record.detail === "string" && record.detail) {
      return {
        message: record.detail,
        status,
        code: typeof record.code === "string" ? record.code : "error",
        fields: {},
        isNetwork: false,
      };
    }
  }

  return { message: fallback, status, code: "error", fields: {}, isNetwork: false };
}

/* ========================================================================== */
/* Refresh-on-401                                                             */
/* ========================================================================== */

let refreshPromise: Promise<boolean> | null = null;

/**
 * Rotates the JWT cookies.
 *
 * The refresh token lives in an httpOnly cookie, so this is a cookie-only
 * `POST /auth/refresh/` with no body. Concurrent 401s share a single
 * in-flight request via `refreshPromise`.
 */
async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh/`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        // Allow a later request to retry the refresh after this one settles.
        queueMicrotask(() => {
          refreshPromise = null;
        });
      }
    })();
  }
  return refreshPromise;
}

/* ========================================================================== */
/* Core request                                                               */
/* ========================================================================== */

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON body. `FormData` bodies pass through untouched. */
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Sent as `?lang=` so the API returns catalog labels in this language. */
  locale?: Locale;
  /** Internal: prevents infinite refresh recursion. */
  _retried?: boolean;
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
  locale?: Locale,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  if (locale) {
    // Overrides any locale already in `query`.
    url.searchParams.set("lang", locale);
  }

  return url.toString();
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Performs an API request and returns the parsed body.
 *
 * Behaviour:
 *  - always sends cookies (`credentials: "include"`) because auth is cookie
 *    based, there is no bearer token on the client;
 *  - attaches `?lang=<locale>` so catalog labels come back localized;
 *  - on a 401 it calls `/auth/refresh/` once and replays the request;
 *  - throws a typed `ApiError` for every failure.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, locale, _retried, ...rest } = options;
  const url = buildUrl(path, query, locale);
  const headers = buildHeaders(options);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      credentials: "include",
      body:
        body === undefined
          ? undefined
          : typeof FormData !== "undefined" && body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiError({
      message: "Can't reach FintFood right now. Check your connection.",
      status: 0,
      code: "network-error",
      fields: {},
      isNetwork: true,
    });
  }

  if (response.status === 401 && !_retried && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(normalizeErrorBody(response.status, payload));
  }

  return payload as T;
}

/** Convenience wrappers. */
export const api = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options: RequestOptions = {}) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
