"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProfileMenu } from "@/components/auth/sidebar-profile-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpenText,
  Menu,
  Mic,
  NotebookPen,
  BarChart3,
  FileText,
  HeartHandshake,
  Building2,
  MessageSquare,
  Layers,
  Briefcase,
  ListChecks,
  User,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  soon?: boolean;
};
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
      { href: "/tools/mock-interview", label: "Mock Interview", icon: Mic },
      { href: "/tools/resume-coach", label: "Resume Coach", icon: FileText },
      { href: "/tools/relationships", label: "Relationships", icon: HeartHandshake },
      { href: "/tools/applications", label: "Applications", icon: Briefcase },
      { href: "/tools/chatbot", label: "Chatbot", icon: MessageSquare },
      { href: "/tools/story-framer", label: "Story Framer", icon: NotebookPen, soon: true },
      { href: "/tools/question-bank", label: "Question Bank", icon: ListChecks, soon: true },
    ],
  },
  {
    kind: "group",
    label: "Reference",
    items: [
      { href: "/firms", label: "Firms", icon: Building2 },
      { href: "/sectors", label: "Sectors", icon: Layers, soon: true },
    ],
  },
  {
    kind: "group",
    label: "You",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/progress", label: "Progress", icon: BarChart3 },
    ],
  },
];

function NavLink({
  item,
  pathname,
  withTourTarget,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  withTourTarget: boolean;
  onNavigate?: () => void;
}) {
  const active =
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        // data-tour targets must be unique in the DOM — only the desktop
        // sidebar instance carries them (the tour skips them when hidden).
        data-tour={withTourTarget ? item.href : undefined}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2.5 border-l-2 py-1.5 pr-2 pl-4 text-sm transition-colors duration-150",
          active
            ? "border-primary text-primary font-medium"
            : "text-muted-foreground hover:border-border hover:text-foreground border-transparent",
        )}
      >
        <Icon aria-hidden className="size-4" strokeWidth={1.75} />
        <span>{item.label}</span>
        {item.soon && (
          <span className="text-muted-foreground/70 ml-auto font-mono text-[10px] tracking-[0.14em]">
            SOON
          </span>
        )}
      </Link>
    </li>
  );
}

function NavList({
  pathname,
  withTourTargets,
  onNavigate,
}: {
  pathname: string;
  withTourTargets: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {sections.map((section, i) => {
        if (section.kind === "item") {
          return (
            <NavLink
              key={section.item.href}
              item={section.item}
              pathname={pathname}
              withTourTarget={withTourTargets}
              {...(onNavigate ? { onNavigate } : {})}
            />
          );
        }
        return (
          <li key={`group-${i}`} className="pt-5">
            <p className="eyebrow mb-1.5 pl-4">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  withTourTarget={withTourTargets}
                  {...(onNavigate ? { onNavigate } : {})}
                />
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-baseline gap-1.5">
      <span className="font-display text-[17px] leading-none">Street Prep</span>
      <span className="text-primary font-mono text-[11px] font-medium tracking-[0.14em]">AI</span>
    </Link>
  );
}

export function AppNav({ email, fullName }: { email: string; fullName?: string | undefined }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile: top bar with a drawer — below lg the sidebar is hidden and
          this is the only navigation. */}
      <header className="bg-background sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 lg:hidden">
        <Brand />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-14 items-center border-b px-5">
              <Brand />
            </div>
            <nav className="flex-1 overflow-y-auto py-5">
              <NavList
                pathname={pathname}
                withTourTargets={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
            <div className="border-t p-3">
              <SidebarProfileMenu email={email} fullName={fullName} />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop: persistent sidebar. */}
      <aside className="bg-background hidden flex-col border-r lg:flex lg:w-60 lg:shrink-0">
        <div className="flex h-14 items-center border-b px-5">
          <Brand />
        </div>
        <nav className="flex-1 overflow-y-auto py-5">
          <NavList pathname={pathname} withTourTargets />
        </nav>
        <div className="border-t p-3">
          <SidebarProfileMenu email={email} fullName={fullName} />
        </div>
      </aside>
    </>
  );
}
