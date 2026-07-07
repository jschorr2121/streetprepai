"use client";

import { useEffect, useRef, useState } from "react";
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
  Mic,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import type { Contact, ChatLog, CalendarEvent } from "@/lib/types";
import { OutreachDrawer } from "@/components/relationships/outreach-drawer";
import { cn } from "@/lib/utils";

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
  const [structured, setStructured] = useState<ChatLog["structured"] | null>(null);
  const [followUp, setFollowUp] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [draftingFollowUp, setDraftingFollowUp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Outreach drawer
  const [outreachOpen, setOutreachOpen] = useState(false);

  // Voice capture for "Log a chat"
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on unmount: stop any active recording.
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Your browser doesn't support voice capture. Type instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      // MediaRecorder picks a sensible default (webm/opus on Chrome, mp4 on Safari).
      const mr = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
        void transcribeBlob(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Mic permission denied: ${err.message}`
          : "Could not access microphone.",
      );
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "recording") mr.stop();
    setRecording(false);
  }

  async function transcribeBlob(blob: Blob) {
    if (blob.size === 0) {
      toast.error("Empty recording — try again.");
      return;
    }
    setTranscribing(true);
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `recording.${ext}`, { type: blob.type });
      const fd = new FormData();
      fd.append("audio", file);
      const res = await fetch("/api/whisper/transcribe", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Transcription failed.");
        return;
      }
      const transcript = (data.transcript as string | undefined)?.trim() ?? "";
      if (!transcript) {
        toast.error("No speech detected.");
        return;
      }
      setNotes((prev) => (prev ? `${prev.trim()}\n\n${transcript}` : transcript));
      toast.success("Transcribed — review and structure when ready.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transcription failed.");
    } finally {
      setTranscribing(false);
    }
  }

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
      setPrepSheet("Sorry, couldn't reach Claude. Check ANTHROPIC_API_KEY in .env.local.");
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
    navigator.clipboard.writeText(`Subject: ${followUp.subject}\n\n${followUp.body}`);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  }

  const relatedEvents = events
    .filter((e) => e.contactId === contact.id)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1">
        <Link href="/tools/relationships">
          <ArrowLeft className="size-3.5" />
          Back to relationships
        </Link>
      </Button>

      <header className="mb-8 border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{contact.name}</h1>
            <p className="text-muted-foreground mt-1">
              {contact.title} · {contact.firm}
              {contact.group ? ` · ${contact.group}` : ""}
            </p>
            {contact.school && (
              <p className="text-muted-foreground mt-0.5 text-sm">
                {contact.school} &apos;{contact.gradYear?.toString().slice(-2)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {contact.stage.replace("-", " ")}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOutreachOpen(true)}
              className="gap-1.5"
            >
              <Mail className="size-3.5" />
              Draft cold outreach
            </Button>
          </div>
        </div>
        {contact.howMet && (
          <p className="text-muted-foreground mt-3 text-sm">
            <span className="text-foreground font-medium">How met:</span> {contact.howMet}
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
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-lg font-semibold">
                  <Sparkles className="text-primary size-4" />
                  AI prep sheet
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Claude pulls signal from {contact.name}&apos;s background and suggests smart
                  questions, hooks, and things to avoid.
                </p>
              </div>
              <Button size="sm" onClick={generatePrepSheet} disabled={prepLoading}>
                {prepLoading ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Generating…
                  </>
                ) : prepSheet ? (
                  "Regenerate"
                ) : (
                  <>
                    <Sparkles className="mr-1.5 size-3.5" /> Generate
                  </>
                )}
              </Button>
            </div>
            {contact.linkedinBio && (
              <details className="mb-4">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                  Source bio
                </summary>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed whitespace-pre-wrap">
                  {contact.linkedinBio}
                </p>
              </details>
            )}
            {prepSheet ? (
              <div className="bg-accent/30 rounded-lg border p-5">
                <Markdown content={prepSheet} />
              </div>
            ) : (
              <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
                Click Generate to have Claude build a prep sheet from {contact.name}&apos;s
                background.
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="log" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-1 text-lg font-semibold">Log a chat with {contact.name}</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Type rough notes. Claude structures them into a memory record and drafts a
              personalized follow-up.
            </p>
            <div className="relative">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="e.g. 30-min zoom with Alex. Talked about GS TMT being heavy on semis. Said he'd intro me to Priya. Don't ask about comp. Mentioned his dog Miso a lot…"
                className="resize-none pr-12"
              />
              <Button
                type="button"
                size="icon"
                variant={recording ? "default" : "outline"}
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                title={
                  recording
                    ? "Stop recording"
                    : transcribing
                      ? "Transcribing…"
                      : "Record voice memo"
                }
                className={cn(
                  "absolute top-2 right-2 size-8 rounded-full",
                  recording && "animate-pulse bg-red-500 text-white hover:bg-red-600",
                )}
              >
                {transcribing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : recording ? (
                  <Square className="size-3.5" />
                ) : (
                  <Mic className="size-3.5" />
                )}
                <span className="sr-only">
                  {recording ? "Stop recording" : "Record voice memo"}
                </span>
              </Button>
            </div>
            {(recording || transcribing) && (
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                {recording ? (
                  <>
                    <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                    Recording — click the square to stop and transcribe.
                  </>
                ) : (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Transcribing your memo…
                  </>
                )}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={structureNotes} disabled={!notes.trim() || structuring}>
                {structuring ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Structuring…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 size-3.5" />
                    Structure notes
                  </>
                )}
              </Button>
            </div>

            {structured && (
              <div className="bg-accent/30 mt-6 space-y-4 rounded-lg border p-5 text-sm">
                <StructuredSection label="Topics" items={structured.topics ?? []} />
                <StructuredSection label="Advice given" items={structured.adviceGiven ?? []} />
                <StructuredSection
                  label="Commitments from them"
                  items={structured.commitments ?? []}
                />
                <StructuredSection
                  label="Personal details (remember next time)"
                  items={structured.personalDetails ?? []}
                />
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                    Follow-ups for you
                  </p>
                  <ul className="space-y-1">
                    {(structured.followUps ?? []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">–</span>
                        <span>
                          {f.description}
                          {f.dueBy && (
                            <span className="text-muted-foreground"> (by {f.dueBy})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {structured && (
              <div className="mt-6 border-t pt-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-1.5 font-semibold">
                      <Mail className="text-primary size-4" />
                      Follow-up email
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-sm">
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
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
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
                  <Card className="bg-background p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
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
                            <Check className="mr-1 size-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 size-3" /> Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="mb-3 text-sm font-medium">{followUp.subject}</p>
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Body
                    </p>
                    <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                      {followUp.body}
                    </pre>
                  </Card>
                ) : (
                  <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
                    Click &quot;Draft follow-up&quot; to generate a personalized email.
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {relatedEvents.length === 0 && chatLogs.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
              No prior events logged with {contact.name}.
            </div>
          ) : (
            <div className="space-y-3">
              {relatedEvents.map((e) => (
                <Card key={e.id} className="p-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{e.title}</p>
                    <Badge
                      variant={e.status === "upcoming" ? "default" : "outline"}
                      className="text-xs capitalize"
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {new Date(e.startsAt).toLocaleString()} · {e.durationMinutes} min{" "}
                    {e.location ? `· ${e.location}` : ""}
                  </p>
                  {e.notes && (
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{e.notes}</p>
                  )}
                </Card>
              ))}
              {chatLogs.map((log) => (
                <Card key={log.id} className="bg-accent/30 p-4">
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Chat notes · {log.happenedAt}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {log.rawNotes}
                  </p>
                  {log.structured && (
                    <div className="mt-4 space-y-3 border-t pt-4 text-sm">
                      <StructuredSection label="Topics" items={log.structured.topics} />
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

      <OutreachDrawer contact={contact} open={outreachOpen} onOpenChange={setOutreachOpen} />
    </div>
  );
}

function StructuredSection({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground">–</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
