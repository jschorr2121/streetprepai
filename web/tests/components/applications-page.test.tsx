/**
 * Server Component test for ApplicationsPage
 * (app/(app)/tools/applications/page.tsx).
 *
 * The page's own logic is the `?stage=` validation (silently drops unknown
 * values instead of erroring) and the empty-state copy, which differs
 * depending on whether a stage filter is active. ApplicationForm,
 * ApplicationRow, and StageFilter each need their own client-hook
 * scaffolding (useRouter, react-hook-form) and aren't this page's job to
 * verify, so they're stubbed — same approach as
 * question-bank-studio.test.tsx stubbing AnswerCard/PracticeSession/DrillRunner.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import ApplicationsPage from "@/app/(app)/tools/applications/page";
import { fakeUser } from "@/tests/fixtures/user";
import type { AppliedJob } from "@/lib/types";

const { requireUserMock, withUserMock, getApplicationsMock } = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  withUserMock: vi.fn(),
  getApplicationsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));
vi.mock("@/lib/db/queries/applications", () => ({ getApplications: getApplicationsMock }));
vi.mock("@/app/(app)/tools/applications/_components/application-form", () => ({
  ApplicationForm: () => <div data-testid="application-form" />,
}));
vi.mock("@/app/(app)/tools/applications/_components/application-row", () => ({
  ApplicationRow: ({ application }: { application: AppliedJob }) => (
    <div data-testid="application-row">
      {application.firm} — {application.role}
    </div>
  ),
}));
vi.mock("@/app/(app)/tools/applications/_components/stage-filter", () => ({
  StageFilter: () => <div data-testid="stage-filter" />,
}));

function setup(applications: AppliedJob[]) {
  requireUserMock.mockResolvedValue(fakeUser());
  withUserMock.mockImplementation(async (_claims: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({}),
  );
  getApplicationsMock.mockResolvedValue(applications);
}

const app: AppliedJob = {
  id: "app_1",
  firm: "Goldman Sachs",
  role: "IB Summer Analyst",
  stage: "applied",
  addedAt: "2026-04-01T00:00:00.000Z",
};

describe("ApplicationsPage", () => {
  it("shows the unfiltered empty state and queries with no stage filter when there's no ?stage param", async () => {
    setup([]);

    render(await ApplicationsPage({ searchParams: Promise.resolve({}) }));

    expect(getApplicationsMock).toHaveBeenCalledWith(expect.anything(), fakeUser().id, {});
    expect(screen.getByText("No applications yet.")).toBeInTheDocument();
  });

  it("passes a valid ?stage param through to the query and renders the returned rows", async () => {
    setup([app]);

    render(await ApplicationsPage({ searchParams: Promise.resolve({ stage: "applied" }) }));

    expect(getApplicationsMock).toHaveBeenCalledWith(expect.anything(), fakeUser().id, {
      stage: "applied",
    });
    expect(screen.getByText(/Goldman Sachs — IB Summer Analyst/)).toBeInTheDocument();
    expect(screen.queryByText("No applications yet.")).not.toBeInTheDocument();
  });

  it("silently drops an unknown ?stage value instead of passing it to the query", async () => {
    setup([]);

    render(await ApplicationsPage({ searchParams: Promise.resolve({ stage: "bogus-stage" }) }));

    expect(getApplicationsMock).toHaveBeenCalledWith(expect.anything(), fakeUser().id, {});
    expect(screen.getByText("No applications yet.")).toBeInTheDocument();
  });

  it("shows stage-specific empty copy for a valid, empty stage filter", async () => {
    setup([]);

    render(await ApplicationsPage({ searchParams: Promise.resolve({ stage: "offer" }) }));

    expect(screen.getByText("No offer applications yet.")).toBeInTheDocument();
  });
});
