import { parseRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";

export interface OpenAIAppsToolResult {
  structuredContent: Record<string, unknown>;
  content: Array<{ type: "text"; text: string }>;
  _meta: Record<string, unknown>;
}

export function envelopeToOpenAIApps(
  envelope: AnyRenderEnvelope,
  templateUri = "ui://modelcanvas/renderer.html",
): OpenAIAppsToolResult {
  return {
    structuredContent: { renderEnvelope: envelope },
    content: [
      {
        type: "text",
        text: envelope.fallback?.text ?? `Interactive ${envelope.type} output`,
      },
    ],
    _meta: {
      "openai/outputTemplate": templateUri,
      "openai/widgetAccessible": true,
      "openai/widgetDescription":
        envelope.presentation?.description ?? envelope.type,
      "modelcanvas/version": envelope.version,
    },
  };
}

export function openAIAppsToEnvelope(
  result: OpenAIAppsToolResult,
): AnyRenderEnvelope {
  const parsed = parseRenderEnvelope(result.structuredContent.renderEnvelope);
  if (!parsed.success)
    throw new Error(
      `Invalid Apps SDK structuredContent: ${parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`,
    );
  return parsed.data;
}
