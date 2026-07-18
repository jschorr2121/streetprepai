import { beforeEach, describe, expect, it, vi } from "vitest";

import { fakeUser } from "@/tests/fixtures/user";

// Both helpers delegate to lib/supabase/get-user (the React cache()-deduped
// wrapper): requireUser() → getUser(), getCurrentUserOrNull() → getUserOrNull().
const getUserFn = vi.fn();
const getUserOrNullFn = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: (...args: unknown[]) => getUserFn(...args),
  getUserOrNull: (...args: unknown[]) => getUserOrNullFn(...args),
}));

beforeEach(() => {
  getUserFn.mockReset();
  getUserOrNullFn.mockReset();
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
  it("returns the user when a session exists", async () => {
    const { getCurrentUserOrNull } = await import("@/lib/auth/server");
    const u = fakeUser();
    getUserOrNullFn.mockResolvedValue(u);

    const result = await getCurrentUserOrNull();
    expect(result).toBe(u);
  });

  it("returns null when there is no session", async () => {
    const { getCurrentUserOrNull } = await import("@/lib/auth/server");
    getUserOrNullFn.mockResolvedValue(null);

    const result = await getCurrentUserOrNull();
    expect(result).toBeNull();
  });
});
