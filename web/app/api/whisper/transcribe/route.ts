import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI hard limit: 25 MB.

export interface TranscribeResult {
  transcript: string;
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
  upstream.append("response_format", "text");

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

  const transcript = (await res.text()).trim();

  return Response.json({ transcript } satisfies TranscribeResult);
}
