import { test, expect } from "@playwright/test";
import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON } from "./_helpers";

/**
 * Auth strategy: AUTHED. /interview is part of the (app) shell which sits
 * behind the Supabase auth wall. Gated on STREETPREP_E2E_AUTH=1 + a
 * pre-provisioned session cookie.
 */

test.describe("Mock Interview Studio (golden path)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);

  test("open studio → pick a mode → recording controls + question render", async ({ page }) => {
    await page.goto("/interview");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Header text confirms we're on the right page
    await expect(
      page.getByRole("heading", { name: /voice-based interview practice/i }),
    ).toBeVisible();

    // The page shows a "Choose a mode" card with multiple mode buttons.
    await expect(page.getByText(/choose a mode/i)).toBeVisible();

    // Click the first available mode. Modes render as <button> with a label.
    // We pick the Behavioral one if present, else the first mode button.
    const behavioralCandidate = page.getByRole("button", {
      name: /behavioral/i,
    });
    if (
      await behavioralCandidate
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await behavioralCandidate.first().click();
    } else {
      // Fallback: click the first mode card. The mode cards are buttons
      // inside the grid. Use a stable locator.
      await page
        .locator("button")
        .filter({ hasText: /technical|behavioral|firm|markets/i })
        .first()
        .click();
    }

    // Once a mode is picked, the studio renders a question card with a
    // "Start recording" button. Verify both are visible.
    await expect(page.getByRole("button", { name: /start recording/i })).toBeVisible({
      timeout: 10_000,
    });

    // The "New question" control should also be present.
    await expect(page.getByRole("button", { name: /new question/i })).toBeVisible();

    // Do NOT actually start recording — that requires real microphone perms
    // which CI cannot provide. We've already verified the UI affordances.
  });
});
