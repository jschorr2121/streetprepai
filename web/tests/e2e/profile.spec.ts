import { test, expect } from "@playwright/test";
import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON } from "./_helpers";

/**
 * Auth strategy: AUTHED. /profile loads the logged-in user's profile via
 * /api/profile/save and Supabase. Skip unless STREETPREP_E2E_AUTH=1.
 */

test.describe("Profile (golden path)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.setTimeout(45_000);

  test("load profile → edit a field → save → reload preserves the change", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Header confirms we're on the profile page.
    await expect(page.getByRole("heading", { name: /bio.*background/i })).toBeVisible();

    // Edit the "Full name" field (first input under "Basics" → Full name).
    const fullNameInput = page.getByPlaceholder(/jake schorr/i).first();
    await expect(fullNameInput).toBeVisible();

    const newName = `E2E User ${Date.now()}`;
    await fullNameInput.fill(newName);

    // Save the profile.
    const savePromise = page.waitForResponse(
      (res) => res.url().includes("/api/profile/save") && res.request().method() === "POST",
      { timeout: 15_000 },
    );

    await page.getByRole("button", { name: /save profile/i }).click();
    const res = await savePromise;
    expect(res.status()).toBe(200);

    // Reload and verify the value persisted.
    await page.reload();
    await expect(page.getByRole("heading", { name: /bio.*background/i })).toBeVisible();

    const reloadedInput = page.getByPlaceholder(/jake schorr/i).first();
    await expect(reloadedInput).toHaveValue(newName, { timeout: 15_000 });
  });
});
