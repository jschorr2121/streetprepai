import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import { NewContactForm } from "@/components/relationships/new-contact-form";

const { createContactActionMock, pushMock, refreshMock, toastErrorMock, toastSuccessMock } =
  vi.hoisted(() => ({
    createContactActionMock: vi.fn(),
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
  }));

vi.mock("@/app/(app)/tools/relationships/actions", () => ({
  createContactAction: createContactActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));

describe("NewContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors and does not submit when required fields are blank", async () => {
    render(<NewContactForm />);

    fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Firm is required.")).toBeInTheDocument();
    expect(createContactActionMock).not.toHaveBeenCalled();
  });

  it("submits the form data and navigates to the new contact on success", async () => {
    createContactActionMock.mockResolvedValue({
      ok: true,
      data: { id: "c1", name: "Alex Chen" },
    });

    render(<NewContactForm />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Alex Chen" } });
    fireEvent.change(screen.getByLabelText(/firm/i), { target: { value: "Goldman Sachs" } });
    fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

    await waitFor(() => expect(createContactActionMock).toHaveBeenCalledTimes(1));
    expect(createContactActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Alex Chen", firm: "Goldman Sachs", stage: "cold" }),
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/tools/relationships/c1"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith("Alex Chen added.");
  });

  it("shows a toast and does not navigate when the server action fails", async () => {
    createContactActionMock.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Something went wrong." },
    });

    render(<NewContactForm />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Alex Chen" } });
    fireEvent.change(screen.getByLabelText(/firm/i), { target: { value: "Goldman Sachs" } });
    fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

    await waitFor(() => expect(createContactActionMock).toHaveBeenCalledTimes(1));
    expect(toastErrorMock).toHaveBeenCalledWith("Something went wrong.");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("highlights server-side field errors instead of only toasting", async () => {
    createContactActionMock.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Check the highlighted fields.",
        fieldErrors: { firm: "Firm is required." },
      },
    });

    render(<NewContactForm />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Alex Chen" } });
    fireEvent.change(screen.getByLabelText(/firm/i), { target: { value: "Goldman Sachs" } });
    fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

    await waitFor(() => expect(createContactActionMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Firm is required.")).toBeInTheDocument();
    expect(screen.getByLabelText(/firm/i)).toHaveAttribute("aria-describedby", "firm-error");
    expect(toastErrorMock).toHaveBeenCalledWith("Check the highlighted fields.");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
