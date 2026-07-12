import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  a2uiToRenderEnvelope,
  agUiEventToModelCanvas,
  aiSdkPartToModelCanvas,
  envelopeToOpenAIApps,
  openAIAppsToEnvelope,
} from "@/src/adapters";
import {
  collectProviderEnvelope,
  DemoProvider,
  OpenAITtsProvider,
  ProviderError,
  ttsCacheKey,
} from "@/src/providers";
import {
  allDemoScenarios,
  demoScenarios,
  widgetFixtures,
} from "@/src/fixtures";
import { parseRenderEnvelope } from "@/src/core";
import { RenderTypeSchema, renderEnvelopeJsonSchema } from "@/src/schema";
import { sanitizeFileName, validateFile } from "@/src/security";

afterEach(() => vi.unstubAllGlobals());

describe("acceptance coverage", () => {
  it("has a valid deterministic demo for every discriminated render type", () => {
    const fixtures = [
      ...demoScenarios.map((item) => item.envelope),
      ...widgetFixtures,
    ];
    const covered = new Set(fixtures.map((item) => item.type));
    expect([...covered].sort()).toEqual([...RenderTypeSchema.options].sort());
    for (const fixture of fixtures)
      expect(parseRenderEnvelope(fixture).success, fixture.type).toBe(true);
  });

  it("exposes every render type as an individually openable case", () => {
    const openable = new Set(
      allDemoScenarios.map((item) => item.envelope.type),
    );
    expect([...openable].sort()).toEqual([...RenderTypeSchema.options].sort());
  });

  it("documents every render type with a real case screenshot", () => {
    const readme = readFileSync("README.md", "utf8");
    const chineseReadme = readFileSync("README.zh-CN.md", "utf8");
    for (const type of RenderTypeSchema.options) {
      expect(readme, `README screenshot for ${type}`).toContain(
        `docs/images/cases/${type}.png`,
      );
      expect(chineseReadme, `Chinese README screenshot for ${type}`).toContain(
        `docs/images/cases/${type}.png`,
      );
    }
    expect(readme).not.toContain("Featured rich results");
    expect(readme).not.toContain("ModelCanvas 是一个");
    expect(readme).toContain("![ModelCanvas social preview](./public/og.png)");
    expect(chineseReadme).toContain(
      "![ModelCanvas social preview](./public/og.png)",
    );
  });

  it("exports a draft 2020-12 JSON schema with every variant", () => {
    const schema = renderEnvelopeJsonSchema() as {
      $schema?: string;
      oneOf?: unknown[];
    };
    expect(schema.$schema).toContain("2020-12");
    expect(schema.oneOf).toHaveLength(RenderTypeSchema.options.length);
  });

  it("converts all AG-UI event families", () => {
    expect(
      agUiEventToModelCanvas({
        type: "TEXT_MESSAGE_START",
        messageId: "m",
        role: "assistant",
      }).type,
    ).toBe("message.streaming");
    expect(
      agUiEventToModelCanvas({
        type: "TOOL_CALL_START",
        toolCallId: "t",
        toolCallName: "weather",
      }).type,
    ).toBe("tool.start");
    expect(
      agUiEventToModelCanvas({
        type: "STATE_SNAPSHOT",
        snapshot: { ready: true },
      }).type,
    ).toBe("state.update");
    expect(
      agUiEventToModelCanvas({ type: "RUN_ERROR", message: "failed" }),
    ).toEqual({ type: "error", message: "failed" });
    expect(
      agUiEventToModelCanvas({ type: "RUN_FINISHED", threadId: "thread" }),
    ).toEqual({ type: "completion", threadId: "thread" });
  });

  it("rejects unknown A2UI components while preserving allowed fields", () => {
    const envelope = a2uiToRenderEnvelope({
      id: "a2",
      nodes: [
        {
          id: "name",
          component: "TextInput",
          properties: { label: "Name", required: true },
        },
        { id: "x", component: "RawHtml" },
      ],
    });
    expect(envelope.type).toBe("form.dynamic");
    expect(envelope.metadata?.rejectedComponents).toEqual(["RawHtml"]);
    const fallback = a2uiToRenderEnvelope({
      id: "bad",
      nodes: [{ id: "x", component: "RawHtml" }],
    });
    expect(fallback.type).toBe("a2ui.unsupported");
  });

  it("round-trips OpenAI Apps and maps Vercel AI SDK states", () => {
    const envelope = demoScenarios[0]!.envelope;
    expect(openAIAppsToEnvelope(envelopeToOpenAIApps(envelope))).toEqual(
      envelope,
    );
    expect(aiSdkPartToModelCanvas({ type: "text", text: "hello" })).toEqual({
      type: "message.streaming",
      delta: "hello",
    });
    expect(
      aiSdkPartToModelCanvas({
        type: "tool-render",
        toolCallId: "t",
        state: "output-available",
        output: envelope,
      }),
    ).toMatchObject({ type: "tool.result", id: "t" });
    expect(
      aiSdkPartToModelCanvas({
        type: "tool-render",
        toolCallId: "t",
        state: "output-error",
        errorText: "nope",
      }),
    ).toEqual({ type: "error", id: "t", message: "nope" });
  });

  it("sanitizes file names and enforces extension, MIME, size and empty guards", () => {
    expect(sanitizeFileName("../../secret<script>.pdf")).toBe(
      "secret_script_.pdf",
    );
    const policy = {
      maxBytes: 100,
      extensions: ["pdf"],
      mimeTypes: ["application/pdf"],
    };
    expect(
      validateFile(
        { name: "ok.pdf", size: 10, type: "application/pdf" },
        policy,
      ).ok,
    ).toBe(true);
    expect(
      validateFile(
        { name: "bad.exe", size: 10, type: "application/pdf" },
        policy,
      ).ok,
    ).toBe(false);
    expect(
      validateFile({ name: "bad.pdf", size: 10, type: "text/html" }, policy).ok,
    ).toBe(false);
    expect(
      validateFile(
        { name: "big.pdf", size: 101, type: "application/pdf" },
        policy,
      ).ok,
    ).toBe(false);
    expect(
      validateFile(
        { name: "empty.pdf", size: 0, type: "application/pdf" },
        policy,
      ).ok,
    ).toBe(false);
  });

  it("keeps TTS cache keys stable and provider errors explicit", async () => {
    const request = { text: "café", voice: "alloy", speed: 1 };
    expect(ttsCacheKey("openai", request)).toBe(
      ttsCacheKey("openai", { ...request, text: "cafe\u0301" }),
    );
    await expect(
      new OpenAITtsProvider().synthesize(request),
    ).rejects.toMatchObject({ code: "missing_key" });
    await expect(
      new OpenAITtsProvider("key").synthesize({
        ...request,
        text: "x".repeat(4097),
      }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it("collects Demo Provider output and rejects streams without envelopes", async () => {
    await expect(
      collectProviderEnvelope(new DemoProvider(), { prompt: "weather" }),
    ).resolves.toMatchObject({ type: "widget.weather" });
    const empty = {
      id: "empty",
      supportsTools: false,
      supportsStructuredOutput: false,
      async stream() {
        return (async function* () {
          yield { type: "complete" as const };
        })();
      },
    };
    await expect(
      collectProviderEnvelope(empty, { prompt: "x" }),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });
});
