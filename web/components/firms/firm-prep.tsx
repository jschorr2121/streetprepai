"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/reader/markdown";
import { Sparkles, Loader2, Building2 } from "lucide-react";
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
      setPrep(
        "Sorry, couldn't reach Claude. Make sure ANTHROPIC_API_KEY is set.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Building2 className="size-4" /> Firm prep
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{firm.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{firm.hq}</p>
          </div>
          <Badge variant="outline" className="capitalize">
            {firm.tier.replace("-", " ")}
          </Badge>
        </div>
        <p className="mt-4 text-muted-foreground leading-relaxed max-w-3xl">
          {firm.description}
        </p>
      </header>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              Pre-interview prep sheet
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Claude synthesizes the latest earnings, recent deals, and
              interview-ready talking points.
            </p>
          </div>
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Generating…
              </>
            ) : prep ? (
              "Regenerate"
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1.5" /> Generate
              </>
            )}
          </Button>
        </div>

        {firm.latestEarningsRaw && (
          <details className="mb-4">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Source data (latest earnings snapshot)
            </summary>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2">
              {firm.latestEarningsRaw}
            </p>
          </details>
        )}

        {prep ? (
          <div className="rounded-lg border bg-accent/30 p-5">
            <Markdown content={prep} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-sm text-muted-foreground text-center">
            Click Generate to have Claude build a custom prep sheet before your
            {" "}
            {firm.name} interview.
          </div>
        )}
      </Card>
    </div>
  );
}
