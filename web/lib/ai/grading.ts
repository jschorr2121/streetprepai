import { z } from "zod";

import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { capText } from "@/lib/ai/sanitize";
import { logUsage } from "@/lib/ai/usage";
import type { GradedAnswer, RubricKeyPoint } from "@/lib/types";

// Grades one free-text answer against a question's published rubric. The rubric
// (key points + misconceptions + depth calibration) is returned to the user in
// full — the published rubric is a product differentiator, not internal state.

export const GRADING_SYSTEM = `You are a rigorous but encouraging investment banking interview grader for Street Prep AI. You grade a student's answer against a published rubric.

Grading dimensions:
1. KEY POINTS — for each rubric key point, decide if the answer hits it (paraphrases count; exact wording never required). Weight-3 points are essential.
2. MISCONCEPTIONS — flag any listed misconception the answer actually asserts. Do not flag things the student merely omitted.
3. DEPTH CALIBRATION — real interviews reward answering at the right depth and stopping. An answer that dumps every detail unprompted is worse than a crisp answer that leaves depth for follow-ups. Comment on this in one sentence.
4. For CALCULATION questions, verify the arithmetic yourself. A correct method with a small arithmetic slip scores ~60-75; wrong method scores below 50. Numbers within a stated tolerance are fully correct.

Scoring: 0-100. "correct" = this answer would satisfy a real interviewer (typically score >= 70 AND no essential weight-3 key point missed AND no misconception asserted).

Be concrete in comments — quote the student's own words where useful. Never invent rubric items beyond those given. Always call the save_grade tool.`;

const gradeToolSchema = z.object({
  score: z.number().min(0).max(100),
  correct: z.boolean(),
  keyPointResults: z
    .array(
      z.object({
        point: z.string(),
        hit: z.boolean(),
        comment: z.string(),
      }),
    )
    .min(1),
  misconceptionsTriggered: z.array(z.string()),
  depthComment: z.string(),
  overallFeedback: z.string(),
});

export type GradeAnswerInput = {
  userId: string;
  endpoint: string;
  questionPrompt: string;
  questionType: string;
  keyPoints: RubricKeyPoint[];
  misconceptions: string[];
  modelAnswer: string;
  answer: string;
  /** Set when grading a follow-up probe — grades against the follow-up's outline. */
  followupPrompt?: string;
};

export async function gradeAnswer(input: GradeAnswerInput): Promise<GradedAnswer> {
  const client = getAnthropic();

  const userPrompt = [
    input.followupPrompt
      ? `Original question: ${capText(input.questionPrompt, 1200)}\nFollow-up being answered: ${capText(input.followupPrompt, 1200)}`
      : `Question: ${capText(input.questionPrompt, 1500)}`,
    `Question type: ${input.questionType}`,
    `\nRubric key points (weight 3 = essential):`,
    ...input.keyPoints.map((k) => `- [w${k.weight}] ${k.point}`),
    input.misconceptions.length > 0
      ? `\nKnown misconceptions to check for:\n${input.misconceptions.map((m) => `- ${m}`).join("\n")}`
      : null,
    `\nReference model answer (for your calibration, never quoted back):\n${capText(input.modelAnswer, 3000)}`,
    `\nStudent's answer:\n"""\n${capText(input.answer, 8000)}\n"""`,
    `\nGrade it and call save_grade.`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 1500,
    system: [{ type: "text", text: GRADING_SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [
      {
        name: "save_grade",
        description: "Save the structured grade for the student's answer.",
        input_schema: {
          type: "object",
          properties: {
            score: { type: "integer", minimum: 0, maximum: 100 },
            correct: {
              type: "boolean",
              description:
                "Would this answer satisfy a real interviewer? Typically score >= 70, no essential key point missed, no misconception asserted.",
            },
            keyPointResults: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  point: { type: "string", description: "The rubric key point, verbatim." },
                  hit: { type: "boolean" },
                  comment: {
                    type: "string",
                    description: "One short sentence: where the answer covered or missed this.",
                  },
                },
                required: ["point", "hit", "comment"],
              },
            },
            misconceptionsTriggered: {
              type: "array",
              items: { type: "string" },
              description: "Listed misconceptions the answer actually asserted. Empty if none.",
            },
            depthComment: {
              type: "string",
              description:
                "One sentence on depth calibration — did they answer at interview depth and stop?",
            },
            overallFeedback: {
              type: "string",
              description: "2-3 sentences. Concrete, actionable, references their own wording.",
            },
          },
          required: [
            "score",
            "correct",
            "keyPointResults",
            "misconceptionsTriggered",
            "depthComment",
            "overallFeedback",
          ],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_grade" },
    messages: [{ role: "user", content: userPrompt }],
  });

  logUsage({
    model: MODELS.sonnet,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined,
    },
    endpoint: input.endpoint,
    userId: input.userId,
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Grader did not call the save_grade tool.");
  }

  const parsed = gradeToolSchema.parse(toolUse.input);
  return {
    score: Math.round(parsed.score),
    correct: parsed.correct,
    keyPointResults: parsed.keyPointResults,
    misconceptionsTriggered: parsed.misconceptionsTriggered,
    depthComment: parsed.depthComment,
    overallFeedback: parsed.overallFeedback,
    modelAnswer: input.modelAnswer,
  };
}
