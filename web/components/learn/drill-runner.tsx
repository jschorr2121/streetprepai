"use client";

// Parameterized drill runner — the 3-statement / TSM / accretion-dilution /
// paper-LBO generators. Answers are checked locally against the computed key
// (no LLM, no server round-trip) because these drills are deterministic. A
// fresh random instance is generated each round so nothing can be memorized.

import { useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/reader/markdown";
import {
  DRILL_GENERATORS,
  DRILL_META,
  type Drill,
  type DrillKind,
} from "@/lib/curriculum/drills/generators";
import { cn } from "@/lib/utils";

export function DrillRunner({ kind }: { kind: DrillKind }) {
  const meta = DRILL_META[kind];
  const [round, setRound] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  // New random drill each round. Math.random is fine client-side (not persisted).
  const drill: Drill = useMemo(
    () => DRILL_GENERATORS[kind](Math.random),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, round],
  );

  function check() {
    setChecked(true);
  }

  function nextDrill() {
    setRound((r) => r + 1);
    setValues({});
    setChecked(false);
  }

  const results = drill.fields.map((f) => {
    const raw = values[f.key];
    const num = raw != null && raw.trim() !== "" ? Number(raw) : NaN;
    const correct = Number.isFinite(num) && Math.abs(num - f.value) <= f.tolerance;
    return { field: f, correct, answered: Number.isFinite(num) };
  });
  const allCorrect = results.every((r) => r.correct);

  return (
    <div className="bg-card rounded-xl border p-5 shadow-sm">
      <div className="mb-1 text-sm font-semibold">{meta.title}</div>
      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{drill.prompt}</p>

      <div className="space-y-3">
        {drill.fields.map((f) => {
          const r = results.find((x) => x.field.key === f.key);
          return (
            <div key={f.key} className="flex items-center gap-3">
              <label htmlFor={`drill-${f.key}`} className="w-56 shrink-0 text-sm">
                {f.label}
              </label>
              <Input
                id={`drill-${f.key}`}
                type="number"
                step="any"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                disabled={checked}
                className={cn(
                  "max-w-40",
                  checked && r && (r.correct ? "border-primary" : "border-destructive"),
                )}
              />
              {checked && r && (
                <span className="flex items-center gap-1 text-sm">
                  {r.correct ? (
                    <CheckCircle2 className="text-primary size-4" />
                  ) : (
                    <>
                      <XCircle className="text-destructive size-4" />
                      <span className="text-muted-foreground">
                        = {f.value}
                        {f.unit ?? ""}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!checked ? (
        <Button className="mt-4" onClick={check} disabled={results.every((r) => !r.answered)}>
          Check answer
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              allCorrect ? "text-primary" : "text-destructive",
            )}
          >
            {allCorrect ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {allCorrect ? "Correct" : "Check the working below"}
          </div>
          <div className="bg-muted/30 rounded-lg border p-3">
            <Markdown content={drill.explanation} className="text-sm [&>p]:text-sm" />
          </div>
          <Button variant="outline" onClick={nextDrill} className="gap-1.5">
            <RefreshCw className="size-4" />
            New drill
          </Button>
        </div>
      )}
    </div>
  );
}
