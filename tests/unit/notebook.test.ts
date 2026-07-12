import { describe, expect, it } from "vitest";
import { ipynbEnvelope, parseRenderEnvelope } from "@/src/core";

describe("ipynb upload conversion", () => {
  it("normalizes source arrays and safe outputs", () => {
    const envelope = ipynbEnvelope(
      {
        metadata: { kernelspec: { language: "python" } },
        cells: [
          { cell_type: "markdown", source: ["## Title\n", "Notes"] },
          {
            cell_type: "code",
            source: ["print('ok')"],
            execution_count: 2,
            outputs: [
              { output_type: "stream", name: "stdout", text: ["ok\n"] },
            ],
          },
        ],
      },
      "analysis.ipynb",
    );
    expect(envelope.payload.cells).toHaveLength(2);
    expect(envelope.payload.cells[0]?.source).toBe("## Title\nNotes");
    const codeCell = envelope.payload.cells[1];
    expect(codeCell?.cellType).toBe("code");
    expect(codeCell?.cellType === "code" ? codeCell.outputs[0]?.text : "").toBe(
      "ok\n",
    );
    expect(parseRenderEnvelope(envelope).success).toBe(true);
  });

  it("rejects documents without cells", () => {
    expect(() => ipynbEnvelope({}, "broken.ipynb")).toThrow("cells array");
  });
});
