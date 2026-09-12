"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/summary", label: "Summary" },
  { href: "/workflows", label: "Workflows" },
  { href: "/executions", label: "Executions" },
  { href: "/queue", label: "Queue" },
  { href: "/system", label: "System" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-5">
      {LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 pb-1 text-sm no-underline hover:text-ink hover:no-underline ${
              isActive ? "border-accent text-ink" : "border-transparent text-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
