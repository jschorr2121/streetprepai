import { test, expect } from "@playwright/test";
import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON } from "./_helpers";

/**
 * Auth strategy: AUTHED. /profile loads the logged-in user's profile via the
 * `saveProfileAction` Server Action. Skip unless STREETPREP_E2E_AUTH=1.
 *
 * Unit 6 note: the form now submits via a Server Action (not fetch('/api/…')),
 * so we wait for a full-page navigation / refresh to confirm persistence rather
 * than intercepting an API response.
 */

test.describe("Profile (golden path)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.setTimeout(45_000);

  test("load profile → edit a field → save → reload preserves the change", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Header confirms we're on the profile page.
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();

    // Edit the "Full name" field.
    const fullNameInput = page.getByPlaceholder(/jake schorr/i).first();
    await expect(fullNameInput).toBeVisible();

    const newName = `E2E User ${Date.now()}`;
    await fullNameInput.fill(newName);

    // Click save — the Server Action runs and the page refreshes via router.refresh().
    await page.getByRole("button", { name: /save profile/i }).click();

    // Wait for the "Saved." toast to confirm the action succeeded.
    await expect(page.getByText(/saved\./i)).toBeVisible({ timeout: 15_000 });

    // Reload and verify the value persisted.
    await page.reload();
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();

    const reloadedInput = page.getByPlaceholder(/jake schorr/i).first();
    await expect(reloadedInput).toHaveValue(newName, { timeout: 15_000 });
  });
});
