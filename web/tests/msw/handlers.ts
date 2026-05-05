import { http, HttpResponse } from "msw";

/**
 * Default handlers — tests can extend or override per-test via
 *   server.use(http.post("...", () => ...))
 *
 * Style:
 * - Anthropic: returns a deterministic streamed text response.
 * - OpenAI: chat completion + transcription.
 * - Groq Whisper: same shape as OpenAI Whisper.
 * - Supabase REST/Auth: NOT mocked here by default — most tests should mock
 *   `lib/supabase/server.ts` and `lib/supabase/admin.ts` at the module level
 *   via `vi.mock(...)` rather than at the network layer. MSW kicks in only for
 *   true 3rd-party APIs.
 */
export const handlers = [
  // ─── Anthropic Messages (streaming) ────────────────────────────────────────
  http.post("https://api.anthropic.com/v1/messages", async () => {
    // Return a non-streaming response by default. Tests that need the
    // streaming wire format should override and produce SSE manually.
    return HttpResponse.json({
      id: "msg_test_001",
      type: "message",
      role: "assistant",
      model: "claude-sonnet-4-6",
      content: [{ type: "text", text: "[mock anthropic response]" }],
      stop_reason: "end_turn",
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    });
  }),

  // ─── OpenAI Chat Completions ───────────────────────────────────────────────
  http.post("https://api.openai.com/v1/chat/completions", async () =>
    HttpResponse.json({
      id: "chatcmpl_test_001",
      object: "chat.completion",
      created: 1_700_000_000,
      model: "gpt-5.4-nano",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "[mock openai response]" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }),
  ),

  // ─── OpenAI Whisper transcription ──────────────────────────────────────────
  http.post("https://api.openai.com/v1/audio/transcriptions", async () =>
    HttpResponse.json({ text: "[mock openai whisper transcript]" }),
  ),

  // ─── OpenAI Embeddings (used by Wave 5 pgvector) ───────────────────────────
  http.post("https://api.openai.com/v1/embeddings", async () =>
    HttpResponse.json({
      object: "list",
      data: [
        {
          object: "embedding",
          index: 0,
          embedding: new Array(1536).fill(0).map((_, i) => (i % 2 ? 0.01 : -0.01)),
        },
      ],
      model: "text-embedding-3-small",
      usage: { prompt_tokens: 8, total_tokens: 8 },
    }),
  ),

  // ─── Groq Whisper transcription ────────────────────────────────────────────
  http.post("https://api.groq.com/openai/v1/audio/transcriptions", async () =>
    HttpResponse.json({ text: "[mock groq whisper transcript]" }),
  ),
];
