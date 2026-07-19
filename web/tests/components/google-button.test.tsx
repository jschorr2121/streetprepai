import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { GoogleButton } from "@/components/auth/google-button";
import { signInWithGoogleAction } from "@/app/(auth)/login/actions";

vi.mock("@/app/(auth)/login/actions", () => ({
  signInWithGoogleAction: vi.fn(),
}));

const mockedSignIn = vi.mocked(signInWithGoogleAction);

beforeEach(() => {
  mockedSignIn.mockReset();
});

describe("GoogleButton", () => {
  it("renders the given label and no error initially", () => {
    render(<GoogleButton label="Continue with Google" />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // On success the server action redirects (throws internally / never
  // resolves in the real world); here it just never resolves, matching the
  // "we only reach here if it didn't redirect" comment in the component.
  it("disables the button while the sign-in action is pending", async () => {
    let resolveAction: (v: { ok: true; data: { url: string } }) => void = () => {};
    mockedSignIn.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    render(<GoogleButton label="Continue with Google" />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();

    resolveAction({ ok: true, data: { url: "https://accounts.google.com/authorize" } });
    await waitFor(() => expect(mockedSignIn).toHaveBeenCalledTimes(1));
  });

  it("shows the error message and re-enables the button when the action fails", async () => {
    mockedSignIn.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Could not start Google sign-in. Try again." },
    });
    render(<GoogleButton label="Continue with Google" />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not start Google sign-in. Try again.",
    );
    expect(button).toBeEnabled();
  });

  it("clears a previous error on a new click attempt", async () => {
    mockedSignIn.mockResolvedValueOnce({
      ok: false,
      error: { code: "INTERNAL", message: "Could not start Google sign-in. Try again." },
    });
    render(<GoogleButton label="Continue with Google" />);
    const button = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(button);
    await screen.findByRole("alert");

    mockedSignIn.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(button);

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
