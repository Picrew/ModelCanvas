import { describe, expect, it } from "vitest";
import {
  deserializeRenderEnvelope,
  migrateEnvelope,
  parseRenderEnvelope,
  serializeRenderEnvelope,
} from "@/src/core";
import { demoScenarios } from "@/src/fixtures";

describe("RenderEnvelope protocol", () => {
  it("validates every deterministic demo fixture", () => {
    for (const scenario of demoScenarios) {
      const result = parseRenderEnvelope(scenario.envelope);
      expect(result.success, scenario.id).toBe(true);
      if (result.success) expect(result.unknownType, scenario.id).toBe(false);
    }
  });

  it("migrates legacy aliases and data payloads", () => {
    const migrated = migrateEnvelope({
      id: "legacy",
      type: "markdown",
      version: "v1",
      data: { content: "# Migrated", streaming: false },
    });
    expect(migrated.value).toMatchObject({
      type: "text.markdown",
      version: "1.0.0",
      payload: { content: "# Migrated" },
    });
    expect(migrated.migrations).toHaveLength(3);
  });

  it("returns a structured path for invalid payloads", () => {
    const result = parseRenderEnvelope({
      id: "broken",
      type: "text.markdown",
      version: "1.0.0",
      payload: { content: 42 },
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.issues[0]?.path).toBe("$.payload.content");
  });

  it("routes future types to an honest fallback", () => {
    const result = parseRenderEnvelope({
      id: "future",
      type: "future.quantum",
      version: "2.0.0",
      payload: {},
      fallback: { text: "Future output" },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.unknownType).toBe(true);
  });

  it("round-trips without losing protocol fields", () => {
    const envelope = demoScenarios[0]!.envelope;
    const result = deserializeRenderEnvelope(serializeRenderEnvelope(envelope));
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data).toEqual(
        parseRenderEnvelope(envelope).success ? envelope : undefined,
      );
  });

  it("rejects malformed and oversized JSON", () => {
    expect(deserializeRenderEnvelope("{").success).toBe(false);
    expect(
      deserializeRenderEnvelope(
        JSON.stringify({ value: "x".repeat(2_000_001) }),
      ).success,
    ).toBe(false);
  });
});
