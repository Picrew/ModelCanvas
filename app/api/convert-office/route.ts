import { NextResponse } from "next/server";

const allowed = new Set(["docx", "pptx", "odt", "ods", "odp"]);

export async function POST(request: Request) {
  const serviceUrl = process.env.OFFICE_CONVERTER_URL;
  if (!serviceUrl)
    return NextResponse.json(
      {
        error:
          "Office converter is not configured. Set OFFICE_CONVERTER_URL or start the Docker Compose service.",
      },
      { status: 503 },
    );
  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (file.size > 25_000_000)
    return NextResponse.json(
      { error: "Office file exceeds 25 MB." },
      { status: 413 },
    );
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowed.has(extension))
    return NextResponse.json(
      {
        error: `.${extension || "unknown"} is not supported by the converter.`,
      },
      { status: 415 },
    );
  const body = new FormData();
  body.append("file", file, file.name);
  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/convert`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: `Conversion failed: ${message.slice(0, 300)}` },
        { status: response.status },
      );
    }
    return new Response(response.body, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${file.name.replace(/[^A-Za-z0-9._-]/g, "_")}.pdf"`,
      },
    });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? `Converter unavailable: ${cause.message}`
            : "Converter unavailable",
      },
      { status: 502 },
    );
  }
}
