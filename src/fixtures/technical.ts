import { parseRenderEnvelope } from "@/src/core";
import type { KnownRenderEnvelope, RenderEnvelopeInput } from "@/src/schema";

const version = "1.0.0";
const sampleSource = {
  provider: "ModelCanvas Technical Fixture",
  model: "fixture-v1",
  createdAt: "2026-07-15T00:00:00.000Z",
};

function fixture(input: RenderEnvelopeInput): KnownRenderEnvelope {
  const result = parseRenderEnvelope(input);
  if (!result.success || result.unknownType)
    throw new Error(
      `Invalid technical fixture: ${result.issues
        .map((issue) => `${issue.path} ${issue.message}`)
        .join(", ")}`,
    );
  return result.data as KnownRenderEnvelope;
}

const sampled = (fn: (value: number) => number, count = 121) =>
  Array.from({ length: count }, (_, index) => {
    const x = -Math.PI * 2 + (Math.PI * 4 * index) / (count - 1);
    return { x, y: fn(x) };
  });

const normalPoints = Array.from({ length: 161 }, (_, index) => {
  const x = -4 + (8 * index) / 160;
  return {
    x,
    y: Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI),
  };
});

const mathPlotEnvelope = fixture({
  id: "demo-math-plot",
  type: "math.plot",
  version,
  source: sampleSource,
  presentation: { title: "Harmonic functions", display: "panel" },
  payload: {
    xDomain: [-6.5, 6.5],
    yDomain: [-1.4, 1.4],
    xLabel: "x (radians)",
    yLabel: "f(x)",
    showGrid: true,
    series: [
      {
        id: "sin",
        label: "sin(x)",
        color: "#5b79ea",
        points: sampled(Math.sin),
      },
      {
        id: "damped",
        label: "0.75 cos(2x)",
        color: "#dc5f73",
        points: sampled((x) => 0.75 * Math.cos(2 * x)),
      },
    ],
  },
});

const mathGeometryEnvelope = fixture({
  id: "demo-math-geometry",
  type: "math.geometry",
  version,
  source: sampleSource,
  presentation: { title: "Circumcircle construction" },
  payload: {
    xDomain: [-1, 9],
    yDomain: [-1, 7],
    points: [
      { id: "A", x: 1, y: 1, label: "A" },
      { id: "B", x: 7, y: 1, label: "B" },
      { id: "C", x: 4, y: 6, label: "C" },
      { id: "O", x: 4, y: 2.6, label: "O" },
    ],
    segments: [
      { id: "ab", from: "A", to: "B" },
      { id: "bc", from: "B", to: "C" },
      { id: "ca", from: "C", to: "A" },
      { id: "oa", from: "O", to: "A", label: "r", dashed: true },
      { id: "ob", from: "O", to: "B", label: "r", dashed: true },
      { id: "oc", from: "O", to: "C", label: "r", dashed: true },
    ],
    polygons: [
      {
        id: "triangle",
        vertices: ["A", "B", "C"],
        label: "△ABC",
        color: "#5b79ea",
      },
    ],
    circles: [{ id: "circumcircle", center: "O", radius: 3.4, label: "Γ" }],
  },
});

const mathMatrixEnvelope = fixture({
  id: "demo-math-matrix",
  type: "math.matrix",
  version,
  source: sampleSource,
  presentation: { title: "Matrix multiplication" },
  payload: {
    matrices: [
      {
        id: "a",
        label: "A",
        values: [
          [2, 1],
          [3, 4],
        ],
      },
      {
        id: "b",
        label: "B",
        values: [
          [5, 2],
          [1, 3],
        ],
      },
      {
        id: "result",
        label: "AB",
        values: [
          [11, 7],
          [19, 18],
        ],
      },
    ],
    operators: ["×", "="],
    highlightedCells: [
      { matrixId: "a", row: 0, column: 0 },
      { matrixId: "a", row: 0, column: 1 },
      { matrixId: "b", row: 0, column: 0 },
      { matrixId: "b", row: 1, column: 0 },
      { matrixId: "result", row: 0, column: 0 },
    ],
    annotation: "Highlighted cells show 2 × 5 + 1 × 1 = 11.",
  },
});

const mathDistributionEnvelope = fixture({
  id: "demo-math-distribution",
  type: "math.distribution",
  version,
  source: sampleSource,
  presentation: { title: "Standard normal distribution" },
  payload: {
    kind: "normal",
    label: "N(0, 1)",
    points: normalPoints,
    parameters: { mean: 0, standardDeviation: 1 },
    shadedRange: [-1.96, 1.96],
    mean: 0,
    median: 0,
    standardDeviation: 1,
  },
});

const mathNumberLineEnvelope = fixture({
  id: "demo-math-number-line",
  type: "math.number-line",
  version,
  source: sampleSource,
  presentation: { title: "Intervals and critical points" },
  payload: {
    domain: [-5, 8],
    step: 1,
    intervals: [
      {
        id: "solution",
        start: -2,
        end: 5,
        startClosed: false,
        endClosed: true,
        label: "−2 < x ≤ 5",
        color: "#5b79ea",
      },
    ],
    points: [{ value: 0, label: "origin", color: "#dc5f73" }],
  },
});

const mapPlacesEnvelope = fixture({
  id: "demo-map-places",
  type: "map.places",
  version,
  source: sampleSource,
  presentation: { title: "Beijing research places" },
  payload: {
    selectedId: "observatory",
    places: [
      {
        id: "observatory",
        name: "Beijing Ancient Observatory",
        category: "Science museum",
        location: { longitude: 116.4283, latitude: 39.9065 },
        address: "2 Dongbiaobei Hutong",
        rating: 4.6,
        description: "Historic astronomical instruments and exhibits.",
      },
      {
        id: "museum",
        name: "National Museum of China",
        category: "Museum",
        location: { longitude: 116.401, latitude: 39.905 },
        address: "16 E Chang'an Ave",
        rating: 4.7,
      },
      {
        id: "planetarium",
        name: "Beijing Planetarium",
        category: "Planetarium",
        location: { longitude: 116.335, latitude: 39.9385 },
        address: "138 Xizhimenwai Ave",
        rating: 4.5,
      },
    ],
  },
});

const routePath = [
  [116.397, 39.908],
  [116.401, 39.91],
  [116.407, 39.913],
  [116.414, 39.914],
  [116.42, 39.911],
  [116.4283, 39.9065],
] as const;
const mapRouteEnvelope = fixture({
  id: "demo-map-route",
  type: "map.route",
  version,
  source: sampleSource,
  presentation: { title: "Museum walking route" },
  payload: {
    mode: "walk",
    distanceKm: 3.2,
    durationMinutes: 43,
    path: routePath.map(([longitude, latitude]) => ({ longitude, latitude })),
    waypoints: [
      {
        longitude: routePath[0][0],
        latitude: routePath[0][1],
        label: "Tian'anmen East",
      },
      {
        longitude: routePath.at(-1)![0],
        latitude: routePath.at(-1)![1],
        label: "Ancient Observatory",
      },
    ],
  },
});

const heatPoints = Array.from({ length: 49 }, (_, index) => {
  const row = Math.floor(index / 7);
  const column = index % 7;
  const distance = Math.hypot(row - 3, column - 3);
  return {
    longitude: 116.36 + column * 0.012,
    latitude: 39.88 + row * 0.012,
    intensity: Math.max(0.08, 1 - distance / 5),
    label: `Sensor ${index + 1}`,
  };
});
const mapHeatmapEnvelope = fixture({
  id: "demo-map-heatmap",
  type: "map.heatmap",
  version,
  source: sampleSource,
  presentation: { title: "Urban heat observations" },
  payload: {
    metric: "Surface temperature anomaly",
    radius: 60,
    points: heatPoints,
  },
});

const mapTrackEnvelope = fixture({
  id: "demo-map-track",
  type: "map.track",
  version,
  source: sampleSource,
  presentation: { title: "Trail activity track" },
  payload: {
    activity: "hike",
    distanceKm: 6.8,
    durationMinutes: 112,
    samples: Array.from({ length: 32 }, (_, index) => ({
      longitude: 116.0105 + index * 0.0022,
      latitude: 40.359 + Math.sin(index / 4) * 0.006 + index * 0.0008,
      time: `${String(8 + Math.floor((index * 3) / 60)).padStart(2, "0")}:${String((index * 3) % 60).padStart(2, "0")}`,
      elevation: 610 + index * 9 + Math.sin(index / 3) * 22,
      speed: 4.1 + Math.sin(index / 2) * 0.7,
    })),
  },
});

const benzene = {
  id: "benzene",
  name: "Benzene",
  formula: "C₆H₆",
  atoms: [
    { id: "c1", element: "C", x: 0, y: -2 },
    { id: "c2", element: "C", x: 1.73, y: -1 },
    { id: "c3", element: "C", x: 1.73, y: 1 },
    { id: "c4", element: "C", x: 0, y: 2 },
    { id: "c5", element: "C", x: -1.73, y: 1 },
    { id: "c6", element: "C", x: -1.73, y: -1 },
  ],
  bonds: [
    { from: "c1", to: "c2", order: 2 as const },
    { from: "c2", to: "c3", order: 1 as const },
    { from: "c3", to: "c4", order: 2 as const },
    { from: "c4", to: "c5", order: 1 as const },
    { from: "c5", to: "c6", order: 2 as const },
    { from: "c6", to: "c1", order: 1 as const },
  ],
};
const scienceMoleculeEnvelope = fixture({
  id: "demo-science-molecule",
  type: "science.molecule",
  version,
  source: sampleSource,
  presentation: { title: "Benzene molecular structure" },
  payload: { molecule: benzene },
});

const scienceReactionEnvelope = fixture({
  id: "demo-science-reaction",
  type: "science.reaction",
  version,
  source: sampleSource,
  presentation: { title: "Methane combustion" },
  payload: {
    balanced: true,
    reversible: false,
    conditions: "ignition",
    reactants: [
      {
        id: "methane",
        name: "Methane",
        formula: "CH₄",
        atoms: [{ id: "c", element: "C", x: 0, y: 0 }],
        bonds: [],
      },
      {
        id: "oxygen",
        name: "2 Oxygen",
        formula: "2 O₂",
        atoms: [
          { id: "o1", element: "O", x: -0.6, y: 0 },
          { id: "o2", element: "O", x: 0.6, y: 0 },
        ],
        bonds: [{ from: "o1", to: "o2", order: 2 }],
      },
    ],
    products: [
      {
        id: "co2",
        name: "Carbon dioxide",
        formula: "CO₂",
        atoms: [
          { id: "o1", element: "O", x: -1.2, y: 0 },
          { id: "c", element: "C", x: 0, y: 0 },
          { id: "o2", element: "O", x: 1.2, y: 0 },
        ],
        bonds: [
          { from: "o1", to: "c", order: 2 },
          { from: "c", to: "o2", order: 2 },
        ],
      },
      {
        id: "water",
        name: "2 Water",
        formula: "2 H₂O",
        atoms: [
          { id: "h1", element: "H", x: -1, y: 0.7 },
          { id: "o", element: "O", x: 0, y: 0 },
          { id: "h2", element: "H", x: 1, y: 0.7 },
        ],
        bonds: [
          { from: "h1", to: "o", order: 1 },
          { from: "o", to: "h2", order: 1 },
        ],
      },
    ],
  },
});

const scienceOpticsEnvelope = fixture({
  id: "demo-science-optics",
  type: "science.optics",
  version,
  source: sampleSource,
  presentation: { title: "Convex lens ray construction" },
  payload: {
    axisY: 0,
    xDomain: [-8, 9],
    yDomain: [-5, 5],
    elements: [
      { id: "object", type: "source", x: -6, height: 4, label: "Object" },
      {
        id: "lens",
        type: "convex-lens",
        x: 0,
        height: 8,
        focalLength: 3,
        label: "Convex lens",
      },
      { id: "screen", type: "screen", x: 6, height: 6, label: "Image plane" },
    ],
    rays: [
      {
        id: "parallel",
        color: "#dc5f73",
        points: [
          { x: -6, y: 3 },
          { x: 0, y: 3 },
          { x: 6, y: -3 },
        ],
      },
      {
        id: "center",
        color: "#5b79ea",
        points: [
          { x: -6, y: 3 },
          { x: 0, y: 0 },
          { x: 6, y: -3 },
        ],
      },
      {
        id: "focus",
        color: "#168363",
        points: [
          { x: -6, y: 3 },
          { x: 0, y: -3 },
          { x: 6, y: -3 },
        ],
      },
    ],
  },
});

const engineeringCircuitEnvelope = fixture({
  id: "demo-engineering-circuit",
  type: "engineering.circuit",
  version,
  source: sampleSource,
  presentation: { title: "RC low-pass filter" },
  payload: {
    title: "First-order RC low-pass filter",
    nodes: [
      { id: "vin", x: 0, y: 4, label: "VIN" },
      { id: "n1", x: 4, y: 4, label: "VOUT" },
      { id: "g1", x: 4, y: 0, label: "GND" },
      { id: "g0", x: 0, y: 0 },
    ],
    components: [
      {
        id: "source",
        type: "source",
        from: "g0",
        to: "vin",
        label: "VS",
        value: "5 V",
      },
      {
        id: "resistor",
        type: "resistor",
        from: "vin",
        to: "n1",
        label: "R1",
        value: "1 kΩ",
      },
      {
        id: "capacitor",
        type: "capacitor",
        from: "n1",
        to: "g1",
        label: "C1",
        value: "100 nF",
      },
      { id: "return", type: "wire", from: "g1", to: "g0" },
    ],
  },
});

const engineeringWaveformEnvelope = fixture({
  id: "demo-engineering-waveform",
  type: "engineering.waveform",
  version,
  source: sampleSource,
  presentation: { title: "Oscilloscope capture" },
  payload: {
    timeUnit: "ms",
    channels: [
      {
        id: "input",
        label: "CH1 input",
        unit: "V",
        color: "#5b79ea",
        samples: Array.from({ length: 241 }, (_, index) => ({
          time: index / 24,
          value: 2.5 * Math.sin(index / 12),
        })),
      },
      {
        id: "output",
        label: "CH2 filtered",
        unit: "V",
        color: "#dc5f73",
        samples: Array.from({ length: 241 }, (_, index) => ({
          time: index / 24,
          value: 1.6 * Math.sin(index / 12 - 0.65),
        })),
      },
    ],
    cursors: [
      { time: 2.5, label: "Δt" },
      { time: 7.5, label: "T" },
    ],
  },
});

const engineeringTimingEnvelope = fixture({
  id: "demo-engineering-timing",
  type: "engineering.timing",
  version,
  source: sampleSource,
  presentation: { title: "SPI timing" },
  payload: {
    duration: 80,
    timeUnit: "ns",
    signals: [
      {
        id: "cs",
        label: "CS̅",
        initial: "1",
        transitions: [
          { time: 8, value: "0" },
          { time: 72, value: "1" },
        ],
      },
      {
        id: "clk",
        label: "SCLK",
        initial: "0",
        transitions: Array.from({ length: 16 }, (_, index) => ({
          time: 12 + index * 3.5,
          value: index % 2 ? ("0" as const) : ("1" as const),
        })),
      },
      {
        id: "mosi",
        label: "MOSI",
        initial: "x",
        transitions: [
          { time: 9, value: "1" },
          { time: 19, value: "0" },
          { time: 29, value: "1" },
          { time: 39, value: "1" },
          { time: 49, value: "0" },
          { time: 59, value: "1" },
          { time: 69, value: "x" },
        ],
      },
      {
        id: "miso",
        label: "MISO",
        initial: "z",
        transitions: [
          { time: 10, value: "0" },
          { time: 24, value: "1" },
          { time: 38, value: "0" },
          { time: 52, value: "1" },
          { time: 70, value: "z" },
        ],
      },
    ],
    markers: [
      { time: 8, label: "select" },
      { time: 72, label: "release" },
    ],
  },
});

const engineeringLogicEnvelope = fixture({
  id: "demo-engineering-logic",
  type: "engineering.logic",
  version,
  source: sampleSource,
  presentation: { title: "One-bit full adder" },
  payload: {
    inputs: [
      { id: "a", label: "A", x: 70, y: 90, value: 1 },
      { id: "b", label: "B", x: 70, y: 190, value: 0 },
      { id: "cin", label: "Cin", x: 70, y: 300, value: 1 },
    ],
    gates: [
      { id: "xor1", type: "xor", x: 245, y: 135, label: "X1" },
      { id: "xor2", type: "xor", x: 455, y: 170, label: "X2" },
      { id: "and1", type: "and", x: 250, y: 265, label: "A1" },
      { id: "and2", type: "and", x: 455, y: 285, label: "A2" },
      { id: "or1", type: "or", x: 615, y: 275, label: "OR" },
    ],
    outputs: [
      { id: "sum", label: "SUM", x: 705, y: 170, value: 0 },
      { id: "cout", label: "COUT", x: 705, y: 275, value: 1 },
    ],
    connections: [
      { from: "a", to: "xor1" },
      { from: "b", to: "xor1" },
      { from: "xor1", to: "xor2" },
      { from: "cin", to: "xor2" },
      { from: "xor2", to: "sum" },
      { from: "a", to: "and1" },
      { from: "b", to: "and1" },
      { from: "xor1", to: "and2" },
      { from: "cin", to: "and2" },
      { from: "and1", to: "or1" },
      { from: "and2", to: "or1" },
      { from: "or1", to: "cout" },
    ],
  },
});

const technicalCases = [
  [
    "math-plot",
    "Mathematical plot",
    "Sampled functions with coordinate axes and legend.",
    "Plot harmonic functions",
    mathPlotEnvelope,
  ],
  [
    "math-geometry",
    "Geometry construction",
    "Points, constraints, polygons and circumcircles.",
    "Construct a triangle circumcircle",
    mathGeometryEnvelope,
  ],
  [
    "math-matrix",
    "Matrix operation",
    "Multi-matrix operations with cell-level explanation.",
    "Explain a matrix multiplication",
    mathMatrixEnvelope,
  ],
  [
    "math-distribution",
    "Probability distribution",
    "Density curve, confidence region and moments.",
    "Show a standard normal distribution",
    mathDistributionEnvelope,
  ],
  [
    "math-number-line",
    "Number line",
    "Open and closed intervals with annotated points.",
    "Render an inequality on a number line",
    mathNumberLineEnvelope,
  ],
  [
    "map-places",
    "Places map",
    "Geocoded places with semantic metadata and popovers.",
    "Show science museums in Beijing",
    mapPlacesEnvelope,
  ],
  [
    "map-route",
    "Route map",
    "Mode, distance, duration, waypoints and path geometry.",
    "Show a museum walking route",
    mapRouteEnvelope,
  ],
  [
    "map-heatmap",
    "Spatial heatmap",
    "Weighted samples rendered as a geographic density field.",
    "Map an urban heat anomaly",
    mapHeatmapEnvelope,
  ],
  [
    "map-track",
    "Activity track",
    "Timestamped route samples with elevation and speed.",
    "Show a hiking activity track",
    mapTrackEnvelope,
  ],
  [
    "science-molecule",
    "Molecular structure",
    "Element-aware atoms and explicit bond orders.",
    "Render the benzene molecule",
    scienceMoleculeEnvelope,
  ],
  [
    "science-reaction",
    "Chemical reaction",
    "Balanced reactants, products and reaction conditions.",
    "Show methane combustion",
    scienceReactionEnvelope,
  ],
  [
    "science-optics",
    "Optics ray diagram",
    "Optical elements, principal axis and traced rays.",
    "Explain image formation through a convex lens",
    scienceOpticsEnvelope,
  ],
  [
    "engineering-circuit",
    "Circuit schematic",
    "Typed electrical components and connected nets.",
    "Draw an RC low-pass filter",
    engineeringCircuitEnvelope,
  ],
  [
    "engineering-waveform",
    "Engineering waveform",
    "Stacked sampled channels, units and cursors.",
    "Show an oscilloscope capture",
    engineeringWaveformEnvelope,
  ],
  [
    "engineering-timing",
    "Digital timing diagram",
    "Logic transitions, unknown states and markers.",
    "Render an SPI timing diagram",
    engineeringTimingEnvelope,
  ],
  [
    "engineering-logic",
    "Logic circuit",
    "Standard logic gates, nets and evaluated terminals.",
    "Draw a one-bit full adder",
    engineeringLogicEnvelope,
  ],
] as const;

export const technicalScenarios = technicalCases.map(
  ([id, title, description, prompt, envelope]) => ({
    id,
    title,
    description,
    category: "Technical" as const,
    prompt,
    envelope,
  }),
);
