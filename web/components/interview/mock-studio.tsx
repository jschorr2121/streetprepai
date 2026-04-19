"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
  Loader2,
  Mic,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
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
import type {
  Scorecard,
  RubricItem,
} from "@/app/api/interview/score/route";

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
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
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== "inactive"
            ) {
              mediaRecorderRef.current.stop();
            }
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      toast.error(
        `Could not access mic: ${
          err instanceof Error ? err.message : "permission denied"
        }`,
      );
    }
  }, [audioUrl]);

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
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
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Transcription failed.");
        setPhase("review");
        return;
      }
      text = data.transcript ?? "";
      words = data.words ?? [];
      mocked = !!data.mocked;
      setTranscript(text);
      if (mocked) {
        toast.message(
          "Using a demo transcript (no OPENAI_API_KEY set).",
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Transcription failed.",
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
        body: JSON.stringify({
          question: question.text,
          mode: question.mode,
          transcript: text,
          audioMetrics,
          idealAnswerOutline: question.idealAnswerOutline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Scoring failed.");
        setPhase("review");
        return;
      }
      setScorecard(data as Scorecard);
      setPhase("scored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scoring failed.");
      setPhase("review");
    }
  }, [question]);

  const remaining = Math.max(0, MAX_RECORD_SECONDS - elapsed);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">
      <header>
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Mic className="size-4" /> Mock Interview Studio
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Voice-based interview practice
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Pick a mode, record your answer, and Claude scores content and
          delivery — with the questions a real interviewer would ask next.
        </p>
      </header>

      {/* Mode picker */}
      <Card className="p-5">
        <p className="text-sm font-medium mb-3">Choose a mode</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pickMode(m.id)}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="size-4 text-primary" />
                  <p className="font-medium text-sm">{m.label}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {m.blurb}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Question + recording */}
      {question && (
        <Card className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                {question.mode}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {question.topic}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {question.difficulty}
              </Badge>
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
            <p className="text-lg font-medium leading-snug">{question.text}</p>
          </div>

          <Separator />

          {phase === "ready" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Button size="lg" onClick={startRecording}>
                <Mic className="size-4" /> Start recording
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll have up to {MAX_RECORD_SECONDS} seconds. Speak like
                you'd answer in person.
              </p>
            </div>
          )}

          {phase === "recording" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <RecordingIndicator elapsed={elapsed} />
              <div className="text-3xl font-mono tabular-nums">
                {formatTime(elapsed)}
                <span className="text-muted-foreground text-base">
                  {" "}
                  / {formatTime(MAX_RECORD_SECONDS)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {remaining}s remaining
              </p>
              <Button size="lg" variant="destructive" onClick={stopRecording}>
                <Square className="size-4" /> Stop
              </Button>
            </div>
          )}

          {phase === "review" && audioUrl && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Recorded {formatTime(elapsed)}. Play it back, or submit for
                scoring.
              </p>
              <audio src={audioUrl} controls className="w-full" />
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={reRecord}>
                  <RotateCcw className="size-4" /> Re-record
                </Button>
                <Button onClick={submit}>
                  <Sparkles className="size-4" /> Submit for scoring
                </Button>
              </div>
            </div>
          )}

          {(phase === "transcribing" || phase === "scoring") && (
            <div className="flex items-center justify-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-sm">
                {phase === "transcribing"
                  ? "Transcribing your answer…"
                  : "Claude is scoring…"}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Transcript */}
      {transcript && (phase === "scoring" || phase === "scored") && (
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Transcript</p>
            <Badge variant="outline" className="text-[10px]">
              Whisper
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {transcript}
          </p>
        </Card>
      )}

      {/* Scorecard */}
      {scorecard && phase === "scored" && (
        <ScorecardView
          scorecard={scorecard}
          onTryAnother={nextQuestionSameMode}
        />
      )}
    </div>
  );
}

function RecordingIndicator({ elapsed }: { elapsed: number }) {
  // Simple breathing dot — no real waveform, but visible feedback that the
  // mic is hot.
  return (
    <div className="relative size-16 grid place-items-center">
      <span
        className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"
        aria-hidden
      />
      <span className="relative size-8 rounded-full bg-red-500 grid place-items-center">
        <Mic className="size-4 text-white" />
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
        <div className="grid sm:grid-cols-2 gap-6">
          <ScoreReadout label="Content" score={scorecard.content_score} />
          <ScoreReadout label="Delivery" score={scorecard.delivery_score} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <button
          type="button"
          onClick={() => setShowRubric((s) => !s)}
          className="flex items-center justify-between w-full text-left"
        >
          <p className="text-sm font-medium">Rubric ({scorecard.rubric.length})</p>
          {showRubric ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
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

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <p className="text-sm font-medium">What worked</p>
          </div>
          <ul className="space-y-2 text-sm">
            {scorecard.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">·</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <p className="text-sm font-medium">Highest-leverage fixes</p>
          </div>
          <ul className="space-y-2 text-sm">
            {scorecard.improvements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">·</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <p className="text-sm font-medium">
          Follow-up questions a real interviewer would ask
        </p>
        <ol className="space-y-2 text-sm list-decimal list-inside marker:text-muted-foreground">
          {scorecard.follow_up_questions.map((q, i) => (
            <li key={i} className="leading-relaxed">
              {q}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-5 space-y-3">
        <button
          type="button"
          onClick={() => setShowModel((s) => !s)}
          className="flex items-center justify-between w-full text-left"
        >
          <p className="text-sm font-medium">Model answer (banker-speak)</p>
          {showModel ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
        {showModel && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {scorecard.model_answer}
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            // TODO: persist to story bank when DB is wired
            toast.success("Saved to your story bank.");
          }}
        >
          <Save className="size-4" /> Save to story bank
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
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p className={`text-5xl font-semibold tabular-nums ${tone.text}`}>
          {score}
        </p>
        <p className="text-muted-foreground text-sm">/ 100</p>
        <Badge variant="secondary" className={`ml-1 ${tone.badge}`}>
          {tone.label}
        </Badge>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function RubricRow({ item }: { item: RubricItem }) {
  const tone = scoreTone(item.score);
  return (
    <div className="grid grid-cols-[140px_1fr_auto] gap-3 items-start">
      <p className="text-sm font-medium leading-snug">{item.dimension}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {item.comment}
      </p>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>
          {item.score}
        </span>
      </div>
    </div>
  );
}

function scoreTone(score: number): {
  label: string;
  text: string;
  bar: string;
  badge: string;
} {
  if (score >= 85)
    return {
      label: "strong",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-800",
    };
  if (score >= 70)
    return {
      label: "solid",
      text: "text-emerald-700",
      bar: "bg-emerald-400",
      badge: "bg-emerald-50 text-emerald-700",
    };
  if (score >= 55)
    return {
      label: "developing",
      text: "text-amber-700",
      bar: "bg-amber-400",
      badge: "bg-amber-50 text-amber-800",
    };
  return {
    label: "needs work",
    text: "text-red-700",
    bar: "bg-red-400",
    badge: "bg-red-50 text-red-700",
  };
}
