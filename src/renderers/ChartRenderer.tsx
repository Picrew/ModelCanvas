"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Maximize2, RefreshCw } from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { JsonValue, KnownRenderEnvelope } from "@/src/schema";
import { sanitizeDataOnlyChartOption } from "@/src/security";

function saveDataUrl(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
}

function EChart({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "chart.echarts" }>;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<import("echarts").ECharts | null>(null);
  const [error, setError] = useState<string>();
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    let active = true;
    let observer: ResizeObserver | undefined;
    void import("echarts").then((echarts) => {
      if (!active || !elementRef.current) return;
      try {
        const chart = echarts.init(elementRef.current, undefined, {
          renderer: envelope.payload.renderer,
        });
        chartRef.current = chart;
        const option = sanitizeDataOnlyChartOption(
          envelope.payload.option as Record<string, JsonValue>,
        );
        chart.setOption(option as import("echarts").EChartsCoreOption, {
          notMerge: true,
        });
        observer = new ResizeObserver(() => chart.resize());
        observer.observe(elementRef.current);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "ECharts could not render this option",
        );
      }
    });
    return () => {
      active = false;
      observer?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [envelope, renderKey]);

  if (error)
    return (
      <div className="renderer-state" role="alert">
        <h2>Chart option rejected</h2>
        <p>{error}</p>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            setError(undefined);
            setRenderKey((value) => value + 1);
          }}
        >
          <RefreshCw /> Retry
        </button>
      </div>
    );

  return (
    <section className="chart-renderer" data-testid="echarts-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">Apache ECharts · data-only option</span>
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            chartRef.current &&
            saveDataUrl(
              chartRef.current.getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#ffffff",
              }),
              `${envelope.id}.png`,
            )
          }
        >
          <Download /> Export PNG
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => elementRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      <div
        ref={elementRef}
        className="chart-canvas"
        aria-label={envelope.presentation?.title ?? "Interactive chart"}
      />
    </section>
  );
}

function VegaChart({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "chart.vega-lite" }>;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<import("vega").View | null>(null);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void import("vega-embed").then(async ({ default: embed }) => {
      if (!active || !elementRef.current) return;
      try {
        const result = await embed(
          elementRef.current,
          envelope.payload.spec as import("vega-embed").VisualizationSpec,
          {
            actions: false,
            renderer: "svg",
            mode: "vega-lite",
            tooltip: true,
            config: { background: "transparent", view: { stroke: null } },
          },
        );
        viewRef.current = result.view;
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Invalid Vega-Lite spec",
        );
      }
    });
    return () => {
      active = false;
      viewRef.current?.finalize();
      viewRef.current = null;
    };
  }, [envelope]);
  return (
    <section className="chart-renderer" data-testid="vega-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">Vega-Lite · embedded data</span>
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            void viewRef.current
              ?.toImageURL("png", 2)
              .then((url) => saveDataUrl(url, `${envelope.id}.png`))
          }
        >
          <Download /> Export PNG
        </button>
      </div>
      {error ? (
        <div className="inline-error" role="alert">
          <strong>Spec error</strong>
          <span>{error}</span>
        </div>
      ) : (
        <div ref={elementRef} className="chart-canvas vega-canvas" />
      )}
    </section>
  );
}

export default function ChartRenderer({ envelope }: RendererComponentProps) {
  if (envelope.type === "chart.echarts")
    return (
      <EChart
        envelope={
          envelope as Extract<KnownRenderEnvelope, { type: "chart.echarts" }>
        }
      />
    );
  if (envelope.type === "chart.vega-lite")
    return (
      <VegaChart
        envelope={
          envelope as Extract<KnownRenderEnvelope, { type: "chart.vega-lite" }>
        }
      />
    );
  throw new Error("Chart renderer received an incompatible envelope");
}
