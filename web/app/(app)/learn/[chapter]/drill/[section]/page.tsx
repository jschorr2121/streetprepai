import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PracticeSession } from "@/components/learn/practice-session";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getSectionDrillQuestions } from "@/lib/db/queries/qbank";
import { getSection } from "@/lib/curriculum/chapters";

const SECTION_DRILL_COUNT = 4;

export default async function SectionDrillPage({
  params,
}: {
  params: Promise<{ chapter: string; section: string }>;
}) {
  const { chapter: chapterSlug, section: sectionSlug } = await params;
  const found = getSection(chapterSlug, sectionSlug);
  if (!found) notFound();

  const user = await requireUser();
  const questions = await withUser({ sub: user.id, role: "authenticated" }, (tx) =>
    getSectionDrillQuestions(tx, chapterSlug, sectionSlug, SECTION_DRILL_COUNT),
  );

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <p className="text-muted-foreground">
          No drill questions are available for this section yet.
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
        context="section-drill"
        chapterSlug={chapterSlug}
        sectionSlug={sectionSlug}
        title={`Drill — ${found.section.title}`}
        subtitle="Answer each and see exactly what you hit. Retrieval right after reading is what sticks."
        backHref={`/learn/${chapterSlug}`}
      />
    </div>
  );
}
