# Frontend auth integration

The backend now has a working auth system (`backend/app/api/routers/auth.py`).
Nothing on the frontend uses it yet — this doc is the checklist for wiring it up.

## What the backend gives you

- `POST /auth/register` — `{ email, password }` → `201` + user, or `409` if the email is taken.
- `POST /auth/login` — `{ email, password }` → `200` + user, sets cookies. `401` on bad
  credentials, `429` if rate-limited (5 attempts/minute per email+IP).
- `POST /auth/refresh` — reads the refresh cookie, rotates it, sets fresh cookies. `401` if
  the refresh cookie is missing/expired/already used.
- `POST /auth/logout` — revokes the refresh token server-side, clears both cookies. `204`.
- `GET /auth/me` — `200` + user if authenticated, `401` otherwise.

The session lives entirely in two `httpOnly` cookies the backend sets on `login`/`refresh` —
frontend JS can never read their values, by design:

| Cookie          | Path      | Lifetime   | Purpose                                   |
|-----------------|-----------|------------|--------------------------------------------|
| `access_token`  | `/`       | 15 min     | Sent on every request; what the API checks |
| `refresh_token` | `/auth`   | 30 days    | Only reaches `/auth/refresh` and `/auth/logout` |

CORS already has `allow_credentials=True` for `CORS_ORIGINS` (default
`http://localhost:3000`) — that's necessary but not sufficient; every fetch call
still has to opt in to sending/receiving cookies (see below).

## Required changes

### 1. Make `apiFetch` cookie-aware

`frontend/src/lib/api/client.ts` never sets `credentials`, and today that's invisible because
nothing needs auth yet. Two different fixes are needed depending on where the call runs:

- **Client-side** (`"use client"` components, calling the browser's `fetch`): add
  `credentials: "include"`. Without it, the browser won't attach cookies to a cross-origin
  request (`localhost:3000` → `localhost:8000`), even though `SameSite=Lax` would otherwise
  allow it.
- **Server-side** (Server Components, calling `fetch` from the Next.js server process): there
  is no browser cookie jar — the visiting user's cookies never travel here automatically. Any
  server-side call that needs to be authenticated (e.g. a Server Component checking who's
  logged in) must explicitly read the incoming request's cookies via `cookies()` from
  `next/headers` and forward them as a `Cookie` header on the outgoing request.

Suggested shape: extend `apiFetch`/`RequestOptions` to branch on `typeof window === "undefined"`
the same way `apiBaseUrl()` in `frontend/src/lib/config.ts` already does, and forward cookies
only on the server branch.

### 2. Add `frontend/src/lib/api/auth.ts`

Same pattern as `frontend/src/lib/api/workflows.ts` — thin wrappers over `apiFetch`:

```ts
export function login(email: string, password: string) {
  return apiFetch<User>("/auth/login", { method: "POST", body: { email, password } });
}
export function logout() {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
export function register(email: string, password: string) {
  return apiFetch<User>("/auth/register", { method: "POST", body: { email, password } });
}
export async function getMe(): Promise<User | null> {
  try {
    return await apiFetch<User>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}
```

### 3. Build out the login page

`frontend/src/app/login/page.tsx` already exists as a stub, and `AppShell.tsx` already
special-cases `pathname === "/login"` to hide the header/nav chrome there — keep that. Needs:

- A client-side form (email + password) calling `login()`, then `router.push("/")` on success.
- Error handling mirroring `TriggerExecutionButton.tsx`'s existing pattern: surface
  `ApiError.status === 401` as "invalid email or password", `429` as "too many attempts, try
  again in a minute".

### 4. Route protection

Add `frontend/middleware.ts`: check `request.cookies.get("access_token")` and redirect to
`/login` if it's missing, for every route except `/login` and static assets. This is a
**presence check only** — middleware can't verify the JWT's signature without duplicating the
backend's secret, so treat it purely as a UX redirect. The backend remains the real
authority; every actual request still needs a cookie that passes `get_current_user`.

### 5. Handle access-token expiry (15 min)

Recommended: reactive refresh. On any `ApiError` with `status === 401`, call
`POST /auth/refresh` once and retry the original request; if the refresh also fails, redirect
to `/login`. A proactive timer-based refresh isn't necessary given the 30-day refresh cookie.

### 6. WebSocket auth (`frontend/src/lib/ws/useExecutionSocket.ts`)

No code change needed for local dev — `useExecutionSocket` opens a raw `WebSocket` to
`NEXT_PUBLIC_WS_URL`, and browsers attach matching cookies to a WS handshake automatically.
`SameSite=Lax` still permits this because `localhost:3000` and `localhost:8000` are the same
*site* (same registrable domain, different port only).

**Watch out in production**: if the frontend and backend ever end up on genuinely different
domains, `SameSite=Lax` cookies are *not* sent on a cross-site WebSocket handshake initiated
from JS — this would connect but fail auth silently. At that point, either put both behind the
same origin (reverse proxy) or add a short-lived WS ticket endpoint (e.g. `GET
/auth/ws-ticket` returning a one-time token passed as a query param) as a fallback.

### 7. Logout control

Call `logout()` then redirect to `/login`, wired into whatever the nav/header ends up using
for account controls (nothing exists there yet).

## Not done yet — don't flip these on blind

- **The existing REST routes and the WebSocket are still open.** `/workflows`, `/executions`,
  `/queue`, and `/ws/executions/{id}` do not require `Depends(get_current_user)` yet. Gating
  them is a small backend change, but do it *after* the frontend can actually authenticate —
  otherwise the app locks itself out.
- No password-reset or email-verification flow.
- No CSRF token. Protection currently relies on `SameSite=Lax` restricting cross-site cookie
  use. That's fine for this app's current threat model (single first-party frontend), but
  revisit if this API ever needs to be called cross-site or embedded.
