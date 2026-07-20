import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";

const { deleteAccountActionMock, pushMock, toastErrorMock } = vi.hoisted(() => ({
  deleteAccountActionMock: vi.fn(),
  pushMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/app/(app)/profile/settings/actions", () => ({
  deleteAccountAction: deleteAccountActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock },
}));

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DeleteAccountDialog", () => {
  it("keeps the final delete button disabled until DELETE is typed exactly", () => {
    render(<DeleteAccountDialog />);
    openDialog();

    const confirmButton = screen.getByRole("button", { name: /permanently delete/i });
    const input = screen.getByLabelText(/confirmation phrase/i);

    expect(confirmButton).toBeDisabled();

    // Wrong case does not enable it.
    fireEvent.change(input, { target: { value: "delete" } });
    expect(confirmButton).toBeDisabled();

    // Exact phrase enables it.
    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(confirmButton).toBeEnabled();
  });

  it("does not call the action while the confirmation is incomplete", () => {
    render(<DeleteAccountDialog />);
    openDialog();

    const confirmButton = screen.getByRole("button", { name: /permanently delete/i });
    fireEvent.click(confirmButton);

    expect(deleteAccountActionMock).not.toHaveBeenCalled();
  });

  it("calls the delete action once confirmed", async () => {
    deleteAccountActionMock.mockResolvedValue({ ok: true });
    render(<DeleteAccountDialog />);
    openDialog();

    fireEvent.change(screen.getByLabelText(/confirmation phrase/i), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /permanently delete/i }));

    await waitFor(() => expect(deleteAccountActionMock).toHaveBeenCalledTimes(1));
  });

  it("surfaces an error toast when deletion fails", async () => {
    deleteAccountActionMock.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Something went wrong deleting your account." },
    });
    render(<DeleteAccountDialog />);
    openDialog();

    fireEvent.change(screen.getByLabelText(/confirmation phrase/i), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /permanently delete/i }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("Something went wrong deleting your account."),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
