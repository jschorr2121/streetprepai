import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const eventRow = {
  id: "ev_001",
  contact_id: "c_001",
  chat_log_id: "chat_001",
  title: "Coffee chat: Alex",
  kind: "coffee_chat",
  starts_at: "2026-04-15T18:00:00.000Z",
  duration_minutes: 30,
  location: "Zoom",
  status: "scheduled",
  notes: "intro",
};

describe("getCalendarEvents", () => {
  it("returns mapped events filtered by user_id and ordered by starts_at", async () => {
    sb.setRows([eventRow]);
    const { getCalendarEvents } = await import("@/lib/data/calendar");
    const events = await getCalendarEvents("user-cal-1");
    expect(sb.from).toHaveBeenCalledWith("calendar_events");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-cal-1");
    expect(sb.order).toHaveBeenCalledWith("starts_at");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "ev_001",
      contactId: "c_001",
      chatLogId: "chat_001",
      title: "Coffee chat: Alex",
      kind: "coffee_chat",
      startsAt: "2026-04-15T18:00:00.000Z",
      durationMinutes: 30,
      location: "Zoom",
      status: "scheduled",
      notes: "intro",
    });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getCalendarEvents } = await import("@/lib/data/calendar");
    const events = await getCalendarEvents("user-cal-2");
    expect(events).toEqual([]);
  });

  it("normalizes nullable columns", async () => {
    sb.setRows([
      {
        ...eventRow,
        contact_id: null,
        chat_log_id: null,
        duration_minutes: null,
        location: null,
        notes: null,
      },
    ]);
    const { getCalendarEvents } = await import("@/lib/data/calendar");
    const [e] = await getCalendarEvents("user-cal-3");
    expect(e.contactId).toBeUndefined();
    expect(e.chatLogId).toBeUndefined();
    expect(e.durationMinutes).toBe(0);
    expect(e.location).toBeUndefined();
    expect(e.notes).toBeUndefined();
  });

  it("throws when supabase returns an error", async () => {
    sb.setRows([], { message: "boom" });
    const { getCalendarEvents } = await import("@/lib/data/calendar");
    await expect(getCalendarEvents("user-cal-4")).rejects.toMatchObject({
      message: "boom",
    });
  });
});
