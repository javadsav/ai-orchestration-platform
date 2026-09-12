import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-8 border-b border-border bg-surface px-6 py-3.5">
        <Link
          href="/"
          className="whitespace-nowrap text-base font-bold text-ink no-underline hover:text-accent hover:no-underline"
        >
          AI Orchestration Platform
        </Link>
        <Nav />
      </header>
      <main className="mx-auto w-full max-w-300 flex-1 p-6">{children}</main>
    </div>
  );
}
