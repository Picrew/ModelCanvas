import { parseRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope, JsonValue } from "@/src/schema";

export type AiSdkPart =
  | { type: "text"; text: string }
  | { type: `tool-${string}`; toolCallId: string; state: "input-streaming" | "input-available" | "output-available" | "output-error"; input?: JsonValue; output?: JsonValue; errorText?: string };

export type AiSdkAdapterResult =
  | { type: "message.streaming"; delta: string }
  | { type: "tool.start"; id: string; tool: string; input?: JsonValue }
  | { type: "tool.result"; id: string; envelope: AnyRenderEnvelope }
  | { type: "error"; id?: string; message: string };

export function aiSdkPartToModelCanvas(part: AiSdkPart): AiSdkAdapterResult {
  if (part.type === "text") return { type: "message.streaming", delta: part.text };
  const tool = part.type.slice(5); if (part.state === "output-error") return { type: "error", id: part.toolCallId, message: part.errorText ?? `${tool} failed` };
  if (part.state === "output-available") { const parsed = parseRenderEnvelope(part.output); if (!parsed.success) return { type: "error", id: part.toolCallId, message: parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ") }; return { type: "tool.result", id: part.toolCallId, envelope: parsed.data }; }
  return { type: "tool.start", id: part.toolCallId, tool, input: part.input };
}

