import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PracticeSession } from "@/components/learn/practice-session";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getGateQuestions } from "@/lib/db/queries/qbank";
import { getChapter } from "@/lib/curriculum/chapters";

const GATE_QUESTION_COUNT = 8;

export default async function ChapterGatePage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  if (!chapter || !chapter.gated) notFound();

  const user = await requireUser();
  const questions = await withUser({ sub: user.id, role: "authenticated" }, (tx) =>
    getGateQuestions(tx, chapterSlug, GATE_QUESTION_COUNT),
  );

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <p className="text-muted-foreground">
          No gate questions are available for this chapter yet.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/learn/${chapterSlug}`}>Back to chapter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1">
        <Link href={`/learn/${chapterSlug}`}>
          <ArrowLeft className="size-4" /> Back to chapter
        </Link>
      </Button>
      <PracticeSession
        questions={questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          topic: q.topic,
          difficulty: q.difficulty,
          questionType: q.questionType,
        }))}
        context="chapter-gate"
        chapterSlug={chapterSlug}
        title={`${chapter.title} — Chapter Gate`}
        subtitle="Mixed questions across the chapter. Score 85%+ to clear it."
        backHref={`/learn/${chapterSlug}`}
      />
    </div>
  );
}
