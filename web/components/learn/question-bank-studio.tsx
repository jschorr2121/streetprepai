"use client";

// The Question Bank studio: three modes.
//  1. Daily drill — spaced-review "due" items interleaved with fresh questions
//     across topics the user has started (retrieval + interleaving + spacing).
//  2. By topic — pick a topic + difficulty, get graded questions with follow-ups.
//  3. Mental math — the parameterized generators (locally checked).

import { useState } from "react";
import { CalendarClock, Dumbbell, ListChecks, Loader2, Sparkles } from "lucide-react";

import { serveQuestionAction } from "@/app/(app)/tools/question-bank/actions";
import { AnswerCard, type AnswerCardQuestion } from "@/components/learn/answer-card";
import { DrillRunner } from "@/components/learn/drill-runner";
import { PracticeSession } from "@/components/learn/practice-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DRILL_META, type DrillKind } from "@/lib/curriculum/drills/generators";
import { cn } from "@/lib/utils";

type TopicOption = { value: string; label: string };
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export function QuestionBankStudio({
  dueCount,
  dailyQuestions,
  topics,
}: {
  dueCount: number;
  dailyQuestions: AnswerCardQuestion[];
  topics: TopicOption[];
}) {
  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="daily" className="gap-1.5">
          <CalendarClock className="size-4" /> Daily drill
          {dueCount > 0 && (
            <Badge className="ml-1 h-5 rounded-full px-1.5 text-xs">{dueCount} due</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="topic" className="gap-1.5">
          <ListChecks className="size-4" /> By topic
        </TabsTrigger>
        <TabsTrigger value="mentalmath" className="gap-1.5">
          <Dumbbell className="size-4" /> Mental math
        </TabsTrigger>
      </TabsList>

      <TabsContent value="daily">
        {dailyQuestions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing queued yet — answer some questions under “By topic” or complete a chapter to
            start building your review queue.
          </p>
        ) : (
          <PracticeSession
            questions={dailyQuestions}
            context="daily-drill"
            title="Today's mixed drill"
            subtitle={
              dueCount > 0
                ? `${dueCount} weak item${dueCount === 1 ? "" : "s"} due for review, mixed with fresh questions across your topics.`
                : "A mix of questions across every topic you've started."
            }
          />
        )}
      </TabsContent>

      <TabsContent value="topic">
        <TopicPractice topics={topics} />
      </TabsContent>

      <TabsContent value="mentalmath">
        <MentalMathDrills />
      </TabsContent>
    </Tabs>
  );
}

function TopicPractice({ topics }: { topics: TopicOption[] }) {
  const [topic, setTopic] = useState<string>(topics[0]?.value ?? "");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("medium");
  const [question, setQuestion] = useState<AnswerCardQuestion | null>(null);
  const [pending, setPending] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function serve() {
    setPending(true);
    setEmpty(false);
    setError(null);
    try {
      const res = await serveQuestionAction({ topic, difficulty });
      if (res.ok) {
        if (res.data) setQuestion(res.data);
        else {
          setQuestion(null);
          setEmpty(true);
        }
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("Something went wrong fetching a question. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="bg-card rounded-xl border p-4">
        <div className="mb-3">
          <div className="text-muted-foreground mb-1.5 text-xs font-medium">Topic</div>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <button
                key={t.value}
                onClick={() => setTopic(t.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  topic === t.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:border-muted-foreground/50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-muted-foreground mb-1.5 text-xs font-medium">Difficulty</div>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                    difficulty === d
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:border-muted-foreground/50",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={serve} disabled={pending || !topic} className="gap-1.5">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {question ? "Next question" : "Start"}
          </Button>
        </div>
      </div>

      {empty && (
        <p className="text-muted-foreground text-sm">
          No questions for that combination yet. Try another difficulty.
        </p>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {question && <AnswerCard key={question.id} question={question} context="qbank" autoFocus />}
    </div>
  );
}

function MentalMathDrills() {
  const kinds = Object.keys(DRILL_META) as DrillKind[];
  const [active, setActive] = useState<DrillKind>(kinds[0]!);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {kinds.map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active === k
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:border-muted-foreground/50",
            )}
          >
            {DRILL_META[k].title}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{DRILL_META[active].blurb}</p>
      <DrillRunner key={active} kind={active} />
    </div>
  );
}
