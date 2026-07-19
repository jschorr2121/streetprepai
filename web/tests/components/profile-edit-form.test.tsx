import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { fakeProfile } from "@/tests/fixtures/profile";

const { saveProfileActionMock, pushMock, refreshMock, toastErrorMock, toastSuccessMock } =
  vi.hoisted(() => ({
    saveProfileActionMock: vi.fn(),
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
  }));

vi.mock("@/app/(app)/profile/actions", async () => {
  const actual = await vi.importActual<typeof import("@/app/(app)/profile/actions")>(
    "@/app/(app)/profile/actions",
  );
  return {
    ...actual,
    saveProfileAction: saveProfileActionMock,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));

describe("ProfileEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a target firm as a removable chip when Enter is pressed", () => {
    render(<ProfileEditForm profile={fakeProfile({ targetFirms: [] })} />);

    const input = screen.getByPlaceholderText("Type a firm and press Enter");
    fireEvent.change(input, { target: { value: "Lazard" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Lazard")).toBeInTheDocument();
    expect(input).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Remove Lazard" }));
    expect(screen.queryByText("Lazard")).not.toBeInTheDocument();
  });

  it("adds a suggested firm chip on click and hides it from the suggestion list", () => {
    render(<ProfileEditForm profile={fakeProfile({ targetFirms: [] })} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Evercore" }));

    expect(screen.getByText("Evercore")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Evercore" })).not.toBeInTheDocument();
  });

  it("toggles the advanced track switch", () => {
    render(<ProfileEditForm profile={fakeProfile({ advancedTrack: false })} />);

    const toggle = screen.getByRole("switch", { name: /advanced track/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("submits the current form values and shows a success toast", async () => {
    saveProfileActionMock.mockResolvedValue({ ok: true, data: fakeProfile() });
    render(<ProfileEditForm profile={fakeProfile({ fullName: "Old Name" })} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Test" } });
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => expect(saveProfileActionMock).toHaveBeenCalledTimes(1));
    expect(saveProfileActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Jane Test" }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Profile saved.");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces server-side field errors instead of navigating on validation failure", async () => {
    saveProfileActionMock.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Check the highlighted fields.",
        fieldErrors: { fullName: "Full name is too long." },
      },
    });
    render(<ProfileEditForm profile={fakeProfile()} />);

    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => expect(saveProfileActionMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Full name is too long.")).toBeInTheDocument();
    expect(toastErrorMock).toHaveBeenCalledWith("Check the highlighted fields.");
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("redirects to login when the session is unauthorized", async () => {
    saveProfileActionMock.mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Please sign in." },
    });
    render(<ProfileEditForm profile={fakeProfile()} />);

    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login?next=/profile"));
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
