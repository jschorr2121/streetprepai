import type { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages";

import { clientSafeError } from "@/lib/security/client-error";
import { encodeStreamError, stripStreamSentinel } from "@/lib/streaming/stream-error";

// Bridges an Anthropic message stream to a plain-text HTTP response. Mid-stream
// failures are framed with the in-band error sentinel that streaming clients
// split on (see lib/streaming/stream-error.ts).
export function streamTextResponse(
  stream: AsyncIterable<MessageStreamEvent>,
  route: string,
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(stripStreamSentinel(event.delta.text)));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            encodeStreamError(
              clientSafeError(route, err, "The response failed. Please try again."),
            ),
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
