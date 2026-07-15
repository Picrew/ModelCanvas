import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { technicalScenarios } from "@/src/fixtures";
import TechnicalRenderer from "@/src/renderers/TechnicalRenderer";

afterEach(cleanup);

function envelope(id: string) {
  return technicalScenarios.find((scenario) => scenario.id === id)!.envelope;
}

describe("technical renderer", () => {
  it.each([
    ["math-plot", "Mathematical plot"],
    ["math-matrix", "Matrix operation"],
    ["science-molecule", "Molecular structure"],
    ["science-optics", "Optics ray diagram"],
    ["engineering-circuit", "Circuit schematic"],
    ["engineering-timing", "Digital timing diagram"],
  ])("renders %s without executable payloads", (id, label) => {
    render(<TechnicalRenderer envelope={envelope(id)} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByTestId("technical-renderer")).toBeInTheDocument();
  });

  it("exposes deterministic grid and label controls", () => {
    render(<TechnicalRenderer envelope={envelope("math-geometry")} />);
    const grid = screen.getByRole("button", { name: "Grid" });
    const labels = screen.getByRole("button", { name: "Labels" });
    expect(grid).toHaveAttribute("aria-pressed", "true");
    expect(labels).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(grid);
    fireEvent.click(labels);
    expect(grid).toHaveAttribute("aria-pressed", "false");
    expect(labels).toHaveAttribute("aria-pressed", "false");
  });

  it("smooths mathematical series by default while preserving linear mode", () => {
    const smoothEnvelope = structuredClone(envelope("math-plot"));
    if (smoothEnvelope.type !== "math.plot")
      throw new Error("Expected math.plot fixture");
    for (const series of smoothEnvelope.payload.series) {
      series.points = series.points.filter((_, index) => index % 10 === 0);
    }
    const smoothResult = render(
      <TechnicalRenderer envelope={smoothEnvelope} />,
    );
    const smoothPaths = smoothResult.container.querySelectorAll(
      ".technical-series-line",
    );
    expect(smoothPaths).toHaveLength(2);
    for (const path of smoothPaths) {
      expect(path.getAttribute("d")).toContain("C");
    }
    smoothResult.unmount();

    const linearEnvelope = structuredClone(envelope("math-plot"));
    if (linearEnvelope.type !== "math.plot")
      throw new Error("Expected math.plot fixture");
    for (const series of linearEnvelope.payload.series) {
      series.interpolation = "linear";
    }
    const linearResult = render(
      <TechnicalRenderer envelope={linearEnvelope} />,
    );
    const linearPaths = linearResult.container.querySelectorAll(
      ".technical-series-line",
    );
    for (const path of linearPaths) {
      expect(path.getAttribute("d")).not.toContain("C");
      expect(path.getAttribute("d")).toContain("L");
    }
  });
});
