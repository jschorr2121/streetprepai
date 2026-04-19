import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { OUTREACH_DRAFT_SYSTEM } from "@/lib/ai/prompts";

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

export async function POST(req: Request) {
  let body: {
    contactName?: string;
    contactFirm?: string;
    contactTitle?: string;
    linkedInContext?: string;
    studentGoal?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const contactName = (body.contactName ?? "").trim();
  const contactFirm = (body.contactFirm ?? "").trim();
  const contactTitle = (body.contactTitle ?? "").trim();
  const linkedInContext = (body.linkedInContext ?? "").trim();
  const studentGoal = (body.studentGoal ?? "").trim();

  if (!contactName || !contactFirm) {
    return Response.json(
      { error: "Missing `contactName` or `contactFirm`." },
      { status: 400 },
    );
  }

  const client = getAnthropic();

  const userPrompt = [
    `Recipient:`,
    `- Name: ${contactName}`,
    `- Firm: ${contactFirm}`,
    contactTitle ? `- Title: ${contactTitle}` : null,
    "",
    `LinkedIn / background context the student has on them:`,
    linkedInContext
      ? `"""${linkedInContext}"""`
      : "(none provided — keep specifics minimal)",
    "",
    `Student goal / context for this outreach:`,
    studentGoal
      ? `"""${studentGoal}"""`
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
                description:
                  "2-3 suggested follow-up touches if the banker doesn't respond.",
                items: {
                  type: "object",
                  properties: {
                    when: {
                      type: "string",
                      description:
                        "Relative time, e.g. '+2 weeks', '+6 weeks', '+3 months'.",
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
      { error: "Model did not call the save_outreach_draft tool." },
      { status: 502 },
    );
  }

  const input = toolUse.input as Partial<OutreachDraft>;
  const result: OutreachDraft = {
    subjects: (input.subjects ?? []).slice(0, 2),
    body: input.body ?? "",
    followups: (input.followups ?? []).map((f) => ({
      when: f.when ?? "",
      kind: f.kind ?? "",
    })),
  };

  // Pad subjects defensively to length 2 so the UI radio always has two options.
  while (result.subjects.length < 2) {
    result.subjects.push(`Quick note from a student`);
  }

  return Response.json(result);
}
