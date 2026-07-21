"use client";

// The graded-answer atom used by the Question Bank, section drills, chapter
// gates, and the daily drill. Presents a question, collects a free-text answer,
// grades it via gradeAnswerAction, and renders the FULL published rubric
// (key points, misconceptions, depth calibration, model answer) — the exposed
// rubric is the product's differentiator over black-box graders.

import { useState } from "react";
import { CheckCircle2, ChevronRight, Circle, Loader2, Sparkles, XCircle } from "lucide-react";

import { gradeAnswerAction } from "@/app/(app)/tools/question-bank/actions";
import { StatusLine } from "@/components/status-line";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/reader/markdown";
import { cn } from "@/lib/utils";
import type { GradedAnswer } from "@/lib/types";

export type AnswerCardQuestion = {
  id: string;
  prompt: string;
  topic: string;
  difficulty: string;
  questionType: string;
};

type PracticeContext = "qbank" | "section-drill" | "chapter-gate" | "daily-drill";

type FollowupState = { id: string; prompt: string } | null;

export function AnswerCard({
  question,
  context,
  onGraded,
  autoFocus = false,
}: {
  question: AnswerCardQuestion;
  context: PracticeContext;
  /** Reports the main-question score up to a parent session (for aggregation). */
  onGraded?: (result: { score: number; correct: boolean }) => void;
  autoFocus?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<GradedAnswer | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Follow-up tree state — a correct answer can open a deeper probe.
  const [followup, setFollowup] = useState<FollowupState>(null);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [followupGrade, setFollowupGrade] = useState<GradedAnswer | null>(null);
  const [followupPending, setFollowupPending] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);

  async function submitMain() {
    if (!answer.trim() || pending) return;
    setPending(true);
    setError(null);
    const res = await gradeAnswerAction({ questionId: question.id, answer, context });
    setPending(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setGrade(res.data.grade);
    setFollowup(res.data.nextFollowup);
    onGraded?.({ score: res.data.grade.score, correct: res.data.grade.correct });
  }

  async function submitFollowup() {
    if (!followup || !followupAnswer.trim() || followupPending) return;
    setFollowupPending(true);
    setError(null);
    const res = await gradeAnswerAction({
      questionId: question.id,
      followupId: followup.id,
      answer: followupAnswer,
      context,
    });
    setFollowupPending(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setFollowupGrade(res.data.grade);
    setFollowup(res.data.nextFollowup); // chain to the next probe if any
    setFollowupAnswer("");
    setShowFollowup(false);
  }

  return (
    <div className="bg-card rounded-xl border p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="rounded-full text-xs capitalize">
          {question.topic.replace(/-/g, " ")}
        </Badge>
        <Badge variant="outline" className="rounded-full text-xs capitalize">
          {question.difficulty}
        </Badge>
        <Badge variant="outline" className="text-muted-foreground rounded-full text-xs capitalize">
          {question.questionType.replace(/-/g, " ")}
        </Badge>
      </div>

      <p className="mb-4 leading-relaxed font-medium">{question.prompt}</p>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Answer as you would out loud in the interview…"
        rows={5}
        disabled={!!grade}
        autoFocus={autoFocus}
        className="resize-y"
      />

      {!grade && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            Graded on a published rubric — you&apos;ll see exactly what you hit and missed.
          </span>
          <Button onClick={submitMain} disabled={!answer.trim() || pending} className="gap-1.5">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {pending ? "Grading…" : "Submit for grading"}
          </Button>
        </div>
      )}

      {/* Live region holds only short announcements — keeping the toggling
          submit button and the full rubric out avoids repeated/verbose
          screen-reader chatter. */}
      <StatusLine>
        {pending && <span className="sr-only">Grading your answer…</span>}
        {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
        {grade && <span className="sr-only">Grading complete. Rubric results follow.</span>}
      </StatusLine>

      {grade && <RubricResult grade={grade} />}

      {/* Follow-up probe — mirrors real interviewer escalation. */}
      {followupGrade && (
        <div className="border-primary/30 mt-4 border-l-2 pl-4">
          <div className="text-muted-foreground mb-1 text-xs font-medium">Follow-up answered</div>
          <RubricResult grade={followupGrade} compact />
        </div>
      )}

      {grade && grade.correct && followup && !showFollowup && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={() => setShowFollowup(true)}
        >
          <ChevronRight className="size-4" />
          Interviewer follow-up
        </Button>
      )}

      {showFollowup && followup && (
        <div className="border-primary/30 bg-accent/30 mt-4 rounded-lg border-l-2 p-4">
          <p className="mb-3 leading-relaxed font-medium">{followup.prompt}</p>
          <Textarea
            value={followupAnswer}
            onChange={(e) => setFollowupAnswer(e.target.value)}
            placeholder="Go deeper…"
            rows={4}
            autoFocus
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={submitFollowup}
              disabled={!followupAnswer.trim() || followupPending}
              size="sm"
              className="gap-1.5"
            >
              {followupPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Submit follow-up
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RubricResult({ grade, compact = false }: { grade: GradedAnswer; compact?: boolean }) {
  return (
    <div className={cn("mt-4 space-y-4", compact && "mt-2 space-y-3")}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
            grade.correct ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
          )}
        >
          {grade.correct ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {grade.score}/100
        </div>
        <span className="text-muted-foreground text-sm">{grade.overallFeedback}</span>
      </div>

      <div>
        <div className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
          Rubric
        </div>
        <ul className="space-y-1.5">
          {grade.keyPointResults.map((kp, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {kp.hit ? (
                <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
              ) : (
                <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              )}
              <span>
                <span className={cn(!kp.hit && "text-muted-foreground")}>{kp.point}</span>
                {kp.comment && <span className="text-muted-foreground"> — {kp.comment}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {grade.misconceptionsTriggered.length > 0 && (
        <div className="bg-destructive/5 rounded-lg p-3">
          <div className="text-destructive mb-1 text-xs font-medium">Watch out</div>
          <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-sm">
            {grade.misconceptionsTriggered.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-muted-foreground text-sm">
        <span className="font-medium">Depth:</span> {grade.depthComment}
      </div>

      {!compact && (
        <details className="group">
          <summary className="text-primary cursor-pointer text-sm font-medium">
            Show a model answer
          </summary>
          <div className="bg-muted/30 mt-2 rounded-lg border p-3">
            <Markdown content={grade.modelAnswer} className="text-sm [&>p]:text-sm" />
          </div>
        </details>
      )}
    </div>
  );
}
