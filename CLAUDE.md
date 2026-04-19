# Street Prep AI — CLAUDE.md

This file gives an AI assistant full context on this repository: what the product is, how the code is structured, all key architectural decisions, and what's real vs stubbed in the prototype.

---

## What This Product Is

**Street Prep AI** is an AI-powered interview and recruiting preparation platform for US undergraduates targeting investment banking Summer Analyst roles. Tagline: *"The recruiting cycle, reimagined with AI."*

The core insight: IB recruiting is won in the details — technical mastery, strong behavioral stories, warm relationships, and firm-specific intel. Every existing tool (WSP, BIWS, WSO, M&I, Handshake) handles one slice in isolation. Street Prep AI unifies the entire cycle with AI lifting friction at every stage: smarter reading, sharper stories, better-prepared coffee chats, and real-time coaching on mock interviews.

**Primary differentiators:**
- AI-assisted active reading (highlight → instant plain-English explanation, no jargon wall)
- Voice mock interviews with content + delivery scoring
- Relationship Memory: a CRM with AI memory that preps you for every coffee chat and interview, drafts follow-ups, and surfaces what past contacts told you at the moment you need it
- Unified hub replacing 6 disconnected browser tabs

**Target user (phase 1):** US sophomore/junior undergrads at target and non-target schools, pre-IB SA recruitment cycle (Aug–Feb).

---

## Repository Structure

```
/InterviewPrep                    (repo root)
  CLAUDE.md                       (this file)
  product-description.md          (non-technical functional description — share with advisors/users)
  ideas-backlog.md                (15 deferred feature ideas with phase suggestions)
  mac-lens-spec.md                (full spec for a future standalone macOS menubar app)
  web/                            (Next.js application — all app code lives here)
    app/
    components/
    lib/
    content/
    public/
    package.json
    .env.local -> ../env.local    (symlink — ANTHROPIC_API_KEY lives in parent dir)
```

The app lives in `web/` because npm rejects package names with capitals and the parent directory is named "InterviewPrep". All `pnpm` commands run from `web/`.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2.4 (App Router) | React 19, Turbopack, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui | CSS-based config (no tailwind.config.js), `@theme inline`, oklch colors, new-york style |
| AI | Anthropic Claude via `@anthropic-ai/sdk` | Server-side only — never expose keys to client |
| Package manager | pnpm | |
| Data | Seed files in `lib/data/*.ts` | No database in prototype — all data is TypeScript |
| Fonts | Geist Sans + Geist Mono | Via `next/font/google` |
| Icons | lucide-react | |
| Toasts | sonner | |
| Deploy target | Vercel | |

**Design tokens** (in `app/globals.css`):
- Primary color: emerald (`oklch(0.55 0.15 160)`)
- Base: neutral
- CSS variables via `@theme inline`

---

## AI Integration

All Claude calls happen in Next.js Route Handlers (`app/api/**/route.ts`). Never in client components.

**Models** (defined in `lib/ai/anthropic.ts`):
```ts
MODELS = {
  opus:   "claude-opus-4-7",
  sonnet: "claude-sonnet-4-6",
  haiku:  "claude-haiku-4-5-20251001",
}
```

**Which model for which task:**
| Task | Model |
|---|---|
| Reading lens explain / beginner rewrite | Sonnet |
| Chat with content | Sonnet |
| Interview scoring + rubric | Opus |
| Pre-chat prep sheets (person) | Sonnet |
| Firm interview prep sheets | Sonnet |
| Chat note structuring (tool use) | Sonnet |
| Follow-up email drafting | Haiku |
| Flashcard generation | Haiku |
| Story framing | Sonnet |
| Question generation | Haiku |

**Streaming pattern** (all endpoints that stream):
```ts
runtime = "nodejs"
// Returns ReadableStream<Uint8Array> via TextEncoder
// Uses anthropic.messages.stream() → on("text") → controller.enqueue()
```

**Prompt caching:** every system prompt uses `cache_control: { type: "ephemeral" }` on the system block. Guide content is cached when passed as system context.

**Tool use** (structured output): `structure-chat` endpoint uses Claude tool use with a typed JSON schema (`save_chat_summary`) instead of free-form JSON parsing.

**All system prompts** live in `lib/ai/prompts.ts`:
- `SYSTEM_BASE` — shared persona/tone for Street Prep AI
- `LENS_EXPLAIN_SYSTEM` — explain a highlighted passage in plain English
- `LENS_BEGINNER_SYSTEM` — rewrite a section for beginners with analogies
- `CHAT_SYSTEM` — chat scoped to a guide, cite sections
- `PREP_PERSON_SYSTEM` — generate a pre-coffee-chat prep sheet from LinkedIn bio
- `PREP_FIRM_SYSTEM` — generate a firm interview prep sheet from earnings + news
- `STRUCTURE_CHAT_SYSTEM` — structure raw post-chat notes into JSON
- `DRAFT_FOLLOWUP_SYSTEM` — draft a warm follow-up email from structured notes
- `STORY_FRAMER_SYSTEM` — generate STAR framings from a raw experience

---

## App Structure (`web/app/`)

```
app/
  globals.css                     design tokens, prose-guide typography
  layout.tsx                      root layout — Geist fonts, TooltipProvider, Toaster
  (marketing)/
    page.tsx                      landing page — hero, features, pricing, CTA
  (app)/
    layout.tsx                    app shell — AppNav sidebar + main
    dashboard/page.tsx
    library/page.tsx              category browser
    library/[category]/page.tsx   guides in a category
    guide/[slug]/page.tsx         guide reader (Reading Lens flagship)
    interview/page.tsx            mock interview studio
    story-framer/page.tsx         behavioral story framer
    jobs/page.tsx                 job hub with filters
    resume/page.tsx               resume coach (stub)
    progress/page.tsx             mastery heatmap, streak
    relationships/page.tsx        contacts + calendar + semantic search
    relationships/[id]/page.tsx   contact detail: prep sheet, log chat, history
    firms/page.tsx                firm list
    firms/[slug]/page.tsx         firm detail + earnings prep sheet
    network/page.tsx              mentor listing (stub)
    community/page.tsx            community forum (stub)
  api/
    lens/explain/route.ts         POST → stream Claude explanation of selection
    lens/beginner/route.ts        POST → stream beginner rewrite of a section
    chat/stream/route.ts          POST → stream guide-scoped chat
    relationships/
      prep-person/route.ts        POST → stream pre-chat prep sheet
      structure-chat/route.ts     POST → tool use → structured chat summary JSON
      draft-followup/route.ts     POST → {subject, body} follow-up email
    firms/[slug]/prep/route.ts    POST → stream firm interview prep sheet
```

---

## Component Structure (`web/components/`)

```
components/
  app-nav.tsx                     sidebar nav (11 items, "Street Prep AI" brand)
  reader/
    reading-lens.tsx              flagship 3-column layout
    chat-panel.tsx                streaming chat UI (guide-scoped)
    markdown.tsx                  lightweight regex markdown renderer
  relationships/
    contacts-view.tsx             3-tab: Calendar, Contacts, Search
    contact-detail.tsx            3-tab: Prep sheet, Log chat, History
  firms/
    firm-prep.tsx                 Generate button → streams firm prep sheet
  ui/                             shadcn primitives (button, badge, tabs, etc.)
```

### Reading Lens Layout (critical — was broken, now fixed)

**Do not** use `flex h-screen overflow-hidden` with nested `ScrollArea` — it breaks content scroll sizing.

**Correct pattern:** natural page scroll for center content, `sticky top-0 h-screen` for left outline and right rail:
- Left rail: `hidden xl:block w-64 shrink-0 border-r` → inner `sticky top-0 h-screen flex flex-col`
- Center: `flex-1 min-w-0` → natural flow, `max-w-2xl mx-auto px-6 py-10`
- Right rail: `hidden md:block md:w-[380px] shrink-0 border-l` → inner `sticky top-0 h-screen flex flex-col`

---

## Data Layer (`web/lib/data/`)

No database in the prototype. Everything is seeded TypeScript:

| File | Contents |
|---|---|
| `guides.ts` | `getAllGuides()` reads MDX from `content/guides/`, `parseSections()` splits on H2/H3 |
| `contacts.ts` | 5 seeded contacts (Alex Chen GS TMT, Priya Mehta Evercore, etc.), 1 full chat log |
| `calendar.ts` | 7 seeded events (coffee chats, interviews, Superday) |
| `firms.ts` | 3 firms (GS, Evercore, MS) with illustrative Q4 2025 earnings raw text |
| `jobs.ts` | 15 seeded jobs across BB/EB/MM with filter arrays |

---

## Content Library (`web/content/guides/`)

32 `.md` files total. All have frontmatter:
```yaml
---
slug: dcf-fundamentals
title: DCF Fundamentals
description: ...
category: technicals
difficulty: intermediate
readingMinutes: 15
tags: [valuation, dcf, ...]
---
```

**Categories:** `technicals`, `behavioral`, `firm-guides`, `networking`, `resume`, `modeling`, `superday`, `markets`

Guides are read at build time via `getAllGuides()` in `lib/data/guides.ts` using `gray-matter` for frontmatter parsing and `fs.readdirSync` on the `content/guides/` directory.

---

## Feature Pillars (all 12)

1. **Content Library** — 30+ MDX guides across all IB prep areas
2. **Active Reading Lens** — highlight → AI explanation in right rail; Beginner Mode rewrites sections; Chat tab for guide-scoped Q&A
3. **Mock Interview Studio** — voice Q&A, Whisper transcription, Claude scoring (content + delivery)
4. **Behavioral Story Framer** — raw experience → STAR framings for leadership, teamwork, conflict, failure, etc. → Story Bank
5. **Progress & Weak-Area Diagnostics** — mastery heatmap, streak calendar, spaced-repetition flashcards, "top 3 gaps" widget
6. **Job Hub** — aggregated IB roles with firm/group/region/deadline filters
7. **Resume & Deal Sheet Coach** — AI rewriting in banker-speak, weak-bullet flagging
8. **Networking & Mentors** — mentor matching, outreach templates, coffee-chat prep
9. **Relationship Memory & Prep Hub** — CRM with AI memory (see detailed section below)
10. **Firms** — firm-level pages with earnings summaries, deal intel, interview prep sheets
11. **Community** — peer forum, interview-report exchange (stubbed)
12. **Office Hours & Events** — scheduled AMAs with real bankers (phase 2)

---

## Relationship Memory & Prep Hub (most complex feature)

This is the strategic differentiator. Think Superhuman + Granola + Clay, scoped to IB recruiting.

**What it does:**
- **Calendar view** — upcoming/past coffee chats and interviews, linked to contacts
- **Contacts list** — filterable by stage (cold → coffee chat → warm → interviewed → offer)
- **Pre-chat prep sheets** — paste LinkedIn bio → Claude generates smart questions, background summary, personal hooks
- **Chat logging** — log raw notes after a call → Claude structures into JSON (topics, advice given, commitments, personal details, follow-up items)
- **Follow-up drafter** — one click → Claude drafts a warm specific email referencing the actual conversation
- **Semantic search** — search across all chat logs (mocked in prototype with static data; real impl uses pgvector)
- **Firm prep sheets** — firm page → Claude generates prep brief from earnings + news + user's past chats at that firm

**Prototype status:** fully wired end-to-end for the core demo path (add contact → prep sheet → log chat → follow-up). Calendar integration is stubbed with seed data. Semantic recall is mocked.

**Data model (for future DB):**
- `contacts` — name, firm, group, title, linkedin_url, school, stage, tags
- `chats` — contact_id, happened_at, raw_notes, structured_summary_json, embedding vector
- `outreach` — contact_id, draft_text, sent_at, scheduled_followup_at
- `prep_sheets` — target_type (person|firm), target_ref, content_json, stale_after

---

## What's Real vs Stubbed in the Prototype

| Feature | Status |
|---|---|
| Reading Lens — highlight + explain | **REAL** (live Claude streaming) |
| Reading Lens — Beginner Mode | **REAL** (live Claude streaming) |
| Chat with content | **REAL** (live Claude streaming) |
| Relationship Memory — prep-person | **REAL** (live Claude streaming) |
| Relationship Memory — structure-chat | **REAL** (Claude tool use → JSON) |
| Relationship Memory — draft-followup | **REAL** (live Claude call) |
| Firms — earnings prep sheet | **REAL** (live Claude streaming) |
| Auth | **STUBBED** (no real user, no session) |
| Database | **STUBBED** (seed TS files) |
| Mock Interview Studio | **UI SHELL** (scorecard is mock data) |
| Job scraping | **MANUAL SEED** (15 curated jobs) |
| Calendar OAuth | **STUBBED** (7 seeded events) |
| Semantic recall | **MOCKED** (static "3 past chats" chip) |
| Payments | **NOT BUILT** |
| Resume Coach | **STUB** |
| Progress / flashcards | **MOCK DATA** |

---

## Monetization Model

| Tier | Price | Unlocks |
|---|---|---|
| Free | $0 | 3 guides, 3 mocks/mo, job feed, read-only community |
| Pro Monthly | $29/mo | Full library, unlimited mocks, all features |
| Recruiting Season Pass | $149 one-time | Pro Aug–Feb (matches recruiting cycle psychology) |
| Mentor Sessions | $40–120/session | 70/30 revenue-share |
| University Plan | Custom B2B | $5–15k/school/year via career centers |

The Season Pass is strategically important: undergrads don't think in subscriptions, they think in recruiting cycles.

---

## Roadmap

**Phase 0 (prototype, weeks 1–4):** ✅ Done. Next.js shell, 30+ guides, Reading Lens + Chat (real Claude), Relationship Memory demo slice, jobs + firms (seeded), progress + network + community stubs. Deployed to Vercel.

**Phase 1 (MVP, weeks 5–12):** Real Supabase auth, Stripe checkout, 40–60 guides with SME review, full mock interview (Whisper + Claude), spaced-repetition flashcards, job scraper for top 30 firms, Posthog analytics, Relationship Memory full build (Google Calendar OAuth, pgvector semantic recall, voice chat capture, outreach assistant).

**Phase 2 (V1, months 4–6):** Mentor marketplace, community forum, firm-specific deep guides, mobile PWA.

**Phase 3 (scale, months 6–12):** PE/ER/S&T verticals, London + HK tracks, in-browser Excel LBO grader, peer mock interview matching.

---

## Development Setup

```bash
cd web
pnpm dev          # starts on localhost:3000 with Turbopack
pnpm build        # production build
pnpm lint
```

**Environment:** `web/.env.local` is a symlink to `../env.local`. The actual file lives at `/Users/jakeschorr/Documents/InterviewPrep/env.local` and contains:
```
ANTHROPIC_API_KEY=...
```

**No database setup required** — prototype runs entirely on seed data in `lib/data/`.

---

## Key Architectural Decisions & Why

- **Seed data over DB:** Lets the prototype be instantly shareable without auth setup. Real Supabase DB deferred to MVP.
- **`web/` subdirectory:** npm rejects uppercase letters in package names; parent dir is "InterviewPrep". Everything app-related is in `web/`.
- **Natural page scroll (not ScrollArea flex):** The 3-column reader layout broke with `flex h-screen overflow-hidden` + nested `ScrollArea` because the content div had no intrinsic height. Fixed by letting center content flow naturally with sticky rails.
- **Prompt caching on system blocks:** Guide content can be 10k+ tokens. Caching cuts cost ~90% on repeated explain/chat calls in a session.
- **No free-form JSON parsing:** All structured AI output uses Claude tool use with typed schemas. Avoids regex JSON extraction brittleness.
- **Sonnet for reading lens, Haiku for lightweight tasks:** Keeps per-user cost in the $0.20–0.50/month free tier target.
- **All AI calls server-side:** Route Handlers only. API key never touches the browser.

---

## Companion Files

| File | Purpose |
|---|---|
| `product-description.md` | Non-technical description for advisors, early users, partners |
| `ideas-backlog.md` | 15 deferred feature ideas (Deal of the Week, Superday Simulator, etc.) |
| `mac-lens-spec.md` | Full spec for a future standalone macOS menubar app (SwiftUI + AX API + Claude streaming) |

---

## Memory Files

AI memory for this project lives at:
```
/Users/jakeschorr/.claude/projects/-Users-jakeschorr-Documents-InterviewPrep/memory/
  MEMORY.md                 (index)
  user_role.md              (Jake: solo founder, IB prep product)
  feedback_many_questions.md (use AskUserQuestion generously during planning)
  project_interview_prep.md  (all 12 feature pillars)
  project_stack.md           (tech stack decisions)
  reference_plan_files.md    (locations of plan, product description, backlog)
```

---

## Content & Branding Notes

- **Product name:** Street Prep AI (not "Lens" — the AI reading lens is a feature, not the brand)
- **Hero line:** "The recruiting cycle, reimagined with AI"
- **Tone:** respected mentor, not a robot. Warm, specific, actionable. Never gamify cynically.
- **Brand palette:** emerald primary, neutral base, clean modern edtech aesthetic
- **Font:** Geist Sans (UI), Geist Mono (code)
