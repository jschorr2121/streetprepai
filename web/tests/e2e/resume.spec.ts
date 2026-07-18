import { test, expect } from "@playwright/test";
import {
  AUTH_SKIP_FLAG,
  AUTH_SKIP_REASON,
  AUTH_STORAGE_STATE_PATH,
  LIVE_AI_SKIP_FLAG,
  LIVE_AI_SKIP_REASON,
  SAMPLE_RESUME_TEXT,
} from "./_helpers";

/**
 * Auth strategy: AUTHED + LIVE-AI. /resume is behind Supabase auth, and
 * /api/resume/critique calls Claude. Both gates must be on.
 */

test.describe("Resume Coach (live Anthropic — costs $)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.skip(LIVE_AI_SKIP_FLAG, LIVE_AI_SKIP_REASON);
  test.use({ storageState: AUTH_STORAGE_STATE_PATH });
  test.setTimeout(60_000); // critique runs Claude end-to-end

  test("paste resume text → review → response area populates", async ({ page }) => {
    await page.goto("/resume");
    await expect(page.locator("body")).not.toContainText("Application error");

    // The Resume Coach offers Upload + Paste tabs. Switch to Paste explicitly.
    const pasteTab = page.getByRole("tab", { name: /paste text/i });
    if (await pasteTab.isVisible().catch(() => false)) {
      await pasteTab.click();
    }

    const textarea = page.getByPlaceholder(/paste the full text of your resume/i);
    await expect(textarea).toBeVisible();
    await textarea.fill(SAMPLE_RESUME_TEXT);

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/resume/critique") && res.request().method() === "POST",
      { timeout: 50_000 },
    );

    await page.getByRole("button", { name: /review resume/i }).click();

    const res = await responsePromise;
    expect(res.status()).toBe(200);

    // After critique completes, the result panel renders bullet feedback.
    // The component uses words like "Critique" / "bullet" / "rewrite" in the
    // result UI; we just assert SOME critique result text grows in the page.
    await expect
      .poll(async () => (await page.locator("body").innerText()).length, {
        timeout: 50_000,
        intervals: [1000, 2000],
      })
      .toBeGreaterThan(SAMPLE_RESUME_TEXT.length + 50);

    // Look for one of the expected result indicators ("Apply all", "Reset",
    // "Revert", or any score wording). Falling back generously.
    const resultsLocator = page
      .locator("body")
      .getByText(/apply all|critique|rewrite|reset|score/i)
      .first();
    await expect(resultsLocator).toBeVisible({ timeout: 10_000 });
  });
});
