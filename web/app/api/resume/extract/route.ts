import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  let buf: Buffer;
  try {
    if (contentType.includes("application/pdf")) {
      const arrayBuf = await req.arrayBuffer();
      if (arrayBuf.byteLength > MAX_PDF_BYTES) {
        return Response.json(
          { error: "PDF is larger than 5 MB. Try a slimmer export." },
          { status: 413 },
        );
      }
      if (arrayBuf.byteLength === 0) {
        return Response.json({ error: "Empty file." }, { status: 400 });
      }
      buf = Buffer.from(arrayBuf);
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return Response.json(
          { error: "No `file` field in form." },
          { status: 400 },
        );
      }
      if (file.size > MAX_PDF_BYTES) {
        return Response.json(
          { error: "PDF is larger than 5 MB. Try a slimmer export." },
          { status: 413 },
        );
      }
      buf = Buffer.from(await file.arrayBuffer());
    } else {
      return Response.json(
        {
          error:
            "Unsupported Content-Type. Send `application/pdf` or `multipart/form-data` with a `file` field.",
        },
        { status: 415 },
      );
    }
  } catch (err) {
    return Response.json(
      {
        error: `Could not read upload: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      },
      { status: 400 },
    );
  }

  if (buf.length < 5 || buf.subarray(0, 5).toString() !== "%PDF-") {
    return Response.json(
      { error: "File doesn't look like a PDF." },
      { status: 400 },
    );
  }

  const parser = new PDFParse({ data: new Uint8Array(buf) });
  let textResult;
  try {
    textResult = await parser.getText();
  } catch (err) {
    await parser.destroy().catch(() => {});
    return Response.json(
      {
        error: `Could not extract text from PDF: ${
          err instanceof Error ? err.message : "parse failed"
        }`,
      },
      { status: 422 },
    );
  }
  await parser.destroy().catch(() => {});

  const cleaned = textResult.text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) {
    return Response.json(
      {
        error:
          "PDF parsed but contains no extractable text. Is it a scanned image?",
      },
      { status: 422 },
    );
  }

  return Response.json({
    raw_text: cleaned,
    pages: textResult.total,
  });
}
