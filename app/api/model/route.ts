import { NextResponse } from "next/server";
import { AnthropicProvider, DemoProvider, OpenAICompatibleProvider, ProviderError, collectProviderEnvelope, redactProviderError } from "@/src/providers";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { provider?: string; prompt?: string };
    if (!body.prompt?.trim() || body.prompt.length > 20_000) return NextResponse.json({ error: "Prompt must contain 1–20,000 characters." }, { status: 400 });
    const provider = body.provider === "openai" ? new OpenAICompatibleProvider({ id: "openai", apiKey: process.env.OPENAI_API_KEY, baseUrl: "https://api.openai.com/v1", model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", organization: process.env.OPENAI_ORG_ID }) : body.provider === "anthropic" ? new AnthropicProvider(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL) : body.provider === "compatible" ? new OpenAICompatibleProvider({ id: "openai-compatible", apiKey: process.env.OPENAI_COMPATIBLE_API_KEY, baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL ?? "", model: process.env.OPENAI_COMPATIBLE_MODEL ?? "" }) : new DemoProvider();
    const envelope = await collectProviderEnvelope(provider, { prompt: body.prompt }); return NextResponse.json({ envelope, provider: provider.id });
  } catch (cause) { const status = cause instanceof ProviderError ? cause.status : 500; const message = redactProviderError(cause instanceof Error ? cause.message : "Provider request failed"); return NextResponse.json({ error: message }, { status }); }
}

