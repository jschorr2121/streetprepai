# API Route Runtime Audit

Snapshot of `app/api/**/route.ts` runtimes and their edge-eligibility. Today every
route is `runtime = "nodejs"`. This table flags candidates that _could_ migrate
to the Edge runtime if we ever want to (lower latency, no cold starts), but the
migration is **not yet performed** — only documented.

A route is **edge-eligible** only if it avoids:

- Node-only deps (`pdf-parse`, `pdfjs-dist`, native bindings, `node:fs`)
- `@supabase/ssr` server client (cookie + ssr-package edge support has been
  historically flaky; safer on Node)
- Any other Node API (`process.cwd`, `node:crypto.createCipher`, etc.)

| Route                                        | Edge-eligible? | Reason                                                                                                                       |
| -------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `_debug/throw`                               | no             | `requireUser` -> Supabase ssr cookies                                                                                        |
| `applied-jobs/route.ts` (GET, POST)          | no             | Supabase ssr (`@/lib/data/applied-jobs` -> `createClient`)                                                                   |
| `applied-jobs/[id]/route.ts` (PATCH, DELETE) | no             | Supabase ssr                                                                                                                 |
| `chat/general/route.ts`                      | no             | Reads profile via Supabase + executes assistant tools that hit Supabase                                                      |
| `chat/stream/route.ts`                       | yes\*          | Pure Anthropic streaming; only Supabase touch is `requireUser` for auth — would need an Edge-safe auth shim before migrating |
| `firms/[slug]/prep/route.ts`                 | no             | `getFirmBySlug` reads Supabase                                                                                               |
| `interview/save/route.ts`                    | no             | Writes via Supabase ssr                                                                                                      |
| `interview/score/route.ts`                   | yes\*          | Anthropic-only; same `requireUser` caveat as `chat/stream`                                                                   |
| `interview/transcribe/route.ts`              | yes\*          | Pass-through to Groq Whisper via `fetch` + FormData; `requireUser` caveat                                                    |
| `lens/beginner/route.ts`                     | yes\*          | Anthropic-only; `requireUser` caveat                                                                                         |
| `lens/explain/route.ts`                      | yes\*          | Anthropic-only; `requireUser` caveat                                                                                         |
| `profile/extract-resume/route.ts`            | yes\*          | OpenAI text call; `requireUser` caveat                                                                                       |
| `profile/save/route.ts`                      | no             | Supabase ssr write                                                                                                           |
| `relationships/draft-followup/route.ts`      | yes\*          | Anthropic-only; `requireUser` caveat                                                                                         |
| `relationships/draft-outreach/route.ts`      | yes\*          | Anthropic-only; `requireUser` caveat                                                                                         |
| `relationships/prep-person/route.ts`         | yes\*          | Anthropic streaming; `requireUser` caveat                                                                                    |
| `relationships/structure-chat/route.ts`      | yes\*          | Anthropic tool-use; `requireUser` caveat                                                                                     |
| `resume/critique/route.ts`                   | yes\*          | Anthropic-only; `requireUser` caveat                                                                                         |
| `resume/extract/route.ts`                    | **no**         | Imports `pdf-parse` — Node-only, must stay nodejs                                                                            |
| `whisper/transcribe/route.ts`                | yes\*          | Pass-through to OpenAI Whisper via `fetch` + FormData; `requireUser` caveat                                                  |

\* Conditional on building an Edge-compatible `requireUser` (or moving auth to
middleware so route handlers don't need to call into `@supabase/ssr` directly).

## Recommendation

Hold all routes on `nodejs` until:

1. We have a measured latency win to chase, AND
2. We've validated `@supabase/ssr` works on Edge in our Next 15.3.x version
   (or moved auth gating into middleware), AND
3. We've smoke-tested streaming responses on Edge — historically Anthropic
   streaming has been Edge-friendly, but the response wrapper details matter.

Until then, this audit is just a map of where the easy wins are when we want
them.
