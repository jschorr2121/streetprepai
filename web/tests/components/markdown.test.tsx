import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Markdown } from "@/components/reader/markdown";

// lib/ has no colocated tests for `safeHref` — it's a private helper inside
// this component, not exported — so this is the only coverage for the
// scheme guard. Focus on the component-render angle only.
describe("Markdown", () => {
  it("renders headings, lists, and a blockquote from mixed content", () => {
    render(
      <Markdown
        content={["# Heading one", "", "- first item", "- second item", "", "> a quoted line"].join(
          "\n",
        )}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Heading one" })).toBeInTheDocument();
    expect(screen.getByText("first item")).toBeInTheDocument();
    expect(screen.getByText("second item")).toBeInTheDocument();
    expect(screen.getByText("a quoted line")).toBeInTheDocument();
  });

  it("renders links with an allowed scheme as real, clickable anchors", () => {
    render(<Markdown content="See [the filing](https://sec.gov/filing) for details." />);

    const link = screen.getByRole("link", { name: "the filing" });
    expect(link).toHaveAttribute("href", "https://sec.gov/filing");
  });

  it("renders relative and mailto links as anchors too", () => {
    render(
      <Markdown content="[Contact](mailto:ir@firm.com) or [go here](/dashboard) or [jump](#top)." />,
    );

    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "mailto:ir@firm.com",
    );
    expect(screen.getByRole("link", { name: "go here" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "jump" })).toHaveAttribute("href", "#top");
  });

  it("drops a javascript: link entirely, rendering the label as plain text", () => {
    render(<Markdown content="[click me](javascript:alert(1))" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("click me")).toBeInTheDocument();
  });

  it("drops data: and vbscript: links as well", () => {
    render(
      <Markdown
        content={["[a](data:text/html,<script>alert(1)</script>)", "[b](vbscript:msgbox(1))"].join(
          "\n\n",
        )}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
  });
});
