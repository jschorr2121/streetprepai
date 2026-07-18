"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RotateCcw, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import type {
  CritiquedBullet,
  CritiqueResult,
  WeaknessFlag,
} from "@/app/api/resume/critique/route";

const FLAG_LABELS: Record<WeaknessFlag, string> = {
  vague: "vague",
  no_metric: "no metric",
  passive_voice: "passive voice",
  weak_verb: "weak verb",
  missing_scope: "missing scope",
  buzzword_only: "buzzwords",
};

type AppliedMap = Record<string, boolean>;

export function ResumeCoach() {
  const [rawText, setRawText] = useState("");
  const [pasteValue, setPasteValue] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [critiquing, setCritiquing] = useState(false);
  const [result, setResult] = useState<CritiqueResult | null>(null);
  const [applied, setApplied] = useState<AppliedMap>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF.");
      return;
    }
    // Match the server's 5 MB cap before uploading the whole file.
    if (file.size > 5 * 1024 * 1024) {
      toast.error("That PDF is over 5 MB. Export a smaller version and try again.");
      return;
    }
    setExtracting(true);
    try {
      const res = await fetch("/api/resume/extract", {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? `Could not extract PDF (HTTP ${res.status}).`);
        return;
      }
      setRawText(data.raw_text);
      toast.success(`Extracted ${data.pages} page${data.pages === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setExtracting(false);
    }
  }, []);

  const runCritique = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.error("Add some resume text first.");
      return;
    }
    setCritiquing(true);
    setResult(null);
    setApplied({});
    try {
      const res = await fetch("/api/resume/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? `Critique failed (HTTP ${res.status}).`);
        return;
      }
      setResult(data as CritiqueResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Critique failed.");
    } finally {
      setCritiquing(false);
    }
  }, []);

  const applyOne = (id: string) => setApplied((p) => ({ ...p, [id]: true }));
  const revertOne = (id: string) => setApplied((p) => ({ ...p, [id]: false }));
  const applyAll = () => {
    if (!result) return;
    const next: AppliedMap = {};
    for (const s of result.sections) {
      for (const b of s.bullets) {
        if (b.confidence !== "low") next[b.id] = true;
      }
    }
    setApplied(next);
  };
  const rejectAll = () => setApplied({});

  const hasResult = !!result;
  const totalBullets = result?.summary.total_bullets ?? 0;
  const weakBullets = result?.summary.weak_bullets ?? 0;
  const appliedCount = useMemo(() => Object.values(applied).filter(Boolean).length, [applied]);

  return (
    <div className="space-y-6">
      {!hasResult && (
        <Card className="p-6">
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload">Upload PDF</TabsTrigger>
              <TabsTrigger value="paste">Paste text</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4 space-y-4">
              <button
                type="button"
                disabled={extracting}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (extracting) return;
                  const f = e.dataTransfer.files?.[0];
                  if (f) void onFile(f);
                }}
                className="hover:bg-accent/30 w-full rounded-md border border-dashed p-10 text-center transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60"
              >
                <Upload className="text-muted-foreground mx-auto size-6" />
                <p className="mt-3 font-medium">
                  {extracting ? "Extracting…" : "Drop your resume PDF here or click to browse"}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Max 5 MB. We don&apos;t store the file.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                    // Reset so re-selecting the same file fires onChange again.
                    e.target.value = "";
                  }}
                />
              </button>
              {rawText && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Extracted preview (
                    <span className="tabular">{rawText.length.toLocaleString()}</span> chars):
                  </p>
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="min-h-40 font-mono text-xs"
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => void runCritique(rawText)} disabled={critiquing}>
                      {critiquing && <Loader2 className="size-4 animate-spin" />}
                      Critique &amp; rewrite
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="paste" className="mt-4 space-y-3">
              <Textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="Paste the full text of your resume here…"
                className="min-h-64 font-mono text-xs"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => void runCritique(pasteValue)}
                  disabled={critiquing || !pasteValue.trim()}
                >
                  {critiquing && <Loader2 className="size-4 animate-spin" />}
                  Critique &amp; rewrite
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {hasResult && result && (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-semibold">
                  <span className="tabular">{weakBullets}</span>
                  <span className="text-muted-foreground text-base font-normal">
                    {" "}
                    / <span className="tabular">{totalBullets}</span> bullets need work
                  </span>
                </p>
                {result.summary.top_issues.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Top issues: {result.summary.top_issues.join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{appliedCount} applied</Badge>
              <Button variant="outline" size="sm" onClick={rejectAll}>
                <RotateCcw className="size-4" /> Revert all
              </Button>
              <Button size="sm" onClick={applyAll}>
                <CheckCircle2 className="size-4" /> Apply all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setApplied({});
                  setRawText("");
                  setPasteValue("");
                }}
              >
                Start over
              </Button>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {result.sections.map((section) => (
                <SectionDiff
                  key={section.heading}
                  heading={section.heading}
                  bullets={section.bullets}
                  applied={applied}
                  onApply={applyOne}
                  onRevert={revertOne}
                />
              ))}
            </div>
            <aside className="space-y-3">
              <h2 className="eyebrow">Edited preview</h2>
              <Card className="sticky top-6 max-h-[80vh] overflow-y-auto p-5">
                <PreviewPane result={result} applied={applied} />
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function SectionDiff({
  heading,
  bullets,
  applied,
  onApply,
  onRevert,
}: {
  heading: string;
  bullets: CritiquedBullet[];
  applied: AppliedMap;
  onApply: (id: string) => void;
  onRevert: (id: string) => void;
}) {
  if (bullets.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <div className="space-y-3">
        {bullets.map((b) => (
          <BulletDiff
            key={b.id}
            bullet={b}
            isApplied={!!applied[b.id]}
            onApply={() => onApply(b.id)}
            onRevert={() => onRevert(b.id)}
          />
        ))}
      </div>
    </section>
  );
}

function BulletDiff({
  bullet,
  isApplied,
  onApply,
  onRevert,
}: {
  bullet: CritiquedBullet;
  isApplied: boolean;
  onApply: () => void;
  onRevert: () => void;
}) {
  const lowConfidence = bullet.confidence === "low";
  return (
    <Card className="space-y-3 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">Before</span>
            {bullet.weakness_flags.map((f) => {
              // The server schema allows any string for graceful degradation
              // (see lib/validation/schemas/resume.ts); skip flags we don't
              // have a label for rather than rendering a blank badge.
              const label = FLAG_LABELS[f];
              if (!label) return null;
              return (
                <Badge key={f} variant="outline">
                  {label}
                </Badge>
              );
            })}
          </div>
          <p className="bg-destructive/5 rounded-sm p-3 text-sm leading-relaxed">
            {bullet.original}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{lowConfidence ? "Guidance" : "After"}</span>
            {lowConfidence ? (
              <Badge variant="warning">low confidence</Badge>
            ) : (
              <Badge variant="secondary">{bullet.confidence}</Badge>
            )}
          </div>
          <p
            className={`rounded-sm p-3 text-sm leading-relaxed ${
              lowConfidence ? "bg-warning/5" : "bg-success/5 font-medium"
            }`}
          >
            {bullet.rewritten}
          </p>
        </div>
      </div>
      {bullet.critique && (
        <p className="text-muted-foreground flex items-start gap-2 text-xs">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {bullet.critique}
        </p>
      )}
      {!lowConfidence && (
        <div className="flex justify-end">
          {isApplied ? (
            <Button variant="ghost" size="sm" onClick={onRevert}>
              <RotateCcw className="size-3.5" /> Revert
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onApply}>
              Apply <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function PreviewPane({ result, applied }: { result: CritiqueResult; applied: AppliedMap }) {
  return (
    <div className="space-y-5 text-sm">
      {result.sections.map((section, i) => (
        <div key={section.heading}>
          {i > 0 && <Separator className="mb-4" />}
          <h3 className="mb-2 font-semibold">{section.heading}</h3>
          <ul className="marker:text-muted-foreground list-inside list-disc space-y-2">
            {section.bullets.map((b) => {
              const useRewrite = applied[b.id] && b.confidence !== "low";
              const text = useRewrite ? b.rewritten : b.original;
              return (
                <li
                  key={b.id}
                  className={`leading-relaxed ${
                    useRewrite ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {text}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
