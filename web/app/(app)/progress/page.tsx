import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { listTopicMastery } from "@/lib/db/queries/curriculum";
import { countDueReviews, listRecentAttempts } from "@/lib/db/queries/qbank";
import { chapters } from "@/lib/curriculum/chapters";
import { summarizeActivity } from "@/lib/mastery/activity";
import { weakestTopics } from "@/lib/mastery/mastery";
import { cn } from "@/lib/utils";

export const metadata = { title: "Progress — Street Prep AI" };

const TOPIC_LABEL = new Map<string, string>(chapters.map((c) => [c.topic, c.shortTitle]));
const ALL_TOPICS = [...TOPIC_LABEL.entries()].map(([value, label]) => ({ value, label }));

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Mastery → token: strong = primary, middling = warning, weak = destructive. */
function masteryFill(mastery: number) {
  return mastery >= 0.7 ? "bg-primary" : mastery >= 0.5 ? "bg-warning" : "bg-destructive";
}

export default async function ProgressPage() {
  const user = await requireUser();
  const { mastery, attempts, dueCount } = await withUser(
    { sub: user.id, role: "authenticated" },
    async (tx) => {
      const [mastery, attempts, dueCount] = await Promise.all([
        listTopicMastery(tx, user.id),
        listRecentAttempts(tx, user.id, 500),
        countDueReviews(tx, user.id),
      ]);
      return { mastery, attempts, dueCount };
    },
  );

  const now = new Date();
  const answeredDates = attempts.map((a) => new Date(a.answeredAt));
  const activity = summarizeActivity(answeredDates, now);
  const weekCount = answeredDates.filter((d) => now.getTime() - d.getTime() < WEEK_MS).length;

  const practiced = mastery.filter((m) => m.attempts > 0);
  const overallMastery =
    practiced.length > 0 ? practiced.reduce((sum, m) => sum + m.score, 0) / practiced.length : null;

  const weak = weakestTopics(mastery, 3);
  const masteryByTopic = new Map(mastery.map((m) => [m.topic, m]));
  const hasAnyData = attempts.length > 0 || practiced.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="You"
        title="What you need to work on"
        description="Not what you've done — what to do next. Graded answers across drills, gates, and the question bank feed this."
      />

      {/* Ledger strip: one ruled row, three cells. */}
      <section
        aria-label="Progress at a glance"
        className="bg-card mt-8 grid grid-cols-1 divide-y rounded-md border md:grid-cols-3 md:divide-x md:divide-y-0"
      >
        <div className="p-5">
          <p className="eyebrow">Streak</p>
          <p className="mt-2 text-3xl">
            <span className="tabular">{activity.currentStreak}</span>{" "}
            <span className="text-muted-foreground text-sm">
              day{activity.currentStreak === 1 ? "" : "s"}
            </span>
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            longest {activity.longestStreak} in the last 4 weeks
          </p>
        </div>
        <div className="p-5">
          <p className="eyebrow">Overall mastery</p>
          <p className="tabular mt-2 text-3xl">
            {overallMastery != null ? `${Math.round(overallMastery * 100)}%` : "—"}
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {overallMastery != null
              ? `across ${practiced.length} topic${practiced.length === 1 ? "" : "s"} practiced`
              : "answer questions to start tracking"}
          </p>
        </div>
        <div className="p-5">
          <p className="eyebrow">This week</p>
          <p className="tabular mt-2 text-3xl">{weekCount}</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            graded answers · {dueCount} due for review
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 border-b pb-3">
          <h2 className="font-display text-xl">Focus today</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Your weakest topics, ranked by mastery.
          </p>
        </div>
        {weak.length > 0 ? (
          <div className="bg-card divide-y rounded-md border">
            {weak.map((w, i) => (
              <div key={w.topic} className="flex items-start justify-between gap-4 p-4">
                <div className="flex min-w-0 flex-1 gap-3">
                  <span className="text-muted-foreground font-mono text-xs leading-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{TOPIC_LABEL.get(w.topic) ?? w.topic}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {w.attempts} graded answer{w.attempts === 1 ? "" : "s"} so far
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="w-20">
                    <div className="bg-muted h-1.5 overflow-hidden rounded-none">
                      <div className="bg-primary h-full" style={{ width: `${w.score * 100}%` }} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-right font-mono text-[10px]">
                      {Math.round(w.score * 100)}% mastered
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/tools/question-bank">
                      Drill <ArrowRight aria-hidden className="ml-1 size-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-5">
            <p className="text-muted-foreground text-sm">
              {hasAnyData
                ? "Keep going — weak areas show up here once a topic has 3+ graded answers."
                : "Answer a few questions and your weakest areas will show up here with one-click drills."}
            </p>
            <Button asChild size="sm" className="mt-4 w-fit">
              <Link href="/tools/question-bank">Start drilling</Link>
            </Button>
          </Card>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display mb-4 border-b pb-3 text-xl">Mastery by topic</h2>
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4">
            {ALL_TOPICS.map((t) => {
              const entry = masteryByTopic.get(t.value);
              const hasData = !!entry && entry.attempts > 0;
              return (
                <div key={t.value}>
                  <p className="mb-1 text-xs font-medium">{t.label}</p>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-none">
                    {hasData && (
                      <div
                        className={cn("h-full transition-all", masteryFill(entry.score))}
                        style={{ width: `${entry.score * 100}%` }}
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-right font-mono text-[10px]">
                    {hasData ? `${Math.round(entry.score * 100)}%` : "no data"}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="mt-10 mb-10">
        <h2 className="font-display mb-4 border-b pb-3 text-xl">Last 4 weeks</h2>
        <Card className="gap-3 p-5">
          <div className="grid grid-cols-14 gap-1">
            {activity.activeDays.map((active, i) => (
              <div
                key={i}
                className={cn("aspect-square rounded-[2px]", active ? "bg-success/80" : "bg-muted")}
              />
            ))}
          </div>
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.08em] uppercase">
            28 days · oldest first
          </p>
        </Card>
      </section>
    </div>
  );
}
