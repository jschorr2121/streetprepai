/**
 * Node-environment vitest setup. Registers MSW for HTTP-level mocks of
 * Anthropic, OpenAI, Groq Whisper, and the Supabase REST/Auth endpoints.
 */
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "../msw/server";

// Default test env. Individual tests can override via vi.stubEnv().
process.env.ANTHROPIC_API_KEY ||= "test-anthropic-key";
process.env.OPENAI_API_KEY ||= "test-openai-key";
process.env.GROQ_API_KEY ||= "test-groq-key";
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role";
// `process.env.NODE_ENV` is typed as readonly via @types/node since 20.x.
// Bypass via index signature; behavior is identical at runtime.
if (!process.env.NODE_ENV) (process.env as Record<string, string>).NODE_ENV = "test";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());
