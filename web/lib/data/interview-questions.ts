export type InterviewMode = "technical" | "behavioral" | "firm" | "superday";

export type Difficulty = "easy" | "medium" | "hard";

export interface InterviewQuestion {
  id: string;
  mode: InterviewMode;
  text: string;
  topic: string;
  difficulty: Difficulty;
  idealAnswerOutline: string;
}

export const interviewQuestions: InterviewQuestion[] = [
  // ---------- TECHNICAL ----------
  {
    id: "tech-walk-dcf",
    mode: "technical",
    topic: "DCF",
    difficulty: "medium",
    text: "Walk me through a DCF.",
    idealAnswerOutline:
      "Project unlevered free cash flow for 5-10 years (EBIT * (1 - tax) + D&A - CapEx - change in NWC). Discount each cash flow back to present using WACC. Calculate terminal value (Gordon Growth or exit multiple), discount it back, sum to enterprise value. Subtract net debt to get equity value, divide by diluted shares for implied price per share. Mention key sensitivities: WACC, terminal growth, margin assumptions.",
  },
  {
    id: "tech-ebitda-fcf",
    mode: "technical",
    topic: "Cash flow",
    difficulty: "easy",
    text: "What's the difference between EBITDA and free cash flow?",
    idealAnswerOutline:
      "EBITDA is a profitability proxy (earnings before interest, taxes, D&A) — it ignores CapEx, working capital changes, and taxes. FCF (unlevered) starts from EBIT, subtracts taxes, adds back D&A, and subtracts CapEx and change in NWC. EBITDA overstates true cash generation for capital-intensive businesses. FCF is what shows up in a DCF.",
  },
  {
    id: "tech-3-statements",
    mode: "technical",
    topic: "Accounting",
    difficulty: "medium",
    text: "How do the three financial statements link together?",
    idealAnswerOutline:
      "Net income from the income statement flows to the top of the cash flow statement (operating activities) and to retained earnings on the balance sheet. D&A is added back on the CFS. CapEx hits investing on CFS and PP&E on BS. Debt issuance/repayment hits financing on CFS and debt on BS. Ending cash from CFS becomes cash on BS. Balance sheet must balance.",
  },
  {
    id: "tech-depreciation-10",
    mode: "technical",
    topic: "Accounting",
    difficulty: "easy",
    text: "Depreciation goes up by $10 — walk me through the three statements (35% tax rate).",
    idealAnswerOutline:
      "Income statement: pre-tax income down $10, taxes down $3.50, net income down $6.50. Cash flow statement: net income down $6.50 but add back $10 of D&A, so cash from operations up $3.50. Balance sheet: cash up $3.50, PP&E down $10, so assets down $6.50; retained earnings down $6.50. Balances.",
  },
  {
    id: "tech-wacc",
    mode: "technical",
    topic: "Valuation",
    difficulty: "medium",
    text: "How do you calculate WACC?",
    idealAnswerOutline:
      "WACC = (E/V) * Re + (D/V) * Rd * (1 - t). Re via CAPM: risk-free rate + levered beta * equity risk premium. Beta from comps unlevered then re-levered to target capital structure. Rd from yield on existing debt or comparable issuance. Use market values for E and D, not book.",
  },
  {
    id: "tech-comps-vs-precedents",
    mode: "technical",
    topic: "Valuation",
    difficulty: "easy",
    text: "What's the difference between trading comps and precedent transactions?",
    idealAnswerOutline:
      "Trading comps value a company based on how the public market prices similar businesses today (no control premium). Precedent transactions reflect what acquirers actually paid for similar businesses (includes a control premium and synergy expectations, so multiples are typically higher). Both rely on a clean comp set and adjustments for size, growth, and margins.",
  },
  {
    id: "tech-accretion-dilution",
    mode: "technical",
    topic: "M&A",
    difficulty: "hard",
    text: "When is an all-stock acquisition accretive vs dilutive?",
    idealAnswerOutline:
      "Compare acquirer's P/E to the target's P/E adjusted for synergies. If acquirer P/E > target P/E (after synergies), the deal is accretive on a stock-only basis. For cash deals, compare the after-tax cost of debt or foregone interest on cash to the target's earnings yield (1/PE). Synergies, transaction costs, and write-ups affect the answer.",
  },
  {
    id: "tech-lbo-drivers",
    mode: "technical",
    topic: "LBO",
    difficulty: "hard",
    text: "What are the main drivers of returns in an LBO?",
    idealAnswerOutline:
      "Three levers: (1) EBITDA growth — revenue growth and margin expansion, (2) multiple expansion — exit at a higher multiple than entry, harder to count on, (3) debt paydown — using cash flow to delever, which transfers value from creditors to equity. Lower entry multiple, higher leverage, and operational improvements drive higher IRR.",
  },
  {
    id: "tech-enterprise-vs-equity",
    mode: "technical",
    topic: "Valuation",
    difficulty: "easy",
    text: "What's the difference between enterprise value and equity value?",
    idealAnswerOutline:
      "Enterprise value = market cap + debt + preferred + minority interest - cash. It's the value of the operating business available to all capital providers. Equity value is what common shareholders own. EV multiples (EV/EBITDA, EV/Sales) pair with capital-structure-neutral metrics; equity multiples (P/E) pair with after-interest metrics.",
  },

  // ---------- BEHAVIORAL ----------
  {
    id: "beh-why-banking",
    mode: "behavioral",
    topic: "Why banking",
    difficulty: "medium",
    text: "Why investment banking?",
    idealAnswerOutline:
      "Personal hook (specific moment of interest — deal you followed, club, internship). Skills you want to build (financial analysis, modeling, executive exposure, working at the intersection of strategy and capital). Why now (sophomore/junior summer is the natural learning curve). Long-term: optionality into PE, corporate strategy, growth investing — but right now you want the rep. Avoid clichés like 'fast-paced environment' or 'work hard play hard.'",
  },
  {
    id: "beh-tell-me-about-yourself",
    mode: "behavioral",
    topic: "Pitch",
    difficulty: "easy",
    text: "Walk me through your resume.",
    idealAnswerOutline:
      "60-90 seconds, narrative arc not chronology. School + concentration + one specific reason it's relevant. One academic/extracurricular highlight that shows analytical or leadership chops. Most relevant prior internship — what you actually did, not the company description. The connecting thread that brought you to investment banking. End with what you're focused on this summer.",
  },
  {
    id: "beh-failure",
    mode: "behavioral",
    topic: "Failure",
    difficulty: "medium",
    text: "Tell me about a time you failed.",
    idealAnswerOutline:
      "Pick a real failure with stakes (not 'I tried to take 6 classes and got a B+'). STAR: situation set up the stakes, task was specific, action you owned (don't blame others), result was honest including the loss. Most important: what you changed afterward. Bonus if the change has been tested in a later situation. Avoid humblebrags.",
  },
  {
    id: "beh-leadership",
    mode: "behavioral",
    topic: "Leadership",
    difficulty: "medium",
    text: "Tell me about a time you led a team.",
    idealAnswerOutline:
      "Concrete role with real responsibility — not a title, an actual decision you made or person you motivated. STAR with focus on Action: what specifically did you do that someone else might not have? Quantify team size and outcome where you can. Reflect briefly on what you learned about leading peers (the harder version of leadership).",
  },
  {
    id: "beh-conflict",
    mode: "behavioral",
    topic: "Conflict",
    difficulty: "medium",
    text: "Describe a time you disagreed with a teammate. How did you handle it?",
    idealAnswerOutline:
      "Real disagreement on substance, not style. Show empathy for their position before describing your own. Action: how you raised it (private first, data-driven, not ego), how you found common ground or escalated appropriately. Result: outcome and the relationship preserved. Banking is a team sport — they want to know you can disagree without making it personal.",
  },
  {
    id: "beh-strength-weakness",
    mode: "behavioral",
    topic: "Self-awareness",
    difficulty: "easy",
    text: "What's your biggest weakness?",
    idealAnswerOutline:
      "A real weakness, not a humblebrag ('I work too hard'). Pick something genuine but not disqualifying ('I default to working solo when I should pull in teammates earlier'). Show self-awareness with one concrete example, then explicitly describe the system/habit you've built to manage it, and a moment that proved it worked.",
  },
  {
    id: "beh-stress",
    mode: "behavioral",
    topic: "Pressure",
    difficulty: "medium",
    text: "Tell me about a time you worked under pressure.",
    idealAnswerOutline:
      "Genuine deadline or stakes, not 'finals week.' STAR: situation that constrains time/resources, your specific actions to triage and prioritize, result that quantifies outcome. Banking is a stress test — they're listening for whether you stay calm, communicate proactively, and lean on the team without losing ownership.",
  },

  // ---------- FIRM-SPECIFIC ----------
  {
    id: "firm-why-this-firm",
    mode: "firm",
    topic: "Firm fit",
    difficulty: "medium",
    text: "Why our firm specifically?",
    idealAnswerOutline:
      "Three layers: (1) firm-specific differentiator (M&A franchise rank, sector strength, capital markets vs pure advisory model, geography), (2) people you've spoken with — by name — and what they told you that resonated, (3) what you can contribute and learn here vs elsewhere. Avoid: league table recital, generic 'culture' answers, naming a competitor's strength.",
  },
  {
    id: "firm-recent-deal",
    mode: "firm",
    topic: "Deals",
    difficulty: "hard",
    text: "Tell me about a recent deal our firm worked on.",
    idealAnswerOutline:
      "Pick a deal from the last 6-12 months. Know: who advised whom (sell-side, buy-side, financing), deal size, strategic rationale, headline multiple if disclosed. Have a point of view — was it a good deal? What's the bull/bear case on the strategic logic? Don't pick the largest deal everyone mentions — pick one in a sector you can actually discuss.",
  },
  {
    id: "firm-recent-news",
    mode: "firm",
    topic: "Markets",
    difficulty: "medium",
    text: "What's a recent piece of news about our firm or our sector that caught your attention?",
    idealAnswerOutline:
      "Something specific from the last quarter — earnings commentary, leadership change, strategic initiative, sector trend. Show you read past the headline: 'CFO mentioned X in the call, which suggests Y about how the franchise is positioned.' Connect it to why it makes the firm interesting to you.",
  },

  // ---------- MIXED SUPERDAY ----------
  {
    id: "super-why-banking",
    mode: "superday",
    topic: "Why banking",
    difficulty: "medium",
    text: "Why investment banking and why now?",
    idealAnswerOutline:
      "Same as the why-banking behavioral, with a Superday twist: be tighter (60s), more polished, and confident. Reference one moment of conviction. Don't audition — answer like someone who has already decided.",
  },
  {
    id: "super-walk-resume-quick",
    mode: "superday",
    topic: "Pitch",
    difficulty: "easy",
    text: "Walk me through your resume in 90 seconds.",
    idealAnswerOutline:
      "60-90 second narrative arc (see beh-tell-me-about-yourself). Cut everything that isn't load-bearing. The hook → the most relevant experience → the connecting thread → today.",
  },
  {
    id: "super-paper-lbo",
    mode: "superday",
    topic: "LBO",
    difficulty: "hard",
    text: "Walk me through a paper LBO. Assume $100M EBITDA, 8x entry, 50% debt, 5-year hold, exit at 8x with 5% annual EBITDA growth. What's the IRR roughly?",
    idealAnswerOutline:
      "Entry EV = $800M. Equity check = $400M (50% debt). Year 5 EBITDA = $100M * 1.05^5 ≈ $128M. Exit EV at 8x = $1,022M. Assume some debt paydown (say $150-200M of FCF over 5 years), so exit debt ≈ $200-250M. Equity value at exit ≈ $770-820M. ~2x MOIC over 5 years ≈ ~15% IRR. Walk through the logic out loud, don't just blurt the answer.",
  },
  {
    id: "super-walk-dcf-fast",
    mode: "superday",
    topic: "DCF",
    difficulty: "medium",
    text: "Walk me through a DCF in under 60 seconds.",
    idealAnswerOutline:
      "Crisp 5-step version of the full DCF answer: project UFCF, discount at WACC, calc terminal value, discount it back, sum to EV, bridge to equity. Tight delivery. Cut every word that isn't earning its keep.",
  },
  {
    id: "super-tell-story",
    mode: "superday",
    topic: "Story",
    difficulty: "medium",
    text: "Tell me a story from your resume that shows me how you handle hard things.",
    idealAnswerOutline:
      "Pick the strongest STAR story in your bank — could be leadership, failure, or conflict. Make sure the 'hard thing' is genuinely hard (real stakes, real ambiguity, real ownership). 90 seconds max. End with what you took away, not 'and that's why I'd be a great fit at your firm.'",
  },
  {
    id: "super-questions-back",
    mode: "superday",
    topic: "Reverse",
    difficulty: "easy",
    text: "What questions do you have for me?",
    idealAnswerOutline:
      "Always have 3-4 ready, tailored to the interviewer's seniority and group. Good: ask about a specific deal they worked on, a sector view, what makes a great analyst on their team, what surprised them about the role. Bad: anything you could google, anything about comp/hours, vague 'culture' questions.",
  },
];

export function getQuestionsByMode(mode: InterviewMode): InterviewQuestion[] {
  return interviewQuestions.filter((q) => q.mode === mode);
}

export function pickRandomQuestion(
  mode: InterviewMode,
  excludeId?: string,
): InterviewQuestion {
  const pool = getQuestionsByMode(mode).filter((q) => q.id !== excludeId);
  const source = pool.length > 0 ? pool : getQuestionsByMode(mode);
  const picked = source[Math.floor(Math.random() * source.length)];
  if (!picked) throw new Error(`no interview questions available for mode: ${mode}`);
  return picked;
}
