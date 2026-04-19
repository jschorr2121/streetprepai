import type { TimestampedWord } from "@/lib/audio/analyze";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI Whisper hard limit.

export interface TranscribeResponse {
  transcript: string;
  words: TimestampedWord[];
  /** True when no OPENAI_API_KEY is set and we returned a canned mock. */
  mocked?: boolean;
}

interface WhisperVerboseJson {
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  let audioBuffer: Buffer;
  let filename = "audio.webm";
  let mimeType = "audio/webm";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return Response.json(
          { error: "No `file` field in form-data." },
          { status: 400 },
        );
      }
      if (file.size > MAX_AUDIO_BYTES) {
        return Response.json(
          { error: "Audio is larger than 25 MB." },
          { status: 413 },
        );
      }
      if (file.size === 0) {
        return Response.json({ error: "Empty audio file." }, { status: 400 });
      }
      audioBuffer = Buffer.from(await file.arrayBuffer());
      filename = file.name || filename;
      mimeType = file.type || mimeType;
    } else if (contentType.startsWith("audio/")) {
      const arrayBuf = await req.arrayBuffer();
      if (arrayBuf.byteLength > MAX_AUDIO_BYTES) {
        return Response.json(
          { error: "Audio is larger than 25 MB." },
          { status: 413 },
        );
      }
      if (arrayBuf.byteLength === 0) {
        return Response.json({ error: "Empty audio body." }, { status: 400 });
      }
      audioBuffer = Buffer.from(arrayBuf);
      mimeType = contentType.split(";")[0];
      // Map common audio MIMEs to a sensible default file extension for Whisper.
      const extMap: Record<string, string> = {
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/mp4": "mp4",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
      };
      const ext = extMap[mimeType] ?? "webm";
      filename = `audio.${ext}`;
    } else {
      return Response.json(
        {
          error:
            "Unsupported Content-Type. Send `multipart/form-data` with a `file` field, or raw audio with an `audio/*` Content-Type.",
        },
        { status: 415 },
      );
    }
  } catch (err) {
    return Response.json(
      {
        error: `Could not read audio upload: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[interview/transcribe] OPENAI_API_KEY not set — returning mock transcript so the demo flow still works locally.",
    );
    return Response.json(buildMockTranscript());
  }

  // Build multipart form for OpenAI.
  const upstream = new FormData();
  upstream.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
    filename,
  );
  upstream.append("model", "whisper-1");
  upstream.append("response_format", "verbose_json");
  upstream.append("timestamp_granularities[]", "word");

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
          err instanceof Error ? err.message : "unknown error"
        }`,
      },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return Response.json(
      {
        error: `Whisper API error (${res.status}): ${errText.slice(0, 500)}`,
      },
      { status: 502 },
    );
  }

  const data = (await res.json()) as WhisperVerboseJson;
  const transcript = (data.text ?? "").trim();
  const words: TimestampedWord[] = (data.words ?? []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  if (!transcript) {
    return Response.json(
      { error: "Whisper returned no transcript text — was there speech?" },
      { status: 422 },
    );
  }

  const payload: TranscribeResponse = { transcript, words };
  return Response.json(payload);
}

/**
 * Mock transcript used when OPENAI_API_KEY is missing — keeps the demo flow
 * working locally without any external credentials.
 */
function buildMockTranscript(): TranscribeResponse {
  const text =
    "So a DCF, um, is basically how you value a company based on its future cash flows. You project unlevered free cash flow for, like, five to ten years, then you discount each one back to the present using WACC. After that you calculate a terminal value, you know, either with the Gordon Growth method or an exit multiple, discount that back too, sum it all up to get enterprise value, and then you bridge to equity value by subtracting net debt.";
  const tokens = text.split(/\s+/);
  let cursor = 0.4; // small leading silence
  const words: TimestampedWord[] = tokens.map((tok) => {
    const dur = 0.28 + Math.random() * 0.12;
    const start = cursor;
    const end = cursor + dur;
    // Insert a small pause every ~12 words to simulate breathing room.
    cursor = end + (Math.random() < 0.08 ? 0.55 : 0.05);
    return { word: tok, start: Number(start.toFixed(2)), end: Number(end.toFixed(2)) };
  });
  return { transcript: text, words, mocked: true };
}
