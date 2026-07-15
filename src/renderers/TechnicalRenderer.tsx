"use client";

import {
  Activity,
  Atom,
  CircuitBoard,
  Download,
  FlaskConical,
  Grid3X3,
  Maximize2,
  Sigma,
  Tags,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";

type MathPlotEnvelope = Extract<KnownRenderEnvelope, { type: "math.plot" }>;
type MathGeometryEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "math.geometry" }
>;
type MathMatrixEnvelope = Extract<KnownRenderEnvelope, { type: "math.matrix" }>;
type MathDistributionEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "math.distribution" }
>;
type MathNumberLineEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "math.number-line" }
>;
type MoleculeEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "science.molecule" }
>;
type ReactionEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "science.reaction" }
>;
type OpticsEnvelope = Extract<KnownRenderEnvelope, { type: "science.optics" }>;
type CircuitEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "engineering.circuit" }
>;
type WaveformEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "engineering.waveform" }
>;
type TimingEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "engineering.timing" }
>;
type LogicEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "engineering.logic" }
>;
type Molecule = MoleculeEnvelope["payload"]["molecule"];

const WIDTH = 760;
const HEIGHT = 420;
const PAD = { left: 66, right: 28, top: 28, bottom: 54 };
const SERIES_COLORS = ["#5b79ea", "#dc5f73", "#168363", "#a65bd4", "#d88922"];
const ATOM_COLORS: Record<string, string> = {
  C: "#334155",
  H: "#94a3b8",
  O: "#dc4c64",
  N: "#3973d8",
  S: "#d99a16",
  P: "#c26d2d",
  F: "#28a879",
  Cl: "#28a879",
  Br: "#9b5b36",
  I: "#7651a8",
};

function finiteRange(values: number[], fallback: [number, number] = [0, 1]) {
  if (!values.length) return fallback;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min - 1, max + 1] as const;
  return [min, max] as const;
}

function project(
  x: number,
  y: number,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
) {
  return {
    x:
      PAD.left +
      ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) *
        (WIDTH - PAD.left - PAD.right),
    y:
      PAD.top +
      (1 - (y - yDomain[0]) / (yDomain[1] - yDomain[0])) *
        (HEIGHT - PAD.top - PAD.bottom),
  };
}

type ProjectedPoint = ReturnType<typeof project>;
type PlotInterpolation =
  MathPlotEnvelope["payload"]["series"][number]["interpolation"];

function formatCoordinate(value: number) {
  return value.toFixed(2);
}

function linearPlotPath(points: ProjectedPoint[]) {
  return points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${formatCoordinate(point.x)},${formatCoordinate(point.y)}`,
    )
    .join(" ");
}

function stepPlotPath(points: ProjectedPoint[]) {
  if (!points.length) return "";
  const commands = [
    `M${formatCoordinate(points[0].x)},${formatCoordinate(points[0].y)}`,
  ];
  for (let index = 1; index < points.length; index += 1) {
    commands.push(
      `H${formatCoordinate(points[index].x)}`,
      `V${formatCoordinate(points[index].y)}`,
    );
  }
  return commands.join(" ");
}

function limitedEndpointSlope(
  slope: number,
  segmentSlope: number,
  adjacentSlope: number,
) {
  if (Math.sign(slope) !== Math.sign(segmentSlope)) return 0;
  if (
    Math.sign(segmentSlope) !== Math.sign(adjacentSlope) &&
    Math.abs(slope) > Math.abs(3 * segmentSlope)
  ) {
    return 3 * segmentSlope;
  }
  return slope;
}

/**
 * Builds a shape-preserving cubic Hermite spline. Unlike a generic Bézier
 * smoothing pass, it does not overshoot local extrema in sparsely sampled
 * functions such as sin(x) and cos(x).
 */
function smoothPlotPath(points: ProjectedPoint[]) {
  if (points.length < 3) return linearPlotPath(points);

  const widths = points
    .slice(1)
    .map((point, index) => point.x - points[index].x);
  if (widths.some((width) => width <= 0)) return linearPlotPath(points);

  const segmentSlopes = widths.map(
    (width, index) => (points[index + 1].y - points[index].y) / width,
  );
  const tangents = new Array<number>(points.length).fill(0);

  const firstSlope =
    ((2 * widths[0] + widths[1]) * segmentSlopes[0] -
      widths[0] * segmentSlopes[1]) /
    (widths[0] + widths[1]);
  tangents[0] = limitedEndpointSlope(
    firstSlope,
    segmentSlopes[0],
    segmentSlopes[1],
  );

  for (let index = 1; index < points.length - 1; index += 1) {
    const previousSlope = segmentSlopes[index - 1];
    const nextSlope = segmentSlopes[index];
    if (
      previousSlope === 0 ||
      nextSlope === 0 ||
      Math.sign(previousSlope) !== Math.sign(nextSlope)
    ) {
      tangents[index] = 0;
      continue;
    }
    const previousWidth = widths[index - 1];
    const nextWidth = widths[index];
    const previousWeight = 2 * nextWidth + previousWidth;
    const nextWeight = nextWidth + 2 * previousWidth;
    tangents[index] =
      (previousWeight + nextWeight) /
      (previousWeight / previousSlope + nextWeight / nextSlope);
  }

  const lastIndex = points.length - 1;
  const lastWidthIndex = widths.length - 1;
  const lastSlope =
    ((2 * widths[lastWidthIndex] + widths[lastWidthIndex - 1]) *
      segmentSlopes[lastWidthIndex] -
      widths[lastWidthIndex] * segmentSlopes[lastWidthIndex - 1]) /
    (widths[lastWidthIndex] + widths[lastWidthIndex - 1]);
  tangents[lastIndex] = limitedEndpointSlope(
    lastSlope,
    segmentSlopes[lastWidthIndex],
    segmentSlopes[lastWidthIndex - 1],
  );

  const commands = [
    `M${formatCoordinate(points[0].x)},${formatCoordinate(points[0].y)}`,
  ];
  for (let index = 0; index < points.length - 1; index += 1) {
    const width = widths[index];
    const start = points[index];
    const end = points[index + 1];
    commands.push(
      `C${formatCoordinate(start.x + width / 3)},${formatCoordinate(
        start.y + (tangents[index] * width) / 3,
      )} ${formatCoordinate(end.x - width / 3)},${formatCoordinate(
        end.y - (tangents[index + 1] * width) / 3,
      )} ${formatCoordinate(end.x)},${formatCoordinate(end.y)}`,
    );
  }
  return commands.join(" ");
}

function plotPath(points: ProjectedPoint[], interpolation: PlotInterpolation) {
  switch (interpolation) {
    case "linear":
      return linearPlotPath(points);
    case "step":
      return stepPlotPath(points);
    case "smooth":
      return smoothPlotPath(points);
  }
}

function ticks([start, end]: readonly [number, number], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const value = Number(
      (start + ((end - start) * index) / (count - 1)).toPrecision(5),
    );
    return Math.abs(value) < 1e-10 ? 0 : value;
  });
}

function TechnicalFrame({
  icon,
  title,
  summary,
  children,
  exportSvg = true,
  gridControl = true,
}: {
  icon: ReactNode;
  title: string;
  summary: string;
  children: (options: { showGrid: boolean; showLabels: boolean }) => ReactNode;
  exportSvg?: boolean;
  gridControl?: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  function downloadSvg() {
    const svg = rootRef.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(
      new Blob([text], { type: "image/svg+xml;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      ref={rootRef}
      className="technical-renderer"
      data-testid="technical-renderer"
    >
      <div className="renderer-toolbar technical-toolbar">
        <span className="toolbar-note">
          {icon} <strong>{title}</strong> · {summary}
        </span>
        {gridControl ? (
          <button
            className={`icon-button ${showGrid ? "active" : ""}`}
            type="button"
            onClick={() => setShowGrid((value) => !value)}
            aria-pressed={showGrid}
          >
            <Grid3X3 /> Grid
          </button>
        ) : null}
        <button
          className={`icon-button ${showLabels ? "active" : ""}`}
          type="button"
          onClick={() => setShowLabels((value) => !value)}
          aria-pressed={showLabels}
        >
          <Tags /> Labels
        </button>
        {exportSvg ? (
          <button className="icon-button" type="button" onClick={downloadSvg}>
            <Download /> SVG
          </button>
        ) : null}
        <button
          className="icon-button"
          type="button"
          onClick={() => rootRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      <div className="technical-stage">
        {children({ showGrid, showLabels })}
      </div>
    </section>
  );
}

function PlotAxes({
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  showGrid,
}: {
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  xLabel?: string;
  yLabel?: string;
  showGrid: boolean;
}) {
  const xTicks = ticks(xDomain, 9);
  const yTicks = ticks(yDomain, 7);
  const xAxis = project(
    0,
    Math.max(yDomain[0], Math.min(0, yDomain[1])),
    xDomain,
    yDomain,
  ).y;
  const yAxis = project(
    Math.max(xDomain[0], Math.min(0, xDomain[1])),
    0,
    xDomain,
    yDomain,
  ).x;
  return (
    <g className="technical-axes">
      {showGrid
        ? xTicks.map((value) => {
            const x = project(value, 0, xDomain, yDomain).x;
            return (
              <line
                key={`x-${value}`}
                x1={x}
                y1={PAD.top}
                x2={x}
                y2={HEIGHT - PAD.bottom}
                className="technical-grid-line"
              />
            );
          })
        : null}
      {showGrid
        ? yTicks.map((value) => {
            const y = project(0, value, xDomain, yDomain).y;
            return (
              <line
                key={`y-${value}`}
                x1={PAD.left}
                y1={y}
                x2={WIDTH - PAD.right}
                y2={y}
                className="technical-grid-line"
              />
            );
          })
        : null}
      <line
        x1={PAD.left}
        y1={xAxis}
        x2={WIDTH - PAD.right}
        y2={xAxis}
        className="technical-axis-line"
      />
      <line
        x1={yAxis}
        y1={PAD.top}
        x2={yAxis}
        y2={HEIGHT - PAD.bottom}
        className="technical-axis-line"
      />
      {xTicks.map((value) => {
        const x = project(value, 0, xDomain, yDomain).x;
        return (
          <text
            key={`xt-${value}`}
            x={x}
            y={HEIGHT - 26}
            textAnchor="middle"
            className="technical-tick"
          >
            {value}
          </text>
        );
      })}
      {yTicks.map((value) => {
        const y = project(0, value, xDomain, yDomain).y;
        return (
          <text
            key={`yt-${value}`}
            x={PAD.left - 12}
            y={y + 4}
            textAnchor="end"
            className="technical-tick"
          >
            {value}
          </text>
        );
      })}
      {xLabel ? (
        <text
          x={(PAD.left + WIDTH - PAD.right) / 2}
          y={HEIGHT - 5}
          textAnchor="middle"
          className="technical-axis-label"
        >
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text
          transform={`translate(17 ${(PAD.top + HEIGHT - PAD.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="technical-axis-label"
        >
          {yLabel}
        </text>
      ) : null}
    </g>
  );
}

function MathPlot({ envelope }: { envelope: MathPlotEnvelope }) {
  const data = envelope.payload;
  return (
    <TechnicalFrame
      icon={<Sigma />}
      title="Mathematical plot"
      summary={`${data.series.length} sampled series`}
    >
      {({ showGrid, showLabels }) => (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="Mathematical plot"
          >
            <PlotAxes {...data} showGrid={showGrid && data.showGrid} />
            {data.series.map((series, index) => {
              const path = plotPath(
                series.points.map((point) =>
                  project(point.x, point.y, data.xDomain, data.yDomain),
                ),
                series.interpolation,
              );
              return (
                <path
                  key={series.id}
                  d={path}
                  fill="none"
                  style={{
                    stroke:
                      series.color ??
                      SERIES_COLORS[index % SERIES_COLORS.length],
                  }}
                  className="technical-series-line"
                />
              );
            })}
          </svg>
          {showLabels ? (
            <div className="technical-legend">
              {data.series.map((series, index) => (
                <span key={series.id}>
                  <i
                    style={{
                      background:
                        series.color ??
                        SERIES_COLORS[index % SERIES_COLORS.length],
                    }}
                  />
                  {series.label}
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </TechnicalFrame>
  );
}

function MathGeometry({ envelope }: { envelope: MathGeometryEnvelope }) {
  const data = envelope.payload;
  const points = new Map(data.points.map((point) => [point.id, point]));
  return (
    <TechnicalFrame
      icon={<Sigma />}
      title="Geometry construction"
      summary={`${data.points.length} points · ${data.segments.length} constraints`}
    >
      {({ showGrid, showLabels }) => (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Geometry construction"
        >
          <PlotAxes
            xDomain={data.xDomain}
            yDomain={data.yDomain}
            showGrid={showGrid}
          />
          {data.polygons.map((polygon) => {
            const vertices = polygon.vertices
              .map((id) => points.get(id))
              .filter(Boolean)
              .map((point) => {
                const mapped = project(
                  point!.x,
                  point!.y,
                  data.xDomain,
                  data.yDomain,
                );
                return `${mapped.x},${mapped.y}`;
              })
              .join(" ");
            return (
              <polygon
                key={polygon.id}
                points={vertices}
                fill={polygon.color ?? "#5b79ea"}
                className="technical-polygon"
              />
            );
          })}
          {data.circles.map((circle) => {
            const center = points.get(circle.center);
            if (!center) return null;
            const mapped = project(
              center.x,
              center.y,
              data.xDomain,
              data.yDomain,
            );
            const edge = project(
              center.x + circle.radius,
              center.y + circle.radius,
              data.xDomain,
              data.yDomain,
            );
            return (
              <ellipse
                key={circle.id}
                cx={mapped.x}
                cy={mapped.y}
                rx={Math.abs(edge.x - mapped.x)}
                ry={Math.abs(edge.y - mapped.y)}
                className="technical-shape-line"
              />
            );
          })}
          {data.segments.map((segment) => {
            const from = points.get(segment.from);
            const to = points.get(segment.to);
            if (!from || !to) return null;
            const a = project(from.x, from.y, data.xDomain, data.yDomain);
            const b = project(to.x, to.y, data.xDomain, data.yDomain);
            return (
              <line
                key={segment.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={`technical-shape-line ${segment.dashed ? "dashed" : ""}`}
              />
            );
          })}
          {data.points.map((point) => {
            const mapped = project(
              point.x,
              point.y,
              data.xDomain,
              data.yDomain,
            );
            return (
              <g key={point.id}>
                <circle
                  cx={mapped.x}
                  cy={mapped.y}
                  r="5"
                  className="technical-point"
                />
                {showLabels ? (
                  <text
                    x={mapped.x + 9}
                    y={mapped.y - 9}
                    className="technical-label"
                  >
                    {point.label ?? point.id}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}
    </TechnicalFrame>
  );
}

function MathMatrix({ envelope }: { envelope: MathMatrixEnvelope }) {
  const data = envelope.payload;
  const highlighted = new Set(
    data.highlightedCells.map(
      (cell) => `${cell.matrixId}:${cell.row}:${cell.column}`,
    ),
  );
  return (
    <TechnicalFrame
      icon={<Grid3X3 />}
      title="Matrix operation"
      summary={`${data.matrices.length} matrices`}
      exportSvg={false}
      gridControl={false}
    >
      {({ showLabels }) => (
        <div
          className="matrix-operation"
          role="group"
          aria-label="Matrix operation"
        >
          {data.matrices.map((matrix, matrixIndex) => (
            <div className="matrix-expression-part" key={matrix.id}>
              <div className="matrix-block">
                {showLabels && matrix.label ? (
                  <strong>{matrix.label}</strong>
                ) : null}
                <div className="matrix-bracket">
                  <table>
                    <tbody>
                      {matrix.values.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((value, columnIndex) => (
                            <td
                              className={
                                highlighted.has(
                                  `${matrix.id}:${rowIndex}:${columnIndex}`,
                                )
                                  ? "highlighted"
                                  : ""
                              }
                              key={columnIndex}
                            >
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {data.operators[matrixIndex] ? (
                <span className="matrix-operator">
                  {data.operators[matrixIndex]}
                </span>
              ) : null}
            </div>
          ))}
          {data.annotation ? (
            <p className="matrix-annotation">{data.annotation}</p>
          ) : null}
        </div>
      )}
    </TechnicalFrame>
  );
}

function MathDistribution({
  envelope,
}: {
  envelope: MathDistributionEnvelope;
}) {
  const data = envelope.payload;
  const xDomain = finiteRange(data.points.map((point) => point.x));
  const yDomain: [number, number] = [
    0,
    Math.max(...data.points.map((point) => point.y)) * 1.12,
  ];
  const curve = data.points
    .map((point, index) => {
      const mapped = project(point.x, point.y, xDomain, yDomain);
      return `${index ? "L" : "M"}${mapped.x},${mapped.y}`;
    })
    .join(" ");
  const shaded = data.shadedRange
    ? data.points.filter(
        (point) =>
          point.x >= data.shadedRange![0] && point.x <= data.shadedRange![1],
      )
    : [];
  const area = shaded.length
    ? `${shaded
        .map((point, index) => {
          const mapped = project(point.x, point.y, xDomain, yDomain);
          return `${index ? "L" : "M"}${mapped.x},${mapped.y}`;
        })
        .join(
          " ",
        )} L${project(shaded.at(-1)!.x, 0, xDomain, yDomain).x},${project(0, 0, xDomain, yDomain).y} L${project(shaded[0]!.x, 0, xDomain, yDomain).x},${project(0, 0, xDomain, yDomain).y} Z`
    : "";
  return (
    <TechnicalFrame
      icon={<Activity />}
      title="Probability distribution"
      summary={`${data.kind} · ${data.label}`}
    >
      {({ showGrid, showLabels }) => (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${data.label} probability distribution`}
          >
            <PlotAxes
              xDomain={xDomain}
              yDomain={yDomain}
              xLabel="x"
              yLabel="density"
              showGrid={showGrid}
            />
            {area ? <path d={area} className="distribution-area" /> : null}
            <path d={curve} fill="none" className="technical-series-line" />
            {data.mean !== undefined ? (
              <line
                x1={project(data.mean, 0, xDomain, yDomain).x}
                x2={project(data.mean, 0, xDomain, yDomain).x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                className="technical-marker"
              />
            ) : null}
          </svg>
          {showLabels ? (
            <div className="technical-metrics">
              <span>
                μ <strong>{data.mean ?? "—"}</strong>
              </span>
              <span>
                median <strong>{data.median ?? "—"}</strong>
              </span>
              <span>
                σ <strong>{data.standardDeviation ?? "—"}</strong>
              </span>
            </div>
          ) : null}
        </>
      )}
    </TechnicalFrame>
  );
}

function MathNumberLine({ envelope }: { envelope: MathNumberLineEnvelope }) {
  const data = envelope.payload;
  const [min, max] = data.domain;
  const values: number[] = [];
  for (let value = min; value <= max + data.step / 100; value += data.step)
    values.push(Number(value.toPrecision(8)));
  const mapX = (value: number) => 64 + ((value - min) / (max - min)) * 632;
  return (
    <TechnicalFrame
      icon={<Sigma />}
      title="Number line"
      summary={`${data.intervals.length} intervals · ${data.points.length} points`}
    >
      {({ showGrid, showLabels }) => (
        <svg viewBox="0 0 760 260" role="img" aria-label="Number line">
          <defs>
            <marker
              id="number-arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10Z" className="technical-arrow" />
            </marker>
          </defs>
          {showGrid
            ? values.map((value) => (
                <line
                  key={`grid-${value}`}
                  x1={mapX(value)}
                  x2={mapX(value)}
                  y1="50"
                  y2="205"
                  className="technical-grid-line"
                />
              ))
            : null}
          <line
            x1="48"
            x2="712"
            y1="154"
            y2="154"
            className="number-axis"
            markerStart="url(#number-arrow)"
            markerEnd="url(#number-arrow)"
          />
          {values.map((value) => (
            <g key={value}>
              <line
                x1={mapX(value)}
                x2={mapX(value)}
                y1="145"
                y2="163"
                className="technical-axis-line"
              />
              {showLabels ? (
                <text
                  x={mapX(value)}
                  y="187"
                  textAnchor="middle"
                  className="technical-tick"
                >
                  {value}
                </text>
              ) : null}
            </g>
          ))}
          {data.intervals.map((interval, index) => {
            const y = 112 - index * 25;
            return (
              <g key={interval.id}>
                <line
                  x1={mapX(interval.start)}
                  x2={mapX(interval.end)}
                  y1={y}
                  y2={y}
                  stroke={
                    interval.color ??
                    SERIES_COLORS[index % SERIES_COLORS.length]
                  }
                  className="number-interval"
                />
                <circle
                  cx={mapX(interval.start)}
                  cy={y}
                  r="6"
                  fill={
                    interval.startClosed
                      ? (interval.color ??
                        SERIES_COLORS[index % SERIES_COLORS.length])
                      : "var(--panel)"
                  }
                  stroke={
                    interval.color ??
                    SERIES_COLORS[index % SERIES_COLORS.length]
                  }
                />
                <circle
                  cx={mapX(interval.end)}
                  cy={y}
                  r="6"
                  fill={
                    interval.endClosed
                      ? (interval.color ??
                        SERIES_COLORS[index % SERIES_COLORS.length])
                      : "var(--panel)"
                  }
                  stroke={
                    interval.color ??
                    SERIES_COLORS[index % SERIES_COLORS.length]
                  }
                />
                {showLabels && interval.label ? (
                  <text
                    x={(mapX(interval.start) + mapX(interval.end)) / 2}
                    y={y - 12}
                    textAnchor="middle"
                    className="technical-label"
                  >
                    {interval.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {data.points.map((point, index) => (
            <g key={`${point.value}-${index}`}>
              <circle
                cx={mapX(point.value)}
                cy="154"
                r="7"
                fill={point.color ?? "#dc5f73"}
              />
              {showLabels && point.label ? (
                <text
                  x={mapX(point.value)}
                  y="220"
                  textAnchor="middle"
                  className="technical-label"
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      )}
    </TechnicalFrame>
  );
}

function moleculeBounds(molecule: Molecule) {
  const x = finiteRange(molecule.atoms.map((atom) => atom.x));
  const y = finiteRange(molecule.atoms.map((atom) => atom.y));
  return {
    x: [x[0] - 0.8, x[1] + 0.8] as [number, number],
    y: [y[0] - 0.8, y[1] + 0.8] as [number, number],
  };
}

function MoleculeSvg({
  molecule,
  showLabels = true,
  compact = false,
}: {
  molecule: Molecule;
  showLabels?: boolean;
  compact?: boolean;
}) {
  const width = compact ? 260 : WIDTH;
  const height = compact ? 230 : HEIGHT;
  const bounds = moleculeBounds(molecule);
  const padding = compact ? 32 : 70;
  const mapAtom = (x: number, y: number) => ({
    x:
      padding +
      ((x - bounds.x[0]) / (bounds.x[1] - bounds.x[0])) * (width - padding * 2),
    y:
      padding +
      (1 - (y - bounds.y[0]) / (bounds.y[1] - bounds.y[0])) *
        (height - padding * 2),
  });
  const atoms = new Map(molecule.atoms.map((atom) => [atom.id, atom]));
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${molecule.name} molecular structure`}
    >
      {molecule.bonds.flatMap((bond, bondIndex) => {
        const from = atoms.get(bond.from);
        const to = atoms.get(bond.to);
        if (!from || !to) return [];
        const a = mapAtom(from.x, from.y);
        const b = mapAtom(to.x, to.y);
        const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const px = (-(b.y - a.y) / length) * 4;
        const py = ((b.x - a.x) / length) * 4;
        return Array.from({ length: bond.order }, (_, lineIndex) => {
          const offset = lineIndex - (bond.order - 1) / 2;
          return (
            <line
              key={`${bondIndex}-${lineIndex}`}
              x1={a.x + px * offset}
              y1={a.y + py * offset}
              x2={b.x + px * offset}
              y2={b.y + py * offset}
              className="molecule-bond"
            />
          );
        });
      })}
      {molecule.atoms.map((atom) => {
        const point = mapAtom(atom.x, atom.y);
        const color = ATOM_COLORS[atom.element] ?? "#64748b";
        return (
          <g key={atom.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={compact ? 18 : 22}
              fill={color}
              className="molecule-atom"
            />
            <text
              x={point.x}
              y={point.y + 5}
              textAnchor="middle"
              className="molecule-symbol"
            >
              {atom.label ?? atom.element}
            </text>
            {atom.charge ? (
              <text
                x={point.x + 17}
                y={point.y - 15}
                className="molecule-charge"
              >
                {atom.charge > 0 ? `+${atom.charge}` : atom.charge}
              </text>
            ) : null}
          </g>
        );
      })}
      {showLabels ? (
        <>
          <text
            x={width / 2}
            y="24"
            textAnchor="middle"
            className="technical-title-label"
          >
            {molecule.name}
          </text>
          {molecule.formula ? (
            <text
              x={width / 2}
              y={height - 10}
              textAnchor="middle"
              className="technical-axis-label"
            >
              {molecule.formula}
            </text>
          ) : null}
        </>
      ) : null}
    </svg>
  );
}

function ScienceMolecule({ envelope }: { envelope: MoleculeEnvelope }) {
  const molecule = envelope.payload.molecule;
  return (
    <TechnicalFrame
      icon={<Atom />}
      title="Molecular structure"
      summary={`${molecule.atoms.length} atoms · ${molecule.bonds.length} bonds`}
      gridControl={false}
    >
      {({ showLabels }) => (
        <MoleculeSvg molecule={molecule} showLabels={showLabels} />
      )}
    </TechnicalFrame>
  );
}

function ScienceReaction({ envelope }: { envelope: ReactionEnvelope }) {
  const data = envelope.payload;
  return (
    <TechnicalFrame
      icon={<FlaskConical />}
      title="Chemical reaction"
      summary={data.balanced ? "balanced equation" : "structural equation"}
      gridControl={false}
    >
      {({ showLabels }) => (
        <div
          className="reaction-layout"
          role="img"
          aria-label="Chemical reaction"
        >
          {data.reactants.map((molecule, index) => (
            <div className="reaction-molecule" key={molecule.id}>
              <MoleculeSvg
                molecule={molecule}
                compact
                showLabels={showLabels}
              />
              {index < data.reactants.length - 1 ? (
                <span className="reaction-plus">+</span>
              ) : null}
            </div>
          ))}
          <div className="reaction-arrow">
            <span>{data.reversible ? "⇌" : "→"}</span>
            {showLabels ? (
              <small>
                {[data.catalyst, data.conditions].filter(Boolean).join(" · ")}
              </small>
            ) : null}
          </div>
          {data.products.map((molecule, index) => (
            <div className="reaction-molecule" key={molecule.id}>
              <MoleculeSvg
                molecule={molecule}
                compact
                showLabels={showLabels}
              />
              {index < data.products.length - 1 ? (
                <span className="reaction-plus">+</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </TechnicalFrame>
  );
}

function ScienceOptics({ envelope }: { envelope: OpticsEnvelope }) {
  const data = envelope.payload;
  return (
    <TechnicalFrame
      icon={<FlaskConical />}
      title="Optics ray diagram"
      summary={`${data.elements.length} optical elements · ${data.rays.length} rays`}
    >
      {({ showGrid, showLabels }) => (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Optics ray diagram"
        >
          <PlotAxes
            xDomain={data.xDomain}
            yDomain={data.yDomain}
            showGrid={showGrid}
          />
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={project(0, data.axisY, data.xDomain, data.yDomain).y}
            y2={project(0, data.axisY, data.xDomain, data.yDomain).y}
            className="optical-axis"
          />
          {data.elements.map((element) => {
            const center = project(
              element.x,
              data.axisY,
              data.xDomain,
              data.yDomain,
            );
            const top = project(
              element.x,
              data.axisY + element.height / 2,
              data.xDomain,
              data.yDomain,
            );
            const bottom = project(
              element.x,
              data.axisY - element.height / 2,
              data.xDomain,
              data.yDomain,
            );
            return (
              <g key={element.id} className={`optical-element ${element.type}`}>
                <line x1={center.x} x2={center.x} y1={top.y} y2={bottom.y} />
                <path
                  d={`M${center.x - 7},${top.y + 10} L${center.x},${top.y} L${center.x + 7},${top.y + 10} M${center.x - 7},${bottom.y - 10} L${center.x},${bottom.y} L${center.x + 7},${bottom.y - 10}`}
                />
                {showLabels ? (
                  <text
                    x={center.x}
                    y={bottom.y + 24}
                    textAnchor="middle"
                    className="technical-label"
                  >
                    {element.label ?? element.type}
                  </text>
                ) : null}
              </g>
            );
          })}
          {data.rays.map((ray, index) => (
            <polyline
              key={ray.id}
              points={ray.points
                .map((point) => {
                  const mapped = project(
                    point.x,
                    point.y,
                    data.xDomain,
                    data.yDomain,
                  );
                  return `${mapped.x},${mapped.y}`;
                })
                .join(" ")}
              fill="none"
              style={{
                stroke:
                  ray.color ?? SERIES_COLORS[index % SERIES_COLORS.length],
              }}
              className="optical-ray"
            />
          ))}
        </svg>
      )}
    </TechnicalFrame>
  );
}

function CircuitSymbol({
  type,
  a,
  b,
}: {
  type: CircuitEnvelope["payload"]["components"][number]["type"];
  a: { x: number; y: number };
  b: { x: number; y: number };
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const start = { x: middle.x - ux * 32, y: middle.y - uy * 32 };
  const end = { x: middle.x + ux * 32, y: middle.y + uy * 32 };
  const common: SVGProps<SVGLineElement> = { className: "circuit-symbol" };
  if (type === "wire")
    return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} {...common} />;
  if (type === "resistor") {
    const points = [
      start,
      ...Array.from({ length: 7 }, (_, index) => ({
        x: start.x + ux * ((index + 1) * 8) + px * (index % 2 ? -8 : 8),
        y: start.y + uy * ((index + 1) * 8) + py * (index % 2 ? -8 : 8),
      })),
      end,
    ];
    return (
      <>
        <line x1={a.x} y1={a.y} x2={start.x} y2={start.y} {...common} />
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          className="circuit-symbol"
        />
        <line x1={end.x} y1={end.y} x2={b.x} y2={b.y} {...common} />
      </>
    );
  }
  if (type === "capacitor")
    return (
      <>
        <line
          x1={a.x}
          y1={a.y}
          x2={middle.x - ux * 7}
          y2={middle.y - uy * 7}
          {...common}
        />
        <line
          x1={middle.x - ux * 7 + px * 18}
          y1={middle.y - uy * 7 + py * 18}
          x2={middle.x - ux * 7 - px * 18}
          y2={middle.y - uy * 7 - py * 18}
          {...common}
        />
        <line
          x1={middle.x + ux * 7 + px * 18}
          y1={middle.y + uy * 7 + py * 18}
          x2={middle.x + ux * 7 - px * 18}
          y2={middle.y + uy * 7 - py * 18}
          {...common}
        />
        <line
          x1={middle.x + ux * 7}
          y1={middle.y + uy * 7}
          x2={b.x}
          y2={b.y}
          {...common}
        />
      </>
    );
  if (type === "source")
    return (
      <>
        <line
          x1={a.x}
          y1={a.y}
          x2={middle.x - ux * 22}
          y2={middle.y - uy * 22}
          {...common}
        />
        <circle cx={middle.x} cy={middle.y} r="22" className="circuit-symbol" />
        <text
          x={middle.x}
          y={middle.y + 5}
          textAnchor="middle"
          className="circuit-source-mark"
        >
          ±
        </text>
        <line
          x1={middle.x + ux * 22}
          y1={middle.y + uy * 22}
          x2={b.x}
          y2={b.y}
          {...common}
        />
      </>
    );
  if (type === "diode" || type === "led")
    return (
      <>
        <line
          x1={a.x}
          y1={a.y}
          x2={middle.x - ux * 24}
          y2={middle.y - uy * 24}
          {...common}
        />
        <polygon
          points={`${middle.x - ux * 22 + px * 16},${middle.y - uy * 22 + py * 16} ${middle.x - ux * 22 - px * 16},${middle.y - uy * 22 - py * 16} ${middle.x + ux * 10},${middle.y + uy * 10}`}
          className="circuit-diode"
        />
        <line
          x1={middle.x + ux * 14 + px * 17}
          y1={middle.y + uy * 14 + py * 17}
          x2={middle.x + ux * 14 - px * 17}
          y2={middle.y + uy * 14 - py * 17}
          {...common}
        />
        <line
          x1={middle.x + ux * 14}
          y1={middle.y + uy * 14}
          x2={b.x}
          y2={b.y}
          {...common}
        />
      </>
    );
  return (
    <>
      <line x1={a.x} y1={a.y} x2={start.x} y2={start.y} {...common} />
      <rect
        x={middle.x - 28}
        y={middle.y - 15}
        width="56"
        height="30"
        rx="4"
        className="circuit-block"
      />
      <text
        x={middle.x}
        y={middle.y + 4}
        textAnchor="middle"
        className="circuit-block-label"
      >
        {type.slice(0, 3).toUpperCase()}
      </text>
      <line x1={end.x} y1={end.y} x2={b.x} y2={b.y} {...common} />
    </>
  );
}

function EngineeringCircuit({ envelope }: { envelope: CircuitEnvelope }) {
  const data = envelope.payload;
  const xDomain = finiteRange(data.nodes.map((node) => node.x));
  const yDomain = finiteRange(data.nodes.map((node) => node.y));
  const expandedX: [number, number] = [xDomain[0] - 1, xDomain[1] + 1];
  const expandedY: [number, number] = [yDomain[0] - 1, yDomain[1] + 1];
  const nodes = new Map(data.nodes.map((node) => [node.id, node]));
  return (
    <TechnicalFrame
      icon={<CircuitBoard />}
      title="Circuit schematic"
      summary={`${data.components.length} components · ${data.nodes.length} nodes`}
    >
      {({ showGrid, showLabels }) => (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Circuit schematic"
        >
          {showGrid ? (
            <defs>
              <pattern
                id="circuit-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path d="M24 0H0V24" className="circuit-grid-path" />
              </pattern>
            </defs>
          ) : null}
          {showGrid ? (
            <rect width={WIDTH} height={HEIGHT} fill="url(#circuit-grid)" />
          ) : null}
          {data.components.map((component) => {
            const from = nodes.get(component.from);
            const to = nodes.get(component.to);
            if (!from || !to) return null;
            const a = project(from.x, from.y, expandedX, expandedY);
            const b = project(to.x, to.y, expandedX, expandedY);
            return (
              <g key={component.id}>
                <CircuitSymbol type={component.type} a={a} b={b} />
                {showLabels && (component.label || component.value) ? (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 - 26}
                    textAnchor="middle"
                    className="technical-label"
                  >
                    {[component.label, component.value]
                      .filter(Boolean)
                      .join(" · ")}
                  </text>
                ) : null}
              </g>
            );
          })}
          {data.nodes.map((node) => {
            const point = project(node.x, node.y, expandedX, expandedY);
            return (
              <g key={node.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  className="circuit-node"
                />
                {showLabels && node.label ? (
                  <text
                    x={point.x + 9}
                    y={point.y + 17}
                    className="technical-label"
                  >
                    {node.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}
    </TechnicalFrame>
  );
}

function EngineeringWaveform({ envelope }: { envelope: WaveformEnvelope }) {
  const data = envelope.payload;
  const times = data.channels.flatMap((channel) =>
    channel.samples.map((sample) => sample.time),
  );
  const timeDomain = finiteRange(times);
  const bandHeight = 330 / data.channels.length;
  return (
    <TechnicalFrame
      icon={<Activity />}
      title="Engineering waveform"
      summary={`${data.channels.length} channels · ${data.timeUnit}`}
    >
      {({ showGrid, showLabels }) => (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="Engineering waveform"
          >
            {showGrid
              ? ticks(timeDomain, 9).map((time) => {
                  const x =
                    94 +
                    ((time - timeDomain[0]) / (timeDomain[1] - timeDomain[0])) *
                      630;
                  return (
                    <line
                      key={time}
                      x1={x}
                      x2={x}
                      y1="28"
                      y2="366"
                      className="technical-grid-line"
                    />
                  );
                })
              : null}
            {data.channels.map((channel, channelIndex) => {
              const values = finiteRange(
                channel.samples.map((sample) => sample.value),
              );
              const yTop = 28 + channelIndex * bandHeight;
              const path = channel.samples
                .map((sample, index) => {
                  const x =
                    94 +
                    ((sample.time - timeDomain[0]) /
                      (timeDomain[1] - timeDomain[0])) *
                      630;
                  const y =
                    yTop +
                    12 +
                    (1 - (sample.value - values[0]) / (values[1] - values[0])) *
                      (bandHeight - 24);
                  return `${index ? "L" : "M"}${x},${y}`;
                })
                .join(" ");
              return (
                <g key={channel.id}>
                  <line
                    x1="94"
                    x2="724"
                    y1={yTop + bandHeight}
                    y2={yTop + bandHeight}
                    className="waveform-divider"
                  />
                  {showLabels ? (
                    <text
                      x="82"
                      y={yTop + bandHeight / 2}
                      textAnchor="end"
                      className="technical-label"
                    >
                      {channel.label}
                    </text>
                  ) : null}
                  <path
                    d={path}
                    fill="none"
                    style={{
                      stroke:
                        channel.color ??
                        SERIES_COLORS[channelIndex % SERIES_COLORS.length],
                    }}
                    className="waveform-path"
                  />
                </g>
              );
            })}
            {data.cursors.map((cursor) => {
              const x =
                94 +
                ((cursor.time - timeDomain[0]) /
                  (timeDomain[1] - timeDomain[0])) *
                  630;
              return (
                <g key={`${cursor.time}-${cursor.label}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1="22"
                    y2="372"
                    className="technical-marker"
                  />
                  {showLabels ? (
                    <text x={x + 5} y="20" className="technical-label">
                      {cursor.label ?? cursor.time}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <text
              x="409"
              y="405"
              textAnchor="middle"
              className="technical-axis-label"
            >
              time ({data.timeUnit})
            </text>
          </svg>
        </>
      )}
    </TechnicalFrame>
  );
}

function EngineeringTiming({ envelope }: { envelope: TimingEnvelope }) {
  const data = envelope.payload;
  const left = 110;
  const right = 724;
  const rowHeight = Math.min(58, 320 / data.signals.length);
  const x = (time: number) => left + (time / data.duration) * (right - left);
  return (
    <TechnicalFrame
      icon={<Activity />}
      title="Digital timing diagram"
      summary={`${data.signals.length} signals · ${data.duration}${data.timeUnit}`}
    >
      {({ showGrid, showLabels }) => (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Digital timing diagram"
        >
          {showGrid
            ? ticks([0, data.duration], 11).map((time) => (
                <g key={time}>
                  <line
                    x1={x(time)}
                    x2={x(time)}
                    y1="32"
                    y2="365"
                    className="technical-grid-line"
                  />
                  <text
                    x={x(time)}
                    y="393"
                    textAnchor="middle"
                    className="technical-tick"
                  >
                    {time}
                  </text>
                </g>
              ))
            : null}
          {data.signals.map((signal, index) => {
            const top = 38 + index * rowHeight;
            const high = top + 8;
            const low = top + rowHeight - 12;
            const events = [
              { time: 0, value: signal.initial },
              ...signal.transitions
                .filter((transition) => transition.time <= data.duration)
                .sort((a, b) => a.time - b.time),
            ];
            let path = `M${x(0)},${signal.initial === "1" ? high : signal.initial === "0" ? low : (high + low) / 2}`;
            events.forEach((event, eventIndex) => {
              const next = events[eventIndex + 1];
              const y =
                event.value === "1"
                  ? high
                  : event.value === "0"
                    ? low
                    : (high + low) / 2;
              path += ` L${x(next?.time ?? data.duration)},${y}`;
              if (next) {
                const nextY =
                  next.value === "1"
                    ? high
                    : next.value === "0"
                      ? low
                      : (high + low) / 2;
                path += ` L${x(next.time)},${nextY}`;
              }
            });
            return (
              <g key={signal.id}>
                {showLabels ? (
                  <text
                    x="96"
                    y={top + rowHeight / 2 + 4}
                    textAnchor="end"
                    className="technical-label"
                  >
                    {signal.label}
                  </text>
                ) : null}
                <path d={path} fill="none" className="timing-path" />
                {events
                  .filter((event) => event.value === "x" || event.value === "z")
                  .map((event) => (
                    <text
                      key={`${event.time}-${event.value}`}
                      x={x(event.time) + 4}
                      y={(high + low) / 2 - 4}
                      className="timing-unknown"
                    >
                      {event.value.toUpperCase()}
                    </text>
                  ))}
              </g>
            );
          })}
          {data.markers.map((marker) => (
            <g key={`${marker.time}-${marker.label}`}>
              <line
                x1={x(marker.time)}
                x2={x(marker.time)}
                y1="24"
                y2="368"
                className="technical-marker"
              />
              {showLabels ? (
                <text x={x(marker.time) + 5} y="21" className="technical-label">
                  {marker.label}
                </text>
              ) : null}
            </g>
          ))}
          <text
            x="418"
            y="414"
            textAnchor="middle"
            className="technical-axis-label"
          >
            time ({data.timeUnit})
          </text>
        </svg>
      )}
    </TechnicalFrame>
  );
}

function GateShape({
  gate,
}: {
  gate: LogicEnvelope["payload"]["gates"][number];
}) {
  const { x, y, type } = gate;
  const negated = type === "nand" || type === "nor";
  const base = type === "nand" ? "and" : type === "nor" ? "or" : type;
  if (base === "not" || base === "buffer")
    return (
      <g>
        <polygon
          points={`${x - 30},${y - 24} ${x - 30},${y + 24} ${x + 22},${y}`}
          className="logic-gate"
        />
        {base === "not" ? (
          <circle cx={x + 29} cy={y} r="7" className="logic-gate" />
        ) : null}
      </g>
    );
  if (base === "and")
    return (
      <g>
        <path
          d={`M${x - 34},${y - 28} H${x} A28,28 0 0 1 ${x},${y + 28} H${x - 34} Z`}
          className="logic-gate"
        />
        {negated ? (
          <circle cx={x + 34} cy={y} r="6" className="logic-gate" />
        ) : null}
      </g>
    );
  return (
    <g>
      <path
        d={`M${x - 34},${y - 28} Q${x - 12},${y} ${x - 34},${y + 28} Q${x + 4},${y + 27} ${x + 32},${y} Q${x + 4},${y - 27} ${x - 34},${y - 28} Z`}
        className="logic-gate"
      />
      {base === "xor" ? (
        <path
          d={`M${x - 42},${y - 28} Q${x - 20},${y} ${x - 42},${y + 28}`}
          className="logic-gate"
        />
      ) : null}
      {negated ? (
        <circle cx={x + 38} cy={y} r="6" className="logic-gate" />
      ) : null}
    </g>
  );
}

function EngineeringLogic({ envelope }: { envelope: LogicEnvelope }) {
  const data = envelope.payload;
  const entities = new Map<string, { x: number; y: number }>();
  data.inputs.forEach((item) => entities.set(item.id, item));
  data.gates.forEach((item) => entities.set(item.id, item));
  data.outputs.forEach((item) => entities.set(item.id, item));
  return (
    <TechnicalFrame
      icon={<CircuitBoard />}
      title="Logic circuit"
      summary={`${data.gates.length} gates · ${data.connections.length} nets`}
    >
      {({ showGrid, showLabels }) => (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Logic circuit"
        >
          {showGrid ? (
            <defs>
              <pattern
                id="logic-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path d="M24 0H0V24" className="circuit-grid-path" />
              </pattern>
            </defs>
          ) : null}
          {showGrid ? (
            <rect width={WIDTH} height={HEIGHT} fill="url(#logic-grid)" />
          ) : null}
          {data.connections.map((connection, index) => {
            const from = entities.get(connection.from);
            const to = entities.get(connection.to);
            if (!from || !to) return null;
            const startX =
              from.x +
              (data.gates.some((gate) => gate.id === connection.from) ? 38 : 8);
            const endX =
              to.x -
              (data.gates.some((gate) => gate.id === connection.to) ? 38 : 8);
            const mid = (startX + endX) / 2;
            return (
              <g key={`${connection.from}-${connection.to}-${index}`}>
                <path
                  d={`M${startX},${from.y} H${mid} V${to.y} H${endX}`}
                  className="logic-wire"
                />
                {showLabels && connection.label ? (
                  <text
                    x={mid + 4}
                    y={(from.y + to.y) / 2 - 5}
                    className="technical-label"
                  >
                    {connection.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {data.inputs.map((input) => (
            <g key={input.id}>
              <circle
                cx={input.x}
                cy={input.y}
                r="8"
                className={`logic-terminal value-${input.value ?? "unknown"}`}
              />
              {showLabels ? (
                <text
                  x={input.x - 13}
                  y={input.y + 5}
                  textAnchor="end"
                  className="technical-label"
                >
                  {input.label}
                  {input.value !== undefined ? ` = ${input.value}` : ""}
                </text>
              ) : null}
            </g>
          ))}
          {data.gates.map((gate) => (
            <g key={gate.id}>
              <GateShape gate={gate} />
              {showLabels ? (
                <text
                  x={gate.x}
                  y={gate.y + 4}
                  textAnchor="middle"
                  className="logic-gate-label"
                >
                  {gate.type.toUpperCase()}
                </text>
              ) : null}
            </g>
          ))}
          {data.outputs.map((output) => (
            <g key={output.id}>
              <circle
                cx={output.x}
                cy={output.y}
                r="8"
                className={`logic-terminal value-${output.value ?? "unknown"}`}
              />
              {showLabels ? (
                <text
                  x={output.x + 13}
                  y={output.y + 5}
                  className="technical-label"
                >
                  {output.label}
                  {output.value !== undefined ? ` = ${output.value}` : ""}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      )}
    </TechnicalFrame>
  );
}

export default function TechnicalRenderer({
  envelope,
}: RendererComponentProps) {
  switch (envelope.type) {
    case "math.plot":
      return <MathPlot envelope={envelope as MathPlotEnvelope} />;
    case "math.geometry":
      return <MathGeometry envelope={envelope as MathGeometryEnvelope} />;
    case "math.matrix":
      return <MathMatrix envelope={envelope as MathMatrixEnvelope} />;
    case "math.distribution":
      return (
        <MathDistribution envelope={envelope as MathDistributionEnvelope} />
      );
    case "math.number-line":
      return <MathNumberLine envelope={envelope as MathNumberLineEnvelope} />;
    case "science.molecule":
      return <ScienceMolecule envelope={envelope as MoleculeEnvelope} />;
    case "science.reaction":
      return <ScienceReaction envelope={envelope as ReactionEnvelope} />;
    case "science.optics":
      return <ScienceOptics envelope={envelope as OpticsEnvelope} />;
    case "engineering.circuit":
      return <EngineeringCircuit envelope={envelope as CircuitEnvelope} />;
    case "engineering.waveform":
      return <EngineeringWaveform envelope={envelope as WaveformEnvelope} />;
    case "engineering.timing":
      return <EngineeringTiming envelope={envelope as TimingEnvelope} />;
    case "engineering.logic":
      return <EngineeringLogic envelope={envelope as LogicEnvelope} />;
    default:
      throw new Error("Technical renderer received an incompatible envelope");
  }
}
