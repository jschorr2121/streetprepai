import { test, expect } from "@playwright/test";
import { SAMPLE_GUIDE_SLUG, LIVE_AI_SKIP_FLAG, LIVE_AI_SKIP_REASON } from "./_helpers";

/**
 * /guide/<slug> is public, but the chat panel hits /api/chat/stream which (a)
 * is now `requireUser`-gated and (b) calls Claude on a happy path. So this
 * spec is COST-GATED — opt in via STREETPREP_E2E_LIVE_AI=1 (`pnpm test:e2e:live`).
 * When opted in, you also need a logged-in storageState so requireUser passes.
 */

test.describe("Chat with guide (live Anthropic — costs $)", () => {
  test.skip(LIVE_AI_SKIP_FLAG, LIVE_AI_SKIP_REASON);
  test.setTimeout(60_000); // streaming first-token latency

  test("open guide → chat tab → send message → response streams in", async ({ page }) => {
    await page.goto(`/guide/${SAMPLE_GUIDE_SLUG}`);

    // App-error guard
    await expect(page.locator("body")).not.toContainText("Application error");

    // Switch to the Chat tab in the right rail
    const chatTab = page.getByRole("tab", { name: /chat/i });
    await expect(chatTab).toBeVisible();
    await chatTab.click();

    // Type a question and send. Use the placeholder to find the textarea.
    const composer = page.getByPlaceholder(/ask about this guide/i);
    await expect(composer).toBeVisible();
    await composer.fill("In one sentence, what is a DCF?");

    // Fire-and-track the streaming request.
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/chat/stream") && res.request().method() === "POST",
      { timeout: 30_000 },
    );

    // Submit via Enter (without Shift) — the component wires this up.
    await composer.press("Enter");

    const res = await responsePromise;
    expect(res.status()).toBe(200);

    // Wait for the assistant bubble to render some text. The component shows
    // a Loader2 icon while waiting and swaps to <Markdown> once tokens
    // arrive. We assert that some body text grows over time.
    //
    // Scope to the assistant bubble (bg-muted styling) — the user bubble
    // already contains text, so we look for any rendered markdown div.
    const assistantBubble = page.locator(".bg-muted").last();

    // First, verify the user message appeared (bubble exists).
    await expect(page.locator("text=In one sentence, what is a DCF?")).toBeVisible();

    // Wait for any non-empty assistant text. Allow up to 45s for first token.
    await expect
      .poll(async () => (await assistantBubble.innerText()).trim().length, {
        timeout: 45_000,
        intervals: [500, 1000, 2000],
      })
      .toBeGreaterThan(5);

    // Confirm growth: the panel should keep growing for a moment.
    const lenA = (await assistantBubble.innerText()).length;
    await page.waitForTimeout(1500);
    const lenB = (await assistantBubble.innerText()).length;
    // Either it's still streaming (lenB > lenA) or it finished and stayed put.
    expect(lenB).toBeGreaterThanOrEqual(lenA);
  });
});
