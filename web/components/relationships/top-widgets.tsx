"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/types";
import type { Followup } from "@/lib/data/followups";
import { OutreachDrawer } from "@/components/relationships/outreach-drawer";

const SIX_WEEKS_MS = 1000 * 60 * 60 * 24 * 7 * 6;

function weeksAgo(iso: string, now: number): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 0;
  return Math.floor((now - then) / (1000 * 60 * 60 * 24 * 7));
}

function relativeDue(iso: string, now: number): { label: string; overdue: boolean } {
  const due = Date.parse(iso);
  if (Number.isNaN(due)) return { label: iso, overdue: false };
  const diffMs = due - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < -1) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  if (diffDays === -1) return { label: "yesterday (overdue)", overdue: true };
  if (diffDays === 0) return { label: "today", overdue: false };
  if (diffDays === 1) return { label: "tomorrow", overdue: false };
  if (diffDays < 7) return { label: `in ${diffDays}d`, overdue: false };
  return { label: `in ${Math.round(diffDays / 7)}w`, overdue: false };
}

export function RelationshipsTopWidgets({
  contacts,
  followups,
}: {
  contacts: Contact[];
  followups: Followup[];
}) {
  const [outreachContact, setOutreachContact] = useState<Contact | null>(null);

  // Capture "now" once per mount to keep the render pure (lint rule react-hooks/purity).
  // The lazy initializer runs on the client when the component mounts.
  // Acceptable for a relative-time widget — no real-time updates needed.
  const [now] = useState<number>(() => Date.now());

  // Stale = no contact in >6 weeks. Take the 3 stalest.
  const staleContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        if (!c.lastContactAt) return false;
        const t = Date.parse(c.lastContactAt);
        if (Number.isNaN(t)) return false;
        return now - t > SIX_WEEKS_MS;
      })
      .sort((a, b) => (a.lastContactAt ?? "").localeCompare(b.lastContactAt ?? ""))
      .slice(0, 3);
  }, [contacts, now]);

  const sortedFollowups = useMemo(
    () => [...followups].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [followups],
  );

  if (staleContacts.length === 0 && sortedFollowups.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 pt-8 md:px-8">
      {staleContacts.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Gentle nudges</p>
          <div className="bg-card divide-y rounded-md border">
            {staleContacts.map((c) => {
              const w = weeksAgo(c.lastContactAt!, now);
              return (
                <div
                  key={c.id}
                  className="hover:bg-accent/30 flex items-start justify-between gap-4 p-4 transition-colors duration-150"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/tools/relationships/${c.id}`}
                        className="hover:text-primary text-sm font-medium transition-colors"
                      >
                        {c.name}
                      </Link>
                      <Badge variant="warning" className="shrink-0">
                        {w}w cold
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {c.firm}
                      {c.group ? ` · ${c.group}` : ""}
                    </p>
                    <p className="text-muted-foreground mt-1 font-mono text-[11px]">
                      Last spoke {w} {w === 1 ? "week" : "weeks"} ago
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => setOutreachContact(c)}
                    >
                      <Mail className="size-3" aria-hidden />
                      Draft check-in
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                      <Link href={`/tools/relationships/${c.id}`}>
                        Open
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {sortedFollowups.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Upcoming follow-ups</p>
          <div className="bg-card divide-y rounded-md border">
            {sortedFollowups.map((f) => {
              const contact = contacts.find((c) => c.id === f.contactId);
              if (!contact) return null;
              const due = relativeDue(f.dueAt, now);
              return (
                <Link
                  key={f.id}
                  href={`/tools/relationships/${contact.id}`}
                  className="hover:bg-accent/30 flex items-center gap-3 px-4 py-3 transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                >
                  <div
                    className={cn(
                      "w-20 shrink-0 font-mono text-[11px]",
                      due.overdue ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {due.label}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {contact.name}
                      <span className="text-muted-foreground font-normal">
                        {" · "}
                        {contact.firm}
                      </span>
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{f.note}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {f.kind === "post-chat" ? "post-chat" : "outreach"}
                  </Badge>
                  <ArrowRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {outreachContact && (
        <OutreachDrawer
          contact={outreachContact}
          open={!!outreachContact}
          onOpenChange={(o) => {
            if (!o) setOutreachContact(null);
          }}
        />
      )}
    </div>
  );
}
