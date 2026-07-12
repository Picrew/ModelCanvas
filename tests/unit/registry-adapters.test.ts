import { describe, expect, it } from "vitest";
import { RendererRegistry, type RendererDefinition } from "@/src/core";
import {
  envelopeToMcpToolResult,
  mcpToolResultToEnvelope,
} from "@/src/adapters";
import { demoScenarios } from "@/src/fixtures";
import type { AnyRenderEnvelope } from "@/src/schema";

const component = () => null;
const fallback: RendererDefinition = {
  id: "fallback",
  type: "*",
  version: "1.0.0",
  displayName: "Fallback",
  priority: -1,
  canRender: (_value): _value is AnyRenderEnvelope => true,
  load: async () => ({ default: component }),
};

describe("registry and adapters", () => {
  it("selects by priority, MIME, extension and override", () => {
    const registry = new RendererRegistry(fallback);
    registry.register({
      id: "markdown",
      type: "text.markdown",
      version: "1.0.0",
      displayName: "Markdown",
      priority: 10,
      supports: { mimeTypes: ["text/markdown"], extensions: ["md"] },
      canRender: (value): value is AnyRenderEnvelope =>
        value.type === "text.markdown",
      load: async () => ({ default: component }),
    });
    const envelope = demoScenarios.find(
      (item) => item.id === "markdown",
    )!.envelope;
    expect(registry.resolve(envelope).definition.id).toBe("markdown");
    expect(registry.resolveByMime("text/markdown; charset=utf-8").id).toBe(
      "markdown",
    );
    expect(registry.resolveByExtension(".MD").id).toBe("markdown");
    expect(
      registry.resolveWithOverride(envelope, "markdown").trace.fallback,
    ).toBe(false);
  });

  it("falls back when a module fails to load", async () => {
    const registry = new RendererRegistry(fallback);
    registry.register({
      id: "broken",
      type: "text.markdown",
      version: "1.0.0",
      displayName: "Broken",
      priority: 10,
      canRender: (value): value is AnyRenderEnvelope =>
        value.type === "text.markdown",
      load: async () => {
        throw new Error("chunk failed");
      },
    });
    const resolution = registry.resolve(demoScenarios[0]!.envelope);
    await expect(registry.load(resolution)).resolves.toMatchObject({
      default: component,
    });
    expect(resolution.trace.fallback).toBe(true);
  });

  it("round-trips MCP Apps resources", () => {
    const envelope = demoScenarios.find(
      (item) => item.id === "weather",
    )!.envelope;
    expect(mcpToolResultToEnvelope(envelopeToMcpToolResult(envelope))).toEqual(
      envelope,
    );
  });
});
