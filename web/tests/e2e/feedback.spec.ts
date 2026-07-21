import { test, expect } from "@playwright/test";
import { AUTH_SKIP_FLAG, AUTH_SKIP_REASON, AUTH_STORAGE_STATE_PATH } from "./_helpers";

/**
 * Feedback widget (relay session 8) — floating trigger mounted on every authed
 * page via `(app)/layout.tsx` (see components/feedback/feedback-widget.tsx).
 *
 * Auth strategy: AUTHED. Skip unless STREETPREP_E2E_AUTH=1.
 *
 * We deliberately never click "Send": `submitFeedbackAction` is a Server
 * Action posted to the page's own URL (see lib/feedback/actions.ts), not a
 * fetch()'d API route, so there's no HTTP route to intercept the way
 * chatbot.spec.ts mocks /api/chat/assistant — clicking it for real would
 * write a live row via `createFeedback`. The submit/success/error paths are
 * already covered at the unit level in
 * tests/components/feedback-widget.test.tsx; this spec only proves the real
 * mount + open + disabled-on-empty-input behavior end to end.
 */

test.describe("Feedback widget (auth-gated)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.use({ storageState: AUTH_STORAGE_STATE_PATH });

  test("floating trigger opens the dialog; Send stays disabled until non-whitespace input", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).not.toContainText("Application error");

    const trigger = page.getByRole("button", { name: /^feedback$/i });
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page.getByText("Send feedback")).toBeVisible();

    const send = page.getByRole("button", { name: /^send$/i });
    await expect(send).toBeDisabled();

    const textarea = page.getByLabel(/feedback message/i);
    await textarea.fill("   ");
    await expect(send).toBeDisabled();

    await textarea.fill("This is a great feature");
    await expect(send).toBeEnabled();

    // Deliberately NOT clicking Send — see file header. Close instead.
    await page.keyboard.press("Escape");
    await expect(page.getByText("Send feedback")).not.toBeVisible();
  });
});
