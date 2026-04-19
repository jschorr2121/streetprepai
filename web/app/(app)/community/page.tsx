import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, ArrowRight } from "lucide-react";

const threads = [
  {
    title: "GS TMT Superday experience — just finished",
    author: "anon · 2nd year at USC",
    replies: 23,
    tags: ["GS", "TMT", "Superday"],
    excerpt:
      "Walked me through DCF, LBO basics, then behavioral. Interviewer #3 asked about the Marvell/Innovium deal. I was not ready.",
  },
  {
    title: "Evercore M&A first round — 2026 cycle",
    author: "anon · Wharton junior",
    replies: 11,
    tags: ["Evercore", "EB", "M&A"],
    excerpt:
      "Two analysts, one associate. 30 min each. Classic tech, classic fit. They care deeply about the why-Evercore answer.",
  },
  {
    title: "Non-target at Citi — how I got the look",
    author: "anon · 3rd year, state school",
    replies: 47,
    tags: ["Citi", "non-target", "networking"],
    excerpt:
      "Outreach strategy, what worked, what didn't. 200+ emails, 18 calls, 3 first rounds.",
  },
];

export default function CommunityPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <MessageSquare className="size-4" /> Community
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Interview reports and study groups
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Anonymous peer reports from recent rounds. Moderated, invite-only to
          start. Every report becomes training data for the Mock Interview
          Studio.
        </p>
      </header>
      <div className="space-y-3">
        {threads.map((t) => (
          <Card key={t.title} className="p-5 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold group-hover:text-primary">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.author} · {t.replies} replies
                </p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {t.excerpt}
                </p>
                <div className="flex gap-1.5 mt-3">
                  {t.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-8 flex items-center justify-center gap-1.5">
        <Users className="size-3.5" />
        Community is stubbed in the prototype. Full forum with moderation ships in V1.
      </p>
    </div>
  );
}
