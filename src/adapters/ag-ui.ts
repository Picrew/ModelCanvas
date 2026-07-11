import { parseRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope, JsonValue } from "@/src/schema";

export type AgUiEvent =
  | {
      type: "TEXT_MESSAGE_START";
      messageId: string;
      role: "assistant" | "user";
    }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string }
  | { type: "TOOL_CALL_RESULT"; toolCallId: string; content: JsonValue }
  | { type: "STATE_SNAPSHOT"; snapshot: Record<string, JsonValue> }
  | {
      type: "STATE_DELTA";
      delta: Array<{
        op: "add" | "replace" | "remove";
        path: string;
        value?: JsonValue;
      }>;
    }
  | { type: "RUN_ERROR"; message: string }
  | { type: "RUN_FINISHED"; threadId?: string };

export type ModelCanvasAgentEvent =
  | { type: "message.streaming"; id: string; delta?: string; role?: string }
  | { type: "tool.start"; id: string; tool: string }
  | {
      type: "tool.result";
      id: string;
      envelope?: AnyRenderEnvelope;
      raw?: JsonValue;
    }
  | { type: "renderer.update"; envelope: AnyRenderEnvelope }
  | {
      type: "state.update";
      state?: Record<string, JsonValue>;
      patch?: Extract<AgUiEvent, { type: "STATE_DELTA" }>["delta"];
    }
  | { type: "error"; message: string }
  | { type: "completion"; threadId?: string };

export function agUiEventToModelCanvas(
  event: AgUiEvent,
): ModelCanvasAgentEvent {
  switch (event.type) {
    case "TEXT_MESSAGE_START":
      return {
        type: "message.streaming",
        id: event.messageId,
        role: event.role,
      };
    case "TEXT_MESSAGE_CONTENT":
      return {
        type: "message.streaming",
        id: event.messageId,
        delta: event.delta,
      };
    case "TOOL_CALL_START":
      return {
        type: "tool.start",
        id: event.toolCallId,
        tool: event.toolCallName,
      };
    case "TOOL_CALL_RESULT": {
      const parsed = parseRenderEnvelope(event.content);
      return parsed.success
        ? { type: "tool.result", id: event.toolCallId, envelope: parsed.data }
        : { type: "tool.result", id: event.toolCallId, raw: event.content };
    }
    case "STATE_SNAPSHOT":
      return { type: "state.update", state: event.snapshot };
    case "STATE_DELTA":
      return { type: "state.update", patch: event.delta };
    case "RUN_ERROR":
      return { type: "error", message: event.message };
    case "RUN_FINISHED":
      return { type: "completion", threadId: event.threadId };
  }
}
