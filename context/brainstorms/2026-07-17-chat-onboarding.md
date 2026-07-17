# Brainstorm: onboarding as an AI-chat quiz (todo.md item, 2026-07-17)

Jake's todo: "add onboarding flow thats kinda like a quiz — what role you want, what
you have done so far — ai chat kinda flow that fills in for you." Current state:
`app/(app)/onboarding/onboarding-form.tsx` is a plain multi-field form. Nothing AI.

## Why now is cheap

Unit 9 built every ingredient this needs: AI SDK v7 is installed, `useChat` +
`DefaultChatTransport` patterns exist (`tools/chatbot/_components/chat.tsx`), the
route recipe (requireUser expensive-tier → streamText → Zod → logUsage) is proven,
and profile extraction already exists (`profile/extract-resume` Zod-validates model
JSON into profile fields). A chat-onboarding is mostly recombination.

## Sketch (1 evening of agent work once approved)

- Keep the form as the source of truth and the fallback. Add a "Chat instead" mode:
  a 4–6 turn guided conversation (target role → school/year → what you've done →
  advanced-track probe) driven by a small system prompt; a forced tool call
  `save_onboarding_profile` (Zod: same shape as the existing onboarding schema)
  fires when enough is known and PRE-FILLS the form for review — user confirms and
  submits the normal path. No silent writes; the existing form action stays the only
  writer.
- One new route `/api/onboarding/chat` (expensive tier, ~4 turns × haiku is
  pennies — use MODELS.haiku, not sonnet).
- Optional resume paste inside the chat reuses the extract-resume path wholesale.
- Skip: voice, file upload, multi-session resume. Onboarding chats need no
  persistence (they end in a form submit) — no chat_threads rows.

## Open product calls for Jake (blockers)

1. Want this at all? The current form works and is short; chat adds delight but
   also latency and a small per-signup AI cost.
2. Default mode: chat-first with "skip to form", or form-first with "try chat"?
   (Recommend form-first + prominent "let AI fill this in" — zero regression risk.)
3. Model/tone: haiku, playful-but-brief, per SYSTEM_BASE.

If approved → promote to `.scratch/onboarding-chat/` PRD + issues (small unit, 2
issues: route+prompt+tool, form integration).
