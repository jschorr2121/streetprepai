import { test, expect } from "@playwright/test";

import {
  AUTH_SKIP_FLAG,
  AUTH_SKIP_REASON,
  AUTH_STORAGE_STATE_PATH,
  UI_MESSAGE_STREAM_HEADERS,
  buildUiMessageStream,
} from "./_helpers";

/**
 * Auth strategy: AUTHED, but AI-MOCKED. /tools/chatbot is behind the Supabase
 * auth wall, and its composer POSTs to /api/chat/assistant (Anthropic +
 * tools). We never gate on STREETPREP_E2E_LIVE_AI here — instead we
 * `page.route` the endpoint and fulfill a canned AI SDK v7 UI-message-stream
 * response, so this spec is free to run any time STREETPREP_E2E_AUTH is on
 * (`pnpm test:e2e`, not `test:e2e:live`).
 *
 * Wire format: see `buildUiMessageStream` in ./_helpers.ts — verified against
 * the installed ai@7.0.31 package, not training data.
 */

const MOCK_ASSISTANT_TEXT =
  "JPMorgan is a strong pick because of its scale, deal flow, and the breadth of groups you can rotate through.";

test.describe("Chatbot golden path (auth-gated, AI-mocked)", () => {
  test.skip(AUTH_SKIP_FLAG, AUTH_SKIP_REASON);
  test.use({ storageState: AUTH_STORAGE_STATE_PATH });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/chat/assistant", async (route) => {
      await route.fulfill({
        status: 200,
        headers: UI_MESSAGE_STREAM_HEADERS,
        body: buildUiMessageStream(MOCK_ASSISTANT_TEXT),
      });
    });
  });

  test("new thread → send a message → mocked reply renders → URL gains ?thread=<uuid>", async ({
    page,
  }) => {
    await page.goto("/tools/chatbot?thread=new");
    await expect(page.locator("body")).not.toContainText("Application error");

    const composer = page.getByPlaceholder(/ask about technicals, recruiting, networking/i);
    await expect(composer).toBeVisible();
    await composer.fill("why JPM");

    await page.getByRole("button", { name: /send message/i }).click();

    // The mocked assistant text should render in the conversation.
    await expect(page.getByText(MOCK_ASSISTANT_TEXT)).toBeVisible({ timeout: 15_000 });

    // On the first turn of a new thread, the client picks its own thread id
    // up front and syncs the URL once the stream finishes (see chat.tsx's
    // onFinish → router.replace).
    await expect(page).toHaveURL(
      /\/tools\/chatbot\?thread=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      { timeout: 15_000 },
    );
  });

  test("after sending, the thread rail shows an entry for the conversation", async ({ page }) => {
    await page.goto("/tools/chatbot?thread=new");

    const composer = page.getByPlaceholder(/ask about technicals, recruiting, networking/i);
    await composer.fill("why JPM");
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByText(MOCK_ASSISTANT_TEXT)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/[?&]thread=([0-9a-f-]{36})$/i, { timeout: 15_000 });

    // Pull the freshly-minted thread id out of the URL so we can look for its
    // exact rail entry — the rail also has a static "New chat" link whose
    // href ends in `thread=new`, so a loose href-contains match would
    // over-count.
    const url = new URL(page.url());
    const threadId = url.searchParams.get("thread");
    expect(threadId).toMatch(/^[0-9a-f-]{36}$/i);

    // The rail re-renders (router.refresh() in onFinish) with a link to the
    // new thread. Tolerate any title text — LLM auto-titling is landing
    // concurrently with this spec, so we don't assert on specific wording,
    // only that a conversation entry now exists in the "Past conversations"
    // nav.
    const rail = page.getByRole("navigation", { name: /past conversations/i });
    await expect(rail).toBeVisible();
    await expect(rail.locator(`a[href="/tools/chatbot?thread=${threadId}"]`)).toBeVisible({
      timeout: 15_000,
    });
  });
});
