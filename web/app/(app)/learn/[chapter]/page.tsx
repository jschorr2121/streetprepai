import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Dumbbell,
  Lock,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkReadButton } from "@/components/learn/mark-read-button";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getProfile } from "@/lib/db/queries/profile";
import { listChapterProgress, listSectionProgress } from "@/lib/db/queries/curriculum";
import { getGuideBySlug } from "@/lib/data/guides";
import { coreSections, getChapter } from "@/lib/curriculum/chapters";
import { cn } from "@/lib/utils";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  if (!chapter) notFound();

  const user = await requireUser();
  const { sections, chapterRows, profile } = await withUser(
    { sub: user.id, role: "authenticated" },
    async (tx) => {
      const [sections, chapterRows, profile] = await Promise.all([
        listSectionProgress(tx, user.id),
        listChapterProgress(tx, user.id),
        getProfile(tx, user.id),
      ]);
      return { sections, chapterRows, profile };
    },
  );

  const readMap = new Map(sections.map((s) => [`${s.chapterSlug}::${s.sectionSlug}`, s]));
  const chapterRow = chapterRows.find((c) => c.chapterSlug === chapterSlug);
  const showAdvanced = profile?.advancedTrack ?? false;

  const visibleSections = chapter.sections.filter((s) => !s.advanced || showAdvanced);
  const core = coreSections(chapter);
  const coreRead = core.filter((s) => readMap.get(`${chapterSlug}::${s.slug}`)?.readAt).length;
  const allCoreRead = coreRead === core.length && core.length > 0;
  const gatePassed = !!chapterRow?.gatePassedAt;
  const completed = !!chapterRow?.completedAt;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1">
        <Link href="/learn">
          <ArrowLeft className="size-4" /> All chapters
        </Link>
      </Button>

      <header className="mb-6">
        <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
          <span className="bg-muted grid size-7 place-items-center rounded-md font-medium">
            {chapter.number}
          </span>
          {chapter.kind === "reference" ? (
            <Badge variant="outline" className="rounded-full text-xs">
              Reference — browse anytime
            </Badge>
          ) : chapter.gated ? (
            <Badge variant="outline" className="gap-1 rounded-full text-xs">
              <Lock className="size-3" /> Gated chapter
            </Badge>
          ) : null}
          {completed && (
            <Badge className="gap-1 rounded-full text-xs">
              <CheckCircle2 className="size-3" /> Complete
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{chapter.title}</h1>
        <p className="text-muted-foreground mt-2">{chapter.description}</p>
      </header>

      {chapter.toolExercise && (
        <Link
          href={chapter.toolExercise.href}
          className="group border-primary/30 bg-primary/5 mb-6 flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm"
        >
          <Sparkles className="text-primary size-5 shrink-0" />
          <div className="flex-1">
            <div className="text-primary text-xs font-medium">Tool exercise</div>
            <div className="text-sm font-medium">{chapter.toolExercise.label}</div>
          </div>
        </Link>
      )}

      <ol className="space-y-2">
        {visibleSections.map((section, i) => {
          const prog = readMap.get(`${chapterSlug}::${section.slug}`);
          const isRead = !!prog?.readAt;
          const drilled = !!prog?.drillCompletedAt;
          const guide = getGuideBySlug(section.slug);
          const hasDrill = chapter.kind === "spine";
          return (
            <li
              key={section.slug}
              className="bg-card flex items-center gap-3 rounded-xl border p-4"
            >
              <div className="shrink-0">
                {isRead ? (
                  <CheckCircle2 className="text-primary size-5" />
                ) : (
                  <Circle className="text-muted-foreground/40 size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{i + 1}</span>
                  <span className="truncate font-medium">{section.title}</span>
                  {section.advanced && (
                    <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  )}
                </div>
                {guide && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                    {guide.description}
                  </p>
                )}
                {!guide && (
                  <p className="text-muted-foreground/70 mt-0.5 text-xs italic">
                    Content in progress
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {drilled && (
                  <span className="text-primary hidden items-center gap-1 text-xs sm:flex">
                    <Dumbbell className="size-3.5" /> Drilled
                  </span>
                )}
                {hasDrill && !section.advanced && guide && (
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <Link href={`/learn/${chapter.slug}/drill/${section.slug}`}>
                      <Dumbbell className="size-3.5" /> Drill
                    </Link>
                  </Button>
                )}
                {guide ? (
                  <>
                    <MarkReadButton
                      chapterSlug={chapter.slug}
                      sectionSlug={section.slug}
                      read={isRead}
                    />
                    <Button asChild size="sm" className="h-8 gap-1 text-xs">
                      <Link href={`/guide/${section.slug}`}>
                        <BookOpen className="size-3.5" /> Read
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {chapter.kind === "spine" && chapter.gated && (
        <div
          className={cn(
            "mt-6 rounded-xl border p-5",
            gatePassed ? "border-primary/30 bg-primary/5" : "bg-card",
          )}
        >
          <div className="flex items-center gap-3">
            <Trophy className={cn("size-6", gatePassed ? "text-primary" : "text-muted-foreground")} />
            <div className="flex-1">
              <div className="font-semibold">Chapter gate</div>
              <p className="text-muted-foreground text-sm">
                {gatePassed
                  ? `Passed at ${Math.round(Number(chapterRow?.gateScore ?? 0))}%. Retake anytime to sharpen.`
                  : "A mixed quiz across this chapter. Score 85%+ to mark it complete. All content stays open regardless."}
              </p>
            </div>
            <Button asChild disabled={!allCoreRead}>
              <Link href={`/learn/${chapter.slug}/practice`}>
                {gatePassed ? "Retake gate" : "Take the gate"}
              </Link>
            </Button>
          </div>
          {!allCoreRead && (
            <p className="text-muted-foreground mt-3 text-xs">
              Read all {core.length} core sections first ({coreRead}/{core.length} done).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
