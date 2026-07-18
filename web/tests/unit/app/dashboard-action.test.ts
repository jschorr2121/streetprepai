/**
 * Unit coverage for `completeTourAction` (app/(app)/dashboard/actions.ts).
 *
 * Tests:
 *  1. Returns UNAUTHORIZED when called without a session.
 *  2. Returns RATE_LIMITED when the limiter denies.
 *  3. Happy path — marks the tour completed and returns { ok: true, data: null }.
 *  4. Returns INTERNAL when the DB write fails.
 *
 * Mocking recipe mirrors tests/unit/app/applications-action.test.ts.
 */

import { describe, expect, it, vi } from "vitest";

// Sentry must be neutralised before any import that transitively loads it.
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

// Hoist mocks referenced inside vi.mock() factories.
const { withUserMock, markTourCompletedMock } = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  markTourCompletedMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/db/queries/profile", () => ({
  markTourCompleted: markTourCompletedMock,
}));

// Auth mock — default: throws UnauthorizedError.
vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: vi.fn(async () => {
      throw new actual.UnauthorizedError();
    }),
  };
});

// Rate-limit mock — default: allow all.
const rateLimitAllowed = vi.fn(async () => ({ allowed: true as const }));
vi.mock("@/lib/ratelimit/limiters", () => ({
  curriculumProgressLimiter: (...args: unknown[]) => rateLimitAllowed(...args),
}));

// Logger mock.
vi.mock("@/lib/logging/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { completeTourAction } from "@/app/(app)/dashboard/actions";
import { UnauthorizedError } from "@/lib/auth/server";

const TEST_USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

// ─── 1. UNAUTHORIZED ─────────────────────────────────────────────────────────

describe("completeTourAction — auth gate", () => {
  it("returns UNAUTHORIZED when called without a session", async () => {
    const result = await completeTourAction();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("UnauthorizedError carries the correct code", () => {
    expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
  });
});

// ─── 2. RATE_LIMITED ─────────────────────────────────────────────────────────

describe("completeTourAction — rate limit", () => {
  it("returns RATE_LIMITED when the limiter denies", async () => {
    const { requireUser } = await import("@/lib/auth/server");
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: TEST_USER_ID,
    } as Awaited<ReturnType<typeof requireUser>>);

    rateLimitAllowed.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 });

    const result = await completeTourAction();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RATE_LIMITED");
    }
    expect(withUserMock).not.toHaveBeenCalled();
  });
});

// ─── 3. Happy path ───────────────────────────────────────────────────────────

describe("completeTourAction — happy path", () => {
  it("marks the tour completed and returns ok:true with null data", async () => {
    const { requireUser } = await import("@/lib/auth/server");
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: TEST_USER_ID,
    } as Awaited<ReturnType<typeof requireUser>>);

    withUserMock.mockImplementationOnce(
      async (token: { sub: string; role: string }, fn: (tx: unknown) => Promise<void>) => {
        await fn({});
        return undefined;
      },
    );

    const result = await completeTourAction();

    expect(result).toEqual({ ok: true, data: null });
    expect(withUserMock).toHaveBeenCalledWith(
      { sub: TEST_USER_ID, role: "authenticated" },
      expect.any(Function),
    );
    expect(markTourCompletedMock).toHaveBeenCalledWith({}, TEST_USER_ID);
  });
});

// ─── 4. DB failure ───────────────────────────────────────────────────────────

describe("completeTourAction — DB failure", () => {
  it("returns INTERNAL when the write fails", async () => {
    const { requireUser } = await import("@/lib/auth/server");
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: TEST_USER_ID,
    } as Awaited<ReturnType<typeof requireUser>>);

    withUserMock.mockRejectedValueOnce(new Error("db exploded"));

    const result = await completeTourAction();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
    }
  });
});
