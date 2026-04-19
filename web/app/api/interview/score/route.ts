import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { INTERVIEW_SCORE_SYSTEM } from "@/lib/ai/prompts";
import type { AudioMetrics } from "@/lib/audio/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

export interface RubricItem {
  dimension: string;
  score: number;
  comment: string;
}

export interface Scorecard {
  content_score: number;
  delivery_score: number;
  rubric: RubricItem[];
  strengths: string[];
  improvements: string[];
  follow_up_questions: string[];
  model_answer: string;
}

export interface ScoreRequestBody {
  question: string;
  mode: string;
  transcript: string;
  audioMetrics: AudioMetrics;
  idealAnswerOutline: string;
}

const MAX_TRANSCRIPT_CHARS = 10_000;

export async function POST(req: Request) {
  let body: Partial<ScoreRequestBody>;
  try {
    body = (await req.json()) as Partial<ScoreRequestBody>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  const mode = (body.mode ?? "").trim();
  const transcript = (body.transcript ?? "").trim();
  const idealAnswerOutline = (body.idealAnswerOutline ?? "").trim();
  const audioMetrics = body.audioMetrics;

  if (!question || !transcript || !audioMetrics || !mode) {
    return Response.json(
      {
        error:
          "Missing required fields: question, mode, transcript, audioMetrics.",
      },
      { status: 400 },
    );
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return Response.json(
      {
        error: `Transcript is ${transcript.length} chars; max is ${MAX_TRANSCRIPT_CHARS}.`,
      },
      { status: 413 },
    );
  }

  const fillersPerMin =
    audioMetrics.totalSpeakingMs > 0
      ? Number(
          (
            (audioMetrics.fillerCount /
              (audioMetrics.totalSpeakingMs / 60_000)) || 0
          ).toFixed(2),
        )
      : 0;

  const userPrompt = [
    `Interview mode: ${mode}`,
    `Question: ${question}`,
    idealAnswerOutline ? `Ideal-answer outline (for your reference, not to be parroted back): ${idealAnswerOutline}` : null,
    `\nStudent's spoken answer (Whisper transcript):\n"""\n${transcript}\n"""`,
    `\nDelivery metrics:`,
    `- words-per-minute: ${audioMetrics.wpm}`,
    `- filler tokens: ${audioMetrics.fillerCount} (${fillersPerMin}/min)`,
    `- pause ratio (>400ms gaps): ${audioMetrics.pauseRatio}`,
    `- longest pause: ${audioMetrics.longestPauseMs}ms`,
    `- total speaking time: ${(audioMetrics.totalSpeakingMs / 1000).toFixed(1)}s`,
    `\nScore this answer and call the \`save_scorecard\` tool with the full structured output.`,
  ]
    .filter(Boolean)
    .join("\n");

  const client = getAnthropic();

  let response;
  try {
    response = await client.messages.create({
      model: MODELS.opus,
      max_tokens: 3000,
      system: [
        {
          type: "text",
          text: INTERVIEW_SCORE_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "save_scorecard",
          description:
            "Save the structured scorecard for the student's mock-interview answer.",
          input_schema: {
            type: "object",
            properties: {
              content_score: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description:
                  "0-100 score for the substance of the answer (accuracy, structure, completeness).",
              },
              delivery_score: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description:
                  "0-100 score for spoken delivery (tempo, fillers, confidence, pauses).",
              },
              rubric: {
                type: "array",
                description:
                  "3-5 mode-aware rubric dimensions, each with a 0-100 score and a one-sentence actionable comment.",
                items: {
                  type: "object",
                  properties: {
                    dimension: {
                      type: "string",
                      description:
                        "Name of the rubric dimension (e.g. 'Accuracy', 'STAR shape', 'Specificity').",
                    },
                    score: { type: "integer", minimum: 0, maximum: 100 },
                    comment: {
                      type: "string",
                      description:
                        "One short sentence the student can act on. Concrete, not vague.",
                    },
                  },
                  required: ["dimension", "score", "comment"],
                },
                minItems: 3,
                maxItems: 5,
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description:
                  "2-3 specific strengths. Quote the student verbatim where it helps.",
                minItems: 2,
                maxItems: 3,
              },
              improvements: {
                type: "array",
                items: { type: "string" },
                description:
                  "2-3 highest-leverage, concrete fixes for next attempt.",
                minItems: 2,
                maxItems: 3,
              },
              follow_up_questions: {
                type: "array",
                items: { type: "string" },
                description:
                  "Exactly 3 follow-up questions a real interviewer would ask next based on this answer.",
                minItems: 3,
                maxItems: 3,
              },
              model_answer: {
                type: "string",
                description:
                  "150-250 words. Banker-speak. How a strong second-year analyst would actually answer this question out loud.",
              },
            },
            required: [
              "content_score",
              "delivery_score",
              "rubric",
              "strengths",
              "improvements",
              "follow_up_questions",
              "model_answer",
            ],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_scorecard" },
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (err) {
    return Response.json(
      {
        error: `Claude call failed: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      },
      { status: 502 },
    );
  }

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json(
      { error: "Model did not call the save_scorecard tool." },
      { status: 502 },
    );
  }

  const input = toolUse.input as Partial<Scorecard>;
  const result: Scorecard = {
    content_score: clampScore(input.content_score),
    delivery_score: clampScore(input.delivery_score),
    rubric: (input.rubric ?? []).map((r) => ({
      dimension: r.dimension ?? "Dimension",
      score: clampScore(r.score),
      comment: r.comment ?? "",
    })),
    strengths: input.strengths ?? [],
    improvements: input.improvements ?? [],
    follow_up_questions: input.follow_up_questions ?? [],
    model_answer: input.model_answer ?? "",
  };

  return Response.json(result);
}

function clampScore(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}
