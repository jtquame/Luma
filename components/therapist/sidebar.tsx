"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ClipboardList,
  Newspaper,
  BookOpen,
  Video,
  UsersRound,
  Megaphone,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/skill-building", label: "Skill building & reflections", icon: Sparkles },
  { href: "/dashboard/prompts", label: "Check-ins & prompts", icon: ClipboardList },
  { href: "/dashboard/blog", label: "Blog", icon: Newspaper },
  { href: "/dashboard/books", label: "Book library", icon: BookOpen },
  { href: "/dashboard/webinars", label: "Webinars", icon: Video },
  { href: "/dashboard/support-groups", label: "Support groups", icon: UsersRound },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/terms", label: "Terms & conditions", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="px-6 py-6">
        <p className="font-display text-lg text-ink">Tribe Works</p>
        <p className="eyebrow mt-0.5">Therapist</p>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
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
    </>
  );
}

export function TherapistSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 h-14">
        <p className="font-display text-lg text-ink">Tribe Works</p>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="text-ink-muted hover:text-ink p-1"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-72 max-w-[80vw] bg-surface flex flex-col h-full">
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-ink-muted hover:text-ink p-1"
              >
                <X size={22} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
          <button
            aria-label="Close menu overlay"
            className="flex-1 bg-black/30"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-surface flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
