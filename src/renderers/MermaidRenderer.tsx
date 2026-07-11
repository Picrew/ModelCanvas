"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Download, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";

type MermaidEnvelope = Extract<KnownRenderEnvelope, { type: "diagram.mermaid" }>;

export default function MermaidRenderer({ envelope }: RendererComponentProps) {
  if (envelope.type !== "diagram.mermaid") throw new Error("Mermaid renderer received an incompatible envelope");
  const diagram = envelope as MermaidEnvelope;
  const id = useId().replace(/:/g, "");
  const frameRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>();
  const [error, setError] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [themeNonce, setThemeNonce] = useState(0);
  const theme = useMemo(() => document.documentElement.dataset.theme === "dark" ? "dark" : "neutral", [themeNonce]);

  useEffect(() => {
    let active = true;
    setSvg(undefined);
    setError(undefined);
    void import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme, flowchart: { htmlLabels: false }, sequence: { useMaxWidth: true } });
      try {
        await mermaid.parse(diagram.payload.code);
        const rendered = await mermaid.render(`modelcanvas-${id}-${themeNonce}`, diagram.payload.code);
        if (active) setSvg(DOMPurify.sanitize(rendered.svg, { USE_PROFILES: { svg: true, svgFilters: true } }));
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Invalid Mermaid syntax");
      }
    });
    return () => { active = false; };
  }, [diagram.payload.code, id, theme, themeNonce]);

  const exportSvg = () => {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${diagram.id}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="diagram-renderer" data-testid="mermaid-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">Strict security · HTML labels off</span>
        <div className="zoom-controls" aria-label="Diagram zoom controls">
          <button className="icon-button compact" type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}><Minus /></button>
          <output>{Math.round(zoom * 100)}%</output>
          <button className="icon-button compact" type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))}><Plus /></button>
          <button className="icon-button compact" type="button" aria-label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw /></button>
        </div>
        <button className="icon-button" type="button" onClick={exportSvg}><Download /> Export SVG</button>
        <button className="icon-button" type="button" onClick={() => frameRef.current?.requestFullscreen()}><Maximize2 /> Fullscreen</button>
      </div>
      {error ? (
        <div className="renderer-state" role="alert"><p className="eyebrow">Syntax error</p><h2>Mermaid could not parse this diagram</h2><pre>{error}</pre><button className="button secondary" type="button" onClick={() => setThemeNonce((value) => value + 1)}><RotateCcw /> Retry</button></div>
      ) : (
        <div ref={frameRef} className="diagram-viewport">
          {svg ? (
            <div className="diagram-surface" style={{ transform: `scale(${zoom})` }} dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="diagram-surface"><div className="inline-loader">Rendering diagram…</div></div>
          )}
        </div>
      )}
    </section>
  );
}
