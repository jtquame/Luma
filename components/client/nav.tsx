"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "Home" },
  { href: "/check-in", label: "Check-in" },
  { href: "/blog", label: "Blog" },
  { href: "/books", label: "Books" },
  { href: "/webinars", label: "Webinars" },
  { href: "/support-groups", label: "Support groups" },
];

export function ClientNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/home" className="font-display text-lg text-ink">
          Luma
        </Link>
        <nav className="flex items-center gap-5">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm transition-colors",
                  active ? "text-primary font-medium" : "text-ink-muted hover:text-ink"
                )}
              >
                {label}
              </Link>
            );
          })}
          <form action={logout}>
            <button type="submit" className="text-sm text-ink-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
