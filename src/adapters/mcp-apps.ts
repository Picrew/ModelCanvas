import { deserializeRenderEnvelope, serializeRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";

export interface McpUiResource {
  uri: string;
  mimeType: string;
  text: string;
  _meta?: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{ type: "text"; text: string } | { type: "resource"; resource: McpUiResource }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export function envelopeToMcpResource(envelope: AnyRenderEnvelope): McpUiResource {
  return { uri: `ui://modelcanvas/${encodeURIComponent(envelope.id)}`, mimeType: "application/vnd.modelcanvas.render-envelope+json", text: serializeRenderEnvelope(envelope), _meta: { "modelcanvas/type": envelope.type, "modelcanvas/version": envelope.version } };
}

export function envelopeToMcpToolResult(envelope: AnyRenderEnvelope): McpToolResult {
  return { content: [{ type: "text", text: envelope.fallback?.text ?? `Render ${envelope.type}` }, { type: "resource", resource: envelopeToMcpResource(envelope) }], structuredContent: { renderEnvelope: envelope } };
}

export function mcpToolResultToEnvelope(result: McpToolResult): AnyRenderEnvelope {
  if (result.isError) throw new Error("MCP tool result is marked as an error");
  const structured = result.structuredContent?.renderEnvelope; if (structured) { const parsed = deserializeRenderEnvelope(JSON.stringify(structured)); if (parsed.success) return parsed.data; throw new Error(parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")); }
  const resource = result.content.find((item): item is { type: "resource"; resource: McpUiResource } => item.type === "resource" && item.resource.mimeType === "application/vnd.modelcanvas.render-envelope+json");
  if (!resource) throw new Error("MCP result contains no ModelCanvas UI resource"); const parsed = deserializeRenderEnvelope(resource.resource.text); if (!parsed.success) throw new Error(parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")); return parsed.data;
}

