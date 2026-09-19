import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Orchestration Platform",
  description: "Workflow and execution orchestration dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
