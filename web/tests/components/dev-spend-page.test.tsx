/**
 * Server Component test for DevSpendPage (app/(app)/dev/spend/page.tsx).
 *
 * Unlike most pages in this app, the aggregation logic here (`rollupBy`,
 * `sum`, today-vs-month splitting) lives directly in the page file rather
 * than a `lib/` module — so exercising it means rendering the page and
 * reading the rolled-up numbers back out of the table, not just checking
 * that a child component got the right props.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import DevSpendPage from "@/app/(app)/dev/spend/page";
import { fakeUser } from "@/tests/fixtures/user";
import type { MyUsageRow } from "@/lib/db/queries/ai-usage";

const { requireUserMock, withUserMock, listMyUsageSinceMock } = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  withUserMock: vi.fn(),
  listMyUsageSinceMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));
vi.mock("@/lib/db/queries/ai-usage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db/queries/ai-usage")>();
  return { ...actual, listMyUsageSince: listMyUsageSinceMock };
});

function row(overrides: Partial<MyUsageRow>): MyUsageRow {
  return {
    endpoint: "chat/assistant",
    model: "claude-sonnet-4-5",
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    costUsd: 0.01,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Mirrors the page's own `usd` formatter exactly (same options), so the
// expected string always matches — including floating-point rounding
// artifacts from summing costUsd values — without hardcoding a guess at
// how many fraction digits a given sum happens to render with.
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/** Finds a Stat card's value by its eyebrow label, scoped to that card only. */
function statValue(label: string): string | null {
  const eyebrow = screen.getByText(label, { selector: "p.eyebrow" });
  return eyebrow.parentElement?.querySelector("p.tabular")?.textContent ?? null;
}

function setup(rows: MyUsageRow[]) {
  requireUserMock.mockResolvedValue(fakeUser());
  withUserMock.mockImplementation(async (_claims: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({}),
  );
  listMyUsageSinceMock.mockResolvedValue(rows);
}

describe("DevSpendPage", () => {
  it("shows the no-spend-yet message when the month has no usage rows", async () => {
    setup([]);

    render(await DevSpendPage());

    expect(screen.getByText(/no ai spend recorded yet this month/i)).toBeInTheDocument();
  });

  it("rolls up cost by endpoint and by model, summed correctly per group", async () => {
    setup([
      row({ endpoint: "chat/assistant", model: "claude-sonnet-4-5", costUsd: 0.02 }),
      row({ endpoint: "chat/assistant", model: "claude-sonnet-4-5", costUsd: 0.03 }),
      row({ endpoint: "interview/score", model: "claude-opus-4-7", costUsd: 0.1 }),
    ]);

    render(await DevSpendPage());

    // "This month" stat: 0.02 + 0.03 + 0.10, summed the same way the page does.
    const monthTotal = [0.02, 0.03, 0.1].reduce((t, c) => t + c, 0);
    expect(statValue("This month")).toBe(usd.format(monthTotal));

    // By-endpoint rollup: chat/assistant called twice, summed.
    const endpointTable = screen.getByText("By feature (endpoint) · this month").closest("div");
    const endpointRow = [...endpointTable!.querySelectorAll("tr")].find((tr) =>
      tr.textContent?.includes("chat/assistant"),
    );
    expect(endpointRow).toBeDefined();
    expect(endpointRow!.textContent).toContain("2");
    const endpointTotal = [0.02, 0.03].reduce((t, c) => t + c, 0);
    expect(endpointRow!.textContent).toContain(usd.format(endpointTotal));

    // By-model rollup: opus called once.
    const modelTable = screen.getByText("By model · this month").closest("div");
    const modelRow = [...modelTable!.querySelectorAll("tr")].find((tr) =>
      tr.textContent?.includes("claude-opus-4-7"),
    );
    expect(modelRow!.textContent).toContain(usd.format(0.1));
  });

  it("splits today's rows from the rest of the month for the 'Today' stat", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    setup([
      row({ costUsd: 0.05, createdAt: now.toISOString() }),
      row({ costUsd: 0.2, createdAt: yesterday.toISOString() }),
    ]);

    render(await DevSpendPage());

    expect(statValue("Today")).toBe(usd.format(0.05));
    const monthTotal = [0.05, 0.2].reduce((t, c) => t + c, 0);
    expect(statValue("This month")).toBe(usd.format(monthTotal));
  });
});
