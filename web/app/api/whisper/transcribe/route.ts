// Plain `fetch` call to OpenAI Whisper. No new SDK dependency.
// Used by the "Log a chat" voice-capture button on contact detail pages.

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI hard limit: 25 MB.

export interface TranscribeResult {
  transcript: string;
}

export async function POST(req: Request) {
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
    return Response.json(
      { error: "Missing `audio` file in form data." },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return Response.json(
      { error: "Audio file is empty." },
      { status: 400 },
    );
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return Response.json(
      { error: "Audio file too large (max 25 MB)." },
      { status: 413 },
    );
  }

  // Forward to OpenAI Whisper as multipart/form-data.
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
        error: `Whisper request failed: ${
          err instanceof Error ? err.message : "network error"
        }`,
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

  // response_format=text returns the raw transcript string.
  const transcript = (await res.text()).trim();

  return Response.json({ transcript } satisfies TranscribeResult);
}
