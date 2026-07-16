import { ListChecks } from "lucide-react";

import { QuestionBankStudio } from "@/components/learn/question-bank-studio";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { countDueReviews, getInterleavedQuestions, listDueReviews } from "@/lib/db/queries/qbank";
import { listChapterProgress } from "@/lib/db/queries/curriculum";
import { chapters, type CurriculumTopic } from "@/lib/curriculum/chapters";
import type { QbankQuestion } from "@/lib/types";

export const metadata = { title: "Question Bank — Street Prep AI" };

const DAILY_TARGET = 8;

// Unique topics across the manifest, in chapter order.
const TOPIC_OPTIONS = [...new Map(chapters.map((c) => [c.topic, c.shortTitle])).entries()].map(
  ([value, label]) => ({ value, label }),
);

export default async function QuestionBankPage() {
  const user = await requireUser();

  const { dueCount, due, chapterRows } = await withUser(
    { sub: user.id, role: "authenticated" },
    async (tx) => {
      const [dueCount, due, chapterRows] = await Promise.all([
        countDueReviews(tx, user.id),
        listDueReviews(tx, user.id, DAILY_TARGET),
        listChapterProgress(tx, user.id),
      ]);
      return { dueCount, due, chapterRows };
    },
  );

  // Interleave: topics the user has engaged with (started chapters), else all.
  const startedTopics = [
    ...new Set(
      chapterRows
        .map((c) => chapters.find((ch) => ch.slug === c.chapterSlug)?.topic)
        .filter((t): t is CurriculumTopic => !!t),
    ),
  ];
  const poolTopics = startedTopics.length > 0 ? startedTopics : TOPIC_OPTIONS.map((t) => t.value);

  const fresh = await withUser({ sub: user.id, role: "authenticated" }, (tx) =>
    getInterleavedQuestions(tx, poolTopics, DAILY_TARGET),
  );

  // Daily set = due reviews first, then fresh, deduped, capped.
  const seen = new Set<string>();
  const daily: QbankQuestion[] = [];
  for (const q of [...due, ...fresh]) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    daily.push(q);
    if (daily.length >= DAILY_TARGET) break;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <header className="mb-6">
        <div className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
          <ListChecks className="size-4" /> Question Bank
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Drill until it&apos;s automatic</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          AI-graded on a published rubric — you see exactly what you hit, what you missed, and how a
          strong candidate would answer. Weak questions come back on a spaced schedule.
        </p>
      </header>

      <QuestionBankStudio
        dueCount={dueCount}
        dailyQuestions={daily.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          topic: q.topic,
          difficulty: q.difficulty,
          questionType: q.questionType,
        }))}
        topics={TOPIC_OPTIONS}
      />
    </div>
  );
}
