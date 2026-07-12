import { parseRenderEnvelope } from "@/src/core";
import type { KnownRenderEnvelope, RenderEnvelopeInput } from "@/src/schema";

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  category:
    | "Start here"
    | "Charts"
    | "Media"
    | "Documents"
    | "Artifacts"
    | "Data & spatial";
  prompt: string;
  envelope: KnownRenderEnvelope;
}

const version = "1.0.0";
const sampleSource = {
  provider: "ModelCanvas Demo Provider",
  model: "fixture-v1",
  createdAt: "2026-07-11T00:00:00.000Z",
};

function fixture(input: RenderEnvelopeInput): KnownRenderEnvelope {
  const result = parseRenderEnvelope(input);
  if (!result.success || result.unknownType) {
    throw new Error(
      `Invalid built-in fixture: ${result.issues.map((issue) => `${issue.path} ${issue.message}`).join(", ")}`,
    );
  }
  return result.data as KnownRenderEnvelope;
}

const markdownEnvelope = fixture({
  id: "demo-markdown",
  type: "text.markdown",
  version,
  source: sampleSource,
  presentation: {
    title: "Streaming Markdown",
    description: "GFM, math, code and Mermaid in one safe stream.",
  },
  payload: {
    streaming: true,
    content: `# A renderer should explain itself

ModelCanvas validates every payload **before** a renderer loads.

> Rich output is useful only when its trust boundary is visible.

- [x] Schema validated
- [x] Lazy renderer selected
- [ ] Host privileges granted (never by default)

| Path | Isolation | Status |
|---|---|---|
| Controlled | React boundary | Ready |
| Declarative | Catalog allow-list | Ready |
| Artifact | Sandbox iframe / Worker | Isolated |

Inline math $E = mc^2$ and a block:

$$\\int_0^1 x^2 dx = \\frac{1}{3}$$

\`\`\`ts
const result = registry.resolve(envelope);
\`\`\`

\`\`\`mermaid
flowchart LR
  Model --> Validate --> Registry --> Render
  Validate -->|invalid| Fallback
\`\`\`
`,
  },
  fallback: {
    text: "ModelCanvas validates, resolves, and safely renders rich output.",
  },
});

const weatherEnvelope = fixture({
  id: "demo-weather",
  type: "widget.weather",
  version,
  source: sampleSource,
  presentation: { title: "Beijing · 7 day forecast", display: "panel" },
  payload: {
    location: "Beijing, China",
    temperature: 29,
    unit: "C",
    condition: "Partly cloudy",
    feelsLike: 31,
    humidity: 46,
    windSpeed: 12,
    precipitationProbability: 20,
    airQualityIndex: 58,
    hourly: [
      {
        time: "09:00",
        temperature: 25,
        precipitationProbability: 5,
        condition: "Sunny",
      },
      {
        time: "12:00",
        temperature: 29,
        precipitationProbability: 10,
        condition: "Sunny",
      },
      {
        time: "15:00",
        temperature: 31,
        precipitationProbability: 20,
        condition: "Cloudy",
      },
      {
        time: "18:00",
        temperature: 28,
        precipitationProbability: 15,
        condition: "Cloudy",
      },
      {
        time: "21:00",
        temperature: 24,
        precipitationProbability: 5,
        condition: "Clear",
      },
    ],
    daily: [
      {
        date: "Sat",
        high: 31,
        low: 22,
        condition: "Partly cloudy",
        precipitationProbability: 20,
      },
      {
        date: "Sun",
        high: 33,
        low: 23,
        condition: "Sunny",
        precipitationProbability: 10,
      },
      {
        date: "Mon",
        high: 32,
        low: 24,
        condition: "Cloudy",
        precipitationProbability: 30,
      },
      {
        date: "Tue",
        high: 28,
        low: 21,
        condition: "Rain",
        precipitationProbability: 70,
      },
      {
        date: "Wed",
        high: 29,
        low: 20,
        condition: "Clear",
        precipitationProbability: 10,
      },
      {
        date: "Thu",
        high: 30,
        low: 21,
        condition: "Sunny",
        precipitationProbability: 5,
      },
      {
        date: "Fri",
        high: 31,
        low: 22,
        condition: "Sunny",
        precipitationProbability: 5,
      },
    ],
    updatedAt: "2026-07-11 08:00 CST",
    provider: "Demo fixture · sample data",
  },
});

const stockCloses = [
  205.1, 205.7, 205.0, 204.6, 204.9, 204.7, 204.1, 203.7, 203.8, 203.5, 203.1,
  202.9, 203.2, 203.0, 203.8, 203.3, 203.6, 203.9, 203.7, 203.5, 203.3, 203.0,
  203.4, 203.6, 204.2, 204.4, 204.1, 204.5, 204.3, 204.7, 204.6, 204.4, 204.2,
  204.5, 204.2, 204.0, 204.3, 204.1, 203.9, 204.2, 204.4, 204.3, 204.2, 204.5,
  204.8, 204.9, 205.1, 205.4, 205.2, 205.6, 205.9, 206.2, 206.0, 206.4, 206.8,
  206.7, 206.9, 206.5, 206.1, 205.3, 205.2,
];
const stockSeries = stockCloses.map((close, index) => ({
  time: `${String(9 + Math.floor(index / 10)).padStart(2, "0")}:${String((index % 10) * 6).padStart(2, "0")}`,
  open: close + (index % 2 ? 0.08 : -0.06),
  high: close + 0.18,
  low: close - 0.16,
  close,
  volume: 180_000 + index * 7_300,
}));

const stockEnvelope = fixture({
  id: "demo-stock",
  type: "widget.stock",
  version,
  source: sampleSource,
  presentation: {
    title: "Apple Inc. (AAPL) · interface fixture",
    description: "Synthetic market data for interface demonstration.",
  },
  payload: {
    name: "Apple Inc.",
    symbol: "AAPL",
    price: 205.2,
    currency: "USD",
    change: -0.91,
    changePercent: -0.44,
    marketStatus: "closed",
    range: "1D",
    series: stockSeries,
    metrics: {
      Open: "$205.10",
      "Day low": "$202.90",
      "Day high": "$206.90",
      Volume: "12.6M",
      "Market cap": "$3.08T",
      "EPS (TTM)": "$6.43",
      "P/E (TTM)": "31.9",
      "52W low": "$164.08",
      "52W high": "$237.49",
    },
    updatedAt: "2026-07-10 close",
    provider: "Demo fixture · synthetic AAPL-like sample, not live market data",
  },
});

function chart(
  id: string,
  title: string,
  option: Record<string, import("@/src/schema").JsonValue>,
) {
  return fixture({
    id,
    type: "chart.echarts",
    version,
    source: sampleSource,
    presentation: { title },
    payload: { option, renderer: "canvas" },
  });
}

const barEnvelope = chart("demo-bar", "Quarterly revenue", {
  color: ["#5B8CFF"],
  tooltip: { trigger: "axis" },
  grid: { left: 42, right: 18, top: 28, bottom: 38 },
  xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
  yAxis: { type: "value" },
  series: [
    {
      type: "bar",
      data: [42, 61, 58, 79],
      barWidth: 28,
      itemStyle: { borderRadius: [7, 7, 0, 0] },
    },
  ],
});

const histogramEnvelope = chart("demo-histogram", "Latency distribution", {
  tooltip: { trigger: "axis" },
  xAxis: {
    type: "category",
    name: "ms",
    data: ["0–50", "50–100", "100–150", "150–200", "200–250", "250+"],
  },
  yAxis: { type: "value", name: "requests" },
  series: [
    {
      type: "bar",
      data: [8, 34, 71, 46, 21, 7],
      itemStyle: { color: "#8B5CF6" },
    },
  ],
});

const lineEnvelope = chart("demo-line", "Renderer load time", {
  tooltip: { trigger: "axis" },
  xAxis: {
    type: "category",
    data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  yAxis: { type: "value", name: "ms" },
  series: [
    {
      type: "line",
      smooth: true,
      areaStyle: { opacity: 0.12 },
      data: [184, 162, 149, 133, 121, 116, 108],
      itemStyle: { color: "#14B8A6" },
    },
  ],
});

const scatterEnvelope = chart("demo-scatter", "Payload size vs render time", {
  tooltip: {},
  xAxis: { type: "value", name: "KB" },
  yAxis: { type: "value", name: "ms" },
  series: [
    {
      type: "scatter",
      symbolSize: 11,
      data: [
        [12, 18],
        [34, 27],
        [55, 31],
        [72, 44],
        [110, 58],
        [160, 72],
        [210, 105],
      ],
      itemStyle: { color: "#F59E0B" },
    },
  ],
});

const flowEnvelope = fixture({
  id: "demo-flow",
  type: "diagram.mermaid",
  version,
  source: sampleSource,
  presentation: { title: "Order approval flow" },
  payload: {
    code: "flowchart LR\n  Request[Request] --> Validate{Valid?}\n  Validate -->|Yes| Approve[Approve]\n  Validate -->|No| Revise[Revise]\n  Revise --> Request\n  Approve --> Ship[Ship]",
  },
});

const sequenceEnvelope = fixture({
  id: "demo-sequence",
  type: "diagram.mermaid",
  version,
  source: sampleSource,
  presentation: { title: "Renderer resolution sequence" },
  payload: {
    code: "sequenceDiagram\n  participant M as Model\n  participant V as Validator\n  participant R as Registry\n  participant U as UI\n  M->>V: RenderEnvelope\n  V->>R: validated envelope\n  R-->>U: lazy renderer\n  U-->>M: component event",
  },
});

const timelineEnvelope = fixture({
  id: "demo-timeline",
  type: "diagram.mermaid",
  version,
  source: sampleSource,
  presentation: { title: "Project delivery timeline" },
  payload: {
    code: `timeline
  title ModelCanvas product delivery
  Week 1 : Requirements : Define outcomes : Collect examples
  Week 2 : Product design : Prototype core flows : Confirm architecture
  Weeks 3–4 : Core development : Frontend renderers : Protocol adapters
  Week 5 : Testing : Accessibility : Performance
  Week 6 : Launch preparation : Documentation : Release checklist
  After launch : Measure usage : Fix friction : Extend cases`,
  },
});

const pronunciationEnvelope = fixture({
  id: "demo-pronunciation",
  type: "audio.pronunciation",
  version,
  source: sampleSource,
  presentation: { title: "“你好” pronunciation and audio" },
  payload: {
    word: "你好",
    language: "Mandarin Chinese",
    ipaUS: "nǐ hǎo",
    ipaUK: "ni˨˩˦ xɑʊ˨˩˦",
    syllables: ["nǐ", "hǎo"],
    stressIndex: 0,
    definition:
      "“你好”读作 nǐ hǎo。实际口语中因三声变调，通常听起来接近 ní hǎo。",
    example: "你好，很高兴认识你。",
    accent: "us",
    speed: 0.8,
    audioUrl: "/fixtures/ni-hao.wav",
    ttsProvider:
      "macOS Ting-Ting fixture WAV · OpenAI MP3 available when configured",
  },
});

const audioEnvelope = fixture({
  id: "demo-audio",
  type: "media.audio",
  version,
  source: sampleSource,
  presentation: { title: "Design systems, in 12 seconds" },
  payload: {
    source: {
      url: "/fixtures/tone.wav",
      mimeType: "audio/wav",
      fileName: "modelcanvas-demo.wav",
    },
    waveform: true,
    transcript: [
      {
        id: "a1",
        start: 0,
        end: 3,
        text: "A protocol separates meaning from presentation.",
      },
      {
        id: "a2",
        start: 3,
        end: 6,
        text: "The registry selects a trusted renderer.",
      },
      {
        id: "a3",
        start: 6,
        end: 10,
        text: "Artifacts remain isolated from the host.",
      },
    ],
    regions: [
      { id: "r1", start: 3, end: 6, label: "Registry", color: "#5B8CFF" },
    ],
  },
});

const tableEnvelope = fixture({
  id: "demo-table",
  type: "data.table",
  version,
  source: sampleSource,
  presentation: { title: "CSV analysis · renderer performance" },
  payload: {
    sourceFormat: "csv",
    pageSize: 8,
    columns: [
      { key: "renderer", label: "Renderer", type: "string" },
      { key: "payloadKb", label: "Payload (KB)", type: "number" },
      { key: "renderMs", label: "Render (ms)", type: "number" },
      { key: "status", label: "Status", type: "string" },
    ],
    rows: [
      { renderer: "Markdown", payloadKb: 18, renderMs: 24, status: "ready" },
      { renderer: "ECharts", payloadKb: 42, renderMs: 71, status: "ready" },
      { renderer: "Mermaid", payloadKb: 8, renderMs: 83, status: "ready" },
      { renderer: "PDF", payloadKb: 820, renderMs: 146, status: "ready" },
      {
        renderer: "Spreadsheet",
        payloadKb: 112,
        renderMs: 94,
        status: "ready",
      },
      { renderer: "3D", payloadKb: 320, renderMs: 132, status: "ready" },
    ],
  },
});

const pdfEnvelope = fixture({
  id: "demo-pdf",
  type: "document.pdf",
  version,
  source: sampleSource,
  presentation: { title: "Protocol brief.pdf" },
  payload: {
    source: {
      url: "/fixtures/protocol-brief.pdf",
      mimeType: "application/pdf",
      fileName: "protocol-brief.pdf",
    },
  },
});
const docxEnvelope = fixture({
  id: "demo-docx",
  type: "document.docx",
  version,
  source: sampleSource,
  presentation: { title: "Product brief.docx" },
  payload: {
    source: {
      url: "/fixtures/product-brief.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName: "product-brief.docx",
    },
  },
});
const spreadsheetEnvelope = fixture({
  id: "demo-xlsx",
  type: "document.spreadsheet",
  version,
  source: sampleSource,
  presentation: { title: "Renderer metrics.xlsx" },
  payload: {
    source: {
      url: "/fixtures/renderer-metrics.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: "renderer-metrics.xlsx",
    },
    activeSheet: "Performance",
    sheets: [
      {
        name: "Performance",
        rows: [
          ["Renderer", "p50 ms", "p95 ms"],
          ["Markdown", 18, 31],
          ["ECharts", 62, 91],
          ["Mermaid", 74, 108],
        ],
      },
      {
        name: "Coverage",
        rows: [
          ["Category", "Demos"],
          ["Content", 8],
          ["Media", 4],
          ["Documents", 7],
          ["Artifacts", 3],
        ],
      },
    ],
  },
});
const presentationEnvelope = fixture({
  id: "demo-pptx",
  type: "document.presentation",
  version,
  source: sampleSource,
  presentation: { title: "ModelCanvas overview.pptx" },
  payload: {
    source: {
      url: "/fixtures/modelcanvas-overview.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      fileName: "modelcanvas-overview.pptx",
    },
  },
  fallback: {
    text: "Start the LibreOffice converter for high-fidelity PPTX preview.",
  },
});

const reactEnvelope = fixture({
  id: "demo-react",
  type: "artifact.react",
  version,
  source: sampleSource,
  presentation: { title: "React artifact · retention calculator" },
  security: {
    trusted: false,
    sandbox: true,
    allowScripts: true,
    allowNetwork: false,
    allowedOrigins: [],
  },
  payload: {
    entry: "/App.tsx",
    files: {
      "/App.tsx": `import { useState } from 'react';\nexport default function App(){const [users,setUsers]=useState(12000);const retained=Math.round(users*.68);return <main><p className="eyebrow">Interactive artifact</p><h1>{retained.toLocaleString()}</h1><p>retained users after 30 days</p><input aria-label="Starting users" type="range" min="1000" max="30000" value={users} onChange={e=>setUsers(+e.target.value)}/><strong>{users.toLocaleString()} starting users</strong></main>}`,
      "/styles.css":
        "body{font-family:Inter,system-ui;background:#0d1323;color:#eef2ff;padding:24px}main{max-width:420px;margin:auto;padding:28px;border:1px solid #29344e;border-radius:20px;background:#131c31}h1{font-size:56px;margin:8px 0;color:#8fb3ff}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:12px}input{width:100%;margin:28px 0 12px}",
    },
    dependencies: {},
    timeoutMs: 10_000,
  },
});

const htmlEnvelope = fixture({
  id: "demo-html",
  type: "artifact.html",
  version,
  source: sampleSource,
  presentation: { title: "HTML artifact · focus timer" },
  security: {
    trusted: false,
    sandbox: true,
    allowScripts: true,
    allowNetwork: false,
    allowedOrigins: [],
  },
  payload: {
    allowedOrigins: [],
    timeoutMs: 5_000,
    html: `<style>body{font-family:system-ui;background:#101528;color:#fff;display:grid;place-items:center;min-height:300px;margin:0}.timer{text-align:center;padding:32px;border:1px solid #2d385c;border-radius:24px;background:#171f37}.time{font-size:64px;font-weight:700;color:#9db8ff}button{border:0;border-radius:999px;padding:10px 18px;background:#5b8cff;color:#fff}</style><div class="timer"><p>FOCUS SESSION</p><div class="time" id="time">05:00</div><button onclick="document.getElementById('time').textContent='04:59';console.log('timer started')">Start</button></div>`,
  },
});

const pythonEnvelope = fixture({
  id: "demo-python",
  type: "artifact.python",
  version,
  source: sampleSource,
  presentation: { title: "Python · pandas + Matplotlib" },
  security: {
    trusted: false,
    sandbox: true,
    allowScripts: true,
    allowNetwork: false,
    allowedOrigins: [],
  },
  payload: {
    code: "import pandas as pd\nimport matplotlib.pyplot as plt\ndf = pd.DataFrame({'renderer':['Markdown','Charts','Docs','Artifacts'], 'coverage':[98,94,82,76]})\nprint(df.to_string(index=False))\ndf.plot.bar(x='renderer', y='coverage', color='#5B8CFF')\nplt.tight_layout()\nplt.show()",
    packages: ["pandas", "matplotlib"],
    timeoutMs: 10_000,
    fixtureOutput: {
      stdout:
        " renderer  coverage\n Markdown        98\n   Charts        94\n     Docs        82\nArtifacts        76",
      table: {
        columns: [
          { key: "renderer", label: "Renderer", type: "string" },
          { key: "coverage", label: "Coverage", type: "percent" },
        ],
        rows: [
          { renderer: "Markdown", coverage: 98 },
          { renderer: "Charts", coverage: 94 },
          { renderer: "Docs", coverage: 82 },
          { renderer: "Artifacts", coverage: 76 },
        ],
        sourceFormat: "json",
        pageSize: 10,
      },
    },
  },
});

const mapEnvelope = fixture({
  id: "demo-map",
  type: "map.geo",
  version,
  source: sampleSource,
  presentation: { title: "Beijing cultural route" },
  payload: {
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [116.397, 39.916] },
          properties: { name: "Forbidden City", kind: "landmark" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [116.383, 39.941] },
          properties: { name: "Shichahai", kind: "lake" },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [116.397, 39.916],
              [116.391, 39.928],
              [116.383, 39.941],
            ],
          },
          properties: { name: "Walking route" },
        },
      ],
    },
  },
});

const modelEnvelope = fixture({
  id: "demo-3d",
  type: "model.3d",
  version,
  source: sampleSource,
  presentation: { title: "3D model · octahedron" },
  payload: {
    source: {
      url: "/fixtures/octahedron.stl",
      mimeType: "model/stl",
      fileName: "octahedron.stl",
    },
    format: "stl",
    background: "#0b1020",
    wireframe: false,
  },
});

const formEnvelope = fixture({
  id: "demo-form",
  type: "form.dynamic",
  version,
  source: sampleSource,
  presentation: { title: "Renderer request" },
  payload: {
    title: "Request a custom renderer",
    description:
      "This declaration can only use fields in the controlled catalog.",
    confirmation: true,
    submitLabel: "Submit request",
    steps: [
      {
        id: "details",
        title: "Details",
        fields: [
          {
            id: "name",
            kind: "text",
            label: "Renderer name",
            required: true,
            placeholder: "e.g. CAD preview",
          },
          {
            id: "format",
            kind: "select",
            label: "Primary format",
            required: true,
            options: [
              { label: "Text", value: "text" },
              { label: "Data", value: "data" },
              { label: "Binary file", value: "binary" },
            ],
          },
        ],
      },
      {
        id: "policy",
        title: "Runtime policy",
        fields: [
          {
            id: "network",
            kind: "switch",
            label: "Requires allow-listed network access",
            defaultValue: false,
          },
          {
            id: "priority",
            kind: "slider",
            label: "Priority",
            min: 1,
            max: 10,
            step: 1,
            defaultValue: 5,
          },
        ],
      },
    ],
  },
});

const jsonEnvelope = fixture({
  id: "demo-json",
  type: "data.json",
  version,
  source: sampleSource,
  presentation: { title: "RenderEnvelope tree" },
  payload: {
    format: "json",
    data: {
      id: "weather-bj",
      type: "widget.weather",
      version: "1.0.0",
      payload: { location: "Beijing", temperature: 29 },
      security: { trusted: false, sandbox: true },
      tags: ["fixture", "validated", "offline"],
    },
  },
});

const notebookEnvelope = fixture({
  id: "demo-notebook",
  type: "data.notebook",
  version,
  source: sampleSource,
  presentation: { title: "Analysis.ipynb" },
  payload: {
    metadata: { kernelspec: { language: "python", name: "python3" } },
    cells: [
      {
        id: "n1",
        cellType: "markdown",
        source:
          "## Renderer latency\nA deterministic notebook fixture with safe MIME output.",
      },
      {
        id: "n2",
        cellType: "code",
        source:
          "latency = {'Markdown': 18, 'ECharts': 62, 'PDF': 146}\nlatency",
        language: "python",
        executionCount: 1,
        outputs: [
          {
            outputType: "execute_result",
            data: {
              "text/plain": "{'Markdown': 18, 'ECharts': 62, 'PDF': 146}",
            },
          },
        ],
      },
      {
        id: "n3",
        cellType: "code",
        source:
          "assert all(value < 200 for value in latency.values())\nprint('budget passed')",
        language: "python",
        executionCount: 2,
        outputs: [
          { outputType: "stream", name: "stdout", text: "budget passed\n" },
        ],
      },
    ],
  },
});

const comparisonEnvelope = fixture({
  id: "demo-image-compare",
  type: "media.image",
  version,
  source: sampleSource,
  presentation: { title: "Image comparison" },
  payload: {
    source: {
      url: "/fixtures/before.png",
      mimeType: "image/png",
      fileName: "before.png",
    },
    comparisonSource: {
      url: "/fixtures/after.png",
      mimeType: "image/png",
      fileName: "after.png",
    },
    alt: "Before and after comparison of a renderer interface",
    width: 1200,
    height: 700,
    overlays: [
      {
        id: "safe-zone",
        label: "Artifact boundary",
        x: 0.58,
        y: 0.22,
        width: 0.28,
        height: 0.56,
        color: "#5B8CFF",
      },
    ],
  },
});

const videoEnvelope = fixture({
  id: "demo-video",
  type: "media.video",
  version,
  source: sampleSource,
  presentation: { title: "Renderer walkthrough" },
  payload: {
    source: {
      url: "/fixtures/walkthrough.webm",
      mimeType: "video/webm",
      fileName: "walkthrough.webm",
    },
    poster: "/fixtures/video-poster.png",
    chapters: [
      { id: "v1", start: 0, end: 3, text: "Validate" },
      { id: "v2", start: 3, end: 6, text: "Resolve" },
      { id: "v3", start: 6, end: 9, text: "Render" },
    ],
    transcript: [
      { id: "vt1", start: 0, end: 3, text: "First, validate the envelope." },
      {
        id: "vt2",
        start: 3,
        end: 6,
        text: "Then resolve a compatible renderer.",
      },
      {
        id: "vt3",
        start: 6,
        end: 9,
        text: "Finally, render inside the correct boundary.",
      },
    ],
  },
});

const codeEnvelope = fixture({
  id: "demo-code",
  type: "text.code",
  version,
  source: sampleSource,
  presentation: { title: "Typed renderer plugin" },
  payload: {
    code: "export const renderer = {\n  type: 'widget.example',\n  version: '1.0.0',\n  load: () => import('./ExampleRenderer'),\n};",
    language: "typescript",
    fileName: "example-renderer.ts",
    editable: true,
    wrap: false,
  },
});

const mathEnvelope = fixture({
  id: "demo-math",
  type: "text.math",
  version,
  source: sampleSource,
  presentation: { title: "Aligned rendering budget" },
  payload: {
    latex:
      "\\begin{aligned} T_{total} &= T_{validate}+T_{load}+T_{paint} \\\\ P_{95} &< 200\\,\\mathrm{ms} \\end{aligned}",
    display: "block",
  },
});

const vegaEnvelope = fixture({
  id: "demo-vega",
  type: "chart.vega-lite",
  version,
  source: sampleSource,
  presentation: { title: "Renderer latency · Vega-Lite" },
  payload: {
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      width: "container",
      mark: { type: "bar", cornerRadiusTopLeft: 5, cornerRadiusTopRight: 5 },
      data: {
        values: [
          { renderer: "Markdown", ms: 18 },
          { renderer: "ECharts", ms: 62 },
          { renderer: "Mermaid", ms: 74 },
          { renderer: "PDF", ms: 146 },
        ],
      },
      encoding: {
        x: { field: "renderer", type: "nominal", sort: null },
        y: { field: "ms", type: "quantitative", title: "p50 (ms)" },
        tooltip: [
          { field: "renderer", type: "nominal" },
          { field: "ms", type: "quantitative" },
        ],
      },
    },
  },
});

const excalidrawEnvelope = fixture({
  id: "demo-excalidraw",
  type: "diagram.excalidraw",
  version,
  source: sampleSource,
  presentation: { title: "Editable trust boundary" },
  payload: {
    editable: true,
    elements: [
      {
        id: "boundary",
        type: "rectangle",
        x: 80,
        y: 70,
        width: 360,
        height: 180,
        angle: 0,
        strokeColor: "#5b8cff",
        backgroundColor: "#e7efff",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        index: "a0",
        roundness: { type: 3 },
        seed: 101,
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
      },
      {
        id: "label",
        type: "text",
        x: 142,
        y: 142,
        width: 235,
        height: 50,
        angle: 0,
        strokeColor: "#17213a",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        index: "a1",
        roundness: null,
        seed: 102,
        version: 1,
        versionNonce: 2,
        isDeleted: false,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        text: "Sandbox boundary",
        fontSize: 28,
        fontFamily: 5,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: null,
        originalText: "Sandbox boundary",
        autoResize: true,
        lineHeight: 1.25,
      },
    ],
    appState: { viewBackgroundColor: "#f8faff" },
    files: {},
  },
});

const parquetEnvelope = fixture({
  id: "demo-parquet",
  type: "data.parquet",
  version,
  source: sampleSource,
  presentation: { title: "Telemetry.parquet" },
  payload: {
    columns: [
      { name: "renderer", type: "UTF8" },
      { name: "payload_kb", type: "DOUBLE" },
      { name: "render_ms", type: "INT64" },
    ],
    rowCount: 250000,
    preview: [
      { renderer: "Markdown", payload_kb: 18, render_ms: 24 },
      { renderer: "ECharts", payload_kb: 42, render_ms: 71 },
      { renderer: "PDF", payload_kb: 820, render_ms: 146 },
    ],
  },
});

const epubEnvelope = fixture({
  id: "demo-epub",
  type: "document.epub",
  version,
  source: sampleSource,
  presentation: { title: "ModelCanvas reading fixture.epub" },
  payload: {
    source: {
      url: "/fixtures/modelcanvas-brief.epub",
      mimeType: "application/epub+zip",
      fileName: "modelcanvas-brief.epub",
    },
  },
});

const rawScenarios = [
  [
    "code",
    "Code editor",
    "Search, line numbers, wrapping, copy and edit mode.",
    "Start here",
    "Show an editable TypeScript renderer",
    codeEnvelope,
  ],
  [
    "math",
    "Math formula",
    "KaTeX rendering with strict error handling.",
    "Start here",
    "Render an aligned performance formula",
    mathEnvelope,
  ],
  [
    "markdown",
    "Rich streaming Markdown",
    "GFM, code, math and a Mermaid fence.",
    "Start here",
    "Show a Markdown explanation of the render pipeline",
    markdownEnvelope,
  ],
  [
    "weather",
    "Beijing · 7 day weather",
    "Controlled weather widget with labeled fixture data.",
    "Start here",
    "Show Beijing's seven-day weather forecast",
    weatherEnvelope,
  ],
  [
    "stock",
    "Stock trend + candlesticks",
    "Synthetic quote, history and market metrics.",
    "Start here",
    "Show Apple's weekly stock trend using sample data",
    stockEnvelope,
  ],
  [
    "bar",
    "Bar chart",
    "Quarterly revenue with exportable ECharts output.",
    "Charts",
    "Create a bar chart",
    barEnvelope,
  ],
  [
    "vega",
    "Vega-Lite chart",
    "Validated responsive Vega-Lite specification.",
    "Charts",
    "Create a Vega-Lite latency chart",
    vegaEnvelope,
  ],
  [
    "excalidraw",
    "Excalidraw canvas",
    "Editable JSON drawing with export controls.",
    "Charts",
    "Show an editable Excalidraw trust boundary",
    excalidrawEnvelope,
  ],
  [
    "histogram",
    "Histogram",
    "Latency distribution with safe data-only config.",
    "Charts",
    "Create a histogram",
    histogramEnvelope,
  ],
  [
    "line",
    "Line chart",
    "Seven-day renderer load-time trend.",
    "Charts",
    "Create a line chart",
    lineEnvelope,
  ],
  [
    "scatter",
    "Scatter plot",
    "Payload size versus render time.",
    "Charts",
    "Create a scatter plot",
    scatterEnvelope,
  ],
  [
    "flow",
    "Mermaid business flow",
    "Strict-mode flowchart with export controls.",
    "Charts",
    "Create a Mermaid business process",
    flowEnvelope,
  ],
  [
    "sequence",
    "Mermaid sequence",
    "Model-to-renderer event sequence.",
    "Charts",
    "Create a Mermaid sequence diagram",
    sequenceEnvelope,
  ],
  [
    "timeline",
    "Mermaid project timeline",
    "Editable timeline with preview, source, export and fullscreen controls.",
    "Charts",
    "Create a project delivery timeline",
    timelineEnvelope,
  ],
  [
    "pronunciation",
    "Pronounce “你好” + audio",
    "Pinyin, tones, local WAV playback and optional provider MP3.",
    "Media",
    "How do you pronounce “你好”? Provide downloadable audio",
    pronunciationEnvelope,
  ],
  [
    "audio",
    "Audio + transcript",
    "Waveform, regions and timestamped transcript.",
    "Media",
    "Show an audio player with transcript",
    audioEnvelope,
  ],
  [
    "table",
    "CSV analysis",
    "Searchable, sortable data with chart conversion.",
    "Data & spatial",
    "Analyze this CSV and make a chart",
    tableEnvelope,
  ],
  [
    "pdf",
    "PDF preview",
    "Page navigation, zoom, text and download.",
    "Documents",
    "Preview a PDF",
    pdfEnvelope,
  ],
  [
    "docx",
    "DOCX preview",
    "Browser-native document rendering with fallback.",
    "Documents",
    "Preview a DOCX",
    docxEnvelope,
  ],
  [
    "xlsx",
    "Spreadsheet · multi sheet",
    "Two-sheet workbook with search and chart handoff.",
    "Documents",
    "Preview a multi-sheet XLSX",
    spreadsheetEnvelope,
  ],
  [
    "pptx",
    "Presentation conversion",
    "LibreOffice conversion service and explicit fallback.",
    "Documents",
    "Preview a PPTX",
    presentationEnvelope,
  ],
  [
    "react",
    "React artifact",
    "Interactive code inside an allow-listed sandbox.",
    "Artifacts",
    "Build an interactive React calculator",
    reactEnvelope,
  ],
  [
    "html",
    "HTML artifact",
    "Single-file artifact with no network and console capture.",
    "Artifacts",
    "Build a focus timer in HTML",
    htmlEnvelope,
  ],
  [
    "python",
    "Python artifact",
    "Pyodide Worker with pandas and Matplotlib fixture output.",
    "Artifacts",
    "Analyze data with pandas and Matplotlib",
    pythonEnvelope,
  ],
  [
    "map",
    "GeoJSON map",
    "Points, route and data-driven layer controls.",
    "Data & spatial",
    "Show a GeoJSON route in Beijing",
    mapEnvelope,
  ],
  [
    "3d",
    "3D model",
    "STL viewer with orbit, wireframe and resource cleanup.",
    "Data & spatial",
    "Show a 3D STL model",
    modelEnvelope,
  ],
  [
    "form",
    "Dynamic form",
    "Allow-listed fields, wizard validation and confirmation.",
    "Start here",
    "Create a renderer request form",
    formEnvelope,
  ],
  [
    "json",
    "JSON tree",
    "Search, folding, paths and raw/tree modes.",
    "Data & spatial",
    "Inspect this RenderEnvelope JSON",
    jsonEnvelope,
  ],
  [
    "parquet",
    "Parquet metadata",
    "Schema, row count and bounded preview.",
    "Data & spatial",
    "Preview Parquet metadata",
    parquetEnvelope,
  ],
  [
    "notebook",
    "Jupyter Notebook",
    "Markdown, code, stream and MIME output cells.",
    "Documents",
    "Preview a Jupyter notebook",
    notebookEnvelope,
  ],
  [
    "epub",
    "EPUB reader",
    "Contents, chapter navigation, font size and reading progress.",
    "Documents",
    "Read a local EPUB fixture",
    epubEnvelope,
  ],
  [
    "compare",
    "Image comparison",
    "Before/after slider and annotation overlay.",
    "Media",
    "Compare these two images",
    comparisonEnvelope,
  ],
  [
    "video",
    "Video + subtitles",
    "Chapters, transcript and timestamp jumps.",
    "Media",
    "Show a video with subtitles",
    videoEnvelope,
  ],
] as const;

export const demoScenarios: DemoScenario[] = rawScenarios.map(
  ([id, title, description, category, prompt, envelope]) => ({
    id,
    title,
    description,
    category,
    prompt,
    envelope,
  }),
);

export const defaultScenario =
  demoScenarios.find((scenario) => scenario.id === "weather") ??
  demoScenarios[0]!;

export function findScenario(query: string): DemoScenario {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return defaultScenario;
  return (
    demoScenarios.find(
      (scenario) =>
        scenario.title.toLowerCase().includes(normalized) ||
        scenario.description.toLowerCase().includes(normalized) ||
        scenario.prompt.toLowerCase().includes(normalized) ||
        normalized.includes(scenario.id),
    ) ??
    (normalized.includes("weather") || normalized.includes("天气")
      ? demoScenarios.find((scenario) => scenario.id === "weather")
      : normalized.includes("stock") || normalized.includes("股票")
        ? demoScenarios.find((scenario) => scenario.id === "stock")
        : normalized.includes("pronoun") ||
            normalized.includes("ephemeral") ||
            normalized.includes("发音")
          ? demoScenarios.find((scenario) => scenario.id === "pronunciation")
          : normalized.includes("mermaid") || normalized.includes("diagram")
            ? demoScenarios.find((scenario) => scenario.id === "flow")
            : normalized.includes("chart") || normalized.includes("图表")
              ? demoScenarios.find((scenario) => scenario.id === "bar")
              : undefined) ??
    defaultScenario
  );
}
