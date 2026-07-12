"use client";

import "@excalidraw/excalidraw/index.css";
import { useMemo, useRef, useState } from "react";
import { Download, Maximize2, Save } from "lucide-react";
import { Excalidraw, exportToBlob, exportToSvg } from "@excalidraw/excalidraw";
import type {
  ExcalidrawInitialDataState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";

type DrawingEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "diagram.excalidraw" }
>;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ExcalidrawRenderer({
  envelope,
  onEvent,
}: RendererComponentProps) {
  if (envelope.type !== "diagram.excalidraw")
    throw new Error("Excalidraw renderer received an incompatible envelope");
  const drawing = envelope as DrawingEnvelope;
  const frameRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [elements, setElements] = useState<readonly ExcalidrawElement[]>(
    drawing.payload.elements as unknown as ExcalidrawElement[],
  );
  const initialData = useMemo<ExcalidrawInitialDataState>(
    () => ({
      elements: drawing.payload.elements as unknown as ExcalidrawElement[],
      appState: drawing.payload
        .appState as ExcalidrawInitialDataState["appState"],
      files: drawing.payload.files as ExcalidrawInitialDataState["files"],
    }),
    [drawing],
  );
  if (!drawing.payload.elements.length)
    return (
      <div className="renderer-state">
        <p className="eyebrow">Empty drawing</p>
        <h2>Add Excalidraw elements to begin</h2>
      </div>
    );
  const exportPng = async () => {
    const blob = await exportToBlob({
      elements,
      appState: apiRef.current?.getAppState(),
      files: apiRef.current?.getFiles(),
      mimeType: "image/png",
    });
    downloadBlob(blob, `${drawing.id}.png`);
  };
  const exportSvg = async () => {
    const svg = await exportToSvg({
      elements,
      appState: apiRef.current?.getAppState(),
      files: apiRef.current?.getFiles(),
    });
    downloadBlob(
      new Blob([svg.outerHTML], { type: "image/svg+xml" }),
      `${drawing.id}.svg`,
    );
  };
  return (
    <section className="excalidraw-renderer" data-testid="excalidraw-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">
          {elements.length} elements ·{" "}
          {drawing.payload.editable ? "editable" : "view only"}
        </span>
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            onEvent?.({
              type: "renderer.save",
              renderer: "diagram.excalidraw",
              action: "save-json",
              payload: { elements, appState: apiRef.current?.getAppState() },
            })
          }
        >
          <Save /> Save JSON
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => void exportPng()}
        >
          <Download /> PNG
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => void exportSvg()}
        >
          <Download /> SVG
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => frameRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      <div className="excalidraw-stage" ref={frameRef}>
        <Excalidraw
          excalidrawAPI={(api) => {
            apiRef.current = api;
          }}
          initialData={initialData}
          viewModeEnabled={!drawing.payload.editable}
          onChange={(nextElements) => setElements(nextElements)}
        />
      </div>
    </section>
  );
}
