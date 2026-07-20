import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import PrivacyPolicyPage from "@/app/(marketing)/privacy/page";

describe("PrivacyPolicyPage", () => {
  it("renders the page title and effective date", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole("heading", { level: 1, name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/effective july 20, 2026/i)).toBeInTheDocument();
  });

  it("covers the key disclosure sections", () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole("heading", { level: 2, name: /information we collect/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /ai processing and subprocessors/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /your rights/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /data retention/i })).toBeInTheDocument();
  });

  it("names the AI and infrastructure subprocessors actually wired into the app", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/Anthropic \(Claude\)/)).toBeInTheDocument();
    expect(screen.getByText("OpenAI", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Supabase", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Upstash", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Sentry", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("PostHog", { exact: false })).toBeInTheDocument();
  });

  it("links to a working mailto contact and to the Terms page in the footer", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole("link", { name: /jacobschorr99@gmail.com/i })).toHaveAttribute(
      "href",
      "mailto:jacobschorr99@gmail.com",
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });
});
