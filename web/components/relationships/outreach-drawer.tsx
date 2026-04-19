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
import {
  Loader2,
  Sparkles,
  Mail,
  Copy,
  Check,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  OutreachDraft,
  OutreachFollowup,
} from "@/app/api/relationships/draft-outreach/route";
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
  const [linkedInContext, setLinkedInContext] = useState(
    contact.linkedinBio ?? "",
  );
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
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 overflow-y-auto"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            Draft cold outreach to {contact.name}
          </SheetTitle>
          <SheetDescription>
            Claude writes a warm, specific opener you can send today. You stay
            in the loop on the actual words.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-4 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="linkedin-context">
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
            <p className="text-xs text-muted-foreground">
              The more specific the context, the more specific the email. Vague
              context gets a vague email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-goal">Your goal for this outreach</Label>
            <Textarea
              id="student-goal"
              value={studentGoal}
              onChange={(e) => setStudentGoal(e.target.value)}
              rows={3}
              placeholder="e.g. Sophomore at NYU targeting M&A SA roles, want a 15-min call to learn about their path…"
              className="resize-none text-sm"
            />
          </div>

          <Button
            onClick={generate}
            disabled={loading || !linkedInContext.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Drafting…
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-1.5" />
                {draft ? "Regenerate" : "Generate draft"}
              </>
            )}
          </Button>

          {draft && (
            <div className="space-y-5 pt-2 border-t">
              <div className="space-y-2 pt-4">
                <Label>Subject (pick one)</Label>
                <div className="space-y-2">
                  {draft.subjects.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSubject(i)}
                      className={cn(
                        "w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors flex items-start gap-2.5",
                        selectedSubject === i
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-accent/30",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 size-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                          selectedSubject === i
                            ? "border-primary"
                            : "border-muted-foreground",
                        )}
                      >
                        {selectedSubject === i && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{s}</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          {i === 0 ? "Direct" : "Curious / warm"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body">Body (editable)</Label>
                <Textarea
                  id="email-body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={10}
                  className="text-sm font-sans leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {editedBody.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyEmail}
                    className="h-7 px-2"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 mr-1" /> Copy email
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {draft.followups.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5" />
                    Suggested follow-up cadence
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {draft.followups.map((f: OutreachFollowup, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs gap-1.5 py-1"
                      >
                        <span className="font-mono text-[11px]">{f.when}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{f.kind}</span>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
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
