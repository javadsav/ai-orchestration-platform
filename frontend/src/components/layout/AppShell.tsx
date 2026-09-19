"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/layout/Nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login";

  if (isAuthRoute) {
    return <div className="h-screen">{children}</div>;
  }

  return (
    <div className="flex h-screen flex-col ">
      <header className="flex items-center gap-8 border-b border-border bg-surface px-6 py-3.5">
        <Link
          href="/"
          className="whitespace-nowrap text-base font-bold text-ink no-underline  hover:text-accent hover:no-underline"
        >
          AI Orchestration Platform
        </Link>
        <Nav />
      </header>

      <main className="mx-auto h-full w-full max-w-300 p-6">{children}</main>
    </div>
  );
}
