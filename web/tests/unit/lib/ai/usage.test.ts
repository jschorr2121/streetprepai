import { describe, expect, it, beforeEach, vi } from "vitest";

type InsertFn = ReturnType<typeof vi.fn>;
type GteFn = ReturnType<typeof vi.fn>;

function makeAdminMock(opts?: {
  insertResult?: { data: unknown; error: unknown };
  gteResult?: { data: unknown; error: unknown };
}) {
  const insert: InsertFn = vi
    .fn()
    .mockResolvedValue(opts?.insertResult ?? { data: null, error: null });
  const gte: GteFn = vi.fn().mockResolvedValue(
    opts?.gteResult ?? {
      data: [{ cost_usd: 0.05 }, { cost_usd: 0.1 }, { cost_usd: "0.2" }],
      error: null,
    },
  );
  const eq = vi.fn(() => ({ gte }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ insert, select }));
  const admin = { from };
  return { admin, insert, gte, eq, select, from };
}

describe("logUsage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("inserts a usage row with the correct columns when admin client is configured", async () => {
    const mocks = makeAdminMock();
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));

    const { logUsage } = await import("@/lib/ai/usage");
    logUsage({
      model: "claude-sonnet-4-6",
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_input_tokens: 100,
        cache_read_input_tokens: 50,
      },
      endpoint: "test/endpoint",
      userId: "user-xyz",
    });

    // logUsage is fire-and-forget. Flush microtasks/macrotasks.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(mocks.from).toHaveBeenCalledWith("ai_usage");
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    const inserted = mocks.insert.mock.calls[0]![0] as Record<string, unknown>;
    expect(inserted.user_id).toBe("user-xyz");
    expect(inserted.endpoint).toBe("test/endpoint");
    expect(inserted.model).toBe("claude-sonnet-4-6");
    expect(inserted.input_tokens).toBe(1000);
    expect(inserted.output_tokens).toBe(500);
    expect(inserted.cache_read_tokens).toBe(50);
    expect(inserted.cache_write_tokens).toBe(100);
    expect(typeof inserted.cost_usd).toBe("number");
    expect(inserted.cost_usd).toBeGreaterThan(0);
  });

  it("does not throw when admin client is null (env unset)", async () => {
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => null),
    }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { logUsage } = await import("@/lib/ai/usage");
    expect(() =>
      logUsage({
        model: "claude-haiku-4-5-20251001",
        usage: { input_tokens: 10, output_tokens: 5 },
        endpoint: "test/null-admin",
      }),
    ).not.toThrow();

    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    // Warning should fire at least once for missing admin.
    expect(warn).toHaveBeenCalled();
  });

  it("subscribes to the lazy Supabase builder so the insert actually fires", async () => {
    // Real supabase-js inserts are lazy thenables: the HTTP request only fires
    // once `.then()` is attached. A bare `void builder` silently no-ops, so
    // this test models the builder shape instead of an eager promise.
    const then = vi.fn((onFulfilled: (v: { error: unknown }) => unknown) =>
      Promise.resolve({ error: null }).then(onFulfilled),
    );
    const insert = vi.fn(() => ({ then }));
    const from = vi.fn(() => ({ insert }));
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => ({ from })),
    }));

    const { logUsage } = await import("@/lib/ai/usage");
    logUsage({
      model: "claude-sonnet-4-6",
      usage: { input_tokens: 1, output_tokens: 1 },
      endpoint: "lazy-builder",
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(then).toHaveBeenCalled();
  });

  it("logs an error when the insert fails", async () => {
    const mocks = makeAdminMock({
      insertResult: { data: null, error: { message: "insert boom" } },
    });
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const { logUsage } = await import("@/lib/ai/usage");
    logUsage({
      model: "claude-sonnet-4-6",
      usage: { input_tokens: 1, output_tokens: 1 },
      endpoint: "err-insert",
    });

    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(err).toHaveBeenCalled();
  });

  it("uses null user_id when userId is omitted", async () => {
    const mocks = makeAdminMock();
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const { logUsage } = await import("@/lib/ai/usage");
    logUsage({
      model: "claude-haiku-4-5-20251001",
      usage: { input_tokens: 1, output_tokens: 1 },
      endpoint: "anon",
    });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const inserted = mocks.insert.mock.calls[0]![0] as Record<string, unknown>;
    expect(inserted.user_id).toBeNull();
  });
});

describe("trackStream", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("logs usage from a stream's finalMessage when model and usage are present", async () => {
    const mocks = makeAdminMock();
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const { trackStream } = await import("@/lib/ai/usage");

    const fakeStream = {
      finalMessage: vi.fn().mockResolvedValue({
        model: "claude-sonnet-4-6",
        usage: {
          input_tokens: 20,
          output_tokens: 30,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      }),
    };

    trackStream(fakeStream, "stream-test", { userId: "u1" });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(mocks.insert).toHaveBeenCalledTimes(1);
    const inserted = mocks.insert.mock.calls[0]![0] as Record<string, unknown>;
    expect(inserted.endpoint).toBe("stream-test");
    expect(inserted.user_id).toBe("u1");
    expect(inserted.model).toBe("claude-sonnet-4-6");
  });

  it("swallows finalMessage rejections without throwing", async () => {
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => null),
    }));
    const { trackStream } = await import("@/lib/ai/usage");
    const fakeStream = {
      finalMessage: vi.fn().mockRejectedValue(new Error("nope")),
    };
    expect(() => trackStream(fakeStream, "err-stream")).not.toThrow();
    // Give the rejection a tick to propagate through the catch.
    await new Promise((r) => setTimeout(r, 0));
  });

  it("does not call logUsage if the message lacks model or usage", async () => {
    const mocks = makeAdminMock();
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const { trackStream } = await import("@/lib/ai/usage");
    const fakeStream = {
      finalMessage: vi.fn().mockResolvedValue({}),
    };
    trackStream(fakeStream, "no-meta");
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

describe("getUserUsageThisMonth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("queries ai_usage scoped by user_id and start of month, summing cost_usd", async () => {
    const mocks = makeAdminMock();
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const { getUserUsageThisMonth } = await import("@/lib/ai/usage");

    const result = await getUserUsageThisMonth("user-1");
    expect(mocks.from).toHaveBeenCalledWith("ai_usage");
    expect(mocks.select).toHaveBeenCalledWith("cost_usd");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.gte).toHaveBeenCalled();
    const gteArgs = mocks.gte.mock.calls[0]!;
    expect(gteArgs[0]).toBe("created_at");
    // ISO string starting at month boundary, ends with "T00:00:00.000Z"
    expect(gteArgs[1]).toMatch(/T00:00:00\.000Z$/);

    expect(result.totalUsd).toBeCloseTo(0.05 + 0.1 + 0.2, 6);
    expect(result.rowCount).toBe(3);
  });

  it("returns zero when admin client is null", async () => {
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => null),
    }));
    const { getUserUsageThisMonth } = await import("@/lib/ai/usage");
    const r = await getUserUsageThisMonth("anyone");
    expect(r).toEqual({ totalUsd: 0, rowCount: 0 });
  });

  it("returns zero on supabase error and logs", async () => {
    const mocks = makeAdminMock({
      gteResult: { data: null, error: { message: "boom" } },
    });
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getUserUsageThisMonth } = await import("@/lib/ai/usage");
    const r = await getUserUsageThisMonth("u-err");
    expect(r).toEqual({ totalUsd: 0, rowCount: 0 });
    expect(err).toHaveBeenCalled();
  });
});

describe("assertUnderQuota", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns ok=false when used >= cap", async () => {
    const mocks = makeAdminMock({
      gteResult: {
        data: [{ cost_usd: 5 }, { cost_usd: 6 }],
        error: null,
      },
    });
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const { assertUnderQuota } = await import("@/lib/ai/usage");
    const r = await assertUnderQuota("u1", 10);
    expect(r.ok).toBe(false);
    expect(r.usedUsd).toBeCloseTo(11, 6);
  });

  it("returns ok=true when used < cap", async () => {
    const mocks = makeAdminMock({
      gteResult: { data: [{ cost_usd: 1 }], error: null },
    });
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => mocks.admin),
    }));
    const { assertUnderQuota } = await import("@/lib/ai/usage");
    const r = await assertUnderQuota("u2", 5);
    expect(r.ok).toBe(true);
    expect(r.usedUsd).toBeCloseTo(1, 6);
  });

  it("returns ok=true with usedUsd=0 when admin is null (env unset case)", async () => {
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: vi.fn(() => null),
    }));
    const { assertUnderQuota } = await import("@/lib/ai/usage");
    const r = await assertUnderQuota("u3", 1);
    expect(r).toEqual({ ok: true, usedUsd: 0 });
  });
});
