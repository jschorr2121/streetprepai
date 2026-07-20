/**
 * Server Component test for OnboardingPage (app/(app)/onboarding/page.tsx).
 *
 * Middleware already gates this route, but the page re-checks server-side:
 * an already-onboarded user hitting it directly gets bounced to /dashboard
 * via `redirect()` rather than shown the form again.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import OnboardingPage from "@/app/(app)/onboarding/page";
import { fakeProfile } from "@/tests/fixtures/profile";
import { fakeUser } from "@/tests/fixtures/user";

const { requireUserMock, withUserMock, getProfileMock, redirectMock } = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  withUserMock: vi.fn(),
  getProfileMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));
vi.mock("@/lib/db/queries/profile", () => ({ getProfile: getProfileMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/app/(app)/onboarding/onboarding-form", () => ({
  OnboardingForm: () => <div data-testid="onboarding-form" />,
}));

beforeEach(() => {
  requireUserMock.mockResolvedValue(fakeUser());
  withUserMock.mockImplementation(async (_claims: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({}),
  );
});

describe("OnboardingPage", () => {
  it("renders the onboarding form for a user who hasn't onboarded yet", async () => {
    getProfileMock.mockResolvedValue(fakeProfile({ onboardedAt: undefined }));

    render(await OnboardingPage());

    expect(screen.getByTestId("onboarding-form")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard instead of rendering the form for an already-onboarded user", async () => {
    getProfileMock.mockResolvedValue(fakeProfile({ onboardedAt: "2026-01-01T00:00:00.000Z" }));

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
