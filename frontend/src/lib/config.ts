/**
 * Central place for environment-driven configuration.
 *
 * - API_BASE_URL: used by server components/route handlers running inside the
 *   Next.js server process (same Docker network as the backend in dev).
 * - NEXT_PUBLIC_API_URL: used by client-side ("use client") code running in the
 *   browser, must be reachable from the host machine.
 * - NEXT_PUBLIC_WS_URL: used by the client WebSocket hook.
 */

export const serverApiBaseUrl: string =
  process.env.API_BASE_URL ?? "http://localhost:8000";

export const clientApiBaseUrl: string =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const clientWsBaseUrl: string =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

/** Returns the correct base URL depending on whether we're on the server or the browser. */
export function apiBaseUrl(): string {
  return typeof window === "undefined" ? serverApiBaseUrl : clientApiBaseUrl;
}
