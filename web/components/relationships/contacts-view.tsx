"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  Search,
  Users,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import type { Contact, ChatLog, CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const stageLabels: Record<string, string> = {
  cold: "Cold",
  "outreach-sent": "Outreach sent",
  "coffee-chat": "Coffee chat",
  warm: "Warm",
  interviewed: "Interviewed",
  offer: "Offer",
};

export function ContactsView({
  contacts,
  chatLogs,
  events,
}: {
  contacts: Contact[];
  chatLogs: ChatLog[];
  events: CalendarEvent[];
}) {
  const [tab, setTab] = useState<"calendar" | "contacts" | "search">(
    "calendar",
  );
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    let list = contacts;
    if (stageFilter !== "all") {
      list = list.filter((c) => c.stage === stageFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) =>
        [c.name, c.firm, c.group, c.title, c.school, ...c.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [contacts, query, stageFilter]);

  const searchResults = useMemo(() => {
    if (!query.trim() || tab !== "search") return [];
    const q = query.toLowerCase();
    return chatLogs
      .filter((log) => {
        const contact = contacts.find((c) => c.id === log.contactId);
        const haystack = [
          contact?.name,
          contact?.firm,
          log.rawNotes,
          ...(log.structured?.topics ?? []),
          ...(log.structured?.adviceGiven ?? []),
          ...(log.structured?.commitments ?? []),
          ...(log.structured?.personalDetails ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .map((log) => ({
        log,
        contact: contacts.find((c) => c.id === log.contactId)!,
      }));
  }, [query, tab, chatLogs, contacts]);

  const upcoming = events
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = events
    .filter((e) => e.status === "completed")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
            <Users className="size-4" /> Relationship Memory
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Your recruiting funnel, remembered
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Every coffee chat and interview on a calendar. Per-person notes,
            follow-up drafts, and search across everything you've ever
            discussed.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/relationships/new">
            <Plus className="size-3.5 mr-1.5" /> Add contact
          </Link>
        </Button>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarIcon className="size-3.5" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <Users className="size-3.5" /> Contacts
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5">
              <Search className="size-3.5" /> Search notes
            </TabsTrigger>
          </TabsList>
          <div className="relative md:w-80">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => tab === "calendar" && setTab("search")}
              placeholder="Search everyone and every note…"
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="calendar" className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Upcoming
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcoming.map((e) => (
                <CalendarCard
                  key={e.id}
                  event={e}
                  contact={contacts.find((c) => c.id === e.contactId)}
                />
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Past
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {past.map((e) => (
                <CalendarCard
                  key={e.id}
                  event={e}
                  contact={contacts.find((c) => c.id === e.contactId)}
                />
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...Object.keys(stageLabels)] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  stageFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-border text-muted-foreground",
                )}
              >
                {s === "all" ? "All" : stageLabels[s]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/relationships/${c.id}`}
                className="group rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.title} · {c.firm}
                      {c.group ? ` · ${c.group}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stageLabels[c.stage]}
                  </Badge>
                </div>
                {c.school && (
                  <p className="text-xs text-muted-foreground">
                    {c.school} '{c.gradYear?.toString().slice(-2)}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-[10px] rounded-full"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
                {c.lastInteractionAt && (
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Last touched: {c.lastInteractionAt}
                  </p>
                )}
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground text-center py-12 border-dashed border rounded-lg">
                No contacts matching those filters.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-3">
          {query.trim() === "" ? (
            <div className="text-sm text-muted-foreground py-12 text-center border-dashed border rounded-lg">
              Type to search across every chat note, commitment, and personal
              detail you've ever recorded.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center border-dashed border rounded-lg">
              No notes mention "{query}". Try a different term.
            </div>
          ) : (
            searchResults.map(({ log, contact }) => (
              <Link
                key={log.id}
                href={`/relationships/${contact.id}`}
                className="block rounded-xl border bg-card p-4 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.firm} · {log.happenedAt}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {log.rawNotes}
                </p>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CalendarCard({
  event,
  contact,
}: {
  event: CalendarEvent;
  contact?: Contact;
}) {
  const d = new Date(event.startsAt);
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const content = (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all h-full">
      <div className="shrink-0 w-14 text-center rounded-lg bg-accent/60 py-2 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {dayName}
        </p>
        <p className="text-base font-semibold">
          {d.toLocaleDateString("en-US", { day: "numeric" })}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {d.toLocaleDateString("en-US", { month: "short" })}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm truncate">{event.title}</p>
          <Badge
            variant={event.kind === "interview" ? "default" : "outline"}
            className="text-[10px] capitalize shrink-0"
          >
            {event.kind.replace("-", " ")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="size-3" />
          {time} · {event.durationMinutes} min
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {event.notes}
          </p>
        )}
      </div>
    </div>
  );

  if (contact) {
    return (
      <Link href={`/relationships/${contact.id}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
