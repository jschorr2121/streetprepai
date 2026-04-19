import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { STRUCTURE_CHAT_SYSTEM } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    contactName: string;
    contactFirm: string;
    contactTitle: string;
    rawNotes: string;
  };

  const client = getAnthropic();

  const response = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 1500,
    system: STRUCTURE_CHAT_SYSTEM,
    tools: [
      {
        name: "save_chat_summary",
        description: "Save the structured summary of the coffee chat.",
        input_schema: {
          type: "object",
          properties: {
            topics: {
              type: "array",
              items: { type: "string" },
              description: "Main topics covered in the conversation.",
            },
            adviceGiven: {
              type: "array",
              items: { type: "string" },
              description:
                "Specific pieces of advice the banker gave the student.",
            },
            commitments: {
              type: "array",
              items: { type: "string" },
              description:
                "Things the banker said they would do (intros, resources, follow-ups).",
            },
            personalDetails: {
              type: "array",
              items: { type: "string" },
              description:
                "Personal details about the banker worth remembering next time (family, hobbies, hometown, interests).",
            },
            followUps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  dueBy: {
                    type: "string",
                    description: "ISO date if a due date is implied.",
                  },
                },
                required: ["description"],
              },
              description:
                "Action items the student should complete after this chat.",
            },
          },
          required: [
            "topics",
            "adviceGiven",
            "commitments",
            "personalDetails",
            "followUps",
          ],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_chat_summary" },
    messages: [
      {
        role: "user",
        content: `Contact: ${body.contactName}, ${body.contactTitle} at ${body.contactFirm}.\n\nRaw notes the student just jotted down:\n"""${body.rawNotes}"""\n\nStructure these into a memory record.`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json({ error: "no tool call" }, { status: 500 });
  }
  return Response.json(toolUse.input);
}
