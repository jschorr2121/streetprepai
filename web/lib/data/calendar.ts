import type { CalendarEvent } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  id: string;
  contact_id: string | null;
  chat_log_id: string | null;
  title: string;
  kind: string;
  starts_at: string;
  duration_minutes: number | null;
  location: string | null;
  status: string;
  notes: string | null;
};

function mapRow(r: DbRow): CalendarEvent {
  return {
    id: r.id,
    contactId: r.contact_id ?? undefined,
    chatLogId: r.chat_log_id ?? undefined,
    title: r.title,
    kind: r.kind as CalendarEvent["kind"],
    startsAt: r.starts_at,
    durationMinutes: r.duration_minutes ?? 0,
    location: r.location ?? undefined,
    status: r.status as CalendarEvent["status"],
    notes: r.notes ?? undefined,
  };
}

export async function getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("starts_at");
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}


export const seedCalendarEvents: CalendarEvent[] = [
  {
    id: "e1",
    contactId: "c1",
    kind: "coffee-chat",
    title: "Coffee chat · Alex Chen (GS TMT)",
    startsAt: "2025-10-18T14:00:00",
    durationMinutes: 30,
    location: "Zoom",
    status: "completed",
    chatLogId: "ch1",
    notes: "30-min intro call. He offered to intro me to Priya.",
  },
  {
    id: "e2",
    contactId: "c2",
    kind: "coffee-chat",
    title: "Coffee chat · Priya Mehta (Evercore M&A)",
    startsAt: "2026-04-21T15:30:00",
    durationMinutes: 30,
    location: "In person · Evercore NYC lobby cafe",
    status: "upcoming",
  },
  {
    id: "e3",
    contactId: "c5",
    kind: "coffee-chat",
    title: "Coffee chat · Samir Patel (MS Energy)",
    startsAt: "2026-04-24T11:00:00",
    durationMinutes: 30,
    location: "Zoom",
    status: "upcoming",
  },
  {
    id: "e4",
    kind: "interview",
    title: "First round · Morgan Stanley",
    startsAt: "2026-04-23T10:00:00",
    durationMinutes: 45,
    location: "Phone",
    status: "upcoming",
  },
  {
    id: "e5",
    kind: "interview",
    title: "Superday · Goldman Sachs TMT",
    startsAt: "2026-05-02T09:00:00",
    durationMinutes: 240,
    location: "GS 200 West St",
    status: "upcoming",
  },
  {
    id: "e6",
    contactId: "c3",
    kind: "coffee-chat",
    title: "Follow-up · Marcus Thompson (JPM HC)",
    startsAt: "2026-02-04T16:00:00",
    durationMinutes: 20,
    location: "Phone",
    status: "completed",
    notes: "Prepped for JPM interview. Discussed Vertex/Alpine deal.",
  },
  {
    id: "e7",
    contactId: "c3",
    kind: "interview",
    title: "JPMorgan Healthcare final round",
    startsAt: "2026-02-14T13:00:00",
    durationMinutes: 60,
    location: "JPM 277 Park",
    status: "completed",
    notes: "Went well. Marcus's Vertex reference landed.",
  },
];
