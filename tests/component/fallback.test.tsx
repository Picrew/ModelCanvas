import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FallbackRenderer from "@/src/renderers/FallbackRenderer";
import { RendererErrorBoundary } from "@/src/react/RendererErrorBoundary";

describe("renderer containment", () => {
  it("presents unknown output honestly", () => {
    render(
      <FallbackRenderer
        envelope={{
          id: "future",
          type: "future.output",
          version: "2.0.0",
          payload: {},
          fallback: { text: "Download the original result" },
        }}
      />,
    );
    expect(
      screen.getByText("Download the original result"),
    ).toBeInTheDocument();
    expect(screen.getByText(/future.output/)).toBeInTheDocument();
  });

  it("isolates a crashing renderer", () => {
    function Broken(): never {
      throw new Error("fixture crash");
    }
    render(
      <RendererErrorBoundary rendererId="broken">
        <Broken />
      </RendererErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This renderer stopped safely",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("fixture crash");
  });
});
