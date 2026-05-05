import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const contactRow = {
  id: "c_001",
  name: "Alex Chen",
  firm: "Goldman Sachs",
  group_name: "TMT",
  title: "VP",
  school: "Wharton",
  grad_year: 2018,
  how_met: "intro",
  stage: "warm",
  tags: ["target"],
  linkedin_bio: "VP at GS TMT",
  last_interaction_at: "2026-04-15T18:00:00.000Z",
  last_contact_at: "2026-04-15T18:00:00.000Z",
};

const chatRow = {
  id: "chat_001",
  contact_id: "c_001",
  happened_at: "2026-04-15T18:00:00.000Z",
  raw_notes: "Talked about deal flow.",
  structured: { topics: ["deal flow"] },
  follow_up_draft: null,
};

describe("getContacts", () => {
  it("returns mapped contacts and filters by user_id", async () => {
    sb.setRows([contactRow]);
    const { getContacts } = await import("@/lib/data/contacts");
    const result = await getContacts("user-getContacts-1");
    expect(sb.from).toHaveBeenCalledWith("contacts");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-getContacts-1");
    expect(sb.order).toHaveBeenCalledWith("name");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "c_001",
      name: "Alex Chen",
      firm: "Goldman Sachs",
      group: "TMT",
      stage: "warm",
      tags: ["target"],
    });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getContacts } = await import("@/lib/data/contacts");
    const result = await getContacts("user-getContacts-2");
    expect(result).toEqual([]);
  });

  it("throws when supabase returns an error", async () => {
    sb.setRows([], { message: "boom" });
    const { getContacts } = await import("@/lib/data/contacts");
    await expect(getContacts("user-getContacts-3")).rejects.toMatchObject({
      message: "boom",
    });
  });

  it("normalizes nullable columns to undefined or sane defaults", async () => {
    sb.setRows([
      {
        ...contactRow,
        group_name: null,
        title: null,
        school: null,
        grad_year: null,
        how_met: null,
        tags: null,
        linkedin_bio: null,
        last_interaction_at: null,
        last_contact_at: null,
      },
    ]);
    const { getContacts } = await import("@/lib/data/contacts");
    const [c] = await getContacts("user-getContacts-4");
    expect(c.group).toBeUndefined();
    expect(c.title).toBe("");
    expect(c.tags).toEqual([]);
    expect(c.lastContactAt).toBeUndefined();
  });
});

describe("getContactById", () => {
  it("returns mapped contact via maybeSingle", async () => {
    sb.setRows([contactRow]);
    const { getContactById } = await import("@/lib/data/contacts");
    const result = await getContactById("c_001", "user-byId-1");
    expect(sb.from).toHaveBeenCalledWith("contacts");
    expect(sb.eq).toHaveBeenCalledWith("id", "c_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-byId-1");
    expect(sb.maybeSingle).toHaveBeenCalled();
    expect(result?.id).toBe("c_001");
  });

  it("returns null when no row", async () => {
    sb.setRows([]);
    const { getContactById } = await import("@/lib/data/contacts");
    const result = await getContactById("c_missing", "user-byId-2");
    expect(result).toBeNull();
  });

  it("throws when error", async () => {
    sb.setRows([], { message: "rls denied" });
    const { getContactById } = await import("@/lib/data/contacts");
    await expect(getContactById("c_x", "user-byId-3")).rejects.toMatchObject({
      message: "rls denied",
    });
  });
});

describe("getChatLogs", () => {
  it("returns mapped chat logs sorted by happened_at desc", async () => {
    sb.setRows([chatRow]);
    const { getChatLogs } = await import("@/lib/data/contacts");
    const result = await getChatLogs("user-chats-1");
    expect(sb.from).toHaveBeenCalledWith("chats");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-chats-1");
    expect(sb.order).toHaveBeenCalledWith("happened_at", { ascending: false });
    expect(result[0]).toMatchObject({ id: "chat_001", contactId: "c_001" });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getChatLogs } = await import("@/lib/data/contacts");
    const r = await getChatLogs("user-chats-2");
    expect(r).toEqual([]);
  });

  it("normalizes null raw_notes to empty string", async () => {
    sb.setRows([{ ...chatRow, raw_notes: null, structured: null }]);
    const { getChatLogs } = await import("@/lib/data/contacts");
    const [c] = await getChatLogs("user-chats-3");
    expect(c.rawNotes).toBe("");
    expect(c.structured).toBeUndefined();
  });
});

describe("getChatLogsForContact", () => {
  it("filters by contact_id and user_id", async () => {
    sb.setRows([chatRow]);
    const { getChatLogsForContact } = await import("@/lib/data/contacts");
    const result = await getChatLogsForContact("c_001", "user-cfc-1");
    expect(sb.eq).toHaveBeenCalledWith("contact_id", "c_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-cfc-1");
    expect(result).toHaveLength(1);
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getChatLogsForContact } = await import("@/lib/data/contacts");
    const r = await getChatLogsForContact("c_missing", "user-cfc-2");
    expect(r).toEqual([]);
  });
});
