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
});

describe("ASSISTANT_TOOLS schema", () => {
  it("declares the expected tool set including get_applied_jobs", async () => {
    const { ASSISTANT_TOOLS } = await import("@/lib/ai/assistant-tools");
    const names = ASSISTANT_TOOLS.map((t) => (t as { name?: string }).name ?? "").filter(Boolean);
    expect(names).toEqual(
      expect.arrayContaining([
        "get_resume",
        "get_applied_jobs",
        "list_contacts",
        "get_contact",
        "get_upcoming_events",
        "search_chat_logs",
        "web_search",
      ]),
    );
  });
});

describe("executeTool dispatch", () => {
  it("get_resume → calls getProfile and returns resume-shaped payload", async () => {
    profileMock.mockResolvedValue(fakeProfile());
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_resume", {})) as {
      fullName: string;
      resumeText: string | null;
      experiences: unknown[];
    };
    expect(profileMock).toHaveBeenCalledWith("u-1");
    expect(out.fullName).toBe("Jane Test");
    expect(out.resumeText).toContain("Wharton");
    expect(Array.isArray(out.experiences)).toBe(true);
  });

  it("list_contacts → returns summary rows, filtered by stage and firm", async () => {
    contactsMock.mockResolvedValue([
      fakeContact({ id: "c1", firm: "Goldman Sachs", stage: "warm" }),
      fakeContact({ id: "c2", firm: "Evercore", stage: "warm" }),
      fakeContact({ id: "c3", firm: "Goldman Sachs", stage: "cold" }),
    ]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "list_contacts", {
      stage: "warm",
      firm: "goldman",
    })) as Array<{ id: string }>;
    expect(out.length).toBe(1);
    expect(out[0]!.id).toBe("c1");
  });

  it("list_contacts → with no filters returns all summary rows", async () => {
    contactsMock.mockResolvedValue([fakeContact({ id: "c1" }), fakeContact({ id: "c2" })]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "list_contacts", {})) as Array<{
      id: string;
    }>;
    expect(out.length).toBe(2);
  });

  it("get_contact → returns {contact, chats}", async () => {
    contactByIdMock.mockResolvedValue(fakeContact());
    chatLogsForContactMock.mockResolvedValue([fakeChatLog()]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_contact", {
      contactId: "c_001",
    })) as { contact: unknown; chats: unknown[] };
    expect(contactByIdMock).toHaveBeenCalledWith("c_001", "u-1");
    expect(chatLogsForContactMock).toHaveBeenCalledWith("c_001", "u-1");
    expect(out.contact).toBeTruthy();
    expect(out.chats.length).toBe(1);
  });

  it("get_contact → returns {error} when contact not found", async () => {
    contactByIdMock.mockResolvedValue(null);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_contact", {
      contactId: "missing",
    })) as { error?: string };
    expect(out.error).toBeTruthy();
  });

  it("get_upcoming_events → filters by status and time window", async () => {
    const now = Date.now();
    calendarMock.mockResolvedValue([
      {
        id: "e1",
        status: "upcoming",
        startsAt: new Date(now + 1000 * 60 * 60).toISOString(),
      },
      {
        id: "e2",
        status: "upcoming",
        startsAt: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days out
      },
      {
        id: "e3",
        status: "past",
        startsAt: new Date(now - 1000 * 60 * 60).toISOString(),
      },
    ]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_upcoming_events", {
      daysAhead: 7,
    })) as Array<{ id: string }>;
    expect(out.length).toBe(1);
    expect(out[0]!.id).toBe("e1");
  });

  it("search_chat_logs → returns hits with snippet", async () => {
    chatLogsMock.mockResolvedValue([
      fakeChatLog({
        id: "chat_a",
        contactId: "c_001",
        rawNotes: "We talked about a SaaS LBO they were modeling at the desk.",
        structured: {
          topics: ["lbo"],
          adviceGiven: [],
          commitments: [],
          personalDetails: [],
          followUps: [],
        },
      }),
      fakeChatLog({
        id: "chat_b",
        contactId: "c_001",
        rawNotes: "Discussed campus recruiting only",
        structured: {
          topics: [],
          adviceGiven: [],
          commitments: [],
          personalDetails: [],
          followUps: [],
        },
      }),
    ]);
    contactsMock.mockResolvedValue([fakeContact()]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "search_chat_logs", {
      query: "saas lbo",
    })) as { count: number; hits: Array<{ chatId: string; snippet: string }> };
    expect(out.count).toBe(1);
    expect(out.hits[0]!.chatId).toBe("chat_a");
    expect(out.hits[0]!.snippet.toLowerCase()).toContain("saas lbo");
  });

  it("returns {error} for an unknown tool name (does not throw)", async () => {
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "nope", {})) as { error?: string };
    expect(out.error).toMatch(/Unknown tool/);
  });

  it("returns {error} when an underlying data call throws", async () => {
    profileMock.mockRejectedValue(new Error("db down"));
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_resume", {})) as { error?: string };
    expect(out.error).toBe("db down");
  });

  // ─── get_applied_jobs ───────────────────────────────────────────────────────

  it("get_applied_jobs → groups by stage correctly", async () => {
    getApplicationsMock.mockResolvedValue([
      {
        id: "a1",
        firm: "Goldman Sachs",
        role: "Summer Analyst",
        stage: "applied",
        deadline: undefined,
        notes: undefined,
      },
      {
        id: "a2",
        firm: "Evercore",
        role: "Summer Analyst",
        stage: "applied",
        deadline: undefined,
        notes: undefined,
      },
      {
        id: "a3",
        firm: "JPMorgan",
        role: "Summer Analyst",
        stage: "interview",
        deadline: "2026-09-01",
        notes: "Good progress",
      },
    ]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_applied_jobs", {})) as {
      count: number;
      byStage: Record<string, Array<{ id: string; firm: string }>>;
    };
    expect(out.count).toBe(3);
    expect(out.byStage["applied"]).toHaveLength(2);
    expect(out.byStage["interview"]).toHaveLength(1);
    expect(out.byStage["interview"]![0]!.firm).toBe("JPMorgan");
  });

  it("get_applied_jobs → filters by stage when provided", async () => {
    getApplicationsMock.mockResolvedValue([
      {
        id: "a1",
        firm: "GS",
        role: "Analyst",
        stage: "offer",
        deadline: undefined,
        notes: undefined,
      },
    ]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_applied_jobs", { stage: "offer" })) as {
      count: number;
      byStage: Record<string, unknown[]>;
    };
    expect(out.count).toBe(1);
    expect(out.byStage["offer"]).toHaveLength(1);
    // Confirm getApplications was called with the stage option.
    expect(getApplicationsMock).toHaveBeenCalledWith(null, "u-1", { stage: "offer" });
  });

  it("get_applied_jobs → returns { count: 0, byStage: {} } when user has zero applications", async () => {
    getApplicationsMock.mockResolvedValue([]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_applied_jobs", {})) as {
      count: number;
      byStage: Record<string, unknown[]>;
    };
    expect(out.count).toBe(0);
    expect(out.byStage).toEqual({});
  });

  it("get_applied_jobs → ignores an invalid stage value and returns all", async () => {
    getApplicationsMock.mockResolvedValue([
      {
        id: "a1",
        firm: "GS",
        role: "Analyst",
        stage: "applied",
        deadline: undefined,
        notes: undefined,
      },
    ]);
    const { executeTool } = await import("@/lib/ai/assistant-tools");
    const out = (await executeTool("u-1", "get_applied_jobs", { stage: "bookmarked" })) as {
      count: number;
    };
    // "bookmarked" is not in APPLIED_JOB_STAGES — treated as no filter.
    expect(out.count).toBe(1);
    expect(getApplicationsMock).toHaveBeenCalledWith(null, "u-1", {});
  });
});
