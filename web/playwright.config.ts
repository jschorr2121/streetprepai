import { defineConfig, devices } from "@playwright/test";

// E2E config. `baseURL` lets specs use relative `page.goto("/dashboard")`.
//
// `webServer` makes `pnpm test:e2e` self-sufficient: if nothing is already
// listening on PLAYWRIGHT_BASE_URL, Playwright builds + starts a production
// server itself and tears it down after the run. We deliberately use
// `next build && next start` rather than `next dev`: Turbopack dev compiles
// routes on demand on first request, and that first-compile latency can blow
// past a spec's per-action timeout (navigations default to the 60s test
// timeout, but subsequent `expect(...).toBeVisible()` polls use a much
// shorter default). A production server has no such warm-up cost once
// Playwright's health check (`url`) succeeds.
//
// Locally, point PLAYWRIGHT_BASE_URL at an already-running dev server (e.g.
// `pnpm dev`) to skip the build+start and reuse it instead
// (`reuseExistingServer` is true outside of CI).
// Authed specs are gated behind STREETPREP_E2E_AUTH=1 (see tests/e2e/_helpers.ts).
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    headless: true,
    trace: "off",
    // Escape hatch for sandboxes that pre-seed a browser binary at a fixed
    // path instead of matching whatever revision this @playwright/test
    // version expects (the default `pnpm exec playwright install` step in
    // CI keeps the two in sync, so this stays unset there).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
