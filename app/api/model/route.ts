import { NextResponse } from "next/server";
import { RenderTypeSchema } from "@/src/schema";
import {
  AnthropicProvider,
  DemoProvider,
  OpenAICompatibleProvider,
  ProviderError,
  collectProviderEnvelope,
  createReplayCacheKey,
  readReplayEnvelope,
  redactProviderError,
  writeReplayEnvelope,
} from "@/src/providers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: string;
      prompt?: string;
      renderType?: string;
    };
    if (!body.prompt?.trim() || body.prompt.length > 20_000)
      return NextResponse.json(
        { error: "Prompt must contain 1–20,000 characters." },
        { status: 400 },
      );
    const renderType = body.renderType
      ? RenderTypeSchema.safeParse(body.renderType)
      : undefined;
    if (renderType && !renderType.success)
      return NextResponse.json(
        { error: "Unknown target render type." },
        { status: 400 },
      );
    const selectedRenderType = renderType?.data;
    const modelScope =
      body.provider === "deepseek"
        ? (process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash")
        : body.provider === "openai"
          ? (process.env.OPENAI_MODEL ?? "gpt-4.1-mini")
          : body.provider === "anthropic"
            ? (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514")
            : body.provider === "compatible"
              ? (process.env.OPENAI_COMPATIBLE_MODEL ?? "")
              : "fixture-v1";
    const provider =
      body.provider === "deepseek"
        ? new OpenAICompatibleProvider({
            id: "deepseek",
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseUrl: "https://api.deepseek.com",
            model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
            thinking: "disabled",
          })
        : body.provider === "openai"
          ? new OpenAICompatibleProvider({
              id: "openai",
              apiKey: process.env.OPENAI_API_KEY,
              baseUrl: "https://api.openai.com/v1",
              model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
              organization: process.env.OPENAI_ORG_ID,
            })
          : body.provider === "anthropic"
            ? new AnthropicProvider(
                process.env.ANTHROPIC_API_KEY,
                process.env.ANTHROPIC_MODEL,
              )
            : body.provider === "compatible"
              ? new OpenAICompatibleProvider({
                  id: "openai-compatible",
                  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
                  baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL ?? "",
                  model: process.env.OPENAI_COMPATIBLE_MODEL ?? "",
                })
              : new DemoProvider();
    const replayKey = createReplayCacheKey({
      prompt: body.prompt,
      provider: provider.id,
      model: modelScope,
      renderType: selectedRenderType,
    });
    const cached = await readReplayEnvelope(
      process.env.MODEL_RESPONSE_CACHE_DIR,
      replayKey,
    );
    if (cached)
      return NextResponse.json({
        envelope: cached,
        provider: provider.id,
        replayed: true,
        replayId: replayKey.slice(0, 12),
      });
    const envelope = await collectProviderEnvelope(provider, {
      prompt: body.prompt,
      system: selectedRenderType
        ? `The user explicitly selected the ${selectedRenderType} capability. You MUST set type to exactly "${selectedRenderType}" and populate its payload. Do not choose another render type.`
        : undefined,
    });
    if (selectedRenderType && envelope.type !== selectedRenderType)
      throw new ProviderError(
        `Model returned ${envelope.type} instead of the selected ${selectedRenderType} capability.`,
        "invalid_response",
        422,
      );
    await writeReplayEnvelope(
      process.env.MODEL_RESPONSE_CACHE_DIR,
      replayKey,
      envelope,
    );
    return NextResponse.json({
      envelope,
      provider: provider.id,
      replayed: false,
      replayId: replayKey.slice(0, 12),
    });
  } catch (cause) {
    const status = cause instanceof ProviderError ? cause.status : 500;
    const message = redactProviderError(
      cause instanceof Error ? cause.message : "Provider request failed",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
