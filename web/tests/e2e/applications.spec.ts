import { test, expect } from "@playwright/test";
import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON } from "./_helpers";

/**
 * Application Tracker — golden-path E2E (Unit 7).
 *
 * Auth strategy: AUTHED. Skip unless STREETPREP_E2E_AUTH=1.
 *
 * Flow: add application → appears in list → filter → hidden → clear filter
 *       → edit stage inline → delete → gone.
 *
 * Note: This test cannot run headlessly in the current dev environment because
 * it requires a live Supabase auth session (storageState). To run locally:
 *   STREETPREP_E2E_AUTH=1 pnpm test:e2e --grep applications
 * and ensure a valid Playwright storageState is configured in playwright.config.ts.
 */

test.describe("Application Tracker (golden path)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.setTimeout(60_000);

  test("add → appears → filter hides it → clear filter → stage edit → delete → gone", async ({
    page,
  }) => {
    await page.goto("/tools/applications");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Confirm we're on the applications page.
    await expect(page.getByRole("heading", { name: /applications/i })).toBeVisible();

    // ── Add a new application ──────────────────────────────────────────────
    const firm = `E2E Firm ${Date.now()}`;
    await page.getByLabel(/firm/i).fill(firm);
    await page.getByLabel(/role/i).fill("Summer Analyst");

    // Select "applied" stage (it's the default, but be explicit).
    await page.getByLabel(/^stage/i).selectOption("applied");

    await page.getByRole("button", { name: /add application/i }).click();

    // Wait for the row to appear.
    const row = page.getByTestId("application-row").filter({ hasText: firm });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ── Filter by a different stage — row should be hidden ────────────────
    await page.getByRole("link", { name: /^interview$/i }).click();

    // The row for our firm should not be visible.
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    // ── Clear filter ("All") — row reappears ─────────────────────────────
    await page.getByRole("link", { name: /^all$/i }).click();
    await expect(row).toBeVisible({ timeout: 10_000 });

    // ── Edit stage inline to "interview" ─────────────────────────────────
    const stageSelect = row.getByRole("combobox", { name: /stage/i });
    await stageSelect.selectOption("interview");

    // Wait for the router refresh (the row re-renders with new stage).
    await page.waitForTimeout(1500);

    // Filter by "interview" — our row should now appear.
    await page.getByRole("link", { name: /^interview$/i }).click();
    await expect(row).toBeVisible({ timeout: 10_000 });

    // ── Delete the application ────────────────────────────────────────────
    await row.getByRole("button", { name: /delete application/i }).click();

    // Confirm the row is gone.
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  });
});
