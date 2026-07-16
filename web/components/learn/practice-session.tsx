"use client";

// Sequences a set of questions through AnswerCard. Used for section drills,
// chapter gates, and the daily interleaved drill. For gated sittings it calls
// finishSittingAction at the end, which recomputes the score server-side and
// returns pass/fail against the ~85% threshold.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Trophy, XCircle } from "lucide-react";

import { finishSittingAction } from "@/app/(app)/learn/actions";
import { AnswerCard, type AnswerCardQuestion } from "@/components/learn/answer-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SittingContext = "section-drill" | "chapter-gate" | "daily-drill" | "qbank";

export function PracticeSession({
  questions,
  context,
  chapterSlug,
  sectionSlug,
  title,
  subtitle,
  backHref,
}: {
  questions: AnswerCardQuestion[];
  context: SittingContext;
  chapterSlug?: string;
  sectionSlug?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const startedAt = useRef(new Date().toISOString());
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [currentGraded, setCurrentGraded] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    averageScore: number;
    passed: boolean;
    threshold: number;
  } | null>(null);

  const current = questions[index];
  const isLast = index >= questions.length - 1;
  const gated = context === "section-drill" || context === "chapter-gate";
  // Only the chapter gate is pass/fail; a section drill records progress but
  // never completes a chapter, so it must not get "Gate passed" copy.
  const isGate = context === "chapter-gate";

  function handleGraded(r: { score: number; correct: boolean }) {
    setScores((s) => [...s, r.score]);
    setCurrentGraded(true);
  }

  async function next() {
    if (isLast) {
      if (gated && chapterSlug) {
        // A failed server-side scoring must NOT fall through to the ungated
        // "passed" tally — stay here, show the error, let the user retry.
        setFinishing(true);
        setFinishError(null);
        try {
          const res = await finishSittingAction({
            chapterSlug,
            ...(sectionSlug ? { sectionSlug } : {}),
            context,
            startedAt: startedAt.current,
          });
          if (res.ok) {
            setResult(res.data);
            router.refresh();
          } else {
            setFinishError(res.error.message);
          }
        } catch {
          setFinishError("Something went wrong scoring this session. Please try again.");
        } finally {
          setFinishing(false);
        }
        return;
      }
      // Ungated (qbank / daily-drill) — just show the tally.
      setResult({
        averageScore: scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length),
        passed: true,
        threshold: 0,
      });
      return;
    }
    setIndex((i) => i + 1);
    setCurrentGraded(false);
  }

  if (result) {
    return (
      <SessionSummary
        result={result}
        gated={isGate}
        count={questions.length}
        backHref={backHref}
        onRetry={
          isGate
            ? () => {
                startedAt.current = new Date().toISOString();
                setIndex(0);
                setScores([]);
                setCurrentGraded(false);
                setResult(null);
              }
            : undefined
        }
      />
    );
  }

  if (!current) {
    return <p className="text-muted-foreground text-sm">No questions available yet.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        <div className="mt-3 flex items-center gap-2">
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${((index + (currentGraded ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-muted-foreground text-xs">
            {index + 1} / {questions.length}
          </span>
        </div>
      </header>

      <AnswerCard
        key={current.id}
        question={current}
        context={context}
        onGraded={handleGraded}
        autoFocus
      />

      {currentGraded && (
        <div className="mt-4 flex flex-col items-end gap-2">
          {finishError && <p className="text-destructive text-sm">{finishError}</p>}
          <Button onClick={next} disabled={finishing} className="gap-1.5">
            {finishing && <Loader2 className="size-4 animate-spin" />}
            {isLast
              ? gated
                ? finishError
                  ? "Try again"
                  : "Finish & score"
                : "Finish"
              : "Next question"}
          </Button>
        </div>
      )}
    </div>
  );
}

function SessionSummary({
  result,
  gated,
  count,
  backHref,
  onRetry,
}: {
  result: { averageScore: number; passed: boolean; threshold: number };
  gated: boolean;
  count: number;
  backHref?: string;
  onRetry?: () => void;
}) {
  const pct = Math.round(result.averageScore);
  const passed = result.passed;
  return (
    <div className="mx-auto max-w-md text-center">
      <div
        className={cn(
          "mx-auto mb-4 flex size-16 items-center justify-center rounded-full",
          gated && !passed ? "bg-destructive/10" : "bg-primary/10",
        )}
      >
        {gated && !passed ? (
          <XCircle className="text-destructive size-8" />
        ) : gated ? (
          <Trophy className="text-primary size-8" />
        ) : (
          <CheckCircle2 className="text-primary size-8" />
        )}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">
        {gated ? (passed ? "Gate passed" : "Not quite yet") : "Session complete"}
      </h2>
      <p className="text-muted-foreground mt-2">
        You averaged <span className="text-foreground font-semibold">{pct}%</span> across {count}{" "}
        question{count === 1 ? "" : "s"}.
        {gated &&
          !passed &&
          ` You need ${Math.round(result.threshold * 100)}% to clear this chapter — review the weak spots and try again.`}
        {gated && passed && " This chapter is now complete."}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {onRetry && !passed && (
          <Button onClick={onRetry} variant="default">
            Retry the gate
          </Button>
        )}
        {backHref && (
          <Button asChild variant={passed || !gated ? "default" : "outline"}>
            <a href={backHref}>{gated ? "Back to chapter" : "Done"}</a>
          </Button>
        )}
      </div>
    </div>
  );
}
