import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { ChatStreamSchema } from "@/lib/validation/schemas/chat";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { CHAT_SYSTEM } from "@/lib/ai/prompts";
import { trackStream } from "@/lib/ai/usage";
import { capText } from "@/lib/ai/sanitize";
import { streamTextResponse } from "@/lib/ai/stream-response";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "chat/stream" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, ChatStreamSchema);
  if (!parsed.ok) return parsed.response;

  const { guideTitle, guideContent, messages } = parsed.data;

  const client = getAnthropic();

  const system = [
    { type: "text" as const, text: CHAT_SYSTEM },
    {
      type: "text" as const,
      text: `The student is reading this guide:\n\n# ${capText(guideTitle, 2000)}\n\n${capText(guideContent, 120000)}`,
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const stream = await client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 700,
    system,
    messages,
  });

  trackStream(stream, "chat/stream", { userId: gate.user.id });

  return streamTextResponse(stream, "chat/stream");
}
