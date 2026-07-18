import { test, expect, type Page } from "@playwright/test";

import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON, AUTH_STORAGE_STATE_PATH } from "./_helpers";

/**
 * Auth strategy: AUTHED, NO live AI. /tools/question-bank is behind the
 * Supabase auth wall. Grading (`gradeAnswerAction`) calls Claude, but
 * *serving* a question by topic/difficulty (`serveQuestionAction`) is a pure
 * DB read (see app/(app)/tools/question-bank/actions.ts) — no HTTP route to
 * intercept (it's a Server Action posted to the page URL), so instead of
 * mocking we simply never trigger grading. This keeps the spec free of the
 * STREETPREP_E2E_LIVE_AI gate while still exercising a real serve → render →
 * enable-submit flow end to end.
 *
 * We drive the "By topic" tab rather than the daily drill: the daily set
 * depends on this account's review/progress history and may be empty for a
 * fresh user, while "By topic" always lets us explicitly request a
 * topic + difficulty via `data-testid` chips added to
 * components/learn/question-bank-studio.tsx for this spec.
 */

async function serveAQuestion(page: Page) {
  await page.getByRole("tab", { name: /by topic/i }).click();

  // Pick whichever topic chip renders first — the exact set comes from the
  // curriculum manifest and isn't worth hard-coding.
  await page.locator('[data-testid^="qbank-topic-"]').first().click();

  const composer = page.getByPlaceholder(/answer as you would out loud in the interview/i);

  // A given topic + difficulty combination can legitimately have zero
  // questions ("No questions for that combination yet"); try each difficulty
  // before giving up so the spec doesn't flake on question-bank content gaps.
  for (const difficulty of ["medium", "easy", "hard"] as const) {
    await page.getByTestId(`qbank-difficulty-${difficulty}`).click();
    await page.getByTestId("qbank-serve-button").click();
    if (await composer.isVisible({ timeout: 8_000 }).catch(() => false)) {
      return composer;
    }
  }
  throw new Error("serveQuestionAction returned no question for any difficulty on this topic.");
}

test.describe("Question Bank (auth-gated, no live AI)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.use({ storageState: AUTH_STORAGE_STATE_PATH });
  test.setTimeout(45_000);

  test("loads the studio and its tabs", async ({ page }) => {
    await page.goto("/tools/question-bank");
    await expect(page.locator("body")).not.toContainText("Application error");

    await expect(page.getByRole("heading", { name: /drill until it.?s automatic/i })).toBeVisible();

    await expect(page.getByRole("tab", { name: /daily drill/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /by topic/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /mental math/i })).toBeVisible();
  });

  test("by topic: pick topic + difficulty → question renders → typing an answer enables submit", async ({
    page,
  }) => {
    await page.goto("/tools/question-bank");

    const composer = await serveAQuestion(page);
    await expect(composer).toBeVisible();

    // The question prompt itself renders as a <p> right above the composer,
    // inside AnswerCard — assert some non-empty prompt text is showing.
    const prompt = page.locator("p.font-medium").first();
    await expect(prompt).toBeVisible();
    await expect(prompt).not.toHaveText("");

    const submit = page.getByRole("button", { name: /submit for grading/i });
    await expect(submit).toBeVisible();
    await expect(submit).toBeDisabled();

    await composer.fill("A DCF discounts projected free cash flows back at the WACC.");
    await expect(submit).toBeEnabled();

    // Deliberately NOT clicking submit — grading calls Claude live and this
    // spec must stay free of STREETPREP_E2E_LIVE_AI.
  });
});
