import { describe, expect, it, beforeEach, vi } from "vitest";
import { fakeContact, fakeChatLog } from "@/tests/fixtures/contact";
import { fakeProfile } from "@/tests/fixtures/profile";

const profileMock = vi.fn();
const contactsMock = vi.fn();
const contactByIdMock = vi.fn();
const chatLogsMock = vi.fn();
const chatLogsForContactMock = vi.fn();
const calendarMock = vi.fn();
const getApplicationsMock = vi.fn();
const findSimilarChatsMock = vi.fn();

vi.mock("@/lib/data/profile", () => ({
  getProfile: (...args: unknown[]) => profileMock(...args),
}));
vi.mock("@/lib/data/contacts", () => ({
  getContacts: (...args: unknown[]) => contactsMock(...args),
  getContactById: (...args: unknown[]) => contactByIdMock(...args),
  getChatLogs: (...args: unknown[]) => chatLogsMock(...args),
  getChatLogsForContact: (...args: unknown[]) => chatLogsForContactMock(...args),
}));
vi.mock("@/lib/data/calendar", () => ({
  getCalendarEvents: (...args: unknown[]) => calendarMock(...args),
}));
vi.mock("@/lib/data/semantic-recall", () => ({
  findSimilarChats: (...args: unknown[]) => findSimilarChatsMock(...args),
}));
vi.mock("@/lib/db/queries/applications", () => ({
  getApplications: (...args: unknown[]) => getApplicationsMock(...args),
}));
// withUser just calls fn(tx) in tests — tx is not used by the mock above.
vi.mock("@/lib/db/client", () => ({
  withUser: vi.fn(async (_token: unknown, fn: (tx: unknown) => Promise<unknown>) => fn(null)),
  db: {},
}));

beforeEach(() => {
  profileMock.mockReset();
  contactsMock.mockReset();
  contactByIdMock.mockReset();
  chatLogsMock.mockReset();
  chatLogsForContactMock.mockReset();
  calendarMock.mockReset();
  getApplicationsMock.mockReset();
  findSimilarChatsMock.mockReset();
  findSimilarChatsMock.mockResolvedValue([]);
});

// AI SDK ToolCallOptions — executors don't read these, but the signature wants them.
const OPTS = { toolCallId: "call_1", messages: [] };

async function tools(userId = "u-1") {
  const { buildAssistantTools } = await import("@/lib/ai/assistant-tools");
  return buildAssistantTools(userId);
}

describe("buildAssistantTools registry", () => {
  it("declares the expected tool set (web_search arrives in issue 03)", async () => {
    expect(Object.keys(await tools()).sort()).toEqual([
      "get_applied_jobs",
      "get_contact",
      "get_resume",
      "get_upcoming_events",
      "list_contacts",
      "search_chat_logs",
    ]);
  });

  it("every tool has a Zod inputSchema and an execute", async () => {
    for (const [name, t] of Object.entries(await tools())) {
      expect(t.inputSchema, name).toBeTruthy();
      expect(typeof t.execute, name).toBe("function");
    }
  });
});

describe("tool executors (userId via closure)", () => {
  it("get_resume → calls getProfile with the closure userId", async () => {
    profileMock.mockResolvedValue(fakeProfile());
    const t = await tools("u-42");
    const out = (await t.get_resume.execute!({}, OPTS)) as {
      fullName: string;
      resumeText: string | null;
      experiences: unknown[];
    };
    expect(profileMock).toHaveBeenCalledWith("u-42");
    expect(out.fullName).toBe("Jane Test");
    expect(out.resumeText).toContain("Wharton");
    expect(Array.isArray(out.experiences)).toBe(true);
  });

  it("list_contacts → filtered by stage and firm", async () => {
    contactsMock.mockResolvedValue([
      fakeContact({ id: "c1", firm: "Goldman Sachs", stage: "warm" }),
      fakeContact({ id: "c2", firm: "Evercore", stage: "warm" }),
      fakeContact({ id: "c3", firm: "Goldman Sachs", stage: "cold" }),
    ]);
    const t = await tools();
    const out = (await t.list_contacts.execute!(
      { stage: "warm", firm: "goldman" },
      OPTS,
    )) as Array<{
      id: string;
    }>;
    expect(out.length).toBe(1);
    expect(out[0]!.id).toBe("c1");
  });

  it("get_contact → returns {contact, chats}; {error} when missing", async () => {
    contactByIdMock.mockResolvedValue(fakeContact());
    chatLogsForContactMock.mockResolvedValue([fakeChatLog()]);
    const t = await tools();
    const out = (await t.get_contact.execute!({ contactId: "c_001" }, OPTS)) as {
      contact: unknown;
      chats: unknown[];
    };
    expect(contactByIdMock).toHaveBeenCalledWith("c_001", "u-1");
    expect(out.contact).toBeTruthy();
    expect(out.chats.length).toBe(1);

    contactByIdMock.mockResolvedValue(null);
    chatLogsForContactMock.mockResolvedValue([]);
    const missing = (await t.get_contact.execute!({ contactId: "nope" }, OPTS)) as {
      error?: string;
    };
    expect(missing.error).toBeTruthy();
  });

  it("get_upcoming_events → filters by status and time window", async () => {
    const now = Date.now();
    calendarMock.mockResolvedValue([
      { id: "e1", status: "upcoming", startsAt: new Date(now + 1000 * 60 * 60).toISOString() },
      {
        id: "e2",
        status: "upcoming",
        startsAt: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
      { id: "e3", status: "past", startsAt: new Date(now - 1000 * 60 * 60).toISOString() },
    ]);
    const t = await tools();
    const out = (await t.get_upcoming_events.execute!({ daysAhead: 7 }, OPTS)) as Array<{
      id: string;
    }>;
    expect(out.length).toBe(1);
    expect(out[0]!.id).toBe("e1");
  });

  it("returns a generic {error} when an underlying data call throws", async () => {
    profileMock.mockRejectedValue(new Error("db down"));
    const t = await tools();
    const out = (await t.get_resume.execute!({}, OPTS)) as { error?: string };
    // Raw error internals must not flow back through the model to the user.
    expect(out.error).toBe("Tool get_resume failed");
    expect(out.error).not.toContain("db down");
  });
});

describe("search_chat_logs (hybrid semantic + keyword)", () => {
  const keywordChat = fakeChatLog({
    id: "chat_kw",
    contactId: "c_001",
    rawNotes: "We talked about a SaaS LBO they were modeling at the desk.",
    structured: {
      topics: ["lbo"],
      adviceGiven: [],
      commitments: [],
      personalDetails: [],
      followUps: [],
    },
  });

  it("returns keyword hits with snippets when semantic recall is empty", async () => {
    chatLogsMock.mockResolvedValue([keywordChat]);
    contactsMock.mockResolvedValue([fakeContact({ id: "c_001" })]);
    const t = await tools();
    const out = (await t.search_chat_logs.execute!({ query: "saas lbo" }, OPTS)) as {
      count: number;
      hits: Array<{ chatId: string; snippet: string; match: string }>;
    };
    expect(out.count).toBe(1);
    expect(out.hits[0]!.chatId).toBe("chat_kw");
    expect(out.hits[0]!.match).toBe("keyword");
    expect(out.hits[0]!.snippet.toLowerCase()).toContain("saas lbo");
  });

  it("puts semantic hits first and dedupes overlapping chatIds", async () => {
    findSimilarChatsMock.mockResolvedValue([
      { chatId: "chat_sem", contactId: "c_001", similarity: 0.9, summaryText: "Apollo culture" },
      { chatId: "chat_kw", contactId: "c_001", similarity: 0.8, summaryText: "SaaS LBO chat" },
    ]);
    chatLogsMock.mockResolvedValue([keywordChat]);
    contactsMock.mockResolvedValue([fakeContact({ id: "c_001", name: "Jordan Vega" })]);
    const t = await tools();
    const out = (await t.search_chat_logs.execute!({ query: "saas lbo" }, OPTS)) as {
      count: number;
      hits: Array<{ chatId: string; match: string; contactName: string }>;
    };
    // chat_kw matches BOTH ways but appears once (semantic wins).
    expect(out.count).toBe(2);
    expect(out.hits.map((h) => h.chatId)).toEqual(["chat_sem", "chat_kw"]);
    expect(out.hits.every((h) => h.match === "semantic")).toBe(true);
    expect(out.hits[0]!.contactName).toBe("Jordan Vega");
    expect(findSimilarChatsMock).toHaveBeenCalledWith({
      userId: "u-1",
      queryText: "saas lbo",
      k: 5,
    });
  });
});

describe("get_applied_jobs", () => {
  it("groups by stage and passes the stage filter through", async () => {
    getApplicationsMock.mockResolvedValue([
      { id: "a1", firm: "Goldman Sachs", role: "Summer Analyst", stage: "applied" },
      { id: "a2", firm: "Evercore", role: "Summer Analyst", stage: "applied" },
      { id: "a3", firm: "Lazard", role: "Summer Analyst", stage: "superday" },
    ]);
    const t = await tools();
    const out = (await t.get_applied_jobs.execute!({}, OPTS)) as {
      count: number;
      byStage: Record<string, unknown[]>;
    };
    expect(out.count).toBe(3);
    expect(out.byStage["applied"]).toHaveLength(2);
    expect(out.byStage["superday"]).toHaveLength(1);

    getApplicationsMock.mockResolvedValue([]);
    const filtered = (await t.get_applied_jobs.execute!({ stage: "superday" }, OPTS)) as {
      count: number;
    };
    expect(getApplicationsMock).toHaveBeenLastCalledWith(null, "u-1", { stage: "superday" });
    expect(filtered.count).toBe(0);
  });
});
