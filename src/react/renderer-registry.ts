import {
  RendererRegistry,
  isKnownEnvelopeOf,
  type RendererDefinition,
  type RendererCapabilities,
} from "@/src/core";
import type { AnyRenderEnvelope, RenderType } from "@/src/schema";

type CapabilityEntry = RendererCapabilities & {
  displayName: string;
  group: string;
};

const capabilities: Record<RenderType, CapabilityEntry> = {
  "text.markdown": {
    displayName: "Streaming Markdown",
    group: "Text",
    mimeTypes: ["text/markdown"],
    extensions: ["md", "markdown"],
    streaming: true,
    export: ["md", "html"],
  },
  "text.code": {
    displayName: "Code",
    group: "Text",
    mimeTypes: ["text/plain", "text/x-typescript", "application/javascript"],
    extensions: ["ts", "tsx", "js", "jsx", "py", "css", "html"],
    editing: true,
    fullscreen: true,
    export: ["source"],
  },
  "text.math": {
    displayName: "Math",
    group: "Text",
    mimeTypes: ["text/x-tex"],
    extensions: ["tex"],
    export: ["tex"],
  },
  "data.table": {
    displayName: "Data Table",
    group: "Data",
    mimeTypes: ["text/csv", "text/tab-separated-values"],
    extensions: ["csv", "tsv"],
    editing: true,
    fullscreen: true,
    export: ["csv", "chart"],
  },
  "data.json": {
    displayName: "Structured Data",
    group: "Data",
    mimeTypes: [
      "application/json",
      "application/yaml",
      "application/xml",
      "text/xml",
      "text/plain",
    ],
    extensions: ["json", "yaml", "yml", "xml", "log"],
    editing: true,
    export: ["source"],
  },
  "chart.echarts": {
    displayName: "Apache ECharts",
    group: "Charts",
    mimeTypes: ["application/vnd.echarts+json"],
    extensions: ["echarts.json"],
    fullscreen: true,
    export: ["png", "svg"],
  },
  "chart.vega-lite": {
    displayName: "Vega-Lite",
    group: "Charts",
    mimeTypes: ["application/vnd.vegalite+json"],
    extensions: ["vl.json", "vega.json"],
    fullscreen: true,
    export: ["png", "svg"],
  },
  "diagram.mermaid": {
    displayName: "Mermaid",
    group: "Diagrams",
    mimeTypes: ["text/vnd.mermaid"],
    extensions: ["mmd", "mermaid"],
    fullscreen: true,
    export: ["svg", "png"],
  },
  "diagram.excalidraw": {
    displayName: "Excalidraw",
    group: "Diagrams",
    mimeTypes: ["application/vnd.excalidraw+json"],
    extensions: ["excalidraw"],
    editing: true,
    fullscreen: true,
    export: ["json", "png", "svg"],
  },
  "media.image": {
    displayName: "Image",
    group: "Media",
    mimeTypes: ["image/*"],
    extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"],
    editing: true,
    fullscreen: true,
    export: ["source"],
  },
  "media.audio": {
    displayName: "Audio",
    group: "Media",
    mimeTypes: ["audio/*"],
    extensions: ["mp3", "wav", "aac", "flac", "opus", "ogg"],
    streaming: true,
    export: ["source", "transcript"],
  },
  "media.video": {
    displayName: "Video",
    group: "Media",
    mimeTypes: ["video/*"],
    extensions: ["mp4", "webm"],
    streaming: true,
    fullscreen: true,
    export: ["source", "transcript"],
  },
  "audio.pronunciation": {
    displayName: "Pronunciation",
    group: "Media",
    mimeTypes: ["application/vnd.modelcanvas.pronunciation+json"],
    extensions: [],
    streaming: true,
    export: ["audio"],
  },
  "document.pdf": {
    displayName: "PDF",
    group: "Documents",
    mimeTypes: ["application/pdf"],
    extensions: ["pdf"],
    fullscreen: true,
    export: ["source", "text"],
  },
  "document.docx": {
    displayName: "DOCX",
    group: "Documents",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: ["docx"],
    fullscreen: true,
    export: ["source", "pdf"],
  },
  "document.spreadsheet": {
    displayName: "Spreadsheet",
    group: "Documents",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ],
    extensions: ["xlsx", "xls", "csv"],
    editing: true,
    fullscreen: true,
    export: ["source", "csv", "chart"],
  },
  "document.presentation": {
    displayName: "Presentation",
    group: "Documents",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    extensions: ["pptx", "ppt", "odp"],
    fullscreen: true,
    export: ["source", "pdf"],
  },
  "document.epub": {
    displayName: "EPUB",
    group: "Documents",
    mimeTypes: ["application/epub+zip"],
    extensions: ["epub"],
    fullscreen: true,
    export: ["source"],
  },
  "data.notebook": {
    displayName: "Notebook",
    group: "Documents",
    mimeTypes: ["application/x-ipynb+json"],
    extensions: ["ipynb"],
    editing: true,
    export: ["ipynb"],
  },
  "data.parquet": {
    displayName: "Parquet / Arrow",
    group: "Data",
    mimeTypes: [
      "application/vnd.apache.parquet",
      "application/vnd.apache.arrow.file",
    ],
    extensions: ["parquet", "arrow", "feather"],
    export: ["csv", "chart"],
  },
  "map.geo": {
    displayName: "Geo Map",
    group: "Spatial",
    mimeTypes: ["application/geo+json"],
    extensions: ["geojson"],
    fullscreen: true,
    export: ["geojson", "png"],
  },
  "model.3d": {
    displayName: "3D Model",
    group: "Spatial",
    mimeTypes: [
      "model/gltf+json",
      "model/gltf-binary",
      "model/obj",
      "model/stl",
      "model/ply",
    ],
    extensions: ["gltf", "glb", "obj", "stl", "ply"],
    fullscreen: true,
    export: ["source"],
  },
  "artifact.html": {
    displayName: "HTML Artifact",
    group: "Artifacts",
    mimeTypes: ["text/html"],
    extensions: ["html"],
    editing: true,
    fullscreen: true,
    export: ["html"],
  },
  "artifact.react": {
    displayName: "React Artifact",
    group: "Artifacts",
    mimeTypes: ["application/vnd.modelcanvas.react+json"],
    extensions: ["tsx", "jsx"],
    editing: true,
    fullscreen: true,
    export: ["zip"],
  },
  "artifact.python": {
    displayName: "Python Artifact",
    group: "Artifacts",
    mimeTypes: ["text/x-python"],
    extensions: ["py"],
    editing: true,
    fullscreen: true,
    export: ["py", "output"],
  },
  "widget.weather": {
    displayName: "Weather Widget",
    group: "Widgets",
    mimeTypes: ["application/vnd.modelcanvas.weather+json"],
    extensions: [],
    export: ["json"],
  },
  "widget.stock": {
    displayName: "Stock Widget",
    group: "Widgets",
    mimeTypes: ["application/vnd.modelcanvas.stock+json"],
    extensions: [],
    fullscreen: true,
    export: ["json", "png"],
  },
  "widget.sports": {
    displayName: "Sports Widget",
    group: "Widgets",
    mimeTypes: ["application/vnd.modelcanvas.sports+json"],
    extensions: [],
    export: ["json"],
  },
  "widget.travel": {
    displayName: "Travel Widget",
    group: "Widgets",
    mimeTypes: ["application/vnd.modelcanvas.travel+json"],
    extensions: [],
    export: ["json"],
  },
  "widget.product": {
    displayName: "Product Widget",
    group: "Widgets",
    mimeTypes: ["application/vnd.modelcanvas.product+json"],
    extensions: [],
    export: ["json"],
  },
  "widget.calendar": {
    displayName: "Calendar Widget",
    group: "Widgets",
    mimeTypes: ["application/vnd.modelcanvas.calendar+json"],
    extensions: [],
    editing: true,
    export: ["ics"],
  },
  "widget.email": {
    displayName: "Email Widget",
    group: "Widgets",
    mimeTypes: ["message/rfc822"],
    extensions: ["eml"],
    editing: true,
    export: ["eml"],
  },
  "widget.logistics": {
    displayName: "Logistics Widget",
    group: "Widgets",
    mimeTypes: ["application/vnd.modelcanvas.logistics+json"],
    extensions: [],
    export: ["json"],
  },
  "form.dynamic": {
    displayName: "Dynamic Form",
    group: "Declarative UI",
    mimeTypes: ["application/vnd.modelcanvas.form+json"],
    extensions: [],
    editing: true,
    export: ["json"],
  },
};

const fallback: RendererDefinition = {
  id: "modelcanvas.fallback",
  type: "*",
  version: "1.0.0",
  displayName: "Safe Fallback",
  priority: -10_000,
  supports: {},
  canRender: (_envelope: AnyRenderEnvelope): _envelope is AnyRenderEnvelope =>
    true,
  load: () => import("@/src/renderers/FallbackRenderer"),
};

export const rendererRegistry = new RendererRegistry(fallback);

function register(
  type: RenderType,
  load: RendererDefinition["load"],
  priority = 100,
) {
  const info = capabilities[type];
  rendererRegistry.register({
    id: `modelcanvas.${type}`,
    type,
    version: "1.0.0",
    displayName: info.displayName,
    priority,
    supports: info,
    canRender: (envelope): envelope is AnyRenderEnvelope =>
      isKnownEnvelopeOf(envelope, type),
    load,
  });
}

register("text.markdown", () => import("@/src/renderers/MarkdownRenderer"));
register("text.code", () => import("@/src/renderers/DataRenderer"));
register("text.math", () => import("@/src/renderers/DataRenderer"));
register("data.table", () => import("@/src/renderers/DataRenderer"));
register("data.json", () => import("@/src/renderers/DataRenderer"));
register("data.notebook", () => import("@/src/renderers/DataRenderer"));
register("data.parquet", () => import("@/src/renderers/DataRenderer"));
register("chart.echarts", () => import("@/src/renderers/ChartRenderer"));
register("chart.vega-lite", () => import("@/src/renderers/ChartRenderer"));
register("diagram.mermaid", () => import("@/src/renderers/MermaidRenderer"));
register(
  "diagram.excalidraw",
  () => import("@/src/renderers/ExcalidrawRenderer"),
);
register("media.image", () => import("@/src/renderers/MediaRenderer"));
register("media.audio", () => import("@/src/renderers/MediaRenderer"));
register("media.video", () => import("@/src/renderers/MediaRenderer"));
register("audio.pronunciation", () => import("@/src/renderers/MediaRenderer"));
register("document.pdf", () => import("@/src/renderers/DocumentRenderer"));
register("document.docx", () => import("@/src/renderers/DocumentRenderer"));
register(
  "document.spreadsheet",
  () => import("@/src/renderers/DocumentRenderer"),
);
register(
  "document.presentation",
  () => import("@/src/renderers/DocumentRenderer"),
);
register("document.epub", () => import("@/src/renderers/DocumentRenderer"));
register("map.geo", () => import("@/src/renderers/SpatialRenderer"));
register("model.3d", () => import("@/src/renderers/SpatialRenderer"));
register("artifact.html", () => import("@/src/renderers/ArtifactRenderer"));
register("artifact.react", () => import("@/src/renderers/ArtifactRenderer"));
register("artifact.python", () => import("@/src/renderers/ArtifactRenderer"));
register("widget.weather", () => import("@/src/renderers/WidgetRenderer"));
register("widget.stock", () => import("@/src/renderers/WidgetRenderer"));
register("widget.sports", () => import("@/src/renderers/WidgetRenderer"));
register("widget.travel", () => import("@/src/renderers/WidgetRenderer"));
register("widget.product", () => import("@/src/renderers/WidgetRenderer"));
register("widget.calendar", () => import("@/src/renderers/WidgetRenderer"));
register("widget.email", () => import("@/src/renderers/WidgetRenderer"));
register("widget.logistics", () => import("@/src/renderers/WidgetRenderer"));
register("form.dynamic", () => import("@/src/renderers/FormRenderer"));

export const rendererCapabilityCatalog = capabilities;
