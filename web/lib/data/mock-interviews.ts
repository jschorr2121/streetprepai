import type { MockInterview } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  id: string;
  user_id: string;
  question_text: string;
  mode: string;
  transcript: string | null;
  scorecard: unknown | null;
  audio_metrics: unknown | null;
  duration_seconds: number | null;
  created_at: string;
};

function mapRow(r: DbRow): MockInterview {
  return {
    id: r.id,
    questionText: r.question_text,
    mode: r.mode,
    transcript: r.transcript ?? undefined,
    scorecard: r.scorecard ?? undefined,
    audioMetrics: r.audio_metrics ?? undefined,
    durationSeconds: r.duration_seconds ?? undefined,
    createdAt: r.created_at,
  };
}

export async function getMockInterviews(userId: string): Promise<MockInterview[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("mock_interviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}

export async function saveMockInterview(
  userId: string,
  input: {
    questionText: string;
    mode: string;
    transcript?: string;
    scorecard?: unknown;
    audioMetrics?: unknown;
    durationSeconds?: number;
  },
): Promise<MockInterview> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("mock_interviews")
    .insert({
      user_id: userId,
      question_text: input.questionText,
      mode: input.mode,
      transcript: input.transcript ?? null,
      scorecard: input.scorecard ?? null,
      audio_metrics: input.audioMetrics ?? null,
      duration_seconds: input.durationSeconds ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function deleteMockInterview(userId: string, id: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb
    .from("mock_interviews")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
