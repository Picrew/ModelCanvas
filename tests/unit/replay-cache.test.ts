import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createReplayCacheKey,
  readReplayEnvelope,
  writeReplayEnvelope,
} from "@/src/providers/replay-cache";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("model response replay cache", () => {
  it("normalizes equivalent prompts into the same cache key", () => {
    const base = {
      provider: "openai-compatible",
      model: "test-model",
      renderType: "diagram.mermaid",
    };
    expect(createReplayCacheKey({ ...base, prompt: "  项目   流程图  " })).toBe(
      createReplayCacheKey({ ...base, prompt: "项目 流程图" }),
    );
  });

  it("round-trips only validated RenderEnvelopes", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "modelcanvas-cache-"));
    directories.push(directory);
    const envelope = {
      id: "stable-replay",
      type: "text.markdown" as const,
      version: "1.0.0",
      payload: { content: "# Stable", streaming: false, allowHtml: false },
    };
    await writeReplayEnvelope(directory, "valid", envelope);
    await expect(readReplayEnvelope(directory, "valid")).resolves.toMatchObject(
      envelope,
    );

    await writeFile(path.join(directory, "invalid.json"), '{"bad":true}');
    await expect(
      readReplayEnvelope(directory, "invalid"),
    ).resolves.toBeUndefined();
  });
});
