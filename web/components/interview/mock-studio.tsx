"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
  Loader2,
  Mic,
  RefreshCw,
  RotateCcw,
  Save,
  Square,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  type InterviewMode,
  type InterviewQuestion,
  pickRandomQuestion,
} from "@/lib/data/interview-questions";
import { analyzeAudio, type TimestampedWord } from "@/lib/audio/analyze";
import type { Scorecard, RubricItem } from "@/app/api/interview/score/route";

const MODES: Array<{
  id: InterviewMode;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "technical",
    label: "Technical",
    blurb: "DCF, accounting, valuation, M&A.",
    icon: Layers,
  },
  {
    id: "behavioral",
    label: "Behavioral",
    blurb: "Why banking, leadership, failure, conflict.",
    icon: GraduationCap,
  },
  {
    id: "firm",
    label: "Firm-specific",
    blurb: "Why this firm, recent deals, sector takes.",
    icon: Briefcase,
  },
  {
    id: "superday",
    label: "Mixed Superday",
    blurb: "Tight rotation across the full board.",
    icon: Target,
  },
];

const MAX_RECORD_SECONDS = 90;

type Phase =
  | "idle"
  | "ready" // mode picked, question shown, not recording yet
  | "recording"
  | "review" // stopped, can play back / re-record / submit
  | "transcribing"
  | "scoring"
  | "scored";

export function MockStudio() {
  const [mode, setMode] = useState<InterviewMode | null>(null);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickMode = (m: InterviewMode) => {
    setMode(m);
    const q = pickRandomQuestion(m);
    setQuestion(q);
    setTranscript(null);
    setScorecard(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioBlobRef.current = null;
    setElapsed(0);
    setPhase("ready");
  };

  const nextQuestionSameMode = () => {
    if (!mode) return;
    const q = pickRandomQuestion(mode, question?.id);
    setQuestion(q);
    setTranscript(null);
    setScorecard(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioBlobRef.current = null;
    setElapsed(0);
    setPhase("ready");
  };

  const startRecording = useCallback(async () => {
    // Insecure contexts / older browsers have no mediaDevices at all —
    // without this check the user gets a raw TypeError in a toast.
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Recording isn't supported in this browser. Try a recent Chrome, Edge, or Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        audioBlobRef.current = blob;
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (tickerRef.current) {
          clearInterval(tickerRef.current);
          tickerRef.current = null;
        }
        setPhase("review");
      };
      mr.start();
      setElapsed(0);
      setPhase("recording");
      tickerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          if (next >= MAX_RECORD_SECONDS) {
            // Auto-stop at the cap.
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      toast.error(
        name === "NotAllowedError"
          ? "Microphone access was blocked. Allow mic access for this site and try again."
          : name === "NotFoundError"
            ? "No microphone was found. Plug one in or check your input settings."
            : "Could not access the microphone. Check your browser settings and try again.",
      );
    }
  }, [audioUrl]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const reRecord = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioBlobRef.current = null;
    setTranscript(null);
    setScorecard(null);
    setElapsed(0);
    setPhase("ready");
  };

  const submit = useCallback(async () => {
    const blob = audioBlobRef.current;
    if (!blob || !question) {
      toast.error("No recording to submit.");
      return;
    }
    setPhase("transcribing");
    setTranscript(null);
    setScorecard(null);

    // 1. Transcribe.
    let words: TimestampedWord[] = [];
    let text = "";
    let mocked = false;
    try {
      const form = new FormData();
      form.append("file", blob, "answer.webm");
      const res = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: form,
        // A hung request otherwise leaves the "Transcribing…" spinner forever.
        signal: AbortSignal.timeout(120_000),
      });
      // Non-JSON error bodies (proxy 413/502 pages) must not turn into a
      // parse-error toast — fall back to the HTTP status.
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? `Transcription failed (HTTP ${res.status}).`);
        setPhase("review");
        return;
      }
      text = data.transcript ?? "";
      words = data.words ?? [];
      mocked = !!data.mocked;
      setTranscript(text);
      if (mocked) {
        toast.message("Using a demo transcript (no OPENAI_API_KEY set).");
      }
    } catch (err) {
      toast.error(
        err instanceof DOMException && err.name === "TimeoutError"
          ? "Transcription took too long — please try again."
          : err instanceof Error
            ? err.message
            : "Transcription failed.",
      );
      setPhase("review");
      return;
    }

    // 2. Score.
    setPhase("scoring");
    const audioMetrics = analyzeAudio(words);
    try {
      const res = await fetch("/api/interview/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          question: question.text,
          mode: question.mode,
          transcript: text,
          audioMetrics,
          idealAnswerOutline: question.idealAnswerOutline,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? `Scoring failed (HTTP ${res.status}).`);
        setPhase("review");
        return;
      }
      setScorecard(data as Scorecard);
      setPhase("scored");
    } catch (err) {
      toast.error(
        err instanceof DOMException && err.name === "TimeoutError"
          ? "Scoring took too long — please try again."
          : err instanceof Error
            ? err.message
            : "Scoring failed.",
      );
      setPhase("review");
    }
  }, [question]);

  const remaining = Math.max(0, MAX_RECORD_SECONDS - elapsed);

  return (
    <div className="space-y-6">
      {/* Mode picker */}
      <Card className="p-5">
        <p className="eyebrow mb-3">Choose a mode</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pickMode(m.id)}
                className={`rounded-md border p-4 text-left transition-colors duration-150 ${
                  active ? "border-primary bg-accent/40" : "hover:bg-accent/30"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon
                    className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                    aria-hidden
                  />
                  <p className="text-sm font-medium">{m.label}</p>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{m.blurb}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Question + recording */}
      {question && (
        <Card className="space-y-5 p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">{question.mode}</Badge>
              <Badge variant="outline">{question.topic}</Badge>
              <Badge variant="outline">{question.difficulty}</Badge>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={nextQuestionSameMode}
                disabled={phase === "recording" || phase === "transcribing" || phase === "scoring"}
              >
                <RefreshCw className="size-3.5" /> New question
              </Button>
            </div>
            <p className="text-lg leading-snug font-medium">{question.text}</p>
          </div>

          <Separator />

          {phase === "ready" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Button size="lg" onClick={startRecording}>
                <Mic className="size-4" /> Start recording
              </Button>
              <p className="text-muted-foreground text-xs">
                You&apos;ll have up to {MAX_RECORD_SECONDS} seconds. Speak like you&apos;d answer in
                person.
              </p>
            </div>
          )}

          {phase === "recording" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <RecordingIndicator elapsed={elapsed} />
              <div className="tabular text-3xl">
                {formatTime(elapsed)}
                <span className="text-muted-foreground text-base">
                  {" "}
                  / {formatTime(MAX_RECORD_SECONDS)}
                </span>
              </div>
              <p className="text-muted-foreground font-mono text-xs">{remaining}s remaining</p>
              <Button size="lg" variant="destructive" onClick={stopRecording}>
                <Square className="size-4" /> Stop
              </Button>
            </div>
          )}

          {phase === "review" && audioUrl && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Recorded <span className="tabular">{formatTime(elapsed)}</span>. Play it back, or
                submit for scoring.
              </p>
              <audio src={audioUrl} controls className="w-full" />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={reRecord}>
                  <RotateCcw className="size-4" /> Re-record
                </Button>
                <Button onClick={submit}>Submit for scoring</Button>
              </div>
            </div>
          )}

          {(phase === "transcribing" || phase === "scoring") && (
            <div className="text-muted-foreground flex items-center justify-center gap-3 py-6">
              <Loader2 className="text-primary size-5 animate-spin" />
              <span className="text-sm">
                {phase === "transcribing" ? "Transcribing your answer…" : "Claude is scoring…"}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Transcript */}
      {transcript && (phase === "scoring" || phase === "scored") && (
        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Transcript</p>
            <Badge variant="outline">Whisper</Badge>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </Card>
      )}

      {/* Scorecard */}
      {scorecard && phase === "scored" && (
        <ScorecardView scorecard={scorecard} onTryAnother={nextQuestionSameMode} />
      )}
    </div>
  );
}

function RecordingIndicator({ elapsed }: { elapsed: number }) {
  // Simple breathing dot — no real waveform, but visible feedback that the
  // mic is hot.
  return (
    <div className="relative grid size-16 place-items-center">
      <span className="bg-destructive/20 absolute inset-0 animate-ping rounded-full" aria-hidden />
      <span className="bg-destructive relative grid size-8 place-items-center rounded-full">
        <Mic className="text-destructive-foreground size-4" aria-hidden />
      </span>
      <span className="sr-only">Recording, {elapsed} seconds elapsed</span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(1, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function ScorecardView({
  scorecard,
  onTryAnother,
}: {
  scorecard: Scorecard;
  onTryAnother: () => void;
}) {
  const [showRubric, setShowRubric] = useState(true);
  const [showModel, setShowModel] = useState(false);

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <ScoreReadout label="Content" score={scorecard.content_score} />
          <ScoreReadout label="Delivery" score={scorecard.delivery_score} />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <button
          type="button"
          onClick={() => setShowRubric((s) => !s)}
          className="flex w-full items-center justify-between text-left"
        >
          <p className="eyebrow">Rubric · {scorecard.rubric.length}</p>
          {showRubric ? (
            <ChevronUp className="text-muted-foreground size-4" />
          ) : (
            <ChevronDown className="text-muted-foreground size-4" />
          )}
        </button>
        {showRubric && (
          <div className="space-y-3">
            {scorecard.rubric.map((r) => (
              <RubricRow key={r.dimension} item={r} />
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <p className="eyebrow">What worked</p>
          <ul className="space-y-2 text-sm">
            {scorecard.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-success">·</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3 p-5">
          <p className="eyebrow">Highest-leverage fixes</p>
          <ul className="space-y-2 text-sm">
            {scorecard.improvements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-destructive">·</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="space-y-3 p-5">
        <p className="eyebrow">Follow-up questions a real interviewer would ask</p>
        <ol className="marker:text-muted-foreground list-inside list-decimal space-y-2 text-sm">
          {scorecard.follow_up_questions.map((q, i) => (
            <li key={i} className="leading-relaxed">
              {q}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-3 p-5">
        <button
          type="button"
          onClick={() => setShowModel((s) => !s)}
          className="flex w-full items-center justify-between text-left"
        >
          <p className="eyebrow">Model answer · Banker-speak</p>
          {showModel ? (
            <ChevronUp className="text-muted-foreground size-4" />
          ) : (
            <ChevronDown className="text-muted-foreground size-4" />
          )}
        </button>
        {showModel && (
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {scorecard.model_answer}
          </p>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Story-bank persistence isn't wired yet — a success toast for a no-op
            would lie to the user, so the button is disabled and labeled. */}
        <Button variant="outline" disabled title="Coming soon">
          <Save className="size-4" /> Save to story bank
          <span className="text-muted-foreground ml-1 font-mono text-[10px] tracking-[0.14em]">
            SOON
          </span>
        </Button>
        <Button onClick={onTryAnother}>
          <RefreshCw className="size-4" /> Try another question
        </Button>
      </div>
    </div>
  );
}

function ScoreReadout({ label, score }: { label: string; score: number }) {
  const tone = useMemo(() => scoreTone(score), [score]);
  return (
    <div className="space-y-1.5">
      <p className="eyebrow">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`tabular text-4xl font-medium ${tone.text}`}>{score}</p>
        <p className="text-muted-foreground font-mono text-sm">/ 100</p>
        <Badge variant={tone.badge} className="ml-1">
          {tone.label}
        </Badge>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden">
        <div className={`h-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function RubricRow({ item }: { item: RubricItem }) {
  const tone = scoreTone(item.score);
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-start gap-3">
      <p className="text-sm leading-snug font-medium">{item.dimension}</p>
      <p className="text-muted-foreground text-sm leading-relaxed">{item.comment}</p>
      <div className="flex items-center gap-2">
        <span className={`tabular text-sm font-medium ${tone.text}`}>{item.score}</span>
      </div>
    </div>
  );
}

function scoreTone(score: number): {
  label: string;
  text: string;
  bar: string;
  badge: "success" | "secondary" | "warning" | "destructive";
} {
  if (score >= 85)
    return {
      label: "strong",
      text: "text-success",
      bar: "bg-success",
      badge: "success",
    };
  if (score >= 70)
    return {
      label: "solid",
      text: "text-success",
      bar: "bg-success",
      badge: "secondary",
    };
  if (score >= 55)
    return {
      label: "developing",
      text: "text-warning",
      bar: "bg-warning",
      badge: "warning",
    };
  return {
    label: "needs work",
    text: "text-destructive",
    bar: "bg-destructive",
    badge: "destructive",
  };
}
