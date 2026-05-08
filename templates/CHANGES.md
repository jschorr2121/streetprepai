# Spec-Driven Development — Running Changes Doc

A live log of decisions and changes that emerge as we fill in the `templates/context/` files. Anything here that diverges from what's currently in the codebase is a deliberate change to make.

---

## Decisions made (vs. current codebase)

- **Project name:** Street Prep AI (unchanged).
- **Target user:** US undergrads targeting IB Summer Analyst roles. Finance-vertical expansion deferred to "much later" — do not bake other verticals into the spec.
- **Information architecture shift:** the product is a **structured learning flow (course-like: chapters → readings → interactive tutorials → graded practice)** with **tools layered on top**, not a flat 12-pillar feature menu. The current codebase has the 12 pillars as side-by-side surfaces; the spec should reframe them as: (a) the learning flow spine, and (b) tools available at any time.
- **Learning flow ordering** (per user): how to apply → which firms do what → sectors → guides → technicals → behavioral.
- **Authenticated-only:** Goal #1 explicitly requires authenticated user access. The current prototype has stubbed auth — this is a confirmed change for the spec target.
- **Resume-driven profile:** users fill out their profile by uploading their resume; profile data feeds the chatbot, story framer, and prep sheets.
- **Chatbot is tool-using:** chatbot can pull from profile, networking history, web, IB knowledge, and firm data — not just guide-scoped Q&A.
- **HireVue practice** is a first-class mock-interview mode (currently the codebase mentions only voice mock; HireVue framing is explicit).
- **Networking discovery:** in addition to tracking past contacts, the spec includes discovering *new* people to network with (new feature, not in current codebase).
- **Learning flow teaches the tools:** chapters in the learning flow don't just teach concepts — they teach users *how to use the product's own tools* in context. E.g., the Networking chapter walks the user through the Relationship Manager; the Behavioral chapter walks them through the Story Framer. Pedagogy and practice are integrated.
- **Cut from the spec** (currently in codebase as stubs or partially built):
  - Job hub (filterable IB postings)
  - Community forum + interview report exchange
  - Mentor marketplace + office hours / live AMAs
  - Spaced-repetition flashcards
- **Goals confirmed/added:**
  - Discover new people to network with — promoted to a top-level goal.
  - Sector deep-dives (TMT, healthcare, FIG, etc.) — top-level goal.
  - Firm-specific pages (earnings, deals, intel) — top-level goal.
  - "AI prep at the moment of need" — folded into the chatbot goal, not a separate goal. The chatbot is the surface for synthesizing personalized prep.

## Open questions

- Do guides need **interactive tutorials** as a distinct content type beyond reading + practice questions? (User listed it; current codebase has only reading + chat.)
- Are jobs hub, community forum, mentor marketplace, and office hours still in the product? They're in the codebase as stubs but absent from the user's restated goals.
- Should the dashboard be the primary landing surface or should it be the learning flow itself?
- Sector deep dives (TMT, healthcare, FIG, etc.) — separate content type or just chapters within "which firms do what"?
- Does "track progress" mean a mastery model + heatmap (current codebase) or simpler completion tracking?

## Codebase changes implied by the spec

- Reorganize routing so the learning flow is a first-class IA surface (chapters → sections → practice), not a flat library of guides.
- Build a profile system seeded from a resume upload (resume parser + structured profile store). Currently no profile system exists.
- Extend the chatbot beyond guide-scoped Q&A: add tool use for profile lookup, networking history search, web search, firm data.
- Add a HireVue practice mode to the mock interview studio.
- Add a technical-question bank (DB-backed, with AI-generated fallback by topic/type). Currently no question bank exists.
- Add a "discover people to network with" surface in Relationship Memory.
- Replace stubbed auth with a real authenticated experience (Supabase, per existing stack decision).

---

## Resolved details

- **Interactive tutorials:** support all three formats (inline exercises, worked examples, AI socratic tutoring); each chapter author picks the right mix.
- **Discovery mechanism for new people to network with:** deferred — feature in scope, mechanism TBD.
- **Progress tracking:** hybrid — mastery model under the hood + completion stats and streak in the UI.
- **Calendar:** Google Calendar OAuth, auto-link events to contacts, trigger pre-event prep sheets.

## Updates from `IB_research.md` review (round 2)

- **Chapter sequence locked at 16 chapters**, with technicals as 7 of them (the bulk):
  1. Recruiting Cycle & Timeline
  2. How to Apply
  3. Firm Overviews (BB / EB / MM + group types)
  4. Sector Deep-Dives
  5. Resume & Cover Letter (uses Resume Coach)
  6. Networking Mastery (uses Relationship Manager)
  7. Behavioral & Fit (uses Story Framer)
  8. Technicals — Accounting & 3 Statements
  9. Technicals — EV vs Equity Value
  10. Technicals — Valuation: Comps & Precedent Transactions
  11. Technicals — DCF (own chapter; 23% of all reported IB Qs)
  12. Technicals — M&A & Merger Models
  13. Technicals — LBO Models
  14. Technicals — Brain Teasers & Mental Math
  15. Mock Interviews & HireVue Practice (uses Mock Interview Studio)
  16. Superday & Logistics
- **Recruiting Cycle Widget** added to the dashboard — personalized to grad year + current semester, surfaces what to focus on this semester. Goal #13.
- **Profile** now stores current semester (in addition to grad year), to drive the cycle widget.
- **Technical Question Bank** extended with three new behaviors:
  - Difficulty levels (easy / medium / hard) per question.
  - Follow-up question trees: 3–5 deeper probes per Q, fired on correct answer.
  - Spaced re-surfacing of weak/incorrect questions every 2–3 days. (Note: this is *not* the standalone flashcard feature — that stays cut. This is in-Q-bank re-serving driven by mastery model state.)
- **Mock Interview Studio** now includes adaptive follow-up questions that branch off each answer, mimicking real interviewer probing.
- **Firm Pages** now include 10–15 firm-specific interview questions per firm (sourced from interview reports), in addition to earnings/deals/intel.
- **Brain Teasers & Mental Math** added as a dedicated technical chapter (was missing before).
- **DCF promoted to its own chapter** (separate from Comps/Precedents) given its outsized weight in real interviews.
- **School-tier-aware strategy** considered but NOT picked. Profile data is captured; we can revisit later if it earns its place.

## Spec file status

- [x] `context/project-overview.md` — drafted, awaiting review
- [ ] `context/architecture.md`
- [ ] `context/ui-context.md`
- [ ] `context/code-standards.md`
- [ ] `context/ai-workflow-rules.md`
- [ ] `context/progress-tracker.md`
