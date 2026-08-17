import { apiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Next.js fetch cache option; defaults to "no-store" since this is a live dashboard. */
  cache?: RequestCache;
  revalidate?: number | false;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = apiBaseUrl().replace(/\/$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, cache = "no-store", revalidate } = options;

  const url = buildUrl(path, query);

  const init: RequestInit & { next?: { revalidate?: number | false } } = {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  if (revalidate !== undefined) {
    init.next = { revalidate };
  } else {
    init.cache = cache;
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new ApiError(
      `Network error calling ${url}: ${err instanceof Error ? err.message : String(err)}`,
      0,
      null,
    );
  }

  if (!response.ok) {
    let parsedBody: unknown = null;
    try {
      parsedBody = await response.json();
    } catch {
      // response had no JSON body
    }
    const detail =
      parsedBody && typeof parsedBody === "object" && "detail" in parsedBody
        ? String((parsedBody as { detail: unknown }).detail)
        : response.statusText;
    throw new ApiError(`Request to ${path} failed (${response.status}): ${detail}`, response.status, parsedBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
