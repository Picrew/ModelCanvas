import { NextResponse } from "next/server";
import { OpenAITtsProvider, ProviderError, redactProviderError } from "@/src/providers";

export async function POST(request: Request) {
  try { const body = await request.json() as { text?: string; voice?: string; speed?: number; format?: "mp3" | "opus" | "wav" | "aac" | "flac" }; const provider = new OpenAITtsProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_TTS_MODEL); const result = await provider.synthesize({ text: body.text ?? "", voice: body.voice ?? "alloy", speed: body.speed ?? 1, format: body.format }); return new Response(result.audio, { headers: { "content-type": result.contentType, "cache-control": "private, max-age=86400", "x-modelcanvas-cache": result.cacheHit ? "hit" : "miss" } }); }
  catch (cause) { const status = cause instanceof ProviderError ? cause.status : 500; return NextResponse.json({ error: redactProviderError(cause instanceof Error ? cause.message : "TTS failed") }, { status }); }
}

