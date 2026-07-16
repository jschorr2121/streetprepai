import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";
import { parseJson } from "@/lib/validation/parse";
import {
  DraftOutreachSchema,
  OutreachDraftOutputSchema,
} from "@/lib/validation/schemas/relationships";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { OUTREACH_DRAFT_SYSTEM } from "@/lib/ai/prompts";
import { logUsage } from "@/lib/ai/usage";
import { wrapUserText, capText } from "@/lib/ai/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

export interface OutreachFollowup {
  when: string;
  kind: string;
}

export interface OutreachDraft {
  subjects: string[];
  body: string;
  followups: OutreachFollowup[];
}

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "relationships/draft-outreach" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, DraftOutreachSchema);
  if (!parsed.ok) return parsed.response;

  const { contactName, contactFirm, contactTitle, linkedInContext, studentGoal } = parsed.data;

  const client = getAnthropic();

  const userPrompt = [
    `Recipient:`,
    `- Name: ${capText(contactName, 200)}`,
    `- Firm: ${capText(contactFirm, 200)}`,
    contactTitle ? `- Title: ${capText(contactTitle, 200)}` : null,
    "",
    `LinkedIn / background context the student has on them:`,
    linkedInContext
      ? wrapUserText(linkedInContext, "linkedin_context", { maxChars: 12000 })
      : "(none provided — keep specifics minimal)",
    "",
    `Student goal / context for this outreach:`,
    studentGoal
      ? wrapUserText(studentGoal, "student_goal", { maxChars: 4000 })
      : "(none provided — assume an undergrad targeting IB SA roles seeking a 15-min coffee chat)",
    "",
    `Draft the cold outreach. Call the save_outreach_draft tool.`,
  ]
    .filter(Boolean)
    .join("\n");

  let response;
  try {
    response = await client.messages.create({
      model: MODELS.sonnet,
      max_tokens: 1200,
      system: [
        {
          type: "text",
          text: OUTREACH_DRAFT_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "save_outreach_draft",
          description:
            "Save the structured cold outreach email draft (two subject options, body, suggested followup cadence).",
          input_schema: {
            type: "object",
            properties: {
              subjects: {
                type: "array",
                description:
                  "Exactly two subject line options. Both under 60 chars. Order: [more direct, warmer/curious].",
                items: { type: "string" },
                minItems: 2,
                maxItems: 2,
              },
              body: {
                type: "string",
                description:
                  "Plain-text email body. Three short paragraphs max. ≤ 120 words. No subject line, no signature block.",
              },
              followups: {
                type: "array",
                description: "2-3 suggested follow-up touches if the banker doesn't respond.",
                items: {
                  type: "object",
                  properties: {
                    when: {
                      type: "string",
                      description: "Relative time, e.g. '+2 weeks', '+6 weeks', '+3 months'.",
                    },
                    kind: {
                      type: "string",
                      description:
                        "Short label for the angle, e.g. 'soft check-in', 'deal commentary', 'industry article share'.",
                    },
                  },
                  required: ["when", "kind"],
                },
                minItems: 2,
                maxItems: 3,
              },
            },
            required: ["subjects", "body", "followups"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_outreach_draft" },
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (err) {
    return Response.json(
      {
        error: clientSafeError(
          "relationships/draft-outreach",
          err,
          "The AI request failed. Please try again.",
        ),
      },
      { status: 502 },
    );
  }

  logUsage({
    model: MODELS.sonnet,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined,
    },
    endpoint: "relationships/draft-outreach",
    userId: gate.user.id,
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json(
      { error: "Model did not call the save_outreach_draft tool." },
      { status: 502 },
    );
  }

  // Tool output is untrusted model output — validate before normalizing.
  const parsedOutput = OutreachDraftOutputSchema.safeParse(toolUse.input);
  if (!parsedOutput.success) {
    console.error("[relationships/draft-outreach] invalid tool output:", parsedOutput.error.issues);
    return Response.json(
      { error: "The AI returned an invalid draft. Please try again." },
      { status: 502 },
    );
  }

  const input = parsedOutput.data;
  const result: OutreachDraft = {
    subjects: (input.subjects ?? []).slice(0, 2),
    body: input.body ?? "",
    followups: (input.followups ?? []).map((f) => ({
      when: f.when ?? "",
      kind: f.kind ?? "",
    })),
  };

  while (result.subjects.length < 2) {
    result.subjects.push(`Quick note from a student`);
  }

  return Response.json(result);
}
