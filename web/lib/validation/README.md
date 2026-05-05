# Request validation

All API routes MUST validate request bodies with Zod. No `as` casts.

## Pattern

```ts
// app/api/<family>/<route>/route.ts
import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { MyRouteSchema } from "@/lib/validation/schemas/<family>";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = await requireUser(req, { tier: "expensive", route: "<family>/<route>" });
  if (!gate.ok) return gate.response;

  const body = await parseJson(req, MyRouteSchema);
  if (!body.ok) return body.response;

  // body.data is now the validated, typed input.
  // gate.user.id is the authenticated user.
  // ...
}
```

## Tier guide

- `cheap` — CRUD, Haiku-class drafts, single-shot writes.
- `expensive` — Sonnet/Opus calls, anything streaming Claude.
- `whisper` — audio transcription endpoints.
- `public` — only when an unauthenticated read genuinely needs to be exposed.

## Sanitizing user text in prompts

Any free-text user input that lands in an AI prompt MUST be wrapped:

```ts
import { wrapUserText, capText } from "@/lib/ai/sanitize";

const userPrompt = [
  `Firm: ${capText(body.firm, 120)}`,
  body.bio ? `Bio:\n${wrapUserText(body.bio, "bio", { maxChars: 8000 })}` : "",
].join("\n");
```

The wrapper strips any literal `<bio>` / `</bio>` tags from inside the text so the user cannot close the delimiter and inject instructions.
