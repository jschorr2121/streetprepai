/**
 * Unit coverage for the feedback widget's Server Action.
 *
 * Tests: auth gate, validation (empty/oversized message), rate-limit gate,
 * happy path through withUser. Pattern mirrors
 * tests/unit/app/chatbot-thread-action.test.ts.
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

const { withUserMock, createFeedbackMock, requireUserMock, limiterMock } = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  createFeedbackMock: vi.fn(),
  requireUserMock: vi.fn(),
  limiterMock: vi.fn(async () => ({ allowed: true as const })),
}));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/db/queries/feedback", () => ({
  createFeedback: createFeedbackMock,
}));

vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

vi.mock("@/lib/ratelimit/limiters", () => ({
  feedbackLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { submitFeedbackAction } from "@/lib/feedback/actions";
import { UnauthorizedError } from "@/lib/auth/server";

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ id: "u-1" });
  limiterMock.mockClear();
  limiterMock.mockResolvedValue({ allowed: true as const });
  withUserMock.mockReset();
  withUserMock.mockImplementation(async (_token: unknown, fn: (tx: null) => Promise<unknown>) =>
    fn(null),
  );
  createFeedbackMock.mockReset();
});

describe("submitFeedbackAction", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await submitFeedbackAction({ route: "/dashboard", message: "hello" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for an empty message", async () => {
    const result = await submitFeedbackAction({ route: "/dashboard", message: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for a message over 2000 characters", async () => {
    const result = await submitFeedbackAction({
      route: "/dashboard",
      message: "x".repeat(2001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns RATE_LIMITED when the limiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 30 });
    const result = await submitFeedbackAction({ route: "/dashboard", message: "hello" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("submits the caller's feedback through withUser (RLS path)", async () => {
    createFeedbackMock.mockResolvedValue(undefined);
    const result = await submitFeedbackAction({ route: "/dashboard", message: "  hello  " });
    expect(result.ok).toBe(true);
    expect(withUserMock).toHaveBeenCalledWith(
      { sub: "u-1", role: "authenticated" },
      expect.any(Function),
    );
    expect(createFeedbackMock).toHaveBeenCalledWith(null, "u-1", "/dashboard", "hello");
  });

  it("returns INTERNAL when the insert throws", async () => {
    createFeedbackMock.mockRejectedValue(new Error("db down"));
    const result = await submitFeedbackAction({ route: "/dashboard", message: "hello" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });
});
