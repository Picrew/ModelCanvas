import type { AnyRenderEnvelope } from "@/src/schema";

export interface ModelRequest {
  prompt: string;
  system?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  signal?: AbortSignal;
}

export type ModelStreamEvent =
  | { type: "text-delta"; delta: string }
  | { type: "envelope"; envelope: AnyRenderEnvelope }
  | { type: "error"; message: string }
  | { type: "complete" };

export type ModelStream = AsyncIterable<ModelStreamEvent>;

export interface ModelProvider {
  id: string;
  stream(request: ModelRequest): Promise<ModelStream>;
  supportsTools: boolean;
  supportsStructuredOutput: boolean;
  supportsAudioOutput?: boolean;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "missing_key"
      | "unauthorized"
      | "rate_limited"
      | "quota"
      | "network"
      | "invalid_response"
      | "unavailable",
    readonly status = 500,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export async function collectProviderEnvelope(
  provider: ModelProvider,
  request: ModelRequest,
): Promise<AnyRenderEnvelope> {
  const stream = await provider.stream(request);
  let envelope: AnyRenderEnvelope | undefined;
  let text = "";
  for await (const event of stream) {
    if (event.type === "envelope") envelope = event.envelope;
    if (event.type === "text-delta") text += event.delta;
    if (event.type === "error")
      throw new ProviderError(event.message, "invalid_response", 502);
  }
  if (envelope) return envelope;
  throw new ProviderError(
    `Provider completed without a RenderEnvelope${text ? ` (${text.slice(0, 120)})` : ""}`,
    "invalid_response",
    502,
  );
}
