import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import TermsOfServicePage from "@/app/(marketing)/terms/page";

describe("TermsOfServicePage", () => {
  it("renders the page title and effective date", () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /terms of service/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/effective july 20, 2026/i)).toBeInTheDocument();
  });

  it("covers acceptable use, the AI disclaimer, and the liability sections", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByRole("heading", { level: 2, name: /acceptable use/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /ai-generated content disclaimer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /limitation of liability/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /governing law/i })).toBeInTheDocument();
  });

  it("flags governing law as an open decision for Jake rather than inventing a jurisdiction", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByText(/\[Jake: choose governing law/i)).toBeInTheDocument();
  });

  it("links to a working mailto contact and to the Privacy Policy", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByRole("link", { name: /jacobschorr99@gmail.com/i })).toHaveAttribute(
      "href",
      "mailto:jacobschorr99@gmail.com",
    );
    expect(screen.getAllByRole("link", { name: "Privacy Policy" })[0]).toHaveAttribute(
      "href",
      "/privacy",
    );
  });
});
