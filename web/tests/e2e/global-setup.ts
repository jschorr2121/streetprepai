import fs from "node:fs";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";

import { AUTH_STORAGE_STATE_PATH } from "./_helpers";

/**
 * Playwright global setup — runs once before the whole test run, after
 * `webServer` is already up (Playwright starts `webServer` before invoking
 * `globalSetup`), so it's safe to hit the app here.
 *
 * When STREETPREP_E2E_AUTH=1 and STREETPREP_E2E_EMAIL / STREETPREP_E2E_PASSWORD
 * are set: sign in once via the real `/login` form and persist the resulting
 * Supabase session (cookies + localStorage) to AUTH_STORAGE_STATE_PATH
 * (tests/e2e/.auth/user.json, gitignored). Authed specs then opt in with
 * `test.use({ storageState: AUTH_STORAGE_STATE_PATH })` inside their gated
 * `test.describe` block.
 *
 * When the vars are absent (the CI default today), this is a no-op: no file
 * is written, and every authed spec stays skipped via
 * `test.skip(AUTH_SKIP_FLAG, ...)` regardless — Playwright never resolves a
 * skipped test's context fixture, so the missing storageState file is never
 * read. The existing ungated public specs (e.g. the signed-out redirect
 * check in auth.spec.ts) don't reference storageState at all and are
 * unaffected either way.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  if (!process.env.STREETPREP_E2E_AUTH) return;

  const email = process.env.STREETPREP_E2E_EMAIL;
  const password = process.env.STREETPREP_E2E_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[e2e/global-setup] STREETPREP_E2E_AUTH=1 but STREETPREP_E2E_EMAIL / STREETPREP_E2E_PASSWORD " +
        "are unset — skipping sign-in. Authed specs that depend on storageState will fail (not skip) " +
        "if they run without it.",
    );
    return;
  }

  const project = config.projects[0];
  const baseURL =
    (typeof project?.use?.baseURL === "string" ? project.use.baseURL : undefined) ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3000";
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

  const browser = await chromium.launch({ executablePath });
  try {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // A successful sign-in redirects to /dashboard (see login-form.tsx).
    await page.waitForURL(/\/dashboard(\?.*)?$/, { timeout: 20_000 });

    fs.mkdirSync(path.dirname(AUTH_STORAGE_STATE_PATH), { recursive: true });
    await context.storageState({ path: AUTH_STORAGE_STATE_PATH });
  } finally {
    await browser.close();
  }
}
