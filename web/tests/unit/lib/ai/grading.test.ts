/**
 * Real-module coverage for lib/ai/grading.ts (`gradeAnswer`).
 *
 * This module is normally `vi.mock`'d away by every caller (question-bank
 * actions, etc.) so its own logic — prompt/rubric formatting, score parsing +
 * rounding, and the "model didn't call the tool" error path — had zero direct
 * coverage. These tests exercise the real module.
 *
 * Convention: mock the Anthropic *client module* (`@/lib/ai/anthropic`)
 * rather than the network layer, matching the pattern already used by
 * `tests/integration/api/interview/score.test.ts` for tool_use-based scoring.
 * `@/lib/ai/usage` (logUsage) is also mocked — it is a fire-and-forget
 * Supabase admin insert, orthogonal to grading logic and already covered by
 * `tests/unit/lib/ai/usage.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GradeAnswerInput } from "@/lib/ai/grading";
import type { RubricKeyPoint } from "@/lib/types";

type AnthropicToolUseContent = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};
type AnthropicTextContent = { type: "text"; text: string };
type AnthropicUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};
type AnthropicResponse = {
  content: (AnthropicToolUseContent | AnthropicTextContent)[];
  usage: AnthropicUsage;
};

type CreateCallArgs = {
  model: string;
  max_tokens: number;
  system: { type: string; text: string; cache_control?: { type: string } }[];
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[];
  tool_choice: { type: string; name: string };
  messages: { role: string; content: string }[];
};

const createMock = vi.fn<(...args: unknown[]) => Promise<AnthropicResponse>>();

vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({ messages: { create: createMock } }),
  MODELS: {
    opus: "claude-opus-4-7",
    sonnet: "claude-sonnet-4-6",
    haiku: "claude-haiku-4-5-20251001",
  },
}));

const logUsageMock = vi.fn();
vi.mock("@/lib/ai/usage", () => ({
  logUsage: (...args: unknown[]) => logUsageMock(...args),
}));

import { MODELS } from "@/lib/ai/anthropic";
import { GRADING_SYSTEM, gradeAnswer } from "@/lib/ai/grading";

beforeEach(() => {
  createMock.mockReset();
  logUsageMock.mockReset();
});

// ─── fixtures ─────────────────────────────────────────────────────────────

const keyPoints: RubricKeyPoint[] = [
  { point: "Projects unlevered FCF for 5-10 years", weight: 3 },
  { point: "Discounts back using WACC", weight: 2 },
];

function baseInput(overrides: Partial<GradeAnswerInput> = {}): GradeAnswerInput {
  return {
    userId: "user-1",
    endpoint: "qbank/grade",
    questionPrompt: "Walk me through a DCF.",
    questionType: "conceptual",
    keyPoints,
    misconceptions: ["Using levered FCF discounted at WACC"],
    modelAnswer: "A DCF projects unlevered free cash flows and discounts them at WACC.",
    answer: "You project cash flows and discount them back at the cost of capital.",
    ...overrides,
  };
}

function validToolInput(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    score: 82,
    correct: true,
    keyPointResults: [
      { point: keyPoints[0]!.point, hit: true, comment: "Covered FCF projection." },
      { point: keyPoints[1]!.point, hit: true, comment: "Mentioned WACC." },
    ],
    misconceptionsTriggered: [],
    depthComment: "Answered at the right depth and stopped.",
    overallFeedback: "Solid, concise answer.",
    ...overrides,
  };
}

function mockToolUseResponse(input: Record<string, unknown>, usage: Partial<AnthropicUsage> = {}) {
  createMock.mockResolvedValueOnce({
    content: [{ type: "tool_use", id: "tu_1", name: "save_grade", input }],
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      ...usage,
    },
  });
}

function getCallArgs(): CreateCallArgs {
  const args = createMock.mock.calls[0]?.[0];
  if (!args) throw new Error("messages.create was never called");
  return args as CreateCallArgs;
}

// ─── GRADING_SYSTEM ───────────────────────────────────────────────────────

describe("GRADING_SYSTEM", () => {
  it("documents all four grading dimensions and the tool-call requirement", () => {
    expect(GRADING_SYSTEM).toMatch(/KEY POINTS/);
    expect(GRADING_SYSTEM).toMatch(/MISCONCEPTIONS/);
    expect(GRADING_SYSTEM).toMatch(/DEPTH CALIBRATION/);
    expect(GRADING_SYSTEM).toMatch(/CALCULATION/);
    expect(GRADING_SYSTEM).toMatch(/Always call the save_grade tool/);
  });
});

// ─── prompt / rubric construction ─────────────────────────────────────────

describe("gradeAnswer — request construction", () => {
  it("sends the sonnet model, tool schema, and cache-controlled system prompt", async () => {
    mockToolUseResponse(validToolInput());
    await gradeAnswer(baseInput());

    const call = getCallArgs();
    expect(call.model).toBe(MODELS.sonnet);
    expect(call.max_tokens).toBe(1500);
    expect(call.system).toHaveLength(1);
    expect(call.system[0]!.text).toBe(GRADING_SYSTEM);
    expect(call.system[0]!.cache_control).toEqual({ type: "ephemeral" });
    expect(call.tool_choice).toEqual({ type: "tool", name: "save_grade" });
    expect(call.tools).toHaveLength(1);
    expect(call.tools[0]!.name).toBe("save_grade");
    expect(call.tools[0]!.input_schema.required).toEqual([
      "score",
      "correct",
      "keyPointResults",
      "misconceptionsTriggered",
      "depthComment",
      "overallFeedback",
    ]);
    expect(call.messages).toEqual([{ role: "user", content: expect.any(String) }]);
  });

  it("formats a plain question with its type and weighted key points", async () => {
    mockToolUseResponse(validToolInput());
    await gradeAnswer(baseInput());

    const prompt = getCallArgs().messages[0]!.content;
    expect(prompt).toContain("Question: Walk me through a DCF.");
    expect(prompt).toContain("Question type: conceptual");
    expect(prompt).toContain("- [w3] Projects unlevered FCF for 5-10 years");
    expect(prompt).toContain("- [w2] Discounts back using WACC");
    expect(prompt).toContain("Grade it and call save_grade.");
  });

  it("formats a follow-up probe as 'original question' + 'follow-up being answered'", async () => {
    mockToolUseResponse(validToolInput());
    await gradeAnswer(baseInput({ followupPrompt: "And how does terminal value factor in?" }));

    const prompt = getCallArgs().messages[0]!.content;
    expect(prompt).toContain("Original question: Walk me through a DCF.");
    expect(prompt).toContain("Follow-up being answered: And how does terminal value factor in?");
    // The plain (non-follow-up) "Question: " prefix should not also appear.
    expect(prompt).not.toContain("Question: Walk me through a DCF.\nQuestion type");
  });

  it("includes a misconceptions section only when misconceptions are given", async () => {
    mockToolUseResponse(validToolInput());
    await gradeAnswer(baseInput({ misconceptions: ["Confusing IRR with MOIC"] }));
    let prompt = getCallArgs().messages[0]!.content;
    expect(prompt).toContain("Known misconceptions to check for:");
    expect(prompt).toContain("- Confusing IRR with MOIC");

    createMock.mockReset();
    mockToolUseResponse(validToolInput());
    await gradeAnswer(baseInput({ misconceptions: [] }));
    prompt = getCallArgs().messages[0]!.content;
    expect(prompt).not.toContain("Known misconceptions to check for:");
  });

  it("caps the question prompt, model answer, and student answer via capText", async () => {
    mockToolUseResponse(validToolInput());
    await gradeAnswer(
      baseInput({
        questionPrompt: "Q".repeat(2000),
        modelAnswer: "M".repeat(4000),
        answer: "A".repeat(9000),
      }),
    );
    const prompt = getCallArgs().messages[0]!.content;
    expect(prompt).toContain(`Question: ${"Q".repeat(1500)}`);
    expect(prompt).not.toContain("Q".repeat(1501));
    expect(prompt).toContain("M".repeat(3000));
    expect(prompt).not.toContain("M".repeat(3001));
    expect(prompt).toContain("A".repeat(8000));
    expect(prompt).not.toContain("A".repeat(8001));
  });

  it("caps the question prompt to 1200 chars (not 1500) when grading a follow-up", async () => {
    mockToolUseResponse(validToolInput());
    await gradeAnswer(
      baseInput({
        questionPrompt: "Q".repeat(1400),
        followupPrompt: "F".repeat(1400),
      }),
    );
    const prompt = getCallArgs().messages[0]!.content;
    expect(prompt).toContain(`Original question: ${"Q".repeat(1200)}`);
    expect(prompt).not.toContain("Q".repeat(1201));
    expect(prompt).toContain(`Follow-up being answered: ${"F".repeat(1200)}`);
    expect(prompt).not.toContain("F".repeat(1201));
  });
});

// ─── score parsing + rounding ──────────────────────────────────────────────

describe("gradeAnswer — score parsing and rounding", () => {
  it("rounds a fractional score down when below the half", async () => {
    mockToolUseResponse(validToolInput({ score: 87.4 }));
    const result = await gradeAnswer(baseInput());
    expect(result.score).toBe(87);
  });

  it("rounds a fractional score up when above the half", async () => {
    mockToolUseResponse(validToolInput({ score: 87.6 }));
    const result = await gradeAnswer(baseInput());
    expect(result.score).toBe(88);
  });

  it("rounds exactly-half scores up (Math.round convention)", async () => {
    mockToolUseResponse(validToolInput({ score: 87.5 }));
    const result = await gradeAnswer(baseInput());
    expect(result.score).toBe(88);
  });

  it("passes through the rest of the rubric untouched and echoes back the input model answer", async () => {
    const toolInput = validToolInput({
      score: 91,
      correct: true,
      misconceptionsTriggered: ["Confusing IRR with MOIC"],
      depthComment: "Stopped at the right depth.",
      overallFeedback: "Great answer.",
    });
    mockToolUseResponse(toolInput);
    const input = baseInput({ modelAnswer: "The canonical model answer text." });
    const result = await gradeAnswer(input);

    expect(result).toEqual({
      score: 91,
      correct: true,
      keyPointResults: toolInput.keyPointResults,
      misconceptionsTriggered: ["Confusing IRR with MOIC"],
      depthComment: "Stopped at the right depth.",
      overallFeedback: "Great answer.",
      modelAnswer: "The canonical model answer text.",
    });
  });

  it("logs usage with the token counts from the response, coalescing missing cache fields to undefined", async () => {
    mockToolUseResponse(
      validToolInput(),
      // Simulate a response with no cache fields at all.
      { cache_creation_input_tokens: undefined, cache_read_input_tokens: undefined },
    );
    await gradeAnswer(baseInput({ userId: "user-42", endpoint: "section-drill/grade" }));

    expect(logUsageMock).toHaveBeenCalledTimes(1);
    expect(logUsageMock).toHaveBeenCalledWith({
      model: MODELS.sonnet,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: undefined,
        cache_read_input_tokens: undefined,
      },
      endpoint: "section-drill/grade",
      userId: "user-42",
    });
  });
});

// ─── error paths ───────────────────────────────────────────────────────────

describe("gradeAnswer — error paths", () => {
  it("throws when the model responds with no tool_use block at all", async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: "text", text: "I refuse to call a tool today." }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    await expect(gradeAnswer(baseInput())).rejects.toThrow(
      "Grader did not call the save_grade tool.",
    );
  });

  it("throws when the model responds with empty content", async () => {
    createMock.mockResolvedValueOnce({
      content: [],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    await expect(gradeAnswer(baseInput())).rejects.toThrow(
      "Grader did not call the save_grade tool.",
    );
  });

  it("rejects when the tool input fails the grade schema (score out of range)", async () => {
    mockToolUseResponse(validToolInput({ score: 150 }));
    await expect(gradeAnswer(baseInput())).rejects.toThrow();
  });

  it("rejects when the tool input is missing a required rubric field", async () => {
    const missingCorrect = validToolInput();
    delete missingCorrect.correct;
    mockToolUseResponse(missingCorrect);
    await expect(gradeAnswer(baseInput())).rejects.toThrow();
  });

  it("rejects when keyPointResults is empty (schema requires at least one)", async () => {
    mockToolUseResponse(validToolInput({ keyPointResults: [] }));
    await expect(gradeAnswer(baseInput())).rejects.toThrow();
  });
});
