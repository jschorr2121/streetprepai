import { test, expect } from "@playwright/test";
import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON, AUTH_STORAGE_STATE_PATH } from "./_helpers";

/**
 * Account Settings — /profile/settings (relay session 8): data export entry
 * point + self-serve account deletion. See app/(app)/profile/settings/page.tsx,
 * app/(app)/profile/settings/actions.ts, components/profile/delete-account-dialog.tsx,
 * and app/api/account/export/route.ts.
 *
 * Auth strategy: AUTHED. Skip unless STREETPREP_E2E_AUTH=1.
 *
 * SAFETY (critical): `deleteAccountAction` is irreversible — it deletes
 * Storage objects, then the Supabase auth user, which cascades every
 * user-owned Postgres row via `on delete cascade`. There is no disposable
 * test account to sacrifice, so the deletion spec below asserts UI state
 * ONLY (dialog opens; the destructive "Permanently delete" button stays
 * disabled until the exact word DELETE is typed; typing it enables the
 * button) and closes via Escape. It must NEVER click the enabled destructive
 * button. Do not add a step that does.
 *
 * Export note: the download link is a plain `<a href="/api/account/export"
 * download>`, not a fetch call, so we intercept the GET via `page.route` and
 * fulfill a small mocked payload — this avoids exercising the real
 * `exportAccountData` query (an 18-table scan) or downloading real account
 * data in a test run, while still proving the link fires a request at the
 * right URL and that clicking it starts a download.
 */

test.describe("Account settings (golden path)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.use({ storageState: AUTH_STORAGE_STATE_PATH });

  test("loads settings and shows the data-export and danger-zone sections", async ({ page }) => {
    await page.goto("/profile/settings");
    await expect(page.locator("body")).not.toContainText("Application error");

    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
    await expect(page.getByText(/download a copy of your data/i)).toBeVisible();
    await expect(page.getByText(/danger zone/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^delete my account$/i })).toBeVisible();
  });

  test("export: the download link points at the export API route", async ({ page }) => {
    await page.goto("/profile/settings");

    const exportLink = page.getByRole("link", { name: /download your data/i });
    await expect(exportLink).toBeVisible();
    await expect(exportLink).toHaveAttribute("href", "/api/account/export");
  });

  test("export: clicking the download link fires a request to /api/account/export (mocked, no real export)", async ({
    page,
  }) => {
    let requestSeen = false;
    await page.route("**/api/account/export", async (route) => {
      requestSeen = true;
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "application/json",
          "content-disposition": 'attachment; filename="streetprep-export-mock.json"',
        },
        body: JSON.stringify({ meta: { app: "mock" }, data: {} }),
      });
    });

    await page.goto("/profile/settings");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: /download your data/i }).click();
    const download = await downloadPromise;

    expect(requestSeen).toBe(true);
    expect(download.suggestedFilename()).toBe("streetprep-export-mock.json");
  });

  test("delete account: confirm button stays disabled until DELETE is typed — dialog closed without submitting", async ({
    page,
  }) => {
    await page.goto("/profile/settings");

    await page.getByRole("button", { name: /^delete my account$/i }).click();
    await expect(page.getByText(/delete your account/i)).toBeVisible();

    const confirmInput = page.getByLabel(/confirmation phrase/i);
    const destructiveButton = page.getByRole("button", { name: /permanently delete/i });

    // Disabled with no input yet.
    await expect(destructiveButton).toBeDisabled();

    // Still disabled on a near-miss (wrong case).
    await confirmInput.fill("delete");
    await expect(destructiveButton).toBeDisabled();

    // Enabled only once the exact word is typed.
    await confirmInput.fill("DELETE");
    await expect(destructiveButton).toBeEnabled();

    // SAFETY: never click the now-enabled destructive button — see file
    // header. Close via Escape instead and confirm the dialog is gone.
    await page.keyboard.press("Escape");
    await expect(page.getByText(/delete your account/i)).not.toBeVisible();
  });
});
