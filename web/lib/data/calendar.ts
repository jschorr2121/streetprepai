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


