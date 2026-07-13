import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const weakAreas = [
  {
    topic: "DCF terminal value assumptions",
    subtopic: "Gordon Growth vs exit multiple",
    mastery: 0.38,
    signal: "2 recent mock questions scored below 60",
    drillHref: "/guide/walk-me-through-a-dcf",
  },
  {
    topic: "Conflict stories",
    subtopic: "STAR structure — Situation too long",
    mastery: 0.42,
    signal: "Only 1 conflict story in your Story Bank",
    drillHref: "/tools/story-framer",
  },
  {
    topic: "GS TMT firm-specific fit",
    subtopic: "Recent deal knowledge",
    mastery: 0.51,
    signal: "Haven't opened GS firm page this week",
    drillHref: "/firms/goldman-sachs",
  },
];

const masteryByTopic = [
  { topic: "Accounting", mastery: 0.82 },
  { topic: "Valuation", mastery: 0.67 },
  { topic: "M&A", mastery: 0.74 },
  { topic: "LBO", mastery: 0.55 },
  { topic: "Behavioral", mastery: 0.62 },
  { topic: "Firm-specific", mastery: 0.48 },
  { topic: "Networking", mastery: 0.77 },
  { topic: "Modeling tests", mastery: 0.3 },
];

const streakDays = Array.from({ length: 28 }, (_, i) => {
  const v = Math.random();
  return { day: i, active: v > 0.22 };
});

/** Mastery → token: strong = primary, middling = warning, weak = destructive. */
function masteryFill(mastery: number) {
  return mastery >= 0.7 ? "bg-primary" : mastery >= 0.5 ? "bg-warning" : "bg-destructive";
}

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="You"
        title="What you need to work on"
        description="Not what you've done — what to do next. Mock scores, flashcard accuracy, and reading signals all feed this."
      />

      {/* Ledger strip: one ruled row, three cells. */}
      <section
        aria-label="Progress at a glance"
        className="bg-card mt-8 grid grid-cols-1 divide-y rounded-md border md:grid-cols-3 md:divide-x md:divide-y-0"
      >
        <div className="p-5">
          <p className="eyebrow">Streak</p>
          <p className="mt-2 text-3xl">
            <span className="tabular">12</span>{" "}
            <span className="text-muted-foreground text-sm">days</span>
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">longest 21</p>
        </div>
        <div className="p-5">
          <p className="eyebrow">Overall mastery</p>
          <p className="tabular mt-2 text-3xl">61%</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">+4% in the last 7 days</p>
        </div>
        <div className="p-5">
          <p className="eyebrow">This week</p>
          <p className="tabular mt-2 text-3xl">23</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            flashcards · 2 mocks · 4 chats
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 border-b pb-3">
          <h2 className="font-display text-xl">Focus today</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ranked by how much they&apos;re holding you back.
          </p>
        </div>
        <div className="bg-card divide-y rounded-md border">
          {weakAreas.map((w, i) => (
            <div key={w.topic} className="flex items-start justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="text-muted-foreground font-mono text-xs leading-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{w.topic}</p>
                  <p className="text-muted-foreground text-xs">{w.subtopic}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{w.signal}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="w-20">
                  <div className="bg-muted h-1.5 overflow-hidden rounded-none">
                    <div className="bg-primary h-full" style={{ width: `${w.mastery * 100}%` }} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-right font-mono text-[10px]">
                    {Math.round(w.mastery * 100)}% mastered
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={w.drillHref}>
                    Drill <ArrowRight aria-hidden className="ml-1 size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display mb-4 border-b pb-3 text-xl">Mastery by topic</h2>
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4">
            {masteryByTopic.map((t) => (
              <div key={t.topic}>
                <p className="mb-1 text-xs font-medium">{t.topic}</p>
                <div className="bg-muted h-1.5 overflow-hidden rounded-none">
                  <div
                    className={cn("h-full transition-all", masteryFill(t.mastery))}
                    style={{ width: `${t.mastery * 100}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-right font-mono text-[10px]">
                  {Math.round(t.mastery * 100)}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-10 mb-10">
        <h2 className="font-display mb-4 border-b pb-3 text-xl">Last 4 weeks</h2>
        <Card className="gap-3 p-5">
          <div className="grid grid-cols-14 gap-1">
            {streakDays.map((d) => (
              <div
                key={d.day}
                className={cn(
                  "aspect-square rounded-[2px]",
                  d.active ? "bg-success/80" : "bg-muted",
                )}
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
