import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  CompassIcon,
  ListChecks,
  Mic,
  Target,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductTour, type TourStep } from "@/components/tour/product-tour";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getProfile } from "@/lib/db/queries/profile";
import {
  listChapterProgress,
  listSectionProgress,
  listTopicMastery,
} from "@/lib/db/queries/curriculum";
import { countDueReviews } from "@/lib/db/queries/qbank";
import { chapters } from "@/lib/curriculum/chapters";
import { computeFlow } from "@/lib/curriculum/progress";
import { cycleGuidance } from "@/lib/curriculum/cycle";
import { weakestTopics } from "@/lib/mastery/mastery";

export const metadata = { title: "Dashboard — Street Prep AI" };

const TOPIC_LABEL = new Map<string, string>(chapters.map((c) => [c.topic, c.shortTitle]));

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="/learn"]',
    title: "The learning flow",
    description:
      "Sixteen chapters from recruiting timeline through technicals to superday. This is your spine — work through it in order.",
  },
  {
    selector: '[data-tour="cycle-widget"]',
    title: "Your recruiting cycle",
    description: "Based on your semester, this tells you what to focus on right now.",
  },
  {
    selector: '[data-tour="continue-flow"]',
    title: "Pick up where you left off",
    description: "Always shows your next section — one click to jump back in.",
  },
  {
    selector: '[data-tour="due-reviews"]',
    title: "Spaced review",
    description:
      "Questions you missed resurface here every few days until you've nailed them twice in a row.",
  },
  {
    selector: '[data-tour="weak-areas"]',
    title: "Your weakest areas",
    description: "Mastery is tracked per topic — drill straight into whatever needs the most work.",
  },
  {
    selector: '[data-tour="/tools/applications"]',
    title: "Application Tracker",
    description: "Log every firm you're applying to and track each one through the pipeline.",
  },
  {
    selector: '[data-tour="/profile"]',
    title: "Your profile",
    description:
      "Target firms, roles, and the advanced-track toggle for PE-style questions all live here.",
  },
];

export default async function DashboardPage() {
  const user = await requireUser();
  // Fire the independent reads together: postgres.js pipelines concurrent
  // queries on the transaction's connection, so this costs ~1 round trip
  // instead of 5 sequential ones.
  const { profile, sections, chapterRows, mastery, dueCount } = await withUser(
    { sub: user.id, role: "authenticated" },
    async (tx) => {
      const [profile, sections, chapterRows, mastery, dueCount] = await Promise.all([
        getProfile(tx, user.id),
        listSectionProgress(tx, user.id),
        listChapterProgress(tx, user.id),
        listTopicMastery(tx, user.id),
        countDueReviews(tx, user.id),
      ]);
      return { profile, sections, chapterRows, mastery, dueCount };
    },
  );

  const flow = computeFlow(sections, chapterRows);
  const cycle = cycleGuidance(profile.currentSemester);
  const weak = weakestTopics(mastery, 3);
  const spineDone = flow.statuses.filter((s) => s.chapter.kind === "spine" && s.completed).length;
  const spineTotal = chapters.filter((c) => c.kind === "spine").length;
  const firstName = profile.fullName?.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s where to spend your time today.</p>
      </header>

      <ProductTour steps={TOUR_STEPS} active={!profile.tourCompletedAt} />

      {/* Recruiting cycle widget */}
      <Card data-tour="cycle-widget" className="border-primary/30 bg-primary/5 mb-6 p-5">
        <div className="flex items-start gap-3">
          <CompassIcon className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{cycle.headline}</h2>
              <Badge variant="outline" className="rounded-full text-xs capitalize">
                {cycle.path} track
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{cycle.detail}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cycle.focus.map((f) => (
                <Badge key={f} variant="secondary" className="rounded-full text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Continue learning */}
        <Card data-tour="continue-flow" className="flex flex-col p-5 md:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <BookOpenText className="text-primary size-4" />
            <p className="text-sm font-medium">Continue the flow</p>
          </div>
          {flow.nextUp ? (
            <>
              <p className="text-lg font-semibold">{flow.nextUp.chapter.title}</p>
              <p className="text-muted-foreground text-sm">{flow.nextUp.sectionTitle}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Button asChild size="sm">
                  <Link href={`/guide/${flow.nextUp.sectionSlug}`}>
                    Read section <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/learn/${flow.nextUp.chapter.slug}`}>Chapter</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">All chapters complete</p>
              <p className="text-muted-foreground text-sm">
                Keep sharp with the daily drill and mock interviews.
              </p>
              <div className="mt-auto pt-4">
                <Button asChild size="sm">
                  <Link href="/tools/question-bank">Daily drill</Link>
                </Button>
              </div>
            </>
          )}
          <p className="text-muted-foreground mt-3 text-xs">
            {spineDone} of {spineTotal} chapters complete
          </p>
        </Card>

        {/* Due reviews */}
        <Card data-tour="due-reviews" className="flex flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="text-primary size-4" />
            <p className="text-sm font-medium">Due for review</p>
          </div>
          <p className="text-3xl font-semibold">{dueCount}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {dueCount === 0
              ? "Nothing due — answer questions to build your queue."
              : "Weak questions resurfacing today."}
          </p>
          <div className="mt-auto pt-4">
            <Button asChild size="sm" variant={dueCount > 0 ? "default" : "outline"}>
              <Link href="/tools/question-bank">
                <ListChecks className="mr-1 size-3.5" /> Drill now
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Weak areas */}
        <Card data-tour="weak-areas" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="text-primary size-4" />
            <h3 className="font-semibold">Your weakest areas</h3>
          </div>
          {weak.length > 0 ? (
            <ul className="space-y-2">
              {weak.map((w) => (
                <li key={w.topic} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Target className="text-muted-foreground size-3.5" />
                    <span className="text-sm">{TOPIC_LABEL.get(w.topic) ?? w.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {Math.round(w.score * 100)}%
                    </span>
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                      <Link href="/tools/question-bank">Drill</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Answer a few questions in the Question Bank and your weak areas show up here with
              one-click drills.
            </p>
          )}
        </Card>

        {/* Mock interview */}
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <Mic className="text-primary size-4" />
            <h3 className="font-semibold">Run a mock interview</h3>
          </div>
          <p className="text-muted-foreground mb-4 flex-1 text-sm leading-relaxed">
            Voice or HireVue-style video. Claude scores content and delivery, cites the chapters you
            should review, and probes with follow-ups.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/tools/mock-interview?mode=technical">Technical</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/tools/mock-interview?mode=behavioral">Behavioral</Link>
            </Button>
          </div>
        </Card>
      </div>

      {spineDone === spineTotal && spineTotal > 0 && (
        <div className="text-primary mt-6 flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4" /> You&apos;ve completed every chapter. Now it&apos;s
          reps.
        </div>
      )}
    </div>
  );
}
