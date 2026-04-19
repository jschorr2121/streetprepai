# Ideas Backlog

> Features and concepts flagged during planning that didn't make the initial prototype cut but are worth revisiting in later phases. Each item has a short description, why it matters, and a rough phase suggestion. Not prioritized — re-prioritize when picking up.

---

### 1. "Deal of the Week" briefing
Every Monday, Claude generates a 5-minute read on a recent M&A deal with 3 interview-ready talking points. Sent by email + in-app.
- **Why:** massive retention hook; arms students for "tell me about a recent deal" without effort.
- **Phase:** MVP (Phase 1). Cheap to build, huge engagement upside.

### 2. Superday Simulator
A 4-question back-to-back mock with realistic 5-minute interviewer switches, ending with a cumulative rating across all rounds.
- **Why:** nothing else on the market recreates a Superday end-to-end. Big differentiator and a natural "premium" feature.
- **Phase:** Phase 1 late / Phase 2. Reuses Mock Interview Studio plumbing.

### 3. "Why this firm?" Generator
Paste a firm → Claude pulls recent deals + culture notes + group structure + synthesizes a custom "why X" answer for *you* based on your Story Bank.
- **Why:** the most-Googled IB interview question. High-utility, high-virality.
- **Phase:** Phase 1. Depends on firm pages being built out.

### 4. Behavioral Story Graph
Visualize your Story Bank as a graph of which stories cover which question angles. Flags weak coverage ("no leadership story yet").
- **Why:** extends the Story Framer into a diagnostic. Fits naturally into Progress.
- **Phase:** Phase 1. Low incremental cost once Story Framer ships.

### 5. Interview Prediction Engine
Ingests user's firm/group/year → predicts the 15 most likely interview questions based on crowdsourced interview reports + public patterns.
- **Why:** the "I have one week until my interview" use case. Students will pay just for this.
- **Phase:** Phase 2. Needs volume of user-submitted interview reports to train on.

### 6. Smart Flashcards from Your Notes
Highlights you made in the Reading Lens automatically become spaced-repetition cards scoped to *your* weak areas.
- **Why:** closes the loop between reading and retention without any extra user effort.
- **Phase:** Phase 1. Already half-spec'd in the Lens.

### 7. Excel LBO Model Scoring
Upload your Excel LBO → Claude (with a tool that parses XLSX) checks structure, flags circularity errors, scores against rubric.
- **Why:** huge differentiator for firms that do modeling tests. No one else does this.
- **Phase:** Phase 2 or 3. Technically tricky — needs a robust XLSX parser and a careful rubric. Worth doing right.

### 8. "Brag sheet" single source of truth
One structured form (roles, dates, impact metrics) that populates resume, deal sheet, and LinkedIn headline from the same data.
- **Why:** eliminates the "keep 4 versions in sync" problem. Sticky utility.
- **Phase:** Phase 2.

### 9. Anxiety / Delivery Coach Mode
After a mock interview, a warm debrief framed as a friendly analyst, not a score. Focus on mental reframing, not just the rubric.
- **Why:** retention + mental-health angle. This audience is stressed; kindness differentiates.
- **Phase:** Phase 1. Just an alternative prompt for the scorecard UI.

### 10. "On the Street" Live Ticker
Anonymous user-submitted timeline events ("Evercore just sent offers Tuesday," "GS moved up first rounds by 2 weeks"). Real-time recruiting intel.
- **Why:** time-sensitive, crowd-sourced data is pure gold for this audience. Creates a daily-use habit.
- **Phase:** Phase 2. Needs community moderation in place first.

### 11. Group Fit Quiz
Suggests which IB product/industry groups (TMT, Healthcare, M&A, LevFin, etc.) align with user's style and background.
- **Why:** helps students articulate "why this group" and filters their firm targets.
- **Phase:** Phase 1. Lightweight to build with Claude.

### 12. Mobile Flashcard / Commute Mode
Audio-only flashcards ("What's the LBO accretion-dilution math?") — user responds by voice; Claude grades. Earbuds-on prep between classes.
- **Why:** expands when students can prep. Retention booster for commuter students.
- **Phase:** Phase 2. Requires voice infra to be battle-tested.

### 13. Verified Analyst Reviews of Your Answers
For a premium tier, a real analyst listens to your mock and adds a 90-second voice note.
- **Why:** hybrid AI + human, premium revenue line, reuses mentor marketplace.
- **Phase:** Phase 2. Needs mentor marketplace live.

### 14. "Firm Culture Match" via Anonymous Alumni Reviews
Glassdoor-style anonymous reviews from verified alumni at each firm — culture, hours, learning curve, deal flow.
- **Why:** deep firm intel that students can't get elsewhere; supports Relationship Hub prep sheets.
- **Phase:** Phase 2. Requires verified-alum program and moderation.

### 15. Referral Flywheel
Give users free Pro time for every friend who signs up — especially impactful in IB because recruiting is a team sport within schools.
- **Why:** cheap viral growth loop in a densely networked audience.
- **Phase:** Phase 1 or 2. Standard growth move; implement once paid conversion is a focus.

---

## When to revisit
Sweep this list at the end of each phase. Items should be re-scored on:
1. **User pull** — are existing users asking for this?
2. **Differentiation** — does it widen the moat or just catch us up?
3. **Cost to build** — effort vs. incremental revenue / retention.
