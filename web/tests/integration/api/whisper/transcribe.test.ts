/**
 * Integration tests for POST /api/whisper/transcribe — OpenAI Whisper passthrough.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

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

beforeEach(() => {
  getUserMock.mockReset();
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response("mocked openai whisper text", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeForm() {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(100)], { type: "audio/webm" });
  form.append("audio", blob, "voice.webm");
  return form;
}

function makeRequest(form: FormData, ip: string) {
  return new Request("http://localhost/api/whisper/transcribe", {
    method: "POST",
    body: form,
    headers: { "x-forwarded-for": ip },
  });
}

describe("POST /api/whisper/transcribe", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/whisper/transcribe/route");
    const res = await POST(makeRequest(makeForm(), "14.0.0.1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 on missing audio field", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-wh-bad" }));
    const { POST } = await import("@/app/api/whisper/transcribe/route");
    const form = new FormData();
    form.append("nope", "x");
    const res = await POST(makeRequest(form, "14.0.0.2"));
    expect(res.status).toBe(400);
  });

  it("returns transcript on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-wh-ok" }));
    const { POST } = await import("@/app/api/whisper/transcribe/route");
    const res = await POST(makeRequest(makeForm(), "14.0.0.3"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transcript).toBe("mocked openai whisper text");
  });

  it("returns 429 after exhausting per-user whisper budget", async () => {
    const userId = "u-wh-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/whisper/transcribe/route");
    for (let i = 0; i < 6; i++) {
      const res = await POST(makeRequest(makeForm(), `14.1.${i}.1`));
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(makeRequest(makeForm(), "14.1.99.99"));
    expect(denied.status).toBe(429);
  });
});
