"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar as CalendarIcon,
  Search,
  Users,
  ArrowRight,
  Clock,
  KanbanSquare,
  ChevronDown,
} from "lucide-react";
import type { Contact, ChatLog, CalendarEvent, ContactStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const stageLabels: Record<ContactStage, string> = {
  cold: "Cold",
  "outreach-sent": "Outreach sent",
  "coffee-chat": "Coffee chat",
  warm: "Warm",
  interviewed: "Interviewed",
  offer: "Offer",
};

// Ledger tag per stage — semantic Badge variants, no decorative color.
const STAGE_BADGE: Record<
  ContactStage,
  "outline" | "secondary" | "default" | "warning" | "success" | "destructive"
> = {
  cold: "outline",
  "outreach-sent": "secondary",
  "coffee-chat": "default",
  warm: "default",
  interviewed: "warning",
  offer: "success",
};

// Pipeline column order (left → right): cold → outreach → chat → warm → interviewed → offer.
const PIPELINE_STAGES: ContactStage[] = [
  "cold",
  "outreach-sent",
  "coffee-chat",
  "warm",
  "interviewed",
  "offer",
];

export function ContactsView({
  contacts,
  chatLogs,
  events,
}: {
  contacts: Contact[];
  chatLogs: ChatLog[];
  events: CalendarEvent[];
}) {
  const [tab, setTab] = useState<"calendar" | "contacts" | "pipeline" | "search">("calendar");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | "all">("all");

  // Pipeline supports in-memory stage overrides (so the user can drag-drop / dropdown-change
  // a contact's stage and see it move immediately). TODO (needs Supabase + auth):
  // persist these changes to the contacts table.
  const [stageOverrides, setStageOverrides] = useState<Record<string, ContactStage>>({});
  const effectiveContacts = useMemo(
    () =>
      contacts.map((c) => {
        const override = stageOverrides[c.id];
        return override ? { ...c, stage: override } : c;
      }),
    [contacts, stageOverrides],
  );

  const filtered = useMemo(() => {
    let list = effectiveContacts;
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
  }, [effectiveContacts, query, stageFilter]);

  const searchResults = useMemo(() => {
    if (!query.trim() || tab !== "search") return [];
    const q = query.toLowerCase();
    return chatLogs
      .filter((log) => {
        const contact = effectiveContacts.find((c) => c.id === log.contactId);
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
        contact: effectiveContacts.find((c) => c.id === log.contactId)!,
      }));
  }, [query, tab, chatLogs, effectiveContacts]);

  const pipelineGrouped = useMemo(() => {
    const map: Record<ContactStage, Contact[]> = {
      cold: [],
      "outreach-sent": [],
      "coffee-chat": [],
      warm: [],
      interviewed: [],
      offer: [],
    };
    for (const c of effectiveContacts) {
      map[c.stage]?.push(c);
    }
    return map;
  }, [effectiveContacts]);

  const upcoming = events
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = events
    .filter((e) => e.status === "completed")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarIcon className="size-3.5" aria-hidden /> Calendar
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <Users className="size-3.5" aria-hidden /> Contacts
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <KanbanSquare className="size-3.5" aria-hidden /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5">
              <Search className="size-3.5" aria-hidden /> Search notes
            </TabsTrigger>
          </TabsList>
          <div className="relative md:w-80">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
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
            <p className="eyebrow mb-3">Upcoming</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {upcoming.map((e) => (
                <CalendarCard
                  key={e.id}
                  event={e}
                  contact={effectiveContacts.find((c) => c.id === e.contactId)}
                />
              ))}
            </div>
          </section>
          <section>
            <p className="eyebrow mb-3">Past</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {past.map((e) => (
                <CalendarCard
                  key={e.id}
                  event={e}
                  contact={effectiveContacts.find((c) => c.id === e.contactId)}
                />
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...PIPELINE_STAGES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn(
                  "rounded-sm border px-3 py-1 font-mono text-[11px] tracking-[0.08em] uppercase transition-colors duration-150",
                  stageFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-border text-muted-foreground",
                )}
              >
                {s === "all" ? "All" : stageLabels[s]}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-md border border-dashed px-6 py-12 text-center">
              <p className="eyebrow">Empty</p>
              <p className="text-muted-foreground mt-2 text-sm">
                No contacts matching those filters.
              </p>
            </div>
          ) : (
            <ul className="bg-card divide-y rounded-md border" aria-label="Your contacts">
              {filtered.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/tools/relationships/${c.id}`}
                    className="group hover:bg-accent/30 flex items-start justify-between gap-4 p-4 transition-colors duration-150"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="group-hover:text-primary font-medium transition-colors">
                          {c.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {c.title} · {c.firm}
                          {c.group ? ` · ${c.group}` : ""}
                        </span>
                        <Badge variant={STAGE_BADGE[c.stage]}>{stageLabels[c.stage]}</Badge>
                      </div>
                      {c.school && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {c.school} &apos;{c.gradYear?.toString().slice(-2)}
                        </p>
                      )}
                      {c.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <Badge key={t} variant="outline">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {c.lastInteractionAt && (
                      <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                        last {c.lastInteractionAt}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Drag-and-drop is coming. For now, click a stage label on any card to move that contact
            through the funnel.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {PIPELINE_STAGES.map((stage) => {
              const items = pipelineGrouped[stage];
              return (
                <div
                  key={stage}
                  className="bg-muted/20 flex min-h-[160px] flex-col gap-2 rounded-md border p-3"
                >
                  <div className="flex items-baseline justify-between border-b pb-2">
                    <h3 className="eyebrow">{stageLabels[stage]}</h3>
                    <span className="text-muted-foreground font-mono text-xs">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((c) => (
                      <PipelineCard
                        key={c.id}
                        contact={c}
                        onChangeStage={(next) => setStageOverrides((p) => ({ ...p, [c.id]: next }))}
                      />
                    ))}
                    {items.length === 0 && (
                      <p className="text-muted-foreground/70 px-1 py-2 font-mono text-[11px]">
                        Empty
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-3">
          {query.trim() === "" ? (
            <div className="text-muted-foreground rounded-md border border-dashed py-12 text-center text-sm">
              Type to search across every chat note, commitment, and personal detail you&apos;ve
              ever recorded.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-muted-foreground rounded-md border border-dashed py-12 text-center text-sm">
              No notes mention &quot;{query}&quot;. Try a different term.
            </div>
          ) : (
            searchResults.map(({ log, contact }) => (
              <Link
                key={log.id}
                href={`/tools/relationships/${contact.id}`}
                className="bg-card hover:border-primary/40 block rounded-md border p-4 transition-colors duration-150"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{contact.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {contact.firm} ·{" "}
                      <span className="font-mono text-[11px]">{log.happenedAt}</span>
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" aria-hidden />
                </div>
                <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
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

function CalendarCard({ event, contact }: { event: CalendarEvent; contact?: Contact }) {
  const d = new Date(event.startsAt);
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const content = (
    <div className="bg-card hover:border-primary/40 flex h-full items-start gap-3 rounded-md border p-4 transition-colors duration-150">
      <div className="bg-muted w-14 shrink-0 rounded-sm px-1 py-2 text-center font-mono">
        <p className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">{dayName}</p>
        <p className="text-base font-medium">{d.toLocaleDateString("en-US", { day: "numeric" })}</p>
        <p className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
          {d.toLocaleDateString("en-US", { month: "short" })}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium">{event.title}</p>
          <Badge variant={event.kind === "interview" ? "default" : "outline"} className="shrink-0">
            {event.kind.replace("-", " ")}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 font-mono text-[11px]">
          <Clock className="size-3" aria-hidden />
          {time} · {event.durationMinutes} min
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.notes && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">{event.notes}</p>
        )}
      </div>
    </div>
  );

  if (contact) {
    return (
      <Link href={`/tools/relationships/${contact.id}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function PipelineCard({
  contact,
  onChangeStage,
}: {
  contact: Contact;
  onChangeStage: (next: ContactStage) => void;
}) {
  const router = useRouter();

  return (
    <div className="bg-card hover:border-primary/40 rounded-md border p-2.5 transition-colors duration-150">
      <button
        type="button"
        onClick={() => router.push(`/relationships/${contact.id}`)}
        className="block w-full text-left"
      >
        <p className="truncate text-sm leading-tight font-medium">{contact.name}</p>
        <p className="text-muted-foreground truncate text-[11px]">
          {contact.firm}
          {contact.group ? ` · ${contact.group}` : ""}
        </p>
      </button>
      <div className="mt-2 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/70 inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors duration-150"
            >
              {stageLabels[contact.stage]}
              <ChevronDown className="size-2.5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuLabel className="text-muted-foreground text-[10px] tracking-wide uppercase">
              Move to stage
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PIPELINE_STAGES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onChangeStage(s)}
                className={cn("text-xs", s === contact.stage && "text-primary font-semibold")}
              >
                {stageLabels[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {contact.lastContactAt && (
          <span className="text-muted-foreground/80 font-mono text-[10px]">
            {contact.lastContactAt.slice(5)}
          </span>
        )}
      </div>
    </div>
  );
}
