"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Markdown } from "@/components/reader/markdown";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Mail,
  MessageSquare,
  NotebookPen,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Contact, ChatLog, CalendarEvent } from "@/lib/types";

export function ContactDetail({
  contact,
  chatLogs,
  events,
}: {
  contact: Contact;
  chatLogs: ChatLog[];
  events: CalendarEvent[];
}) {
  const [prepSheet, setPrepSheet] = useState("");
  const [prepLoading, setPrepLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [structuring, setStructuring] = useState(false);
  const [structured, setStructured] = useState<ChatLog["structured"] | null>(
    null,
  );
  const [followUp, setFollowUp] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [draftingFollowUp, setDraftingFollowUp] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generatePrepSheet() {
    setPrepLoading(true);
    setPrepSheet("");
    try {
      const res = await fetch("/api/relationships/prep-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          firm: contact.firm,
          title: contact.title,
          group: contact.group,
          school: contact.school,
          bio: contact.linkedinBio,
        }),
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPrepSheet(acc);
      }
    } catch {
      setPrepSheet(
        "Sorry, couldn't reach Claude. Check ANTHROPIC_API_KEY in .env.local.",
      );
    } finally {
      setPrepLoading(false);
    }
  }

  async function structureNotes() {
    if (!notes.trim()) return;
    setStructuring(true);
    try {
      const res = await fetch("/api/relationships/structure-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactFirm: contact.firm,
          contactTitle: contact.title,
          rawNotes: notes,
        }),
      });
      const data = await res.json();
      setStructured(data);
      toast.success("Notes structured — scroll down to draft the follow-up.");
    } catch {
      toast.error("Couldn't structure notes.");
    } finally {
      setStructuring(false);
    }
  }

  async function draftFollowUp() {
    if (!structured) return;
    setDraftingFollowUp(true);
    try {
      const res = await fetch("/api/relationships/draft-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactFirm: contact.firm,
          contactTitle: contact.title,
          contactSchool: contact.school,
          summary: structured,
        }),
      });
      const data = await res.json();
      setFollowUp(data);
    } catch {
      toast.error("Couldn't draft follow-up.");
    } finally {
      setDraftingFollowUp(false);
    }
  }

  function copyFollowUp() {
    if (!followUp) return;
    navigator.clipboard.writeText(
      `Subject: ${followUp.subject}\n\n${followUp.body}`,
    );
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  }

  const relatedEvents = events
    .filter((e) => e.contactId === contact.id)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 mb-4 -ml-2">
        <Link href="/relationships">
          <ArrowLeft className="size-3.5" />
          Back to relationships
        </Link>
      </Button>

      <header className="mb-8 pb-6 border-b">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {contact.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {contact.title} · {contact.firm}
              {contact.group ? ` · ${contact.group}` : ""}
            </p>
            {contact.school && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {contact.school} '{contact.gradYear?.toString().slice(-2)}
              </p>
            )}
          </div>
          <Badge variant="outline" className="capitalize">
            {contact.stage.replace("-", " ")}
          </Badge>
        </div>
        {contact.howMet && (
          <p className="text-sm text-muted-foreground mt-3">
            <span className="font-medium text-foreground">How met:</span>{" "}
            {contact.howMet}
          </p>
        )}
      </header>

      <Tabs defaultValue="prep" className="space-y-6">
        <TabsList>
          <TabsTrigger value="prep" className="gap-1.5">
            <Sparkles className="size-3.5" /> Pre-chat prep
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5">
            <NotebookPen className="size-3.5" /> Log a chat
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <MessageSquare className="size-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prep" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  AI prep sheet
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Claude pulls signal from {contact.name}'s background and
                  suggests smart questions, hooks, and things to avoid.
                </p>
              </div>
              <Button
                size="sm"
                onClick={generatePrepSheet}
                disabled={prepLoading}
              >
                {prepLoading ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Generating…
                  </>
                ) : prepSheet ? (
                  "Regenerate"
                ) : (
                  <>
                    <Sparkles className="size-3.5 mr-1.5" /> Generate
                  </>
                )}
              </Button>
            </div>
            {contact.linkedinBio && (
              <details className="mb-4">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Source bio
                </summary>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2 whitespace-pre-wrap">
                  {contact.linkedinBio}
                </p>
              </details>
            )}
            {prepSheet ? (
              <div className="rounded-lg border bg-accent/30 p-5">
                <Markdown content={prepSheet} />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-sm text-muted-foreground text-center">
                Click Generate to have Claude build a prep sheet from{" "}
                {contact.name}'s background.
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="log" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-1">
              Log a chat with {contact.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Type rough notes. Claude structures them into a memory record and
              drafts a personalized follow-up.
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              placeholder="e.g. 30-min zoom with Alex. Talked about GS TMT being heavy on semis. Said he'd intro me to Priya. Don't ask about comp. Mentioned his dog Miso a lot…"
              className="resize-none"
            />
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={structureNotes}
                disabled={!notes.trim() || structuring}
              >
                {structuring ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Structuring…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 mr-1.5" />
                    Structure notes
                  </>
                )}
              </Button>
            </div>

            {structured && (
              <div className="mt-6 rounded-lg border bg-accent/30 p-5 space-y-4 text-sm">
                <StructuredSection
                  label="Topics"
                  items={structured.topics ?? []}
                />
                <StructuredSection
                  label="Advice given"
                  items={structured.adviceGiven ?? []}
                />
                <StructuredSection
                  label="Commitments from them"
                  items={structured.commitments ?? []}
                />
                <StructuredSection
                  label="Personal details (remember next time)"
                  items={structured.personalDetails ?? []}
                />
                <div>
                  <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Follow-ups for you
                  </p>
                  <ul className="space-y-1">
                    {(structured.followUps ?? []).map((f, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-muted-foreground">–</span>
                        <span>
                          {f.description}
                          {f.dueBy && (
                            <span className="text-muted-foreground">
                              {" "}
                              (by {f.dueBy})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {structured && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-1.5">
                      <Mail className="size-4 text-primary" />
                      Follow-up email
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Drafted from the chat above. Edit before sending.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={draftFollowUp}
                    disabled={draftingFollowUp}
                  >
                    {draftingFollowUp ? (
                      <>
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        Drafting…
                      </>
                    ) : followUp ? (
                      "Regenerate"
                    ) : (
                      "Draft follow-up"
                    )}
                  </Button>
                </div>
                {followUp ? (
                  <Card className="p-4 bg-background">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Subject
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyFollowUp}
                        className="h-7 px-2 text-xs"
                      >
                        {copied ? (
                          <>
                            <Check className="size-3 mr-1" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3 mr-1" /> Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="font-medium text-sm mb-3">{followUp.subject}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Body
                    </p>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {followUp.body}
                    </pre>
                  </Card>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground text-center">
                    Click "Draft follow-up" to generate a personalized email.
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {relatedEvents.length === 0 && chatLogs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12 border-dashed border rounded-lg">
              No prior events logged with {contact.name}.
            </div>
          ) : (
            <div className="space-y-3">
              {relatedEvents.map((e) => (
                <Card key={e.id} className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-sm font-semibold">{e.title}</p>
                    <Badge
                      variant={
                        e.status === "upcoming" ? "default" : "outline"
                      }
                      className="text-xs capitalize"
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.startsAt).toLocaleString()} · {e.durationMinutes}{" "}
                    min {e.location ? `· ${e.location}` : ""}
                  </p>
                  {e.notes && (
                    <p className="text-sm mt-2 text-muted-foreground leading-relaxed">
                      {e.notes}
                    </p>
                  )}
                </Card>
              ))}
              {chatLogs.map((log) => (
                <Card key={log.id} className="p-4 bg-accent/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Chat notes · {log.happenedAt}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {log.rawNotes}
                  </p>
                  {log.structured && (
                    <div className="mt-4 pt-4 border-t text-sm space-y-3">
                      <StructuredSection
                        label="Topics"
                        items={log.structured.topics}
                      />
                      <StructuredSection
                        label="Commitments from them"
                        items={log.structured.commitments}
                      />
                      <StructuredSection
                        label="Personal details"
                        items={log.structured.personalDetails}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StructuredSection({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="text-muted-foreground">–</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
