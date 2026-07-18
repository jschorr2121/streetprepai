import { beforeEach, describe, expect, it, vi } from "vitest";

import { fakeUser } from "@/tests/fixtures/user";

// requireUser() delegates to lib/supabase/get-user's getUser().
const getUserFn = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: (...args: unknown[]) => getUserFn(...args),
}));

// getCurrentUserOrNull() does NOT go through get-user.ts -- it calls
// createClient() from lib/supabase/server directly and reads
// supabase.auth.getUser() itself, so it needs its own mock target.
const authGetUserFn = vi.fn();
const createClientFn = vi.fn(async () => ({ auth: { getUser: authGetUserFn } }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientFn(...args),
}));

beforeEach(() => {
  getUserFn.mockReset();
  authGetUserFn.mockReset();
  createClientFn.mockClear();
});

describe("requireUser", () => {
  it("returns the user on success", async () => {
    const { requireUser } = await import("@/lib/auth/server");
    const u = fakeUser();
    getUserFn.mockResolvedValue(u);

    const result = await requireUser();
    expect(result).toBe(u);
  });

  it("throws UnauthorizedError when getUser() rejects", async () => {
    const { requireUser, UnauthorizedError } = await import("@/lib/auth/server");
    getUserFn.mockRejectedValue(new Error("Not authenticated"));

    await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws UnauthorizedError (not the original error) regardless of the underlying failure reason", async () => {
    const { requireUser, UnauthorizedError } = await import("@/lib/auth/server");
    getUserFn.mockRejectedValue(new TypeError("network exploded"));

    let caught: unknown;
    try {
      await requireUser();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(UnauthorizedError);
    expect((caught as Error).message).toBe("You need to be signed in to do that.");
  });
});

describe("getCurrentUserOrNull", () => {
  it("returns the user when supabase.auth.getUser() succeeds", async () => {
    const { getCurrentUserOrNull } = await import("@/lib/auth/server");
    const u = fakeUser();
    authGetUserFn.mockResolvedValue({ data: { user: u }, error: null });

    const result = await getCurrentUserOrNull();
    expect(result).toBe(u);
  });

  it("returns null when supabase.auth.getUser() returns an error", async () => {
    const { getCurrentUserOrNull } = await import("@/lib/auth/server");
    authGetUserFn.mockResolvedValue({ data: { user: null }, error: new Error("no session") });

    const result = await getCurrentUserOrNull();
    expect(result).toBeNull();
  });

  it("returns null when there's no error but also no user in the payload", async () => {
    const { getCurrentUserOrNull } = await import("@/lib/auth/server");
    authGetUserFn.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getCurrentUserOrNull();
    expect(result).toBeNull();
  });
});
