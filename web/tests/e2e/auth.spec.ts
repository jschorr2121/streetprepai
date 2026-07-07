import { test, expect } from "@playwright/test";

import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON } from "./_helpers";

/**
 * Unit 4 — Auth UI + middleware + onboarding.
 *
 * Two specs:
 *  1. PUBLIC (always runs): a signed-out visit to /dashboard redirects to /login.
 *     This exercises the proxy/middleware gate without needing a session.
 *  2. AUTHED (skipped unless STREETPREP_E2E_AUTH=1): full signup → onboarding →
 *     dashboard happy path. Requires a running dev server, a fresh unique email,
 *     and email-confirmation OFF in the Supabase project (the locked dev setting).
 */

test.describe("Auth gating (public)", () => {
  test("signed-out visit to /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});

test.describe("Signup → onboarding → dashboard (golden path)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.setTimeout(60_000);

  test("a new user signs up, onboards, and lands on the dashboard", async ({ page }) => {
    const email = `e2e+${Date.now()}@streetprep.test`;
    const password = "e2e-password-123";

    // --- Sign up ---
    await page.goto("/signup");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    // Email confirmation is OFF in dev → signup yields a live session → we are
    // routed straight into onboarding.
    await expect(page).toHaveURL(/\/onboarding(\?.*)?$/, { timeout: 20_000 });

    // --- Onboarding (4 fields) ---
    await page.getByLabel(/school/i).fill("University of Michigan");
    await page.getByLabel(/graduation year/i).fill(String(new Date().getUTCFullYear() + 2));

    // Semester select (radix). Open and choose.
    await page.getByLabel(/current semester/i).click();
    await page.getByRole("option", { name: "Sophomore Fall" }).click();

    // Target firm via the suggestion chip.
    await page.getByRole("button", { name: /\+ Goldman Sachs/i }).click();

    await page.getByRole("button", { name: /finish setup/i }).click();

    // --- Dashboard ---
    await expect(page).toHaveURL(/\/dashboard(\?.*)?$/, { timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText("Application error");

    // Re-visiting onboarding now redirects to the dashboard (already onboarded).
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/dashboard(\?.*)?$/);

    // And hitting /login while signed in also redirects into the app.
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard(\?.*)?$/);
  });
});
