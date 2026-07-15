import { describe, expect, it } from "vitest";
import { parseRenderEnvelope } from "@/src/core";
import { technicalScenarios } from "@/src/fixtures";

describe("technical render envelopes", () => {
  it("keeps every technical fixture deterministic and valid", () => {
    expect(technicalScenarios).toHaveLength(16);
    for (const scenario of technicalScenarios) {
      const parsed = parseRenderEnvelope(scenario.envelope);
      expect(parsed.success, scenario.envelope.type).toBe(true);
      expect(scenario.category).toBe("Technical");
    }
  });

  it("rejects malformed matrices and invalid geographic coordinates", () => {
    expect(
      parseRenderEnvelope({
        id: "bad-matrix",
        type: "math.matrix",
        version: "1.0.0",
        payload: {
          matrices: [{ id: "a", values: [[1, 2], [3]] }],
          operators: [],
          highlightedCells: [],
        },
      }).success,
    ).toBe(false);
    expect(
      parseRenderEnvelope({
        id: "bad-place",
        type: "map.places",
        version: "1.0.0",
        payload: {
          places: [
            {
              id: "x",
              name: "Out of bounds",
              category: "test",
              location: { longitude: 240, latitude: 120 },
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it("defaults mathematical plots to smooth interpolation", () => {
    const parsed = parseRenderEnvelope({
      id: "sparse-trigonometric-plot",
      type: "math.plot",
      version: "1.0.0",
      payload: {
        xDomain: [-Math.PI, Math.PI],
        yDomain: [-1.5, 1.5],
        series: [
          {
            id: "sin",
            label: "sin(x)",
            points: [
              { x: -Math.PI, y: 0 },
              { x: -Math.PI / 2, y: -1 },
              { x: 0, y: 0 },
              { x: Math.PI / 2, y: 1 },
              { x: Math.PI, y: 0 },
            ],
          },
        ],
      },
    });

    expect(parsed.success).toBe(true);
    if (
      !parsed.success ||
      parsed.unknownType ||
      parsed.data.type !== "math.plot"
    )
      throw new Error("Expected a valid math.plot envelope");
    expect(parsed.data.payload.series[0].interpolation).toBe("smooth");
  });
});
