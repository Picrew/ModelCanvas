import { createHash } from "node:crypto";
import { ProviderError } from "./types";

export interface TtsRequest {
  text: string;
  voice: string;
  speed: number;
  format?: "mp3" | "opus" | "wav" | "aac" | "flac";
}
export interface TtsProvider {
  id: string;
  synthesize(
    request: TtsRequest,
  ): Promise<{ audio: ArrayBuffer; contentType: string; cacheHit: boolean }>;
}

export function ttsCacheKey(provider: string, request: TtsRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        provider,
        request.voice,
        request.speed,
        request.format ?? "mp3",
        request.text.normalize("NFC"),
      ]),
    )
    .digest("hex");
}

const memoryCache = new Map<
  string,
  { audio: ArrayBuffer; contentType: string }
>();

export class OpenAITtsProvider implements TtsProvider {
  id = "openai";
  constructor(
    private readonly apiKey?: string,
    private readonly model = "gpt-4o-mini-tts",
  ) {}
  async synthesize(
    request: TtsRequest,
  ): Promise<{ audio: ArrayBuffer; contentType: string; cacheHit: boolean }> {
    if (!this.apiKey)
      throw new ProviderError(
        "OpenAI TTS is not configured. Browser SpeechSynthesis is available as the no-key fallback.",
        "missing_key",
        503,
      );
    if (!request.text.trim() || request.text.length > 4_096)
      throw new ProviderError(
        "TTS text must contain 1–4,096 characters.",
        "invalid_response",
        400,
      );
    if (request.speed < 0.25 || request.speed > 4)
      throw new ProviderError(
        "TTS speed must be between 0.25 and 4.",
        "invalid_response",
        400,
      );
    const key = ttsCacheKey(this.id, request);
    const cached = memoryCache.get(key);
    if (cached) return { ...cached, cacheHit: true };
    let response: Response | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: request.text,
            voice: request.voice,
            speed: request.speed,
            response_format: request.format ?? "mp3",
          }),
        });
        if (response.ok || response.status < 500) break;
      } catch (cause) {
        lastError = cause;
      }
    }
    if (!response)
      throw new ProviderError(
        lastError instanceof Error
          ? lastError.message
          : "TTS network request failed",
        "network",
        502,
      );
    if (!response.ok) throw classifyTtsResponse(response.status);
    const audio = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") ??
      `audio/${request.format ?? "mpeg"}`;
    memoryCache.set(key, { audio, contentType });
    if (memoryCache.size > 100)
      memoryCache.delete(memoryCache.keys().next().value!);
    return { audio, contentType, cacheHit: false };
  }
}

function classifyTtsResponse(status: number): ProviderError {
  if (status === 401 || status === 403)
    return new ProviderError(
      "OpenAI TTS credentials were rejected.",
      "unauthorized",
      status,
    );
  if (status === 429)
    return new ProviderError(
      "OpenAI TTS rate limit reached. Browser SpeechSynthesis remains available.",
      "rate_limited",
      status,
    );
  return new ProviderError(
    `OpenAI TTS request failed (${status}).`,
    "unavailable",
    status,
  );
}
