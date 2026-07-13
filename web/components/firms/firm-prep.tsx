"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/reader/markdown";
import { Loader2 } from "lucide-react";
import type { Firm } from "@/lib/types";

export function FirmPrep({ firm }: { firm: Firm }) {
  const [prep, setPrep] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setPrep("");
    try {
      const res = await fetch(`/api/firms/${firm.slug}/prep`, {
        method: "POST",
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPrep(acc);
      }
    } catch {
      setPrep("Sorry, couldn't reach Claude. Make sure ANTHROPIC_API_KEY is set.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-10">
      <header className="border-b pb-6">
        <p className="eyebrow">Firm prep</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">{firm.name}</h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs">{firm.hq}</p>
          </div>
          <Badge variant="outline">{firm.tier.replace("-", " ")}</Badge>
        </div>
        <p className="text-muted-foreground mt-4 max-w-3xl text-sm leading-relaxed">
          {firm.description}
        </p>
      </header>

      <Card className="mt-8 gap-0 rounded-md p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="eyebrow">Pre-interview prep sheet</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Claude synthesizes the latest earnings, recent deals, and interview-ready talking
              points.
            </p>
          </div>
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
                Generating…
              </>
            ) : prep ? (
              "Regenerate"
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {firm.latestEarningsRaw && (
          <details className="mb-4">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-mono text-xs">
              Source data (latest earnings snapshot)
            </summary>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed whitespace-pre-wrap">
              {firm.latestEarningsRaw}
            </p>
          </details>
        )}

        {prep ? (
          <div className="bg-accent/30 rounded-md border p-5">
            <Markdown content={prep} />
          </div>
        ) : (
          <div className="bg-muted/30 text-muted-foreground rounded-md border border-dashed px-4 py-10 text-center text-sm">
            Click Generate to have Claude build a custom prep sheet before your {firm.name}{" "}
            interview.
          </div>
        )}
      </Card>
    </div>
  );
}
