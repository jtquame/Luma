"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Newspaper,
  BookOpen,
  Video,
  UsersRound,
  Settings,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/prompts", label: "Check-ins & prompts", icon: ClipboardList },
  { href: "/dashboard/blog", label: "Blog", icon: Newspaper },
  { href: "/dashboard/books", label: "Book library", icon: BookOpen },
  { href: "/dashboard/webinars", label: "Webinars", icon: Video },
  { href: "/dashboard/support-groups", label: "Support groups", icon: UsersRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function TherapistSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6">
        <p className="font-display text-lg text-ink">Luma</p>
        <p className="eyebrow mt-0.5">Therapist</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-ink-muted hover:bg-bg hover:text-ink"
              )}
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-bg hover:text-ink transition-colors"
          >
            <LogOut size={17} strokeWidth={1.75} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
