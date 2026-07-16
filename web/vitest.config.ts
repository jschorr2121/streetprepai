import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

/**
 * Vitest is split into two project workspaces:
 *
 *  - `node`     — for `lib/*` units and `app/api/**` integration tests.
 *                 No DOM. Mocks Supabase and AI SDKs via MSW + module mocks.
 *
 *  - `dom`      — for component tests under `tests/components/`. Uses
 *                 `happy-dom`, `@testing-library/react`, jest-dom matchers.
 *
 * Run a single project with `pnpm test --project node` or `--project dom`.
 * Run everything with `pnpm test:unit`.
 *
 * Playwright E2E lives in `tests/e2e/` and is owned by `playwright.config.ts` —
 * the `e2e` glob is excluded here so vitest does not try to evaluate Playwright specs.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["lib/**/*.ts", "lib/**/*.tsx", "components/**/*.tsx"],
      exclude: ["lib/**/*.d.ts", "lib/data/*-fixture.ts", "**/index.ts"],
      thresholds: {
        // Wave 3 target — enforced in CI by Wave 6.
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    projects: [
      {
        plugins: [tsconfigPaths()],
        resolve: { alias: { "@": path.resolve(__dirname) } },
        test: {
          name: "node",
          environment: "node",
          // lib/**/*.test.ts covers colocated pure-function tests (the
          // code-standards convention) — without it lib/mastery/mastery.test.ts
          // silently never ran.
          include: [
            "tests/unit/**/*.test.ts",
            "tests/integration/**/*.test.ts",
            "lib/**/*.test.ts",
          ],
          setupFiles: ["./tests/setup/node.ts"],
        },
      },
      {
        plugins: [tsconfigPaths()],
        resolve: { alias: { "@": path.resolve(__dirname) } },
        test: {
          name: "dom",
          environment: "happy-dom",
          include: ["tests/components/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/setup/dom.ts"],
        },
      },
    ],
  },
});
