/**
 * Unit coverage for the Relationship Manager Server Actions (contacts, chat
 * logs, follow-ups). Mirrors the mock pattern in
 * tests/unit/app/applications-action.test.ts and
 * tests/unit/app/qbank-actions.test.ts: auth gate, validation, rate-limit
 * gate, ownership/NOT_FOUND behavior, and one happy path per action, with the
 * `lib/data/contacts` and `lib/data/followups` data layers mocked wholesale.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Sentry must be neutralised before any import that transitively loads it —
// actions.ts imports `* as Sentry from "@sentry/nextjs"` directly.
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

const {
  requireUserMock,
  limiterMock,
  createContactMock,
  getContactByIdMock,
  saveChatFollowUpDraftMock,
  saveChatStructuredMock,
  touchContactLastContactMock,
  updateContactStageMock,
  upsertChatLogMock,
  completeFollowupMock,
  createFollowupMock,
  getFollowupsMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  limiterMock: vi.fn(async () => ({ allowed: true as const })),
  createContactMock: vi.fn(),
  getContactByIdMock: vi.fn(),
  saveChatFollowUpDraftMock: vi.fn(),
  saveChatStructuredMock: vi.fn(),
  touchContactLastContactMock: vi.fn(),
  updateContactStageMock: vi.fn(),
  upsertChatLogMock: vi.fn(),
  completeFollowupMock: vi.fn(),
  createFollowupMock: vi.fn(),
  getFollowupsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

vi.mock("@/lib/ratelimit/limiters", () => ({
  contactsLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("@/lib/data/contacts", () => ({
  createContact: createContactMock,
  getContactById: getContactByIdMock,
  saveChatFollowUpDraft: saveChatFollowUpDraftMock,
  saveChatStructured: saveChatStructuredMock,
  touchContactLastContact: touchContactLastContactMock,
  updateContactStage: updateContactStageMock,
  upsertChatLog: upsertChatLogMock,
}));

vi.mock("@/lib/data/followups", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/followups")>();
  return {
    ...actual,
    completeFollowup: completeFollowupMock,
    createFollowup: createFollowupMock,
    getFollowups: getFollowupsMock,
  };
});

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  completeFollowupAction,
  createContactAction,
  logChatAction,
  saveChatSummaryAction,
  saveFollowUpDraftAction,
  updateContactStageAction,
} from "@/app/(app)/tools/relationships/actions";
import { UnauthorizedError } from "@/lib/auth/server";
import type { Contact, ChatLog } from "@/lib/types";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CONTACT_ID = "11111111-1111-4111-8111-111111111111";
const CHAT_ID = "22222222-2222-4222-8222-222222222222";
const FOLLOWUP_ID = "33333333-3333-4333-8333-333333333333";

const CONTACT: Contact = {
  id: CONTACT_ID,
  name: "Jane Banker",
  firm: "Goldman Sachs",
  title: "VP",
  stage: "warm",
  tags: [],
};

const CHAT: ChatLog = {
  id: CHAT_ID,
  contactId: CONTACT_ID,
  happenedAt: "2026-07-01T00:00:00.000Z",
  rawNotes: "Talked about markets.",
};

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ id: USER_ID });
  limiterMock.mockReset();
  limiterMock.mockResolvedValue({ allowed: true as const });
  createContactMock.mockReset();
  getContactByIdMock.mockReset();
  saveChatFollowUpDraftMock.mockReset();
  saveChatStructuredMock.mockReset();
  touchContactLastContactMock.mockReset();
  touchContactLastContactMock.mockResolvedValue(undefined);
  updateContactStageMock.mockReset();
  upsertChatLogMock.mockReset();
  completeFollowupMock.mockReset();
  createFollowupMock.mockReset();
  createFollowupMock.mockResolvedValue(undefined);
  getFollowupsMock.mockReset();
  getFollowupsMock.mockResolvedValue([]);
});

// ─── createContactAction ─────────────────────────────────────────────────────

describe("createContactAction", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await createContactAction({ name: "Jane", firm: "GS", stage: "cold" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(createContactMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED with fieldErrors when name and firm are missing", async () => {
    const result = await createContactAction({ stage: "cold" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toMatchObject({
        name: expect.any(String) as string,
        firm: expect.any(String) as string,
      });
    }
    expect(createContactMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for an invalid stage enum value", async () => {
    const result = await createContactAction({ name: "Jane", firm: "GS", stage: "bookmarked" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns VALIDATION_FAILED for an unknown field (strict schema)", async () => {
    const result = await createContactAction({
      name: "Jane",
      firm: "GS",
      stage: "cold",
      bogus: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns RATE_LIMITED when contactsLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 45 });
    const result = await createContactAction({ name: "Jane", firm: "GS", stage: "cold" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RATE_LIMITED");
      expect(result.error.message).toMatch(/45s/);
    }
    expect(createContactMock).not.toHaveBeenCalled();
  });

  it("returns INTERNAL when the data layer throws", async () => {
    createContactMock.mockRejectedValue(new Error("db down"));
    const result = await createContactAction({ name: "Jane", firm: "GS", stage: "cold" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("happy path: creates the contact and converts gradYear to a number", async () => {
    createContactMock.mockResolvedValue(CONTACT);
    const result = await createContactAction({
      name: "Jane",
      firm: "GS",
      stage: "cold",
      gradYear: "2027",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(CONTACT);
    expect(createContactMock).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ name: "Jane", firm: "GS", stage: "cold", gradYear: 2027 }),
    );
  });

  it("happy path: omits gradYear entirely when given as an empty string", async () => {
    createContactMock.mockResolvedValue(CONTACT);
    await createContactAction({ name: "Jane", firm: "GS", stage: "cold", gradYear: "" });
    const passedInput = createContactMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(passedInput).not.toHaveProperty("gradYear");
  });
});

// ─── updateContactStageAction ────────────────────────────────────────────────

describe("updateContactStageAction", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await updateContactStageAction({ id: CONTACT_ID, stage: "warm" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(updateContactStageMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for an invalid stage value", async () => {
    const result = await updateContactStageAction({ id: CONTACT_ID, stage: "not-a-stage" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("returns RATE_LIMITED when contactsLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 10 });
    const result = await updateContactStageAction({ id: CONTACT_ID, stage: "warm" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(updateContactStageMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the contact does not belong to the caller", async () => {
    updateContactStageMock.mockResolvedValue(null);
    const result = await updateContactStageAction({ id: CONTACT_ID, stage: "warm" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    expect(updateContactStageMock).toHaveBeenCalledWith(USER_ID, CONTACT_ID, "warm");
  });

  it("returns INTERNAL when the data layer throws", async () => {
    updateContactStageMock.mockRejectedValue(new Error("db down"));
    const result = await updateContactStageAction({ id: CONTACT_ID, stage: "warm" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("happy path: updates the stage and returns the contact", async () => {
    updateContactStageMock.mockResolvedValue({ ...CONTACT, stage: "warm" });
    const result = await updateContactStageAction({ id: CONTACT_ID, stage: "warm" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.stage).toBe("warm");
  });
});

// ─── logChatAction ───────────────────────────────────────────────────────────

describe("logChatAction", () => {
  const VALID_INPUT = { contactId: CONTACT_ID, rawNotes: "Talked about markets." };

  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(getContactByIdMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED when rawNotes is empty", async () => {
    const result = await logChatAction({ contactId: CONTACT_ID, rawNotes: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("returns RATE_LIMITED when contactsLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 20 });
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(getContactByIdMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the contact does not belong to the caller (ownership check)", async () => {
    getContactByIdMock.mockResolvedValue(null);
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    expect(getContactByIdMock).toHaveBeenCalledWith(CONTACT_ID, USER_ID);
    expect(upsertChatLogMock).not.toHaveBeenCalled();
  });

  it("returns INTERNAL when the ownership check throws", async () => {
    getContactByIdMock.mockRejectedValue(new Error("db down"));
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("returns NOT_FOUND when upsertChatLog returns null", async () => {
    getContactByIdMock.mockResolvedValue(CONTACT);
    upsertChatLogMock.mockResolvedValue(null);
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("returns INTERNAL when upsertChatLog throws", async () => {
    getContactByIdMock.mockResolvedValue(CONTACT);
    upsertChatLogMock.mockRejectedValue(new Error("db down"));
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("happy path: logs the chat and stamps last-contact date", async () => {
    getContactByIdMock.mockResolvedValue(CONTACT);
    upsertChatLogMock.mockResolvedValue(CHAT);
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(CHAT);
    expect(touchContactLastContactMock).toHaveBeenCalledWith(USER_ID, CONTACT_ID);
  });

  it("still succeeds when the best-effort last-contact stamp fails", async () => {
    getContactByIdMock.mockResolvedValue(CONTACT);
    upsertChatLogMock.mockResolvedValue(CHAT);
    touchContactLastContactMock.mockRejectedValue(new Error("stamp failed"));
    const result = await logChatAction(VALID_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(CHAT);
  });
});

// ─── saveChatSummaryAction ───────────────────────────────────────────────────

const STRUCTURED = {
  topics: ["markets"],
  adviceGiven: [],
  commitments: [],
  personalDetails: [],
  followUps: [{ description: "Send resume", dueBy: "2026-07-25" }],
};

describe("saveChatSummaryAction", () => {
  const VALID_INPUT = { chatId: CHAT_ID, structured: STRUCTURED };

  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await saveChatSummaryAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(saveChatStructuredMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED when structured is missing required arrays", async () => {
    const result = await saveChatSummaryAction({ chatId: CHAT_ID, structured: { topics: [] } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("returns RATE_LIMITED when contactsLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 5 });
    const result = await saveChatSummaryAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(saveChatStructuredMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the chat log does not belong to the caller", async () => {
    saveChatStructuredMock.mockResolvedValue(null);
    const result = await saveChatSummaryAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("returns INTERNAL when saveChatStructured throws", async () => {
    saveChatStructuredMock.mockRejectedValue(new Error("db down"));
    const result = await saveChatSummaryAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("happy path: saves the summary and seeds a follow-up from action items", async () => {
    saveChatStructuredMock.mockResolvedValue(CHAT);
    const result = await saveChatSummaryAction(VALID_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(CHAT);
    expect(createFollowupMock).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        contactId: CONTACT_ID,
        kind: "post-chat",
        note: "Send resume",
        dueAt: "2026-07-25",
      }),
    );
  });

  it("dedupes follow-up creation against the contact's existing open follow-ups", async () => {
    saveChatStructuredMock.mockResolvedValue(CHAT);
    getFollowupsMock.mockResolvedValue([
      {
        id: "existing",
        contactId: CONTACT_ID,
        dueAt: "2026-07-20",
        kind: "post-chat",
        note: "Send resume",
      },
    ]);
    const result = await saveChatSummaryAction(VALID_INPUT);
    expect(result.ok).toBe(true);
    expect(createFollowupMock).not.toHaveBeenCalled();
  });

  it("still succeeds when seeding follow-ups fails (best-effort)", async () => {
    saveChatStructuredMock.mockResolvedValue(CHAT);
    getFollowupsMock.mockRejectedValue(new Error("followups down"));
    const result = await saveChatSummaryAction(VALID_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(CHAT);
  });

  it("skips follow-up creation entirely when there are no action items", async () => {
    saveChatStructuredMock.mockResolvedValue(CHAT);
    const result = await saveChatSummaryAction({
      chatId: CHAT_ID,
      structured: { ...STRUCTURED, followUps: [] },
    });
    expect(result.ok).toBe(true);
    expect(getFollowupsMock).not.toHaveBeenCalled();
    expect(createFollowupMock).not.toHaveBeenCalled();
  });
});

// ─── saveFollowUpDraftAction ─────────────────────────────────────────────────

describe("saveFollowUpDraftAction", () => {
  const VALID_INPUT = { chatId: CHAT_ID, draft: { subject: "Following up", body: "Hi Jane," } };

  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await saveFollowUpDraftAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(saveChatFollowUpDraftMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED when the draft body is empty", async () => {
    const result = await saveFollowUpDraftAction({
      chatId: CHAT_ID,
      draft: { subject: "Following up", body: "" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("returns RATE_LIMITED when contactsLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 15 });
    const result = await saveFollowUpDraftAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(saveChatFollowUpDraftMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the chat log does not belong to the caller", async () => {
    saveChatFollowUpDraftMock.mockResolvedValue(null);
    const result = await saveFollowUpDraftAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("returns INTERNAL when the data layer throws", async () => {
    saveChatFollowUpDraftMock.mockRejectedValue(new Error("db down"));
    const result = await saveFollowUpDraftAction(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("happy path: saves the follow-up draft", async () => {
    saveChatFollowUpDraftMock.mockResolvedValue({ ...CHAT, followUpDraft: VALID_INPUT.draft });
    const result = await saveFollowUpDraftAction(VALID_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.followUpDraft).toEqual(VALID_INPUT.draft);
  });
});

// ─── completeFollowupAction ──────────────────────────────────────────────────

describe("completeFollowupAction", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await completeFollowupAction({ id: FOLLOWUP_ID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(completeFollowupMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for a non-uuid id", async () => {
    const result = await completeFollowupAction({ id: "not-a-uuid" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("returns RATE_LIMITED when contactsLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 8 });
    const result = await completeFollowupAction({ id: FOLLOWUP_ID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(completeFollowupMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the follow-up does not belong to the caller", async () => {
    completeFollowupMock.mockResolvedValue(false);
    const result = await completeFollowupAction({ id: FOLLOWUP_ID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    expect(completeFollowupMock).toHaveBeenCalledWith(USER_ID, FOLLOWUP_ID);
  });

  it("returns INTERNAL when the data layer throws", async () => {
    completeFollowupMock.mockRejectedValue(new Error("db down"));
    const result = await completeFollowupAction({ id: FOLLOWUP_ID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("happy path: marks the follow-up complete", async () => {
    completeFollowupMock.mockResolvedValue(true);
    const result = await completeFollowupAction({ id: FOLLOWUP_ID });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: FOLLOWUP_ID });
  });
});
