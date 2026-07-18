/**
 * Unit coverage for the (auth) route group's Server Actions: signup, login
 * (email + Google OAuth), forgot-password, and reset-password.
 *
 * Pattern: rate-limit + Zod-validate + Supabase auth call, mirroring
 * tests/unit/app/applications-action.test.ts for the mock scaffolding. The
 * Supabase server client and `next/headers` / `next/navigation` are mocked
 * wholesale so no real request context is required.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const { authMock, createClientMock, headersGetMock, limiterMock, redirectMock } = vi.hoisted(
  () => ({
    authMock: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    createClientMock: vi.fn(),
    headersGetMock: vi.fn(),
    limiterMock: vi.fn(async () => ({ allowed: true as const })),
    redirectMock: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/ratelimit/limiters", () => ({
  authActionLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: headersGetMock })),
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { signUpAction } from "@/app/(auth)/signup/actions";
import { signInAction, signInWithGoogleAction } from "@/app/(auth)/login/actions";
import { requestPasswordResetAction } from "@/app/(auth)/forgot-password/actions";
import { resetPasswordAction } from "@/app/(auth)/reset-password/actions";

const VALID_EMAIL = "jane@example.com";
const VALID_PASSWORD = "correcthorsebattery";
const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  createClientMock.mockReset();
  createClientMock.mockResolvedValue({ auth: authMock });
  authMock.signUp.mockReset();
  authMock.signInWithPassword.mockReset();
  authMock.signInWithOAuth.mockReset();
  authMock.getUser.mockReset();
  authMock.updateUser.mockReset();
  authMock.resetPasswordForEmail.mockReset();
  limiterMock.mockReset();
  limiterMock.mockResolvedValue({ allowed: true as const });
  redirectMock.mockClear();
  headersGetMock.mockReset();
  headersGetMock.mockImplementation((name: string) => {
    if (name === "x-forwarded-for") return "203.0.113.5";
    if (name === "origin") return "https://streetprepai.com";
    return null;
  });
});

// ─── signUpAction ─────────────────────────────────────────────────────────────

describe("signUpAction", () => {
  it("returns RATE_LIMITED when authActionLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 30 });
    const result = await signUpAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED with fieldErrors for an invalid email", async () => {
    const result = await signUpAction({ email: "not-an-email", password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toMatchObject({ email: expect.any(String) as string });
    }
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for a too-short password", async () => {
    const result = await signUpAction({ email: VALID_EMAIL, password: "short" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toMatchObject({ password: expect.any(String) as string });
    }
  });

  it("returns VALIDATION_FAILED with an email fieldError when Supabase reports the address is taken", async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email address already registered" },
    });
    const result = await signUpAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toEqual({ email: "That email is already in use." });
    }
  });

  it("returns INTERNAL for other Supabase sign-up errors", async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Service unavailable" },
    });
    const result = await signUpAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
      expect(result.error.message).toBe("Service unavailable");
    }
  });

  it("happy path: returns needsEmailConfirmation=false when a session comes back immediately", async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: { id: USER_ID }, session: { access_token: "tok" } },
      error: null,
    });
    const result = await signUpAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ needsEmailConfirmation: false });
  });

  it("happy path: returns needsEmailConfirmation=true when no session is returned", async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: { id: USER_ID }, session: null },
      error: null,
    });
    const result = await signUpAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ needsEmailConfirmation: true });
  });
});

// ─── signInAction ─────────────────────────────────────────────────────────────

describe("signInAction", () => {
  it("returns RATE_LIMITED when authActionLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 30 });
    const result = await signInAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(authMock.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for an invalid email", async () => {
    const result = await signInAction({ email: "not-an-email", password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
    expect(authMock.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for an empty password", async () => {
    const result = await signInAction({ email: VALID_EMAIL, password: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns UNAUTHORIZED when Supabase rejects the credentials", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    const result = await signInAction({ email: VALID_EMAIL, password: "wrong-password" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
      expect(result.error.message).toBe("Invalid email or password.");
    }
  });

  it("returns UNAUTHORIZED when Supabase returns no error but also no user", async () => {
    authMock.signInWithPassword.mockResolvedValue({ data: { user: null }, error: null });
    const result = await signInAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
  });

  it("happy path: returns the signed-in user's id", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    const result = await signInAction({ email: VALID_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ userId: USER_ID });
  });
});

// ─── signInWithGoogleAction ───────────────────────────────────────────────────

describe("signInWithGoogleAction", () => {
  it("returns INTERNAL when Supabase fails to start the OAuth flow", async () => {
    authMock.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: { message: "boom" } });
    const result = await signInWithGoogleAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns INTERNAL when Supabase returns no error but also no url", async () => {
    authMock.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });
    const result = await signInWithGoogleAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("happy path: redirects to the Supabase-hosted authorize URL", async () => {
    const AUTHORIZE_URL = "https://test.supabase.co/auth/v1/authorize?provider=google";
    authMock.signInWithOAuth.mockResolvedValue({ data: { url: AUTHORIZE_URL }, error: null });

    await expect(signInWithGoogleAction()).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith(AUTHORIZE_URL);
    expect(authMock.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://streetprepai.com/callback" },
    });
  });
});

// ─── requestPasswordResetAction ───────────────────────────────────────────────

describe("requestPasswordResetAction", () => {
  it("returns RATE_LIMITED when authActionLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 30 });
    const result = await requestPasswordResetAction({ email: VALID_EMAIL });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(authMock.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for an invalid email", async () => {
    const result = await requestPasswordResetAction({ email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
    expect(authMock.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns ok:true even when Supabase's send fails (avoids account enumeration)", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({ error: { message: "no such user" } });
    const result = await requestPasswordResetAction({ email: VALID_EMAIL });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ sent: true });
  });

  it("happy path: sends the reset email and reports success", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({ error: null });
    const result = await requestPasswordResetAction({ email: VALID_EMAIL });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ sent: true });
    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(VALID_EMAIL, {
      redirectTo: "https://streetprepai.com/callback?next=/reset-password",
    });
  });
});

// ─── resetPasswordAction ──────────────────────────────────────────────────────

describe("resetPasswordAction", () => {
  it("returns VALIDATION_FAILED for a too-short password", async () => {
    const result = await resetPasswordAction({ password: "short" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
    expect(authMock.getUser).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED when there is no recovery session", async () => {
    authMock.getUser.mockResolvedValue({ data: { user: null } });
    const result = await resetPasswordAction({ password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(authMock.updateUser).not.toHaveBeenCalled();
  });

  it("returns INTERNAL when Supabase fails to update the password", async () => {
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
    authMock.updateUser.mockResolvedValue({ error: { message: "update failed" } });
    const result = await resetPasswordAction({ password: VALID_PASSWORD });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
      expect(result.error.message).toBe("update failed");
    }
  });

  it("happy path: updates the password", async () => {
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
    authMock.updateUser.mockResolvedValue({ error: null });
    const result = await resetPasswordAction({ password: VALID_PASSWORD });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ updated: true });
    expect(authMock.updateUser).toHaveBeenCalledWith({ password: VALID_PASSWORD });
  });
});
