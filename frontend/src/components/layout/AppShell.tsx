import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/" className="app-brand">
          AI Orchestration Platform
        </Link>
        <Nav />
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
