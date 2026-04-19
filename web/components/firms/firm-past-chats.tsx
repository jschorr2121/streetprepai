import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight } from "lucide-react";
import type { ChatLog, Contact } from "@/lib/types";

export function FirmPastChats({
  firmName,
  matches,
}: {
  firmName: string;
  matches: { log: ChatLog; contact: Contact }[];
}) {
  if (matches.length === 0) return null;

  return (
    <section className="max-w-4xl mx-auto px-6 md:px-8 pb-12">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        <MessageSquare className="size-3.5" />
        Past chats mentioning {firmName}
      </h2>
      <div className="space-y-3">
        {matches.map(({ log, contact }) => {
          // Prefer 2 lines of advice given; fall back to topics; fall back to raw notes.
          const adviceExcerpt = (log.structured?.adviceGiven ?? []).slice(0, 2);
          const topicsExcerpt = (log.structured?.topics ?? []).slice(0, 2);
          return (
            <Link
              key={log.id}
              href={`/relationships/${contact.id}`}
              className="block"
            >
              <Card className="p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{contact.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {contact.title} · {contact.firm} · {log.happenedAt}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                {adviceExcerpt.length > 0 ? (
                  <ul className="space-y-1">
                    {adviceExcerpt.map((a, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground leading-relaxed flex gap-2"
                      >
                        <span>–</span>
                        <span className="line-clamp-2">{a}</span>
                      </li>
                    ))}
                  </ul>
                ) : topicsExcerpt.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {topicsExcerpt.map((t, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[10px] rounded-full"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {log.rawNotes}
                  </p>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-3">
        {/* TODO: replace with pgvector similarity search when DB wired. */}
        String-match recall — semantic embeddings ship with Phase 1.
      </p>
    </section>
  );
}
