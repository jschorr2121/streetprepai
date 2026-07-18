/**
 * Tests for `updateSession` — the session-refresh + route-gating entrypoint
 * that runs on every request through the Next.js middleware/proxy layer.
 *
 * This is the app's defense-in-depth backstop: it 401s unauthenticated API
 * calls even if a route forgets to call `requireUser`, and it redirects
 * unauthenticated page requests to /login. Getting the gating logic wrong
 * either locks users out (redirect loop) or lets them through unauthed
 * (auth bypass), so the branch coverage here matters more than most.
 *
 * `@supabase/ssr`'s `createServerClient` is mocked at the module boundary —
 * we control `auth.getUser()` and the `profiles` query chain, and assert on
 * what `updateSession` does with the result, not on Supabase internals.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { fakeUser } from "@/tests/fixtures/user";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

const createServerClientMock = vi.fn((_url: string, _key: string, options: unknown) => {
  // Capture the cookies option so we can exercise getAll/setAll like the
  // real @supabase/ssr client would (it calls setAll when refreshing a
  // session; we don't emulate refresh, but we prove the plumbing is wired).
  lastCookiesOption = (
    options as { cookies: { getAll: () => unknown; setAll: (c: unknown) => void } }
  ).cookies;
  return {
    auth: { getUser: getUserMock },
    from: fromMock,
  };
});

let lastCookiesOption: { getAll: () => unknown; setAll: (c: unknown) => void } | undefined;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: [string, string, unknown]) => createServerClientMock(...args),
}));

function makeRequest(path: string, opts?: { cookie?: string }): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: opts?.cookie ? { cookie: opts.cookie } : {},
  });
}

beforeEach(() => {
  vi.resetModules();
  getUserMock.mockReset();
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  createServerClientMock.mockClear();
  lastCookiesOption = undefined;
});

describe("updateSession — @supabase/ssr cookie plumbing", () => {
  it("wires cookies.getAll/setAll onto the live request so a refreshed session survives", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const req = makeRequest("/", { cookie: "sb-access-token=abc123" });
    await updateSession(req);

    expect(lastCookiesOption).toBeDefined();
    expect(lastCookiesOption!.getAll()).toEqual(req.cookies.getAll());

    // Per the @supabase/ssr contract, setAll must write the refreshed cookie
    // back onto the *request* too (not just the response) so downstream RSC
    // reads in the same pass see the new value.
    lastCookiesOption!.setAll([{ name: "sb-access-token", value: "refreshed", options: {} }]);
    expect(req.cookies.get("sb-access-token")?.value).toBe("refreshed");
  });
});

describe("updateSession — /api/* backstop", () => {
  it("returns 401 JSON for an unauthenticated API request", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/api/interview/score"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("passes through (no redirect) for an authenticated API request", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/api/interview/score"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    // API requests never touch the onboarding gate.
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("updateSession — passthrough routes", () => {
  it("lets /callback through regardless of auth state", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/callback"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets /reset-password through for an authenticated (recovery) session", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/reset-password"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("updateSession — unauthenticated page requests", () => {
  it("allows the marketing landing page", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows an auth route (/login)", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("redirects a protected route to /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });
});

describe("updateSession — authenticated on landing/auth routes", () => {
  it("redirects an authenticated user away from / to /dashboard", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    maybeSingleMock.mockResolvedValue({ data: { onboarded_at: "2026-01-01T00:00:00Z" } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/", { cookie: `sp-onboarded=${fakeUser().id}` }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects an authenticated user away from /login to /dashboard", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    const res = await (
      await import("@/lib/auth/middleware")
    ).updateSession(makeRequest("/login", { cookie: `sp-onboarded=${fakeUser().id}` }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });
});

describe("updateSession — onboarding gate", () => {
  it("redirects to /onboarding when the profile has no onboarded_at and no cookie is set", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    maybeSingleMock.mockResolvedValue({ data: { onboarded_at: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/onboarding");
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(eqMock).toHaveBeenCalledWith("user_id", fakeUser().id);
  });

  it("does not redirect (and does not loop) when already at /onboarding and not onboarded", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    maybeSingleMock.mockResolvedValue({ data: { onboarded_at: null } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/onboarding"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("queries the profile and sets the onboarded cookie on first pass when no cookie is present", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    maybeSingleMock.mockResolvedValue({ data: { onboarded_at: "2026-01-01T00:00:00Z" } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(makeRequest("/dashboard"));
    expect(res.status).toBe(200);
    expect(maybeSingleMock).toHaveBeenCalledTimes(1);
    const setCookie = res.cookies.get("sp-onboarded");
    expect(setCookie?.value).toBe(fakeUser().id);
  });

  it("skips the profile query when the onboarded cookie matches the current user id", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(
      makeRequest("/dashboard", { cookie: `sp-onboarded=${fakeUser().id}` }),
    );
    expect(res.status).toBe(200);
    expect(fromMock).not.toHaveBeenCalled();
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });

  it("ignores the onboarded cookie when it belongs to a different user id", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser({ id: "other-user-id" }) } });
    maybeSingleMock.mockResolvedValue({ data: { onboarded_at: "2026-01-01T00:00:00Z" } });
    const { updateSession } = await import("@/lib/auth/middleware");
    // Cookie carries a *different* user's id — must not be trusted as proof
    // that THIS user is onboarded.
    const res = await updateSession(
      makeRequest("/dashboard", { cookie: `sp-onboarded=${fakeUser().id}` }),
    );
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(res.status).toBe(200);
  });

  it("redirects an onboarded user away from /onboarding to /dashboard", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(
      makeRequest("/onboarding", { cookie: `sp-onboarded=${fakeUser().id}` }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("allows a normal authenticated, onboarded request through untouched", async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser() } });
    const { updateSession } = await import("@/lib/auth/middleware");
    const res = await updateSession(
      makeRequest("/relationships", { cookie: `sp-onboarded=${fakeUser().id}` }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
