import { test, expect } from "@playwright/test";
import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON } from "./_helpers";

/**
 * Auth strategy: AUTHED. The tracker board hits /api/applied-jobs which
 * requires a logged-in user (requireUser gate). Gated on STREETPREP_E2E_AUTH.
 */

test.describe("Jobs hub + tracker board (golden path)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);

  test("open /jobs → switch to tracker → board columns render → add a job → it shows up", async ({
    page,
  }) => {
    await page.goto("/jobs");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Switch to the Tracker tab.
    await page.getByRole("button", { name: /my tracker/i }).click();

    // All 6 stage columns should render.
    const stageLabels = ["Shortlist", "Applied", "Interview", "Superday", "Offer", "Rejected"];
    for (const label of stageLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
    }

    // Add a job into the Shortlist column. The "Add Job" button appears once
    // per column; click the one in Shortlist (the first column).
    const addButtons = page.getByRole("button", { name: /add job/i });
    await addButtons.first().click();

    // The dialog should open with title "Add to Tracker".
    await expect(page.getByRole("heading", { name: /add to tracker/i })).toBeVisible({
      timeout: 5_000,
    });

    // Fill the firm + role. Find inputs by label or placeholder where possible.
    // The dialog uses Label + Input pairs; locate by surrounding label text.
    const uniqueFirm = `E2E Test Firm ${Date.now()}`;

    // Use the first text input in the dialog as Firm (component renders
    // "Firm" as the first field); fall back to placeholder-driven locators
    // if the label form changes.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Try by label first, then fall back to "the first textbox in the dialog".
    const firmInput = dialog.locator("input").first();
    await firmInput.fill(uniqueFirm);

    // Click the dialog's submit "Add Job" button (last "Add Job" in the page,
    // since the column buttons share the same label).
    const submitPromise = page.waitForResponse(
      (res) => res.url().includes("/api/applied-jobs") && res.request().method() === "POST",
      { timeout: 15_000 },
    );

    // The submit button is inside the dialog; scope to dialog and click "Add Job".
    await dialog.getByRole("button", { name: /^add job$/i }).click();

    const res = await submitPromise;
    expect([200, 201]).toContain(res.status());

    // The new job should now appear somewhere on the page (in the Shortlist
    // column). Use a forgiving timeout for the optimistic re-fetch.
    await expect(page.getByText(uniqueFirm)).toBeVisible({ timeout: 15_000 });
  });
});
