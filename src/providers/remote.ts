import { parseRenderEnvelope } from "@/src/core";
import { renderEnvelopeJsonSchema, type AnyRenderEnvelope } from "@/src/schema";
import {
  ProviderError,
  type ModelProvider,
  type ModelRequest,
  type ModelStream,
} from "./types";

const rendererSystemPrompt = `You create exactly one ModelCanvas RenderEnvelope JSON object. The object must satisfy the supplied JSON Schema. Use version 1.0.0. Never put JavaScript function values outside source-code strings. Prefer controlled render types. If asked for an interactive browser game, use game.canvas and provide a complete standalone HTML document fragment in payload.html with a responsive canvas, inline CSS and JavaScript, keyboard controls, pointer/touch controls, visible game state, and no external assets. Populate payload.controls with the actual controls. If asked for executable code, mark security.trusted=false, security.sandbox=true, and disable network unless explicitly essential. Return JSON only.`;

function classifyResponse(status: number, provider: string): ProviderError {
  if (status === 401 || status === 403)
    return new ProviderError(
      `${provider} credentials were rejected. Check the server-side environment variable.`,
      "unauthorized",
      status,
    );
  if (status === 429)
    return new ProviderError(
      `${provider} rate limit reached. Try again later or use Demo Provider.`,
      "rate_limited",
      status,
    );
  if (status === 402)
    return new ProviderError(
      `${provider} quota or credits are exhausted. Demo Provider remains available.`,
      "quota",
      status,
    );
  return new ProviderError(
    `${provider} request failed (${status}).`,
    "unavailable",
    status,
  );
}

function parseJsonEnvelope(value: unknown): AnyRenderEnvelope {
  const parsed = parseRenderEnvelope(value);
  if (!parsed.success)
    throw new ProviderError(
      `Model returned an invalid RenderEnvelope: ${parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`,
      "invalid_response",
      502,
    );
  return parsed.data;
}

function extractJsonObject(content: string): unknown {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    // OpenAI-compatible providers sometimes wrap an otherwise valid object in
    // a Markdown fence or a short reasoning preface, even in JSON mode.
  }

  const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fence) {
    try {
      return JSON.parse(fence.trim()) as unknown;
    } catch {
      // Fall through to the balanced-object scanner below.
    }
  }

  const start = content.indexOf("{");
  if (start < 0) throw new SyntaxError("No JSON object found");
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < content.length; index += 1) {
    const character = content[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0)
        return JSON.parse(content.slice(start, index + 1)) as unknown;
    }
  }
  throw new SyntaxError("Incomplete JSON object");
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
  thinking?: "enabled" | "disabled";
}

export class OpenAICompatibleProvider implements ModelProvider {
  id: string;
  supportsTools = true;
  supportsStructuredOutput = true;
  supportsAudioOutput = false;
  constructor(private readonly options: OpenAICompatibleOptions) {
    this.id = options.id;
  }
  async stream(request: ModelRequest): Promise<ModelStream> {
    if (!this.options.apiKey)
      throw new ProviderError(
        `${this.id} is not configured on the server. Use Demo Provider or set the documented API key.`,
        "missing_key",
        503,
      );
    let response: Response;
    try {
      response = await fetch(
        `${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          signal: request.signal,
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.options.apiKey}`,
            ...(this.options.organization
              ? { "OpenAI-Organization": this.options.organization }
              : {}),
          },
          body: JSON.stringify({
            model: this.options.model,
            temperature: 0.2,
            ...(this.options.thinking
              ? { thinking: { type: this.options.thinking } }
              : {}),
            messages: [
              {
                role: "system",
                content: `${rendererSystemPrompt}${request.system ? `\n${request.system}` : ""}\nJSON Schema:\n${JSON.stringify(renderEnvelopeJsonSchema())}`,
              },
              ...(request.history ?? []),
              { role: "user", content: request.prompt },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );
    } catch (cause) {
      throw new ProviderError(
        cause instanceof Error
          ? `Network error: ${cause.message}`
          : "Provider network error",
        "network",
        502,
      );
    }
    if (!response.ok) throw classifyResponse(response.status, this.id);
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content)
      throw new ProviderError(
        `${this.id} returned no message content.`,
        "invalid_response",
        502,
      );
    try {
      return singleEnvelope(parseJsonEnvelope(extractJsonObject(content)));
    } catch (cause) {
      if (cause instanceof ProviderError) throw cause;
      throw new ProviderError(
        `${this.id} returned malformed JSON.`,
        "invalid_response",
        502,
      );
    }
  }
}

export class AnthropicProvider implements ModelProvider {
  id = "anthropic";
  supportsTools = true;
  supportsStructuredOutput = true;
  supportsAudioOutput = false;
  constructor(
    private readonly apiKey?: string,
    private readonly model = "claude-sonnet-4-20250514",
  ) {}
  async stream(request: ModelRequest): Promise<ModelStream> {
    if (!this.apiKey)
      throw new ProviderError(
        "Anthropic is not configured on the server. Set ANTHROPIC_API_KEY or use Demo Provider.",
        "missing_key",
        503,
      );
    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: request.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 8_000,
          temperature: 0.2,
          system: `${rendererSystemPrompt}${request.system ? `\n${request.system}` : ""}\nJSON Schema:\n${JSON.stringify(renderEnvelopeJsonSchema())}`,
          messages: [
            ...(request.history ?? []),
            { role: "user", content: request.prompt },
          ],
        }),
      });
    } catch (cause) {
      throw new ProviderError(
        cause instanceof Error
          ? `Network error: ${cause.message}`
          : "Anthropic network error",
        "network",
        502,
      );
    }
    if (!response.ok) throw classifyResponse(response.status, this.id);
    const body = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const content = body.content?.find((item) => item.type === "text")?.text;
    if (!content)
      throw new ProviderError(
        "Anthropic returned no text block.",
        "invalid_response",
        502,
      );
    const match = content.match(/\{[\s\S]*\}/);
    if (!match)
      throw new ProviderError(
        "Anthropic response did not contain a JSON object.",
        "invalid_response",
        502,
      );
    try {
      return singleEnvelope(parseJsonEnvelope(JSON.parse(match[0]) as unknown));
    } catch (cause) {
      if (cause instanceof ProviderError) throw cause;
      throw new ProviderError(
        "Anthropic returned malformed JSON.",
        "invalid_response",
        502,
      );
    }
  }
}
