import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders the eyebrow/heading pattern shared with the error boundary", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /this page doesn't exist/i }),
    ).toBeInTheDocument();
  });

  it("links back to the dashboard and to home", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
  });
});
