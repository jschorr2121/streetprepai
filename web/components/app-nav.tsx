"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProfileMenu } from "@/components/auth/sidebar-profile-menu";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpenText,
  Mic,
  NotebookPen,
  BarChart3,
  FileText,
  HeartHandshake,
  Building2,
  Sparkles,
  MessageSquare,
  Layers,
  Briefcase,
  ListChecks,
  User,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavSection =
  | { kind: "item"; item: NavItem }
  | { kind: "group"; label: string; items: NavItem[] };

const sections: NavSection[] = [
  { kind: "item", item: { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard } },
  { kind: "item", item: { href: "/learn", label: "Learn", icon: BookOpenText } },
  {
    kind: "group",
    label: "Tools",
    items: [
      { href: "/tools/chatbot", label: "Chatbot", icon: MessageSquare },
      { href: "/tools/story-framer", label: "Story Framer", icon: NotebookPen },
      { href: "/tools/resume-coach", label: "Resume Coach", icon: FileText },
      { href: "/tools/mock-interview", label: "Mock Interview", icon: Mic },
      { href: "/tools/question-bank", label: "Question Bank", icon: ListChecks },
      { href: "/tools/relationships", label: "Relationships", icon: HeartHandshake },
      { href: "/tools/applications", label: "Applications", icon: Briefcase },
    ],
  },
  { kind: "item", item: { href: "/firms", label: "Firms", icon: Building2 } },
  { kind: "item", item: { href: "/sectors", label: "Sectors", icon: Layers } },
  { kind: "item", item: { href: "/profile", label: "Profile", icon: User } },
  { kind: "item", item: { href: "/progress", label: "Progress", icon: BarChart3 } },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active =
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;
  return (
    <li>
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
}

export function AppNav({ email, fullName }: { email: string; fullName?: string | undefined }) {
  const pathname = usePathname();
  return (
    <aside className="bg-background/40 hidden flex-col border-r backdrop-blur lg:flex lg:w-60 lg:shrink-0">
      <div className="flex h-14 items-center border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md">
            <Sparkles className="size-4" />
          </div>
          <div className="leading-tight">
            <span className="text-sm">Street Prep</span>
            <span className="text-primary ml-1 text-xs font-semibold">AI</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {sections.map((section, i) => {
            if (section.kind === "item") {
              return <NavLink key={section.item.href} item={section.item} pathname={pathname} />;
            }
            return (
              <li key={`group-${i}`} className="pt-3">
                <p className="text-muted-foreground/70 mb-1 px-3 text-[10px] font-semibold tracking-wider uppercase">
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t p-3">
        <SidebarProfileMenu email={email} fullName={fullName} />
      </div>
    </aside>
  );
}
