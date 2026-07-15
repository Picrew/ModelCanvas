import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OpenAICompatibleProvider,
  collectProviderEnvelope,
} from "@/src/providers";

const envelope = {
  id: "fenced-response",
  type: "text.markdown",
  version: "1.0.0",
  payload: { content: "# Valid", streaming: false },
};

afterEach(() => vi.unstubAllGlobals());

describe("OpenAICompatibleProvider response parsing", () => {
  it("accepts a validated envelope wrapped in a JSON code fence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: `Reasoning complete.\n\`\`\`json\n${JSON.stringify(envelope)}\n\`\`\``,
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const provider = new OpenAICompatibleProvider({
      id: "test",
      apiKey: "test-only",
      baseUrl: "https://example.test/v1",
      model: "test-model",
    });

    await expect(
      collectProviderEnvelope(provider, { prompt: "Render it" }),
    ).resolves.toMatchObject(envelope);
  });

  it("can request DeepSeek V4 Flash with thinking disabled", async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (_url, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(envelope) } }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );

    const provider = new OpenAICompatibleProvider({
      id: "deepseek",
      apiKey: "test-only",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      thinking: "disabled",
    });

    await collectProviderEnvelope(provider, { prompt: "Render it quickly" });

    expect(requestBody).toMatchObject({
      model: "deepseek-v4-flash",
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
    });
  });
});
