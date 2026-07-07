/**
 * Unit coverage for `completeOnboardingAction` (Unit 4). Asserts the auth gate:
 * with no session, `requireUser` throws `UnauthorizedError` and the action
 * returns the `{ ok: false, error: { code: 'UNAUTHORIZED' } }` shape — before any
 * DB write is attempted.
 */
import { describe, expect, it, vi } from "vitest";

// Sentry's mcp-server/transport.js makes a network call at module-load time in
// the test environment. Mock the entire package so Sentry is a no-op in tests.
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

// `withUserMock` must be created via vi.hoisted so it is available inside the
// vi.mock factory (which is hoisted to the top of the module by Vitest).
const { withUserMock } = vi.hoisted(() => ({ withUserMock: vi.fn() }));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

// requireUser throws when there's no session; withUser must never be reached.
vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: vi.fn(async () => {
      throw new actual.UnauthorizedError();
    }),
  };
});

import { UnauthorizedError } from "@/lib/auth/server";
import { completeOnboardingAction } from "@/app/(app)/onboarding/actions";

describe("completeOnboardingAction", () => {
  it("returns UNAUTHORIZED when called without a session", async () => {
    const result = await completeOnboardingAction({
      school: "State U",
      graduationYear: new Date().getUTCFullYear() + 2,
      currentSemester: "Sophomore Fall",
      targetFirms: ["Evercore"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("exports an UnauthorizedError carrying the UNAUTHORIZED code", () => {
    expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
  });
});
