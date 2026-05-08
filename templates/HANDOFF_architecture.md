# Handoff Prompt — Build `templates/context/architecture.md`

Paste the block below into a fresh Claude Code conversation to continue spec-driven development on Street Prep AI. This handoff assumes the new conversation has no memory of the prior `project-overview.md` work.

---

## Prompt to paste

I'm doing spec-driven development for Street Prep AI, an AI-powered IB recruiting prep platform. We just finished `templates/context/project-overview.md` in a prior session and now need to build `templates/context/architecture.md`.

**Read these files first, in order, before asking me anything:**

1. `/Users/jakeschorr/Documents/InterviewPrep/templates/context/project-overview.md` — the locked product spec. The architecture must serve this.
2. `/Users/jakeschorr/Documents/InterviewPrep/templates/context/architecture.md` — the empty template you'll be filling in. Note the section headers: Stack, System Boundaries, Storage Model, Auth and Access Model, Invariants.
3. `/Users/jakeschorr/Documents/InterviewPrep/templates/CHANGES.md` — the running decisions log from the prior session. Pay attention to "Codebase changes implied by the spec" and "Updates from IB_research.md review".
4. `/Users/jakeschorr/Documents/InterviewPrep/CLAUDE.md` — describes what's currently in the repo. Treat this as "the current codebase state," NOT as a constraint on what we should pick. We're free to redesign.
5. `/Users/jakeschorr/Documents/InterviewPrep/IB_research.md` — IB recruiting research; informs data shapes (e.g., contacts, chats, firm pages).

**How to work with me:**

- Append every meaningful decision to `templates/CHANGES.md` under a new section "Architecture decisions". Open questions go under "Open questions". Things the current codebase needs to change go under "Codebase changes implied by the spec".
- DO NOT just lift the existing tech stack from the codebase. I might want to make different choices. Ask before assuming.
- Use `AskUserQuestion` generously — I prefer many small focused questions over big open-ended ones. (This is a documented preference in your memory.)
- Write user-facing updates one sentence at a time, not paragraphs.
- When you draft a section, write it to the file and then ask me to react. Don't draft the entire file in one go.

**Order of operations I want:**

1. **Stack** — pin every layer. Already locked from `project-overview.md` and current code: Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, Anthropic Claude server-side, Supabase (auth + Postgres + storage + RLS), Drizzle ORM, Vercel deploy. But ask me about: (a) embeddings provider for semantic chat search (Voyage vs OpenAI text-embedding-3-small vs Anthropic), (b) speech transcription (Whisper API vs newer alternatives), (c) HireVue-style video capture (browser MediaRecorder + Supabase Storage vs a managed service), (d) calendar OAuth approach, (e) any background-job system for scheduled prep-sheet refreshes / spaced re-surfacing / weekly firm-data refresh, (f) rate-limiting layer (Upstash vs alternatives), (g) analytics, (h) email (transactional + follow-up scheduling).
2. **System Boundaries** — propose a folder layout that reflects the *learning flow as the spine + tools layered on top* model from the overview. Don't blindly mirror the current `/web/app/(app)/...` layout — propose what makes sense given the spec. Ask me to react before writing.
3. **Storage Model** — Postgres tables for: profile/users, chapters/sections/practice questions/follow-up trees, mastery model state, mocks/HireVues/transcripts/scorecards, contacts/chats/calendar events/prep sheets, firms (shared)/sector pages, story bank, technical Q bank with spaced-rep state, llm_usage. Plus Supabase Storage for resumes/audio/video. Plus pgvector for semantic recall. Ask before drafting the schema in detail.
4. **Auth and Access Model** — Supabase auth, every user-owned row scoped via RLS to `auth.uid()`. Shared content (chapters, firms, sectors, public Q bank) is read-only for users. Discuss whether content authors get a separate role.
5. **Invariants** — propose 5–8 architectural rules the codebase must never violate. Examples to consider: AI calls only happen server-side; no free-form JSON parsing from LLM (always tool use); RLS on every user-owned table; LLM usage logged for every call; cached prompt content for guides/firms to keep cost down; spaced-re-surfacing computed in a scheduled job, not on each request. Ask me to confirm/extend.

**Locked decisions from the prior session you should NOT relitigate:**

- Project name: Street Prep AI.
- Target user: US undergrads targeting IB SA roles. No other verticals in scope.
- Authenticated experience required for all features (Goal #1).
- Resume upload populates the user profile.
- 16 chapters in the learning flow, 7 of which are technicals.
- Tools: Chatbot (tool-using), Story Framer, Resume Coach, Mock Interview + HireVue, Technical Question Bank (with difficulty levels, follow-up trees, spaced re-surfacing), Relationship Manager (with calendar OAuth + prep-sheet button).
- Cut features (do not add to architecture): job hub, community forum, mentor marketplace, office hours, standalone spaced-rep flashcards.
- Firm pages include 10–15 firm-specific interview Qs.
- Recruiting Cycle Widget on dashboard, personalized to grad year + current semester.
- Discovery mechanism for new networking targets is in scope; how it works is deferred.

**First message in your reply should be:**

(a) confirmation you've read all five files,
(b) the 6–10 questions you want answered to fill in the Stack section, and
(c) nothing else — don't draft architecture content until I've answered.

Begin.
