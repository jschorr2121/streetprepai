import { defineConfig, devices } from "@playwright/test";

// E2E config. `baseURL` lets specs use relative `page.goto("/dashboard")`.
// We do NOT manage a webServer here — point PLAYWRIGHT_BASE_URL at a running
// dev server (default http://localhost:3000). Authed specs are gated behind
// STREETPREP_E2E_AUTH=1 (see tests/e2e/_helpers.ts).
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
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
