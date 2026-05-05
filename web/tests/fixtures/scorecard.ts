/**
 * Deterministic interview scorecard fixture used by integration tests for
 * /api/interview/score.
 */
export function fakeScorecard() {
  return {
    overall: 72,
    summary: "Solid framework, missed terminal value step.",
    strengths: ["clear walkthrough", "good intro"],
    improvements: ["explain WACC components", "tighten close"],
    rubric: {
      content: { score: 70, notes: "covered DCF basics" },
      delivery: { score: 75, notes: "calm pace" },
      structure: { score: 70, notes: "linear, hit main beats" },
    },
  };
}
