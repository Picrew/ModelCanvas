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
});
