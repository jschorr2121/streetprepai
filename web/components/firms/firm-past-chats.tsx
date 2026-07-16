import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
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
    <section className="mx-auto max-w-4xl px-6 pb-12 md:px-10">
      <h2 className="eyebrow border-b pb-3">Past chats mentioning {firmName}</h2>
      <ul>
        {matches.map(({ log, contact }) => {
          // Prefer 2 lines of advice given; fall back to topics; fall back to raw notes.
          const adviceExcerpt = (log.structured?.adviceGiven ?? []).slice(0, 2);
          const topicsExcerpt = (log.structured?.topics ?? []).slice(0, 2);
          return (
            <li key={log.id}>
              <Link
                href={`/tools/relationships/${contact.id}`}
                className="group hover:bg-accent/40 -mx-3 block rounded-sm border-b px-3 py-3.5 transition-colors duration-150"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="group-hover:text-primary text-sm font-medium transition-colors">
                      {contact.name}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {contact.title} · {contact.firm}
                    </p>
                  </div>
                  <span className="text-muted-foreground flex shrink-0 items-center gap-3 font-mono text-xs">
                    {log.happenedAt}
                    <ArrowRight
                      aria-hidden
                      className="group-hover:text-primary size-3 transition-colors"
                    />
                  </span>
                </div>
                <div className="mt-2">
                  {adviceExcerpt.length > 0 ? (
                    <ul className="space-y-1">
                      {adviceExcerpt.map((a, i) => (
                        <li
                          key={i}
                          className="text-muted-foreground flex gap-2 text-xs leading-relaxed"
                        >
                          <span>–</span>
                          <span className="line-clamp-2">{a}</span>
                        </li>
                      ))}
                    </ul>
                  ) : topicsExcerpt.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {topicsExcerpt.map((t, i) => (
                        <Badge key={i} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground line-clamp-2 text-xs">{log.rawNotes}</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground/70 mt-3 font-mono text-[11px]">
        {/* TODO: replace with pgvector similarity search when DB wired. */}
        String-match recall — semantic embeddings ship with Phase 1.
      </p>
    </section>
  );
}
