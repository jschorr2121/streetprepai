import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";
import { parseJson } from "@/lib/validation/parse";
import {
  ResumeCritiqueOutputSchema,
  ResumeCritiqueSchema,
} from "@/lib/validation/schemas/resume";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { RESUME_CRITIQUE_SYSTEM } from "@/lib/ai/prompts";
import { logUsage } from "@/lib/ai/usage";
import { wrapUserText } from "@/lib/ai/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME_CHARS = 20_000;

export type WeaknessFlag =
  | "vague"
  | "no_metric"
  | "passive_voice"
  | "weak_verb"
  | "missing_scope"
  | "buzzword_only";

export type Confidence = "high" | "medium" | "low";

export interface CritiquedBullet {
  id: string;
  original: string;
  rewritten: string;
  weakness_flags: WeaknessFlag[];
  critique: string;
  confidence: Confidence;
}

export interface CritiquedSection {
  heading: string;
  bullets: CritiquedBullet[];
}

export interface CritiqueSummary {
  total_bullets: number;
  weak_bullets: number;
  top_issues: string[];
}

export interface CritiqueResult {
  sections: CritiquedSection[];
  summary: CritiqueSummary;
}

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "resume/critique" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, ResumeCritiqueSchema);
  if (!parsed.ok) return parsed.response;

  const { rawText } = parsed.data;

  if (rawText.length > MAX_RESUME_CHARS) {
    return Response.json(
      {
        error: `Resume text is ${rawText.length} chars; max is ${MAX_RESUME_CHARS}.`,
      },
      { status: 413 },
    );
  }

  const client = getAnthropic();

  let response;
  try {
    response = await client.messages.create({
      model: MODELS.opus,
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: RESUME_CRITIQUE_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "critique_resume",
          description:
            "Save the structured per-bullet critique and rewrites for the student's resume.",
          input_schema: {
            type: "object",
            properties: {
              sections: {
                type: "array",
                description:
                  "Resume sections, in the order they appeared on the resume.",
                items: {
                  type: "object",
                  properties: {
                    heading: {
                      type: "string",
                      description:
                        "Section heading exactly as it appeared on the resume (e.g. 'Experience', 'Leadership', 'Projects').",
                    },
                    bullets: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            description:
                              "Stable ID, format: <section-slug>-<index> (e.g. 'experience-1').",
                          },
                          original: {
                            type: "string",
                            description:
                              "Bullet text exactly as written by the student (light whitespace cleanup OK; do not rephrase).",
                          },
                          rewritten: {
                            type: "string",
                            description:
                              "Banker-style rewrite faithful to the original facts. For low-confidence bullets, a 'Needs more detail: …' guidance message instead.",
                          },
                          weakness_flags: {
                            type: "array",
                            items: {
                              type: "string",
                              enum: [
                                "vague",
                                "no_metric",
                                "passive_voice",
                                "weak_verb",
                                "missing_scope",
                                "buzzword_only",
                              ],
                            },
                            description:
                              "Zero or more weakness tags applicable to the original bullet.",
                          },
                          critique: {
                            type: "string",
                            description:
                              "One short sentence (≤ 25 words) explaining why the original is weak and what the rewrite changed.",
                          },
                          confidence: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                            description:
                              "How faithful the rewrite is to the original facts. 'low' means the original was too vague to rewrite without inventing claims.",
                          },
                        },
                        required: [
                          "id",
                          "original",
                          "rewritten",
                          "weakness_flags",
                          "critique",
                          "confidence",
                        ],
                      },
                    },
                  },
                  required: ["heading", "bullets"],
                },
              },
              summary: {
                type: "object",
                properties: {
                  total_bullets: { type: "integer", minimum: 0 },
                  weak_bullets: {
                    type: "integer",
                    minimum: 0,
                    description:
                      "Count of bullets with at least one weakness flag.",
                  },
                  top_issues: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "2-4 short human-readable phrases naming the most common weaknesses across the resume.",
                  },
                },
                required: ["total_bullets", "weak_bullets", "top_issues"],
              },
            },
            required: ["sections", "summary"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "critique_resume" },
      messages: [
        {
          role: "user",
          content: `Here is the raw text of a student's resume (extracted from PDF — formatting may be imperfect):\n\n${wrapUserText(rawText, "resume", { maxChars: 25000 })}\n\nIdentify the sections, extract every bullet, and produce a banker-style critique and rewrite for each one. Call the \`critique_resume\` tool with the result.`,
        },
      ],
    });
  } catch (err) {
    return Response.json(
      {
        error: clientSafeError("resume/critique", err, "The AI request failed. Please try again."),
      },
      { status: 502 },
    );
  }

  logUsage({
    model: MODELS.opus,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined,
    },
    endpoint: "resume/critique",
    userId: gate.user.id,
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json(
      { error: "Model did not call the critique_resume tool." },
      { status: 502 },
    );
  }

  // Tool output is untrusted model output — validate before returning.
  const critique = ResumeCritiqueOutputSchema.safeParse(toolUse.input);
  if (!critique.success) {
    console.error("[resume/critique] invalid tool output:", critique.error.issues);
    return Response.json(
      { error: "The AI returned an invalid critique. Please try again." },
      { status: 502 },
    );
  }

  return Response.json(critique.data);
}
