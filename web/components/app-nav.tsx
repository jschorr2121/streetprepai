"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpenText,
  Mic,
  NotebookPen,
  BarChart3,
  Briefcase,
  FileText,
  Users,
  HeartHandshake,
  MessageSquare,
  Building2,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: BookOpenText },
  { href: "/interview", label: "Mock Interview", icon: Mic },
  { href: "/story-framer", label: "Story Framer", icon: NotebookPen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/resume", label: "Resume Coach", icon: FileText },
  { href: "/relationships", label: "Relationships", icon: HeartHandshake },
  { href: "/firms", label: "Firms", icon: Building2 },
  { href: "/network", label: "Mentors", icon: Users },
  { href: "/community", label: "Community", icon: MessageSquare },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex lg:w-60 lg:shrink-0 flex-col border-r bg-background/40 backdrop-blur">
      <div className="h-14 flex items-center px-5 border-b">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <div className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="size-4" />
          </div>
          <div className="leading-tight">
            <span className="text-sm">Street Prep</span>
            <span className="text-xs text-primary ml-1 font-semibold">AI</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <div className="rounded-lg bg-accent/60 p-3 text-xs">
          <p className="font-medium text-accent-foreground mb-1">
            Prototype demo
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Data is seeded. Lens, Chat, and Prep Sheets call Claude live.
          </p>
        </div>
      </div>
    </aside>
  );
}
