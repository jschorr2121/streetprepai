import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { RESUME_CRITIQUE_SYSTEM } from "@/lib/ai/prompts";

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

export async function POST(req: Request) {
  let body: { rawText?: string };
  try {
    body = (await req.json()) as { rawText?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawText = (body.rawText ?? "").trim();
  if (!rawText) {
    return Response.json(
      { error: "Missing `rawText`." },
      { status: 400 },
    );
  }
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
          content: `Here is the raw text of a student's resume (extracted from PDF — formatting may be imperfect):\n\n"""\n${rawText}\n"""\n\nIdentify the sections, extract every bullet, and produce a banker-style critique and rewrite for each one. Call the \`critique_resume\` tool with the result.`,
        },
      ],
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
      { error: "Model did not call the critique_resume tool." },
      { status: 502 },
    );
  }

  // Best-effort defensive normalization — the tool schema enforces shape, but
  // we still want to guarantee non-undefined arrays for the UI.
  const input = toolUse.input as Partial<CritiqueResult>;
  const result: CritiqueResult = {
    sections: (input.sections ?? []).map((s) => ({
      heading: s.heading ?? "Section",
      bullets: (s.bullets ?? []).map((b, i) => ({
        id: b.id ?? `${(s.heading ?? "section").toLowerCase()}-${i}`,
        original: b.original ?? "",
        rewritten: b.rewritten ?? "",
        weakness_flags: b.weakness_flags ?? [],
        critique: b.critique ?? "",
        confidence: b.confidence ?? "medium",
      })),
    })),
    summary: {
      total_bullets: input.summary?.total_bullets ?? 0,
      weak_bullets: input.summary?.weak_bullets ?? 0,
      top_issues: input.summary?.top_issues ?? [],
    },
  };

  return Response.json(result);
}
