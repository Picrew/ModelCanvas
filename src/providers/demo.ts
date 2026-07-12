import { findScenario } from "@/src/fixtures";
import type { ModelProvider, ModelRequest, ModelStream } from "./types";

export class DemoProvider implements ModelProvider {
  id = "demo";
  supportsTools = true;
  supportsStructuredOutput = true;
  supportsAudioOutput = false;

  async stream(request: ModelRequest): Promise<ModelStream> {
    const scenario = findScenario(request.prompt);
    async function* events() {
      yield { type: "text-delta" as const, delta: "Fixture route selected. " };
      yield { type: "envelope" as const, envelope: scenario.envelope };
      yield { type: "complete" as const };
    }
    return events();
  }
}
