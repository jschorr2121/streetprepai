import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { AppNav } from "@/components/app-nav";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

// SidebarProfileMenu is owned by its own test suite — stub it so this file
// only exercises AppNav's own layout/nav-state logic.
vi.mock("@/components/auth/sidebar-profile-menu", () => ({
  SidebarProfileMenu: ({ email }: { email: string }) => (
    <div data-testid="sidebar-profile-menu">{email}</div>
  ),
}));

describe("AppNav", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
  });

  it("marks the exact-match Dashboard link active only on /dashboard itself", () => {
    usePathnameMock.mockReturnValue("/dashboard/settings");
    render(<AppNav email="jane@test.com" />);

    const desktopNav = document.querySelector("aside nav") as HTMLElement;
    expect(within(desktopNav).getByRole("link", { name: /dashboard/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks a nested-route link active via startsWith, unlike Dashboard", () => {
    usePathnameMock.mockReturnValue("/firms/goldman-sachs");
    render(<AppNav email="jane@test.com" />);

    const desktopNav = document.querySelector("aside nav") as HTMLElement;
    expect(within(desktopNav).getByRole("link", { name: /firms/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders every top-level and grouped nav destination once on desktop", () => {
    usePathnameMock.mockReturnValue("/dashboard");
    render(<AppNav email="jane@test.com" />);

    const desktopNav = document.querySelector("aside nav") as HTMLElement;
    const labels = [
      "Dashboard",
      "Learn",
      "Mock Interview",
      "Resume Coach",
      "Relationships",
      "Applications",
      "Chatbot",
      "Story Framer",
      "Question Bank",
      "Firms",
      "Sectors",
      "Profile",
      "Progress",
    ];
    for (const label of labels) {
      expect(within(desktopNav).getByRole("link", { name: new RegExp(label, "i") })).toBeVisible();
    }
  });

  it("opens the mobile drawer and closes it after a nav link is clicked", () => {
    usePathnameMock.mockReturnValue("/dashboard");
    render(<AppNav email="jane@test.com" fullName="Jane Test" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("link", { name: /learn/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
