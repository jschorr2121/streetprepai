"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OutreachDraft, OutreachFollowup } from "@/app/api/relationships/draft-outreach/route";
import type { Contact } from "@/lib/types";

export function OutreachDrawer({
  contact,
  open,
  onOpenChange,
}: {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [linkedInContext, setLinkedInContext] = useState(contact.linkedinBio ?? "");
  const [studentGoal, setStudentGoal] = useState(
    "Sophomore targeting IB Summer Analyst recruiting. Looking for a 15-min call to learn about their group and path.",
  );
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(0);
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setDraft(null);
    setEditedBody("");
    try {
      const res = await fetch("/api/relationships/draft-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactFirm: contact.firm,
          contactTitle: contact.title,
          linkedInContext,
          studentGoal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't draft outreach.");
        return;
      }
      const d = data as OutreachDraft;
      setDraft(d);
      setSelectedSubject(0);
      setEditedBody(d.body);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't draft outreach.");
    } finally {
      setLoading(false);
    }
  }

  function copyEmail() {
    if (!draft) return;
    const subject = draft.subjects[selectedSubject] ?? draft.subjects[0] ?? "";
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${editedBody}`);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b">
          <p className="eyebrow">Outreach</p>
          <SheetTitle className="font-display">Draft cold outreach to {contact.name}</SheetTitle>
          <SheetDescription>
            Claude writes a warm, specific opener you can send today. You stay in the loop on the
            actual words.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 p-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin-context" className="eyebrow">
              LinkedIn / background context
            </Label>
            <Textarea
              id="linkedin-context"
              value={linkedInContext}
              onChange={(e) => setLinkedInContext(e.target.value)}
              rows={5}
              placeholder="Paste their LinkedIn About section, recent posts, or anything you know about them…"
              className="resize-none text-sm"
            />
            <p className="text-muted-foreground text-xs">
              The more specific the context, the more specific the email. Vague context gets a vague
              email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-goal" className="eyebrow">
              Your goal for this outreach
            </Label>
            <Textarea
              id="student-goal"
              value={studentGoal}
              onChange={(e) => setStudentGoal(e.target.value)}
              rows={3}
              placeholder="e.g. Sophomore at NYU targeting M&A SA roles, want a 15-min call to learn about their path…"
              className="resize-none text-sm"
            />
          </div>

          <div>
            <Button
              onClick={generate}
              disabled={loading || !linkedInContext.trim()}
              className="w-full"
            >
              <span role="status" aria-live="polite">
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                    Drafting…
                  </>
                ) : draft ? (
                  "Regenerate"
                ) : (
                  "Generate draft"
                )}
              </span>
            </Button>
            {!loading && !linkedInContext.trim() && (
              <p className="text-muted-foreground mt-1.5 text-xs">
                Add a note about this contact above to enable drafting.
              </p>
            )}
          </div>

          {draft && (
            <div className="space-y-5 border-t pt-2">
              <div className="space-y-2 pt-4">
                <Label className="eyebrow">Subject (pick one)</Label>
                <div className="space-y-2">
                  {draft.subjects.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSubject(i)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-sm border px-3 py-2.5 text-left text-sm transition-colors duration-150",
                        selectedSubject === i
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-accent/30",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                          selectedSubject === i ? "border-primary" : "border-muted-foreground",
                        )}
                      >
                        {selectedSubject === i && (
                          <span className="bg-primary size-2 rounded-full" />
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{s}</span>
                        <span className="text-muted-foreground mt-0.5 block font-mono text-[11px] tracking-[0.08em] uppercase">
                          {i === 0 ? "Direct" : "Curious / warm"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body" className="eyebrow">
                  Body (editable)
                </Label>
                <Textarea
                  id="email-body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={10}
                  className="font-sans text-sm leading-relaxed"
                />
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px]">
                    {editedBody.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <Button variant="ghost" size="sm" onClick={copyEmail} className="h-7 px-2">
                    {copied ? (
                      <>
                        <Check className="mr-1 size-3" aria-hidden /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 size-3" aria-hidden /> Copy email
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {draft.followups.length > 0 && (
                <div className="space-y-2">
                  <Label className="eyebrow">Suggested follow-up cadence</Label>
                  <div className="flex flex-wrap gap-2">
                    {draft.followups.map((f: OutreachFollowup, i) => (
                      <Badge key={i} variant="secondary" className="gap-1.5">
                        <span>{f.when}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{f.kind}</span>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {/* TODO (needs Supabase + auth): one-click "schedule these"
                        to persist into the followups table. */}
                    Light cadence — only nudge if they don&apos;t reply.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
