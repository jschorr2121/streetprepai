import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatSummaryOutput } from "@/lib/validation/schemas/relationships";

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

  it("throws when supabase returns an error", async () => {
    sb.setRows([], { message: "boom" });
    const { getChatLogs } = await import("@/lib/data/contacts");
    await expect(getChatLogs("user-chats-4")).rejects.toMatchObject({ message: "boom" });
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

  it("throws when supabase returns an error", async () => {
    sb.setRows([], { message: "boom" });
    const { getChatLogsForContact } = await import("@/lib/data/contacts");
    await expect(getChatLogsForContact("c_001", "user-cfc-3")).rejects.toMatchObject({
      message: "boom",
    });
  });
});

describe("createContact", () => {
  it("inserts with the given user_id and defaults optional fields to null/[]", async () => {
    sb.setRows([contactRow]);
    const { createContact } = await import("@/lib/data/contacts");
    const result = await createContact("user-create-1", {
      name: "Alex Chen",
      firm: "Goldman Sachs",
      stage: "warm",
    });
    expect(sb.from).toHaveBeenCalledWith("contacts");
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-create-1",
        name: "Alex Chen",
        firm: "Goldman Sachs",
        stage: "warm",
        title: null,
        group_name: null,
        school: null,
        grad_year: null,
        how_met: null,
        linkedin_bio: null,
        tags: [],
      }),
    );
    expect(sb.single).toHaveBeenCalled();
    expect(result.id).toBe("c_001");
  });

  it("passes through optional fields when provided", async () => {
    sb.setRows([contactRow]);
    const { createContact } = await import("@/lib/data/contacts");
    await createContact("user-create-2", {
      name: "Jamie Lee",
      firm: "Morgan Stanley",
      stage: "cold",
      title: "Analyst",
      group: "TMT",
      school: "NYU",
      gradYear: 2025,
      howMet: "coffee chat",
      linkedinBio: "bio text",
    });
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Analyst",
        group_name: "TMT",
        school: "NYU",
        grad_year: 2025,
        how_met: "coffee chat",
        linkedin_bio: "bio text",
      }),
    );
  });

  it("throws when supabase returns an error", async () => {
    sb.setRows([], { message: "insert failed" });
    const { createContact } = await import("@/lib/data/contacts");
    await expect(
      createContact("user-create-3", { name: "X", firm: "Y", stage: "cold" }),
    ).rejects.toMatchObject({ message: "insert failed" });
  });
});

describe("upsertChatLog", () => {
  it("updates raw_notes and scopes by id, user_id, and contact_id when id is given", async () => {
    sb.setRows([chatRow]);
    const { upsertChatLog } = await import("@/lib/data/contacts");
    const result = await upsertChatLog("user-upsert-1", {
      id: "chat_001",
      contactId: "c_001",
      rawNotes: "Updated notes.",
    });
    expect(sb.update).toHaveBeenCalledWith({ raw_notes: "Updated notes." });
    expect(sb.eq).toHaveBeenCalledWith("id", "chat_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-upsert-1");
    expect(sb.eq).toHaveBeenCalledWith("contact_id", "c_001");
    expect(sb.maybeSingle).toHaveBeenCalled();
    expect(result?.id).toBe("chat_001");
  });

  it("returns null on update when the row doesn't belong to the caller", async () => {
    sb.setRows([]);
    const { upsertChatLog } = await import("@/lib/data/contacts");
    const result = await upsertChatLog("user-upsert-2", {
      id: "chat_other",
      contactId: "c_001",
      rawNotes: "notes",
    });
    expect(result).toBeNull();
  });

  it("inserts a new row and scopes by user_id when no id is given", async () => {
    sb.setRows([chatRow]);
    const { upsertChatLog } = await import("@/lib/data/contacts");
    const result = await upsertChatLog("user-upsert-3", {
      contactId: "c_001",
      rawNotes: "Fresh notes.",
    });
    expect(sb.insert).toHaveBeenCalledWith({
      user_id: "user-upsert-3",
      contact_id: "c_001",
      raw_notes: "Fresh notes.",
    });
    expect(sb.single).toHaveBeenCalled();
    expect(result?.id).toBe("chat_001");
  });

  it("throws on update error", async () => {
    sb.setRows([], { message: "update boom" });
    const { upsertChatLog } = await import("@/lib/data/contacts");
    await expect(
      upsertChatLog("user-upsert-4", { id: "chat_001", contactId: "c_001", rawNotes: "x" }),
    ).rejects.toMatchObject({ message: "update boom" });
  });

  it("throws on insert error", async () => {
    sb.setRows([], { message: "insert boom" });
    const { upsertChatLog } = await import("@/lib/data/contacts");
    await expect(
      upsertChatLog("user-upsert-5", { contactId: "c_001", rawNotes: "x" }),
    ).rejects.toMatchObject({ message: "insert boom" });
  });
});

const chatSummary: ChatSummaryOutput = {
  topics: ["new topic"],
  adviceGiven: [],
  commitments: [],
  personalDetails: [],
  followUps: [],
};

describe("saveChatStructured", () => {
  it("updates the structured field scoped by id and user_id", async () => {
    sb.setRows([{ ...chatRow, structured: chatSummary }]);
    const { saveChatStructured } = await import("@/lib/data/contacts");
    const result = await saveChatStructured("user-struct-1", "chat_001", chatSummary);
    expect(sb.update).toHaveBeenCalledWith({ structured: chatSummary });
    expect(sb.eq).toHaveBeenCalledWith("id", "chat_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-struct-1");
    expect(result?.structured).toEqual(chatSummary);
  });

  it("returns null when the chat isn't the caller's", async () => {
    sb.setRows([]);
    const { saveChatStructured } = await import("@/lib/data/contacts");
    const result = await saveChatStructured("user-struct-2", "chat_other", chatSummary);
    expect(result).toBeNull();
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { saveChatStructured } = await import("@/lib/data/contacts");
    await expect(
      saveChatStructured("user-struct-3", "chat_001", chatSummary),
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("saveChatFollowUpDraft", () => {
  it("updates the follow_up_draft field scoped by id and user_id", async () => {
    const draft = { subject: "Following up", body: "Great chatting." };
    sb.setRows([{ ...chatRow, follow_up_draft: draft }]);
    const { saveChatFollowUpDraft } = await import("@/lib/data/contacts");
    const result = await saveChatFollowUpDraft("user-draft-1", "chat_001", draft);
    expect(sb.update).toHaveBeenCalledWith({ follow_up_draft: draft });
    expect(sb.eq).toHaveBeenCalledWith("id", "chat_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-draft-1");
    expect(result?.followUpDraft).toEqual(draft);
  });

  it("returns null when the chat isn't the caller's", async () => {
    sb.setRows([]);
    const { saveChatFollowUpDraft } = await import("@/lib/data/contacts");
    const result = await saveChatFollowUpDraft("user-draft-2", "chat_other", {
      subject: "s",
      body: "b",
    });
    expect(result).toBeNull();
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { saveChatFollowUpDraft } = await import("@/lib/data/contacts");
    await expect(
      saveChatFollowUpDraft("user-draft-3", "chat_001", { subject: "s", body: "b" }),
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("touchContactLastContact", () => {
  it("stamps today's date on both last_interaction_at and last_contact_at, scoped by id and user_id", async () => {
    sb.setRows([contactRow]);
    const { touchContactLastContact } = await import("@/lib/data/contacts");
    await touchContactLastContact("user-touch-1", "c_001");

    const today = new Date().toISOString().slice(0, 10);
    expect(sb.update).toHaveBeenCalledWith({
      last_interaction_at: today,
      last_contact_at: today,
    });
    expect(sb.eq).toHaveBeenCalledWith("id", "c_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-touch-1");
  });

  it("throws when supabase returns an error", async () => {
    sb.setRows([], { message: "boom" });
    const { touchContactLastContact } = await import("@/lib/data/contacts");
    await expect(touchContactLastContact("user-touch-2", "c_001")).rejects.toMatchObject({
      message: "boom",
    });
  });
});

describe("updateContactStage", () => {
  it("updates the stage scoped by id and user_id", async () => {
    sb.setRows([{ ...contactRow, stage: "offer" }]);
    const { updateContactStage } = await import("@/lib/data/contacts");
    const result = await updateContactStage("user-stage-1", "c_001", "offer");
    expect(sb.update).toHaveBeenCalledWith({ stage: "offer" });
    expect(sb.eq).toHaveBeenCalledWith("id", "c_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-stage-1");
    expect(result?.stage).toBe("offer");
  });

  it("returns null when the contact doesn't exist or belongs to someone else", async () => {
    sb.setRows([]);
    const { updateContactStage } = await import("@/lib/data/contacts");
    const result = await updateContactStage("user-stage-2", "c_not_mine", "warm");
    expect(result).toBeNull();
  });

  it("throws when supabase returns an error", async () => {
    sb.setRows([], { message: "boom" });
    const { updateContactStage } = await import("@/lib/data/contacts");
    await expect(updateContactStage("user-stage-3", "c_001", "warm")).rejects.toMatchObject({
      message: "boom",
    });
  });
});
