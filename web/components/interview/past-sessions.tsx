import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MockInterview } from "@/lib/types";

// Minimal shape a scorecard needs to compute an "overall" readout. The stored
// scorecard column is JSONB (`unknown` in MockInterview) — parse it rather
// than casting, since older or partially-scored rows may not have this shape.
const ScorecardScoresSchema = z
  .object({
    content_score: z.number(),
    delivery_score: z.number(),
  })
  .partial();

function overallScore(scorecard: unknown): number | null {
  const parsed = ScorecardScoresSchema.safeParse(scorecard);
  if (!parsed.success) return null;
  const { content_score, delivery_score } = parsed.data;
  if (typeof content_score !== "number" || typeof delivery_score !== "number") return null;
  return Math.round((content_score + delivery_score) / 2);
}

const MODE_LABELS: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  firm: "Firm-specific",
  superday: "Mixed Superday",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PastSessions({ sessions }: { sessions: MockInterview[] }) {
  return (
    <Card className="space-y-4 p-5">
      <p className="eyebrow">Past sessions</p>
      {sessions.length === 0 ? (
        <div className="rounded-md border border-dashed px-6 py-10 text-center">
          <p className="text-foreground text-sm font-medium">No completed sessions yet.</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
            Record and submit an answer above — every scored session shows up here.
          </p>
        </div>
      ) : (
        <ul className="bg-card divide-y rounded-md border" aria-label="Your past mock interviews">
          {sessions.map((s) => {
            const overall = overallScore(s.scorecard);
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.questionText}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{MODE_LABELS[s.mode] ?? s.mode}</Badge>
                    <span className="text-muted-foreground text-xs">{formatDate(s.createdAt)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {overall === null ? (
                    <span className="text-muted-foreground text-xs">Not scored</span>
                  ) : (
                    <p className="tabular text-lg font-medium">
                      {overall}
                      <span className="text-muted-foreground font-mono text-xs"> /100</span>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
