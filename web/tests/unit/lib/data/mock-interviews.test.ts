import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const miRow = {
  id: "mi_001",
  user_id: "user-1",
  question_text: "Walk me through a DCF",
  mode: "technical",
  transcript: "I would project FCF...",
  scorecard: { content: { score: 8 } },
  audio_metrics: { wpm: 140 },
  duration_seconds: 90,
  created_at: "2026-04-15T18:00:00.000Z",
};

describe("getMockInterviews", () => {
  it("returns mapped interviews ordered by created_at desc", async () => {
    sb.setRows([miRow]);
    const { getMockInterviews } = await import("@/lib/data/mock-interviews");
    const r = await getMockInterviews("user-mi-1");
    expect(sb.from).toHaveBeenCalledWith("mock_interviews");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-mi-1");
    expect(sb.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(r[0]).toMatchObject({
      id: "mi_001",
      questionText: "Walk me through a DCF",
      mode: "technical",
      transcript: "I would project FCF...",
      durationSeconds: 90,
    });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getMockInterviews } = await import("@/lib/data/mock-interviews");
    expect(await getMockInterviews("user-mi-2")).toEqual([]);
  });

  it("normalizes nullable fields", async () => {
    sb.setRows([
      {
        ...miRow,
        transcript: null,
        scorecard: null,
        audio_metrics: null,
        duration_seconds: null,
      },
    ]);
    const { getMockInterviews } = await import("@/lib/data/mock-interviews");
    const [m] = await getMockInterviews("user-mi-3");
    expect(m.transcript).toBeUndefined();
    expect(m.scorecard).toBeUndefined();
    expect(m.audioMetrics).toBeUndefined();
    expect(m.durationSeconds).toBeUndefined();
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { getMockInterviews } = await import("@/lib/data/mock-interviews");
    await expect(getMockInterviews("u")).rejects.toMatchObject({
      message: "rls",
    });
  });
});

describe("saveMockInterview", () => {
  it("inserts and returns the saved interview", async () => {
    sb.setRows([miRow]);
    const { saveMockInterview } = await import("@/lib/data/mock-interviews");
    const r = await saveMockInterview("user-save-1", {
      questionText: "Walk me through a DCF",
      mode: "technical",
      transcript: "answer",
      scorecard: { content: { score: 8 } } as never,
      audioMetrics: { wpm: 140 } as never,
      durationSeconds: 90,
    });
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-save-1",
        question_text: "Walk me through a DCF",
        mode: "technical",
        duration_seconds: 90,
      }),
    );
    expect(r.id).toBe("mi_001");
  });

  it("nulls out optional missing fields", async () => {
    sb.setRows([miRow]);
    const { saveMockInterview } = await import("@/lib/data/mock-interviews");
    await saveMockInterview("user-save-2", {
      questionText: "q",
      mode: "behavioral",
    });
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        transcript: null,
        scorecard: null,
        audio_metrics: null,
        duration_seconds: null,
      }),
    );
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { saveMockInterview } = await import("@/lib/data/mock-interviews");
    await expect(
      saveMockInterview("u", { questionText: "q", mode: "technical" }),
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("deleteMockInterview", () => {
  it("deletes by id+user_id", async () => {
    sb.setRows([]);
    const { deleteMockInterview } = await import("@/lib/data/mock-interviews");
    await deleteMockInterview("user-del-1", "mi_001");
    expect(sb.delete).toHaveBeenCalled();
    expect(sb.eq).toHaveBeenCalledWith("id", "mi_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-del-1");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { deleteMockInterview } = await import("@/lib/data/mock-interviews");
    await expect(deleteMockInterview("u", "x")).rejects.toMatchObject({
      message: "rls",
    });
  });
});
