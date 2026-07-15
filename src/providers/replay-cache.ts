import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";

const REPLAY_CACHE_VERSION = "modelcanvas-replay-v1";

export interface ReplayCacheKeyInput {
  prompt: string;
  provider: string;
  model: string;
  renderType?: string;
}

function normalizePrompt(prompt: string): string {
  return prompt.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function createReplayCacheKey(input: ReplayCacheKeyInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: REPLAY_CACHE_VERSION,
        prompt: normalizePrompt(input.prompt),
        provider: input.provider,
        model: input.model,
        renderType: input.renderType ?? "auto",
      }),
    )
    .digest("hex");
}

export async function readReplayEnvelope(
  directory: string | undefined,
  key: string,
): Promise<AnyRenderEnvelope | undefined> {
  if (!directory) return undefined;
  try {
    const value = JSON.parse(
      await readFile(path.join(directory, `${key}.json`), "utf8"),
    ) as unknown;
    const parsed = parseRenderEnvelope(value);
    return parsed.success && !parsed.unknownType ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function writeReplayEnvelope(
  directory: string | undefined,
  key: string,
  envelope: AnyRenderEnvelope,
): Promise<void> {
  if (!directory) return;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const destination = path.join(directory, `${key}.json`);
  const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(envelope), { mode: 0o600 });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true }).catch(() => undefined);
  }
}
