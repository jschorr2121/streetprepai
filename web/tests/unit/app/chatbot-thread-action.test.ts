/**
 * Unit coverage for chatbot thread-management Server Actions (Unit 9 issue 05).
 *
 * Tests: auth gate, validation, rate-limit gate, NOT_FOUND on foreign/missing
 * threads, happy path. Pattern mirrors tests/unit/app/applications-action.test.ts.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Sentry must be neutralised before any import that transitively loads it.
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

const { withUserMock, deleteThreadMock, requireUserMock, limiterMock } = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  deleteThreadMock: vi.fn(),
  requireUserMock: vi.fn(),
  limiterMock: vi.fn(async () => ({ allowed: true as const })),
}));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/db/queries/chat", () => ({
  deleteThread: deleteThreadMock,
}));

vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

vi.mock("@/lib/ratelimit/limiters", () => ({
  chatThreadsLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { deleteThreadAction } from "@/app/(app)/tools/chatbot/actions";
import { UnauthorizedError } from "@/lib/auth/server";

const THREAD_ID = "33333333-0000-4000-8000-000000000001";

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ id: "u-1" });
  limiterMock.mockClear();
  limiterMock.mockResolvedValue({ allowed: true as const });
  withUserMock.mockReset();
  withUserMock.mockImplementation(async (_token: unknown, fn: (tx: null) => Promise<unknown>) =>
    fn(null),
  );
  deleteThreadMock.mockReset();
});

describe("deleteThreadAction", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await deleteThreadAction({ threadId: THREAD_ID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for a non-uuid threadId", async () => {
    const result = await deleteThreadAction({ threadId: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns RATE_LIMITED when the limiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 30 });
    const result = await deleteThreadAction({ threadId: THREAD_ID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the thread is missing or owned by someone else", async () => {
    deleteThreadMock.mockResolvedValue(false);
    const result = await deleteThreadAction({ threadId: THREAD_ID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("deletes the caller's thread through withUser (RLS path)", async () => {
    deleteThreadMock.mockResolvedValue(true);
    const result = await deleteThreadAction({ threadId: THREAD_ID });
    expect(result.ok).toBe(true);
    expect(withUserMock).toHaveBeenCalledWith(
      { sub: "u-1", role: "authenticated" },
      expect.any(Function),
    );
    expect(deleteThreadMock).toHaveBeenCalledWith(null, "u-1", THREAD_ID);
  });
});
