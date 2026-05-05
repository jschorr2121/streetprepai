/**
 * Integration tests for POST /api/resume/extract — PDF text extraction.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => getUserMock(),
  getUserOrNull: () => getUserMock().catch(() => null),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    async getText() {
      return { text: "mock extracted resume text", total: 1 };
    }
    async destroy() {}
  },
}));

vi.mock("@/lib/logging/request-context", () => ({
  getRequestLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({ info: vi.fn() }),
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
});

function makePdfBlob(): ArrayBuffer {
  // %PDF- magic + filler
  const header = new TextEncoder().encode("%PDF-1.4\n");
  const filler = new Uint8Array(64);
  const out = new Uint8Array(header.length + filler.length);
  out.set(header, 0);
  out.set(filler, header.length);
  return out.buffer;
}

function makeRequest(body: ArrayBuffer | FormData, ip: string, contentType?: string) {
  const headers: Record<string, string> = { "x-forwarded-for": ip };
  if (contentType) headers["Content-Type"] = contentType;
  return new Request("http://localhost/api/resume/extract", {
    method: "POST",
    body: body instanceof FormData ? body : Buffer.from(body),
    headers,
  });
}

describe("POST /api/resume/extract", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/resume/extract/route");
    const res = await POST(makeRequest(makePdfBlob(), "18.0.0.1", "application/pdf"));
    expect(res.status).toBe(401);
  });

  it("returns 415 on unsupported content type", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-rx-bad" }));
    const { POST } = await import("@/app/api/resume/extract/route");
    const res = await POST(
      new Request("http://localhost/api/resume/extract", {
        method: "POST",
        body: "plain text",
        headers: { "x-forwarded-for": "18.0.0.2", "Content-Type": "text/plain" },
      }),
    );
    expect(res.status).toBe(415);
  });

  it("returns 400 on multipart with missing file", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-rx-bad2" }));
    const { POST } = await import("@/app/api/resume/extract/route");
    const form = new FormData();
    form.append("nope", "x");
    const res = await POST(makeRequest(form, "18.0.0.4"));
    expect(res.status).toBe(400);
  });

  it("returns extracted text on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-rx-ok" }));
    const { POST } = await import("@/app/api/resume/extract/route");
    const res = await POST(makeRequest(makePdfBlob(), "18.0.0.3", "application/pdf"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.raw_text).toContain("mock extracted resume text");
    expect(json.pages).toBe(1);
  });

  it("returns 429 after exhausting per-user cheap budget", async () => {
    const userId = "u-rx-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/resume/extract/route");
    // cheap tier → 30/min/user, 90/min/ip. Vary IP to avoid IP cap.
    for (let i = 0; i < 30; i++) {
      const res = await POST(makeRequest(makePdfBlob(), `18.1.${i}.1`, "application/pdf"));
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(makeRequest(makePdfBlob(), "18.1.99.99", "application/pdf"));
    expect(denied.status).toBe(429);
  });
});
