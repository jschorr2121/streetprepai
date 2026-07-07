"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { signOutAction } from "@/lib/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Avatar + profile menu pinned at the bottom of the sidebar (ui-context.md
// layout pattern). Holds Profile and Logout.
export function SidebarProfileMenu({
  email,
  fullName,
}: {
  email: string;
  fullName?: string | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const display = fullName?.trim() || email;
  const initials = initialsFrom(display);

  function onSignOut() {
    startTransition(() => {
      void signOutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent/50 focus-visible:ring-ring/50 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors outline-none focus-visible:ring-[3px]">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate text-sm font-medium">{display}</span>
          {fullName ? (
            <span className="text-muted-foreground block truncate text-xs">{email}</span>
          ) : null}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="truncate font-normal">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="size-4" aria-hidden />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} disabled={isPending}>
          <LogOut className="size-4" aria-hidden />
          {isPending ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initialsFrom(value: string): string {
  const parts = value.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}
