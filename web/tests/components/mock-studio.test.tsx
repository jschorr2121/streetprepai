import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { MockStudio } from "@/components/interview/mock-studio";
import type { InterviewQuestion } from "@/lib/data/interview-questions";
import type { Scorecard } from "@/app/api/interview/score/route";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), message: vi.fn(), success: vi.fn() },
}));

// pickRandomQuestion is random by design — mock it with a deterministic
// fixture so tests can assert on exact question text instead of re-deriving
// the pool's random selection. Everything else from the module (types,
// isInterviewMode helper lives in the component itself) passes through.
const questionsByMode: Record<string, InterviewQuestion> = {
  technical: {
    id: "tech-1",
    mode: "technical",
    text: "Walk me through a DCF.",
    topic: "Valuation",
    difficulty: "medium",
    idealAnswerOutline: "outline",
  },
  behavioral: {
    id: "beh-1",
    mode: "behavioral",
    text: "Why banking?",
    topic: "Motivation",
    difficulty: "easy",
    idealAnswerOutline: "outline",
  },
};
let nextQuestionCall = 0;
vi.mock("@/lib/data/interview-questions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/interview-questions")>();
  return {
    ...actual,
    pickRandomQuestion: vi.fn((mode: string, excludeId?: string) => {
      nextQuestionCall += 1;
      const base = questionsByMode[mode] ?? questionsByMode.technical!;
      // When asked to exclude the current question (New question), return a
      // distinguishable variant so tests can assert the prompt changed.
      if (excludeId) {
        return { ...base, id: `${base.id}-${nextQuestionCall}`, text: `${base.text} (again)` };
      }
      return base;
    }),
  };
});

const fakeStream = { getTracks: () => [{ stop: vi.fn() }] };

class FakeMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  state: "inactive" | "recording" = "inactive";
  mimeType = "audio/webm;codecs=opus";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["fake-audio"], { type: "audio/webm" }) });
    this.onstop?.();
  }
}

function stubRecordingApis() {
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
    configurable: true,
  });
}

const scorecard: Scorecard = {
  content_score: 82,
  delivery_score: 68,
  rubric: [{ dimension: "Structure", score: 80, comment: "Clear framework." }],
  strengths: ["Clean walk through the formula."],
  improvements: ["Mention terminal value sensitivities."],
  follow_up_questions: ["How would WACC change with more leverage?"],
  model_answer: "Project unlevered FCF, discount at WACC, add terminal value...",
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

beforeEach(() => {
  nextQuestionCall = 0;
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.message).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
  vi.restoreAllMocks();
});

describe("MockStudio", () => {
  it("renders the idle mode picker with no question when initialMode is omitted", () => {
    render(<MockStudio />);
    expect(screen.getByText("Choose a mode")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start recording/i })).not.toBeInTheDocument();
  });

  it("ignores an invalid initialMode and falls back to the idle picker", () => {
    render(<MockStudio initialMode="not-a-real-mode" />);
    expect(screen.getByText("Choose a mode")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start recording/i })).not.toBeInTheDocument();
  });

  it("starts directly in the ready phase with a question when initialMode is valid", () => {
    render(<MockStudio initialMode="technical" />);
    expect(screen.getByText("Walk me through a DCF.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });

  it("lets the user pick a mode from the picker and shows its question", () => {
    render(<MockStudio />);
    fireEvent.click(screen.getByRole("button", { name: /behavioral/i }));

    expect(screen.getByText("Why banking?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });

  it("serves a new question in the same mode without leaving the ready phase", () => {
    render(<MockStudio initialMode="technical" />);
    fireEvent.click(screen.getByRole("button", { name: /new question/i }));

    expect(screen.getByText("Walk me through a DCF. (again)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });

  it("shows an unsupported-browser toast when recording APIs are unavailable", async () => {
    // happy-dom ships neither navigator.mediaDevices nor MediaRecorder, so
    // this exercises the component's real guard without any stubbing.
    render(<MockStudio initialMode="technical" />);
    fireEvent.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Recording isn't supported in this browser. Try a recent Chrome, Edge, or Safari.",
      ),
    );
  });

  it("records, transcribes, scores, and lets the user try another question", async () => {
    stubRecordingApis();
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/interview/transcribe") {
        return Promise.resolve(
          jsonResponse({ transcript: "You discount cash flows.", words: [], mocked: false }),
        );
      }
      if (url === "/api/interview/score") {
        return Promise.resolve(jsonResponse(scorecard));
      }
      throw new Error(`unexpected url ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MockStudio initialMode="technical" />);

    fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
    await screen.findByRole("button", { name: /stop/i });

    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    const submitButton = await screen.findByRole("button", { name: /submit for scoring/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText("You discount cash flows.")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("Clean walk through the formula.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try another question/i }));
    expect(screen.getByText("Walk me through a DCF. (again)")).toBeInTheDocument();
    expect(screen.queryByText("82")).not.toBeInTheDocument();
  });

  it("shows a toast and returns to review when scoring fails after transcription", async () => {
    stubRecordingApis();
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/interview/transcribe") {
        return Promise.resolve(jsonResponse({ transcript: "Answer text.", words: [] }));
      }
      if (url === "/api/interview/score") {
        return Promise.resolve(jsonResponse({ error: "Scoring is overloaded." }, false, 503));
      }
      throw new Error(`unexpected url ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MockStudio initialMode="technical" />);
    fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
    await screen.findByRole("button", { name: /stop/i });
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    fireEvent.click(await screen.findByRole("button", { name: /submit for scoring/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Scoring is overloaded."));
    // Back in the review phase — the audio player and submit button return.
    expect(await screen.findByRole("button", { name: /submit for scoring/i })).toBeInTheDocument();
  });

  it("collapses and expands the rubric section", async () => {
    stubRecordingApis();
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/interview/transcribe") {
        return Promise.resolve(jsonResponse({ transcript: "Answer.", words: [] }));
      }
      return Promise.resolve(jsonResponse(scorecard));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MockStudio initialMode="technical" />);
    fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
    await screen.findByRole("button", { name: /stop/i });
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    fireEvent.click(await screen.findByRole("button", { name: /submit for scoring/i }));

    const rubricToggle = await screen.findByText(/Rubric ·/);
    expect(screen.getByText("Structure")).toBeInTheDocument();
    fireEvent.click(rubricToggle);
    expect(screen.queryByText("Structure")).not.toBeInTheDocument();
    fireEvent.click(rubricToggle);
    expect(screen.getByText("Structure")).toBeInTheDocument();
  });
});
