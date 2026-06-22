const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const AUTH_TOKEN_STORAGE_KEY = "local-enjoy-trip-access-token";

type ApiErrorBody = {
  code?: string;
  message?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: ApiErrorBody | null;
};

export class ApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function readAccessToken() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    "error" in value
  );
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  { body, headers, ...init }: ApiRequestOptions = {},
): Promise<T> {
  const token = readAccessToken();
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: requestHeaders,
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  const envelope = isApiEnvelope<T>(payload) ? payload : null;

  if (!response.ok || (envelope && !envelope.success)) {
    const error = envelope?.error;
    throw new ApiError(
      error?.message ?? `API 요청에 실패했습니다. (${response.status})`,
      response.status,
      error?.code,
    );
  }

  return (envelope ? envelope.data : payload) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { body, method: "POST" });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { body, method: "PUT" });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}
