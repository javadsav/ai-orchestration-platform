"use client";

import { useState, type FormEvent } from "react";

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const passwordOk = password.length > 0;

    setErrors({
      email: emailOk ? undefined : "Enter a valid email address.",
      password: passwordOk ? undefined : "Password is required.",
    });
    if (!emailOk || !passwordOk) return;

    // TODO: replace with apiFetch("/api/auth/login", { method: "POST", body: { email, password, remember } })
    // once the backend exposes an auth endpoint.
    console.log("login submit", { email, remember });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-accent text-[15px] font-extrabold text-bg">
            AI
          </div>
          <div className="text-[16.5px] font-bold text-ink">AI Orchestration Platform</div>
        </div>

        <div className="rounded-xl border border-border bg-surface px-[30px] pb-[26px] pt-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
          <h1 className="mb-1.5 text-center text-[19px] font-bold text-ink">Sign in</h1>
          <p className="mb-[26px] text-center text-[13px] text-muted">
            Access your workflows, executions and queue.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-medium text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border bg-surface-alt px-3 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-muted focus:border-accent focus:ring-[3px] focus:ring-accent/15 ${
                  errors.email ? "border-danger" : "border-border"
                }`}
              />
              {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="mb-1.5 flex items-center justify-between text-[12.5px] font-medium text-muted">
                Password
                <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-accent hover:underline">
                  Forgot password?
                </a>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-lg border bg-surface-alt px-3 py-2.5 pr-[38px] text-[13.5px] text-ink outline-none placeholder:text-muted focus:border-accent focus:ring-[3px] focus:ring-accent/15 ${
                    errors.password ? "border-danger" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[13px] text-muted hover:text-ink"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-danger">{errors.password}</p>}
            </div>

            <div className="mt-1 mb-5 flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12.5px] text-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 accent-accent"
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg border border-accent bg-accent py-[11px] text-sm font-bold text-bg hover:brightness-[1.06] active:brightness-[0.96]"
            >
              Sign in
            </button>
          </form>

          <div className="my-[22px] flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            or continue with
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            className="mb-2.5 flex w-full items-center justify-center gap-[9px] rounded-lg border border-border bg-surface-alt py-2.5 text-[13.5px] font-semibold text-ink hover:border-muted hover:bg-surface"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-[9px] rounded-lg border border-border bg-surface-alt py-2.5 text-[13.5px] font-semibold text-ink hover:border-muted hover:bg-surface"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path fill="#4285F4" d="M15.68 8.18c0-.58-.05-1.13-.15-1.66H8v3.14h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.51-1.39 2.4-3.44 2.4-5.9z" />
              <path fill="#34A853" d="M8 16c2.16 0 3.97-.72 5.29-1.92l-2.58-2c-.72.48-1.63.77-2.71.77-2.08 0-3.85-1.41-4.48-3.3H.86v2.07A8 8 0 0 0 8 16z" />
              <path fill="#FBBC05" d="M3.52 9.55A4.8 4.8 0 0 1 3.27 8c0-.54.09-1.06.25-1.55V4.38H.86A8 8 0 0 0 0 8c0 1.29.31 2.51.86 3.62l2.66-2.07z" />
              <path fill="#EA4335" d="M8 3.18c1.17 0 2.23.4 3.06 1.19l2.29-2.29C11.96.86 10.15 0 8 0A8 8 0 0 0 .86 4.38l2.66 2.07C4.15 4.59 5.92 3.18 8 3.18z" />
            </svg>
            Sign in with Google
          </button>

          <p className="mt-6 text-center text-[13px] text-muted">
            Don&apos;t have an account?{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-accent hover:underline">
              Request access
            </a>
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(47,191,113,0.15)]" />
          All systems operational
        </div>
      </div>
    </div>
  );
}
