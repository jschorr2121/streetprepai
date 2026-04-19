import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { PREP_PERSON_SYSTEM } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name: string;
    firm: string;
    title: string;
    group?: string;
    school?: string;
    bio?: string;
    studentContext?: string;
  };

  const client = getAnthropic();

  const userPrompt = [
    `Student is preparing to meet:`,
    `- Name: ${body.name}`,
    `- Firm: ${body.firm}`,
    `- Title: ${body.title}`,
    body.group ? `- Group: ${body.group}` : null,
    body.school ? `- School: ${body.school}` : null,
    "",
    body.bio ? `LinkedIn / bio text they shared:\n"""${body.bio}"""` : null,
    body.studentContext
      ? `Student context:\n"""${body.studentContext}"""`
      : `Student context: Undergraduate targeting IB Summer Analyst roles.`,
    "",
    `Produce the prep sheet.`,
  ]
    .filter(Boolean)
    .join("\n");

  const stream = await client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 1200,
    system: [
      {
        type: "text",
        text: PREP_PERSON_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n[Error: ${err instanceof Error ? err.message : "stream failed"}]`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
