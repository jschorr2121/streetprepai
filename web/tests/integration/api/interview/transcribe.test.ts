/**
 * Integration tests for POST /api/interview/transcribe — Groq Whisper passthrough.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
vi.stubEnv("GROQ_API_KEY", "test-groq-key");
vi.stubEnv("NODE_ENV", "test");

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => getUserMock(),
  getUserOrNull: () => getUserMock().catch(() => null),
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

const logUsageMock = vi.fn();
vi.mock("@/lib/ai/usage", () => ({
  logUsage: (payload: unknown) => logUsageMock(payload),
  assertUnderQuota: vi.fn().mockResolvedValue({ ok: true, usedUsd: 0 }),
  getUserUsageThisMonth: vi.fn().mockResolvedValue({ totalUsd: 0, rowCount: 0 }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  logUsageMock.mockReset();
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          text: "mocked transcript",
          words: [
            { word: "mocked", start: 0, end: 0.5 },
            { word: "transcript", start: 0.5, end: 1.0 },
          ],
          duration: 4.2,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeAudioForm() {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(100)], { type: "audio/webm" });
  form.append("file", blob, "audio.webm");
  return form;
}

function makeRequest(form: FormData, ip: string) {
  return new Request("http://localhost/api/interview/transcribe", {
    method: "POST",
    body: form,
    headers: { "x-forwarded-for": ip },
  });
}

describe("POST /api/interview/transcribe", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/interview/transcribe/route");
    const res = await POST(makeRequest(makeAudioForm(), "13.0.0.1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 on missing file field", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-tr-bad" }));
    const { POST } = await import("@/app/api/interview/transcribe/route");
    const form = new FormData();
    form.append("notfile", "x");
    const res = await POST(makeRequest(form, "13.0.0.2"));
    expect(res.status).toBe(400);
  });

  it("returns transcript JSON on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-tr-ok" }));
    const { POST } = await import("@/app/api/interview/transcribe/route");
    const res = await POST(makeRequest(makeAudioForm(), "13.0.0.3"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transcript).toBe("mocked transcript");
    expect(Array.isArray(json.words)).toBe(true);
  });

  it("logs exactly one whisper-1 usage row with duration-based surcharge", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-tr-usage" }));
    const { POST } = await import("@/app/api/interview/transcribe/route");
    const res = await POST(makeRequest(makeAudioForm(), "13.2.0.1"));
    expect(res.status).toBe(200);
    expect(logUsageMock).toHaveBeenCalledTimes(1);
    const payload = logUsageMock.mock.calls[0]![0] as {
      model: string;
      usage: unknown;
      endpoint: string;
      userId: string;
      surchargeUsd: number;
    };
    expect(payload.model).toBe("whisper-1");
    expect(payload.usage).toEqual({ input_tokens: 0, output_tokens: 0 });
    expect(payload.endpoint).toBe("interview/transcribe");
    expect(payload.userId).toBe("u-tr-usage");
    expect(payload.surchargeUsd).toBeCloseTo((4.2 / 60) * 0.006, 10);
  });

  it("still logs a $0 usage row when Whisper omits `duration`", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-tr-noduration" }));
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ text: "no duration field", words: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const { POST } = await import("@/app/api/interview/transcribe/route");
    const res = await POST(makeRequest(makeAudioForm(), "13.2.1.1"));
    expect(res.status).toBe(200);
    expect(logUsageMock).toHaveBeenCalledTimes(1);
    const payload = logUsageMock.mock.calls[0]![0] as { model: string; surchargeUsd: number };
    expect(payload.model).toBe("whisper-1");
    expect(payload.surchargeUsd).toBe(0);
  });

  it("returns 429 after exhausting per-user whisper budget", async () => {
    const userId = "u-tr-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/interview/transcribe/route");
    // whisper tier → 6/min/user, 12/min/ip. Vary IP to avoid IP cap.
    for (let i = 0; i < 6; i++) {
      const res = await POST(makeRequest(makeAudioForm(), `13.1.${i}.1`));
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(makeRequest(makeAudioForm(), "13.1.99.99"));
    expect(denied.status).toBe(429);
  });
});
