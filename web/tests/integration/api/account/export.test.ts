/**
 * Integration tests for GET /api/account/export — self-serve data export.
 *
 * Covers:
 *  - 401 unauthenticated
 *  - 200 with grouped-by-table payload + Content-Disposition attachment header
 *  - Embedding vectors excluded from `chats` / `chatEmbeddings` in the export
 *  - 500 surfaces a client-safe message when the export query throws
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => getUserMock(),
  getUserOrNull: () => getUserMock().catch(() => null),
}));

const withUserMock = vi.fn(async (_token: unknown, fn: (tx: object) => Promise<unknown>) => fn({}));
vi.mock("@/lib/db/client", () => ({
  withUser: (token: unknown, fn: (tx: object) => Promise<unknown>) => withUserMock(token, fn),
}));

const exportAccountDataMock = vi.fn();
vi.mock("@/lib/db/queries/account-export", () => ({
  exportAccountData: (...args: unknown[]) => exportAccountDataMock(...args),
}));

function fakeExport(userId: string) {
  return {
    profile: { userId, fullName: "Test User" },
    contacts: [{ id: "c-1", userId, name: "Jane Recruiter" }],
    // Deliberately no `embedding` key on either — the export must never
    // include raw vector data.
    chats: [{ id: "chat-1", userId, contactId: "c-1", rawNotes: "great call" }],
    chatEmbeddings: [{ chatId: "chat-1", userId, contactId: "c-1", summaryText: "great call" }],
    followups: [],
    calendarEvents: [],
    appliedJobs: [],
    mockInterviews: [],
    stories: [],
    guideProgress: [],
    aiUsage: [{ id: "u-1", userId, endpoint: "chat/assistant", costUsd: "0.01" }],
    qbankAttempts: [],
    qbankSpacedState: [],
    topicMastery: [],
    sectionProgress: [],
    chapterProgress: [],
    chatThreads: [],
    chatMessages: [],
    feedback: [],
  };
}

beforeEach(() => {
  getUserMock.mockReset();
  withUserMock.mockClear();
  exportAccountDataMock.mockReset();
});

function makeReq(ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/account/export", {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  });
}

describe("GET /api/account/export", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { GET } = await import("@/app/api/account/export/route");
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(exportAccountDataMock).not.toHaveBeenCalled();
  });

  it("returns 200 with a grouped-by-table payload and an attachment header", async () => {
    const user = fakeUser();
    getUserMock.mockResolvedValue(user);
    exportAccountDataMock.mockResolvedValue(fakeExport(user.id));

    const { GET } = await import("@/app/api/account/export/route");
    const res = await GET(makeReq());

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const disposition = res.headers.get("Content-Disposition");
    expect(disposition).toContain("attachment");
    expect(disposition).toMatch(/filename="streetprep-export-\d{4}-\d{2}-\d{2}\.json"/);

    const json = await res.json();
    expect(json.meta.userId).toBe(user.id);
    expect(json.meta.app).toBe("Street Prep AI");
    expect(typeof json.meta.exportedAt).toBe("string");
    expect(Array.isArray(json.meta.notes)).toBe(true);
    expect(json.data.contacts).toHaveLength(1);
    expect(json.data.chats).toHaveLength(1);
    expect(json.data.aiUsage).toHaveLength(1);

    // Scoped to the authed user's id, run inside a withUser transaction.
    expect(withUserMock).toHaveBeenCalledWith(
      { sub: user.id, role: "authenticated" },
      expect.any(Function),
    );
    expect(exportAccountDataMock).toHaveBeenCalledWith(expect.anything(), user.id);
  });

  it("never includes embedding vectors in the chats or chatEmbeddings rows", async () => {
    const user = fakeUser();
    getUserMock.mockResolvedValue(user);
    exportAccountDataMock.mockResolvedValue(fakeExport(user.id));

    const { GET } = await import("@/app/api/account/export/route");
    const res = await GET(makeReq());
    const json = await res.json();

    for (const row of json.data.chats) {
      expect(Object.prototype.hasOwnProperty.call(row, "embedding")).toBe(false);
    }
    for (const row of json.data.chatEmbeddings) {
      expect(Object.prototype.hasOwnProperty.call(row, "embedding")).toBe(false);
    }
    expect(json.meta.notes.some((n: string) => n.toLowerCase().includes("embedding"))).toBe(true);
  });

  it("returns 500 with a client-safe message when the export query throws", async () => {
    const user = fakeUser();
    getUserMock.mockResolvedValue(user);
    exportAccountDataMock.mockRejectedValue(new Error("db down"));

    const { GET } = await import("@/app/api/account/export/route");
    const res = await GET(makeReq());

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Could not export your data.");
  });

  it("returns 429 after exhausting the cheap-tier per-user limit (31 requests)", async () => {
    const user = fakeUser({ id: "88888888-8888-4888-8888-888888888888" });
    getUserMock.mockResolvedValue(user);
    exportAccountDataMock.mockResolvedValue(fakeExport(user.id));
    const { GET } = await import("@/app/api/account/export/route");

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await GET(makeReq(`198.51.100.${i}`));
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});
