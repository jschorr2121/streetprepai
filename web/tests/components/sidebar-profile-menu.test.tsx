import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { SidebarProfileMenu } from "@/components/auth/sidebar-profile-menu";
import { signOutAction } from "@/lib/auth/actions";

vi.mock("@/lib/auth/actions", () => ({
  signOutAction: vi.fn(),
}));

const mockedSignOutAction = vi.mocked(signOutAction);

// Radix DropdownMenu opens on `pointerdown`, not `click`.
function openMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: /alex chen/i }), { button: 0 });
}

beforeEach(() => {
  mockedSignOutAction.mockReset();
  mockedSignOutAction.mockResolvedValue(undefined);
});

describe("SidebarProfileMenu", () => {
  it("shows the full name and initials when a full name is given", () => {
    render(<SidebarProfileMenu email="alex@example.com" fullName="Alex Chen" />);
    expect(screen.getByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByText("AC")).toBeInTheDocument();
    // Email is shown as the secondary line under the name.
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
  });

  it("falls back to the email as the display name and derives initials from it", () => {
    render(<SidebarProfileMenu email="jordan@example.com" fullName={undefined} />);
    expect(screen.getByRole("button", { name: /jordan@example\.com/i })).toBeInTheDocument();
    expect(screen.getByText("JE")).toBeInTheDocument();
  });

  it("opens the menu with a Profile link and a Log out item", () => {
    render(<SidebarProfileMenu email="alex@example.com" fullName="Alex Chen" />);
    openMenu();

    // Radix's `asChild` renders the anchor with an explicit role="menuitem",
    // so it's queried as a menuitem rather than a link.
    expect(screen.getByRole("menuitem", { name: /profile/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("menuitem", { name: /log out/i })).toBeInTheDocument();
  });

  it("calls signOutAction when Log out is selected", async () => {
    render(<SidebarProfileMenu email="alex@example.com" fullName="Alex Chen" />);
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: /log out/i }));

    await vi.waitFor(() => expect(mockedSignOutAction).toHaveBeenCalledTimes(1));
  });
});
