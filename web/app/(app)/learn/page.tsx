import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, GraduationCap, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getProfile } from "@/lib/db/queries/profile";
import { listChapterProgress, listSectionProgress } from "@/lib/db/queries/curriculum";
import { chapters, GROUP_META, type ChapterGroup } from "@/lib/curriculum/chapters";
import { computeFlow } from "@/lib/curriculum/progress";
import { cn } from "@/lib/utils";

export const metadata = { title: "Learn — Street Prep AI" };

export default async function LearnPage() {
  const user = await requireUser();
  const { sections, chapterRows, profile } = await withUser(
    { sub: user.id, role: "authenticated" },
    async (tx) => ({
      sections: await listSectionProgress(tx, user.id),
      chapterRows: await listChapterProgress(tx, user.id),
      profile: await getProfile(tx, user.id),
    }),
  );

  const flow = computeFlow(sections, chapterRows);
  const statusBySlug = new Map(flow.statuses.map((s) => [s.chapter.slug, s]));
  const spineDone = flow.statuses.filter((s) => s.chapter.kind === "spine" && s.completed).length;
  const spineTotal = chapters.filter((c) => c.kind === "spine").length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <header className="mb-8">
        <div className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
          <GraduationCap className="size-4" /> Learning Flow
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Your complete IB recruiting prep</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Sixteen chapters grouped into five stages, from breaking in to interview day. Read each
          section, drill it, then clear the chapter. {spineDone} of {spineTotal} chapters complete.
        </p>
      </header>

      {flow.nextUp && (
        <Link
          href={`/learn/${flow.nextUp.chapter.slug}`}
          className="group border-primary/30 bg-primary/5 mb-8 flex items-center justify-between rounded-xl border p-5 transition-all hover:shadow-sm"
        >
          <div>
            <div className="text-primary text-xs font-medium">Pick up where you left off</div>
            <div className="mt-1 font-semibold">
              {flow.nextUp.chapter.title} · {flow.nextUp.sectionTitle}
            </div>
          </div>
          <ArrowRight className="text-primary size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      {(Object.keys(GROUP_META) as ChapterGroup[]).map((group) => {
        const groupChapters = chapters.filter((c) => c.group === group);
        if (groupChapters.length === 0) return null;
        const meta = GROUP_META[group];
        const groupDone = groupChapters.filter((c) => statusBySlug.get(c.slug)?.completed).length;
        return (
          <section key={group} className="mb-10">
            <div className="mb-3 flex items-baseline justify-between gap-4 border-b pb-2">
              <div>
                <h2 className="font-semibold">{meta.label}</h2>
                <p className="text-muted-foreground text-xs">{meta.description}</p>
              </div>
              {group !== "reference" && (
                <span className="text-muted-foreground shrink-0 text-xs">
                  {groupDone}/{groupChapters.length} complete
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {groupChapters.map((chapter) => {
                const st = statusBySlug.get(chapter.slug);
                const readFraction = st?.readFraction ?? 0;
                const advancedHidden =
                  !profile?.advancedTrack && chapter.sections.some((s) => s.advanced);
                return (
                  <Link
                    key={chapter.slug}
                    href={`/learn/${chapter.slug}`}
                    className="group bg-card hover:border-primary/40 flex flex-col rounded-xl border p-4 transition-all hover:shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span className="bg-muted grid size-6 place-items-center rounded-md font-medium">
                          {chapter.number}
                        </span>
                        {chapter.kind === "reference" ? (
                          <Badge variant="outline" className="rounded-full text-xs">
                            Reference
                          </Badge>
                        ) : chapter.gated ? (
                          <Badge variant="outline" className="gap-1 rounded-full text-xs">
                            <Lock className="size-3" /> Gated
                          </Badge>
                        ) : null}
                      </div>
                      {st?.completed && <CheckCircle2 className="text-primary size-5" />}
                    </div>
                    <h3 className="group-hover:text-primary font-semibold transition-colors">
                      {chapter.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2 flex-1 text-xs leading-relaxed">
                      {chapter.description}
                    </p>
                    {chapter.kind === "spine" && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              st?.completed ? "bg-primary" : "bg-primary/60",
                            )}
                            style={{ width: `${Math.round(readFraction * 100)}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {st?.sectionsRead ?? 0}/{st?.coreCount ?? chapter.sections.length}
                        </span>
                      </div>
                    )}
                    {advancedHidden && (
                      <p className="text-muted-foreground mt-2 text-xs">
                        + advanced sections available
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
