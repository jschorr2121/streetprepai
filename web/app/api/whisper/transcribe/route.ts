import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";
import { logUsage } from "@/lib/ai/usage";
import { WHISPER_USD_PER_MINUTE } from "@/lib/ai/pricing";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI hard limit: 25 MB.

export interface TranscribeResult {
  transcript: string;
}

interface WhisperVerboseJson {
  text: string;
  /** Audio duration in seconds — present on verbose_json responses. */
  duration?: number;
}

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "whisper", route: "whisper/transcribe" });
  if (!gate.ok) return gate.response;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Voice capture is not configured on this server (missing OPENAI_API_KEY). Type your notes instead.",
      },
      { status: 503 },
    );
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data with an `audio` file field." },
      { status: 400 },
    );
  }

  const file = incoming.get("audio");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing `audio` file in form data." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "Audio file is empty." }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio file too large (max 25 MB)." }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name || "recording.webm");
  upstream.append("model", "whisper-1");
  // verbose_json (not "text") so we get `duration` back for usage logging.
  upstream.append("response_format", "verbose_json");

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
  } catch (err) {
    return Response.json(
      {
        error: clientSafeError(
          "whisper/transcribe",
          err,
          "Transcription failed. Please try again.",
        ),
      },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    return Response.json(
      {
        error: `Whisper returned ${res.status}: ${errBody.slice(0, 300) || "no body"}`,
      },
      { status: 502 },
    );
  }

  const data = (await res.json()) as WhisperVerboseJson;
  const transcript = (data.text ?? "").trim();

  // Whisper bills per minute of audio regardless of transcript content, so
  // log one row per successful upstream call — a missing `duration` still
  // logs a $0 row rather than silently skipping the row entirely.
  const durationSeconds = data.duration ?? 0;
  logUsage({
    model: "whisper-1",
    usage: { input_tokens: 0, output_tokens: 0 },
    endpoint: "whisper/transcribe",
    userId: gate.user.id,
    surchargeUsd: (durationSeconds / 60) * WHISPER_USD_PER_MINUTE,
  });

  return Response.json({ transcript } satisfies TranscribeResult);
}
