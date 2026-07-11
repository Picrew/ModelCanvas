import { parseRenderEnvelope } from "@/src/core";
import { renderEnvelopeJsonSchema, type AnyRenderEnvelope } from "@/src/schema";
import { ProviderError, type ModelProvider, type ModelRequest, type ModelStream } from "./types";

const rendererSystemPrompt = `You create exactly one ModelCanvas RenderEnvelope JSON object. The object must satisfy the supplied JSON Schema. Use version 1.0.0. Never include JavaScript functions. Prefer controlled render types. If asked for executable code, mark security.trusted=false, security.sandbox=true, and disable network unless explicitly essential. Return JSON only.`;

function classifyResponse(status: number, provider: string): ProviderError {
  if (status === 401 || status === 403) return new ProviderError(`${provider} credentials were rejected. Check the server-side environment variable.`, "unauthorized", status);
  if (status === 429) return new ProviderError(`${provider} rate limit reached. Try again later or use Demo Provider.`, "rate_limited", status);
  if (status === 402) return new ProviderError(`${provider} quota or credits are exhausted. Demo Provider remains available.`, "quota", status);
  return new ProviderError(`${provider} request failed (${status}).`, "unavailable", status);
}

function parseJsonEnvelope(value: unknown): AnyRenderEnvelope {
  const parsed = parseRenderEnvelope(value);
  if (!parsed.success) throw new ProviderError(`Model returned an invalid RenderEnvelope: ${parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`, "invalid_response", 502);
  return parsed.data;
}

async function* singleEnvelope(envelope: AnyRenderEnvelope) {
  yield { type: "envelope" as const, envelope };
  yield { type: "complete" as const };
}

export interface OpenAICompatibleOptions {
  id: string;
  apiKey?: string;
  baseUrl: string;
  model: string;
  organization?: string;
}

export class OpenAICompatibleProvider implements ModelProvider {
  id: string;
  supportsTools = true;
  supportsStructuredOutput = true;
  supportsAudioOutput = false;
  constructor(private readonly options: OpenAICompatibleOptions) { this.id = options.id; }
  async stream(request: ModelRequest): Promise<ModelStream> {
    if (!this.options.apiKey) throw new ProviderError(`${this.id} is not configured on the server. Use Demo Provider or set the documented API key.`, "missing_key", 503);
    let response: Response;
    try {
      response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", signal: request.signal, headers: { "content-type": "application/json", authorization: `Bearer ${this.options.apiKey}`, ...(this.options.organization ? { "OpenAI-Organization": this.options.organization } : {}) }, body: JSON.stringify({ model: this.options.model, temperature: 0.2, messages: [{ role: "system", content: `${rendererSystemPrompt}\nJSON Schema:\n${JSON.stringify(renderEnvelopeJsonSchema())}` }, ...(request.history ?? []), { role: "user", content: request.prompt }], response_format: { type: "json_object" } }) });
    } catch (cause) { throw new ProviderError(cause instanceof Error ? `Network error: ${cause.message}` : "Provider network error", "network", 502); }
    if (!response.ok) throw classifyResponse(response.status, this.id);
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError(`${this.id} returned no message content.`, "invalid_response", 502);
    try { return singleEnvelope(parseJsonEnvelope(JSON.parse(content) as unknown)); }
    catch (cause) { if (cause instanceof ProviderError) throw cause; throw new ProviderError(`${this.id} returned malformed JSON.`, "invalid_response", 502); }
  }
}

export class AnthropicProvider implements ModelProvider {
  id = "anthropic";
  supportsTools = true;
  supportsStructuredOutput = true;
  supportsAudioOutput = false;
  constructor(private readonly apiKey?: string, private readonly model = "claude-sonnet-4-20250514") {}
  async stream(request: ModelRequest): Promise<ModelStream> {
    if (!this.apiKey) throw new ProviderError("Anthropic is not configured on the server. Set ANTHROPIC_API_KEY or use Demo Provider.", "missing_key", 503);
    let response: Response;
    try { response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: request.signal, headers: { "content-type": "application/json", "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: this.model, max_tokens: 8_000, temperature: 0.2, system: `${rendererSystemPrompt}\nJSON Schema:\n${JSON.stringify(renderEnvelopeJsonSchema())}`, messages: [...(request.history ?? []), { role: "user", content: request.prompt }] }) }); }
    catch (cause) { throw new ProviderError(cause instanceof Error ? `Network error: ${cause.message}` : "Anthropic network error", "network", 502); }
    if (!response.ok) throw classifyResponse(response.status, this.id);
    const body = await response.json() as { content?: Array<{ type: string; text?: string }> }; const content = body.content?.find((item) => item.type === "text")?.text;
    if (!content) throw new ProviderError("Anthropic returned no text block.", "invalid_response", 502);
    const match = content.match(/\{[\s\S]*\}/); if (!match) throw new ProviderError("Anthropic response did not contain a JSON object.", "invalid_response", 502);
    try { return singleEnvelope(parseJsonEnvelope(JSON.parse(match[0]) as unknown)); }
    catch (cause) { if (cause instanceof ProviderError) throw cause; throw new ProviderError("Anthropic returned malformed JSON.", "invalid_response", 502); }
  }
}

