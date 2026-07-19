import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { ResumeCoach } from "@/components/resume/resume-coach";
import type { CritiqueResult } from "@/app/api/resume/critique/route";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Radix Tabs switches the active tab on `mousedown` (not `click`) under its
// default "automatic" activation mode — see @radix-ui/react-tabs's
// TabsTrigger, which calls `onValueChange` from onMouseDown/onFocus.
function switchTab(name: RegExp | string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

const critiqueResult: CritiqueResult = {
  sections: [
    {
      heading: "Experience",
      bullets: [
        {
          id: "b1",
          original: "Helped with stuff on the team.",
          rewritten: "Drove a 12% lift in deal throughput by rebuilding the intake process.",
          weakness_flags: ["vague", "no_metric"],
          critique: "No metric, vague verb.",
          confidence: "high",
        },
        {
          id: "b2",
          original: "Was involved in various projects.",
          rewritten: "Consider adding scope and outcome.",
          weakness_flags: ["missing_scope"],
          critique: "Too little detail to safely rewrite.",
          confidence: "low",
        },
      ],
    },
  ],
  summary: { total_bullets: 2, weak_bullets: 1, top_issues: ["vague", "no metric"] },
};

beforeEach(() => {
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

describe("ResumeCoach", () => {
  it("shows the upload dropzone by default and the paste tab on demand", () => {
    render(<ResumeCoach />);
    expect(screen.getByText(/drop your resume pdf here/i)).toBeInTheDocument();

    switchTab(/paste text/i);
    expect(
      screen.getByPlaceholderText(/paste the full text of your resume here/i),
    ).toBeInTheDocument();
  });

  it("critiques pasted text and renders the section diff and summary", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(critiqueResult));
    render(<ResumeCoach />);

    switchTab(/paste text/i);
    fireEvent.change(screen.getByPlaceholderText(/paste the full text of your resume here/i), {
      target: { value: "Helped with stuff on the team." },
    });
    fireEvent.click(screen.getByRole("button", { name: /critique & rewrite/i }));

    expect(
      await screen.findByRole("heading", { name: "Experience", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, node) => node?.textContent?.replace(/\s+/g, " ").trim() === "1 / 2 bullets need work",
      ),
    ).toBeInTheDocument();
    // Appears both in the "Before" bullet card and in the edited preview
    // pane, since the bullet hasn't been applied yet.
    expect(screen.getAllByText("Helped with stuff on the team.")).toHaveLength(2);
    expect(
      screen.getByText("Drove a 12% lift in deal throughput by rebuilding the intake process."),
    ).toBeInTheDocument();
    // Low-confidence bullet gets guidance framing, not an Apply button.
    expect(screen.getByText("low confidence")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/resume/critique",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("applies and reverts a single bullet, reflected in the applied count and preview", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(critiqueResult));
    render(<ResumeCoach />);
    switchTab(/paste text/i);
    fireEvent.change(screen.getByPlaceholderText(/paste the full text of your resume here/i), {
      target: { value: "some text" },
    });
    fireEvent.click(screen.getByRole("button", { name: /critique & rewrite/i }));
    await screen.findByRole("heading", { name: "Experience", level: 2 });

    expect(screen.getByText("0 applied")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(screen.getByText("1 applied")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^revert$/i }));
    expect(screen.getByText("0 applied")).toBeInTheDocument();
  });

  it("applies all high/medium-confidence bullets and reverts them with the header buttons", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(critiqueResult));
    render(<ResumeCoach />);
    switchTab(/paste text/i);
    fireEvent.change(screen.getByPlaceholderText(/paste the full text of your resume here/i), {
      target: { value: "some text" },
    });
    fireEvent.click(screen.getByRole("button", { name: /critique & rewrite/i }));
    await screen.findByRole("heading", { name: "Experience", level: 2 });

    fireEvent.click(screen.getByRole("button", { name: /apply all/i }));
    // Only the one non-low-confidence bullet counts.
    expect(screen.getByText("1 applied")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /revert all/i }));
    expect(screen.getByText("0 applied")).toBeInTheDocument();
  });

  it("keeps rawText/pasteValue after Start over so re-critiquing doesn't require re-pasting", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(critiqueResult));
    render(<ResumeCoach />);
    switchTab(/paste text/i);
    fireEvent.change(screen.getByPlaceholderText(/paste the full text of your resume here/i), {
      target: { value: "my resume text" },
    });
    fireEvent.click(screen.getByRole("button", { name: /critique & rewrite/i }));
    await screen.findByRole("heading", { name: "Experience", level: 2 });

    fireEvent.click(screen.getByRole("button", { name: /start over/i }));

    // Back to the tabbed empty state, but the paste tab retains its value.
    expect(screen.queryByRole("heading", { name: "Experience", level: 2 })).not.toBeInTheDocument();
    switchTab(/paste text/i);
    expect(screen.getByPlaceholderText(/paste the full text of your resume here/i)).toHaveValue(
      "my resume text",
    );
  });

  it("shows the server error message when critique fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: "Too many requests, slow down." }, false, 429),
    );
    render(<ResumeCoach />);
    switchTab(/paste text/i);
    fireEvent.change(screen.getByPlaceholderText(/paste the full text of your resume here/i), {
      target: { value: "some text" },
    });
    fireEvent.click(screen.getByRole("button", { name: /critique & rewrite/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Too many requests, slow down."));
    expect(screen.queryByRole("heading", { name: "Experience", level: 2 })).not.toBeInTheDocument();
  });

  it("shows a generic error toast when the critique request throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    render(<ResumeCoach />);
    switchTab(/paste text/i);
    fireEvent.change(screen.getByPlaceholderText(/paste the full text of your resume here/i), {
      target: { value: "some text" },
    });
    fireEvent.click(screen.getByRole("button", { name: /critique & rewrite/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("network down"));
  });

  it("rejects a non-PDF upload without calling extract", () => {
    render(<ResumeCoach />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "resume.docx", { type: "application/msword" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(toast.error).toHaveBeenCalledWith("Please upload a PDF.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a PDF over the 5 MB cap without calling extract", () => {
    render(<ResumeCoach />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([big], "resume.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(toast.error).toHaveBeenCalledWith(
      "That PDF is over 5 MB. Export a smaller version and try again.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("extracts a valid PDF and shows the extracted text preview", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ raw_text: "Extracted resume text", pages: 2 }),
    );
    render(<ResumeCoach />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Extracted 2 pages."));
    expect(await screen.findByDisplayValue("Extracted resume text")).toBeInTheDocument();
  });
});
