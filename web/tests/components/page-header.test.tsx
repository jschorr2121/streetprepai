import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PageHeader } from "@/components/page-header";

describe("PageHeader", () => {
  it("renders the title and omits optional slots when not provided", () => {
    render(<PageHeader title="Applications" />);

    expect(screen.getByRole("heading", { level: 1, name: "Applications" })).toBeInTheDocument();
    expect(screen.queryByText(/./, { selector: "p.eyebrow" })).not.toBeInTheDocument();
  });

  it("renders the eyebrow, description, and action slot when all are provided", () => {
    render(
      <PageHeader
        eyebrow="03 / Progress"
        title="Your Progress"
        description="Track mastery across chapters."
        action={<button>Export</button>}
      />,
    );

    expect(screen.getByText("03 / Progress")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your Progress" })).toBeInTheDocument();
    expect(screen.getByText("Track mastery across chapters.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });
});
