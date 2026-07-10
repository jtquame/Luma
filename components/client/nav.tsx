"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

// Order per Samara's request: skill building, check-ins, webinars, support
// groups, then books. Home stays first (it's the landing page), and Blog /
// Announcements are placed alongside their closest relatives.
const NAV = [
  { href: "/home", label: "Home" },
  { href: "/skill-building", label: "Skill building" },
  { href: "/check-in", label: "Check-in" },
  { href: "/webinars", label: "Webinars" },
  { href: "/support-groups", label: "Support groups" },
  { href: "/announcements", label: "Announcements" },
  { href: "/books", label: "Books" },
  { href: "/blog", label: "Blog" },
];

export function ClientNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/home" className="font-display text-lg text-ink">
          Tribe Works
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm transition-colors whitespace-nowrap",
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="lg:hidden text-ink-muted hover:text-ink p-1"
        >
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-72 max-w-[80vw] bg-surface flex flex-col h-full ml-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="font-display text-lg text-ink">Tribe Works</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-ink-muted hover:text-ink p-1"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1">
              {NAV.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-ink-muted hover:bg-bg hover:text-ink"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-border">
              <form action={logout}>
                <button
                  type="submit"
                  className="block w-full text-left rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:bg-bg hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <button
            aria-label="Close menu overlay"
            className="flex-1 bg-black/30"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
