/**
 * Unit coverage for the self-serve account deletion Server Action.
 *
 * Tests: auth gate, rate-limit gate, happy-path order-of-operations (Storage
 * cleanup BEFORE the auth-user delete), and storage-failure aborting before the
 * auth user is touched. Pattern mirrors tests/unit/app/chatbot-thread-action.test.ts.
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

const {
  requireUserMock,
  limiterMock,
  getAdminClientMock,
  createClientMock,
  cookiesMock,
  redirectMock,
  cookieDeleteMock,
  signOutMock,
  deleteUserMock,
  callLog,
} = vi.hoisted(() => {
  const callLog: string[] = [];
  return {
    requireUserMock: vi.fn(),
    limiterMock: vi.fn(async () => ({ allowed: true as const })),
    getAdminClientMock: vi.fn(),
    createClientMock: vi.fn(),
    cookiesMock: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    cookieDeleteMock: vi.fn(),
    signOutMock: vi.fn(async () => ({ error: null })),
    deleteUserMock: vi.fn(async () => {
      callLog.push("deleteUser");
      return { data: {}, error: null };
    }),
    callLog,
  };
});

vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return { ...actual, requireUser: (...args: unknown[]) => requireUserMock(...args) };
});

vi.mock("@/lib/ratelimit/limiters", () => ({
  accountDeletionLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: () => getAdminClientMock() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClientMock() }));
vi.mock("next/headers", () => ({ cookies: () => cookiesMock() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

import { deleteAccountAction } from "@/app/(app)/profile/settings/actions";
import { UnauthorizedError } from "@/lib/auth/server";

// Builds a fake service-role client whose storage `list` returns `listResult`
// for every bucket. `list`/`remove`/`deleteUser` push onto the shared call log
// so ordering can be asserted.
function fakeAdmin(listResult: { data: unknown; error: unknown }) {
  return {
    storage: {
      from: (bucket: string) => ({
        list: vi.fn(async () => {
          callLog.push(`list:${bucket}`);
          return listResult;
        }),
        remove: vi.fn(async () => {
          callLog.push(`remove:${bucket}`);
          return { data: [], error: null };
        }),
      }),
    },
    auth: { admin: { deleteUser: deleteUserMock } },
  };
}

beforeEach(() => {
  callLog.length = 0;
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ id: "u-1" });
  limiterMock.mockClear();
  limiterMock.mockResolvedValue({ allowed: true as const });
  deleteUserMock.mockClear();
  signOutMock.mockClear();
  signOutMock.mockResolvedValue({ error: null });
  cookieDeleteMock.mockClear();
  redirectMock.mockClear();
  getAdminClientMock.mockReset();
  getAdminClientMock.mockReturnValue(fakeAdmin({ data: [], error: null }));
  createClientMock.mockReset();
  createClientMock.mockResolvedValue({ auth: { signOut: signOutMock } });
  cookiesMock.mockReset();
  cookiesMock.mockResolvedValue({ delete: cookieDeleteMock });
});

describe("deleteAccountAction", () => {
  it("returns UNAUTHORIZED without a session and never touches the admin client", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await deleteAccountAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(getAdminClientMock).not.toHaveBeenCalled();
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("returns RATE_LIMITED when the limiter denies, before any deletion", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 30 });
    const result = await deleteAccountAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(getAdminClientMock).not.toHaveBeenCalled();
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("returns INTERNAL when the service-role client is unavailable", async () => {
    getAdminClientMock.mockReturnValue(null);
    const result = await deleteAccountAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("cleans Storage before deleting the auth user, signs out, clears the cookie, and redirects home", async () => {
    await expect(deleteAccountAction()).rejects.toThrow("NEXT_REDIRECT:/");

    // Every Storage list happens before the auth-user delete.
    const deleteIdx = callLog.indexOf("deleteUser");
    const listIdxs = callLog.map((c, i) => (c.startsWith("list:") ? i : -1)).filter((i) => i >= 0);
    expect(listIdxs.length).toBeGreaterThan(0);
    expect(Math.max(...listIdxs)).toBeLessThan(deleteIdx);

    expect(deleteUserMock).toHaveBeenCalledWith("u-1");
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    expect(cookieDeleteMock).toHaveBeenCalledWith("sp-onboarded");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("aborts before deleting the auth user when Storage cleanup fails", async () => {
    getAdminClientMock.mockReturnValue(
      fakeAdmin({ data: null, error: { message: "network unreachable" } }),
    );
    const result = await deleteAccountAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("treats a missing Storage bucket as nothing-to-clean and still deletes the account", async () => {
    getAdminClientMock.mockReturnValue(
      fakeAdmin({ data: null, error: { message: "Bucket not found" } }),
    );
    await expect(deleteAccountAction()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(deleteUserMock).toHaveBeenCalledWith("u-1");
  });
});
