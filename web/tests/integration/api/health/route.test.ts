/**
 * Integration tests for GET /api/health — uptime-monitor liveness probe.
 * `getDb` is mocked at the module boundary so these prove the route's own
 * contract (200 on a successful query, 503 on any failure) without a real DB.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({ execute: executeMock }),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

beforeEach(() => {
  vi.resetModules();
  executeMock.mockReset();
});

describe("GET /api/health", () => {
  it("returns 200 { status: 'ok' } when the DB query succeeds", async () => {
    executeMock.mockResolvedValue([{ "?column?": 1 }]);
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("returns 503 { status: 'degraded' } when the DB query throws", async () => {
    executeMock.mockRejectedValue(new Error("connection refused"));
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json).toEqual({ status: "degraded" });
    // No leaked error details.
    expect(JSON.stringify(json)).not.toContain("connection refused");
  });
});
