# ModelCanvas

[中文文档](./README.zh-CN.md)

ModelCanvas is a protocol-driven rendering bridge for rich model output. A model or tool emits a versioned `RenderEnvelope`; the host validates it, resolves a compatible renderer, and renders it inside an appropriate trust boundary.

ModelCanvas 是一个面向模型富输出的协议化渲染桥。模型或工具只需返回带版本的 `RenderEnvelope`；宿主负责校验、选择兼容渲染器，并在正确的安全边界内呈现结果。

## Rendered case gallery

These are screenshots from the running ModelCanvas frontend—not design mockups. Every case is backed by a validated fixture, and sample data is visibly labeled. Run the app and append `&case=1` to any scenario URL for the focused, ChatGPT-style result view.

### All 34 RenderEnvelope types

<details open>
<summary><strong>Text, structured data, charts and diagrams</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/text.markdown.png" alt="Markdown renderer"><br><code>text.markdown</code></td><td width="50%"><img src="docs/images/cases/text.code.png" alt="Code renderer"><br><code>text.code</code></td></tr>
  <tr><td><img src="docs/images/cases/text.math.png" alt="Math renderer"><br><code>text.math</code></td><td><img src="docs/images/cases/data.table.png" alt="Table renderer"><br><code>data.table</code></td></tr>
  <tr><td><img src="docs/images/cases/data.json.png" alt="JSON renderer"><br><code>data.json</code></td><td><img src="docs/images/cases/chart.echarts.png" alt="ECharts renderer"><br><code>chart.echarts</code></td></tr>
  <tr><td><img src="docs/images/cases/chart.vega-lite.png" alt="Vega-Lite renderer"><br><code>chart.vega-lite</code></td><td><img src="docs/images/cases/diagram.mermaid.png" alt="Mermaid renderer"><br><code>diagram.mermaid</code></td></tr>
  <tr><td><img src="docs/images/cases/diagram.excalidraw.png" alt="Excalidraw renderer"><br><code>diagram.excalidraw</code></td><td></td></tr>
</table>
</details>

<details>
<summary><strong>Media and documents</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/media.image.png" alt="Image renderer"><br><code>media.image</code></td><td width="50%"><img src="docs/images/cases/media.audio.png" alt="Audio renderer"><br><code>media.audio</code></td></tr>
  <tr><td><img src="docs/images/cases/media.video.png" alt="Video renderer"><br><code>media.video</code></td><td><img src="docs/images/cases/audio.pronunciation.png" alt="Pronunciation renderer"><br><code>audio.pronunciation</code></td></tr>
  <tr><td><img src="docs/images/cases/document.pdf.png" alt="PDF renderer"><br><code>document.pdf</code></td><td><img src="docs/images/cases/document.docx.png" alt="DOCX renderer"><br><code>document.docx</code></td></tr>
  <tr><td><img src="docs/images/cases/document.spreadsheet.png" alt="Spreadsheet renderer"><br><code>document.spreadsheet</code></td><td><img src="docs/images/cases/document.presentation.png" alt="Presentation renderer"><br><code>document.presentation</code></td></tr>
  <tr><td><img src="docs/images/cases/document.epub.png" alt="EPUB renderer"><br><code>document.epub</code></td><td></td></tr>
</table>
</details>

<details>
<summary><strong>Notebook, spatial and open-ended artifacts</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/data.notebook.png" alt="Notebook renderer"><br><code>data.notebook</code></td><td width="50%"><img src="docs/images/cases/data.parquet.png" alt="Parquet renderer"><br><code>data.parquet</code></td></tr>
  <tr><td><img src="docs/images/cases/map.geo.png" alt="GeoJSON map renderer"><br><code>map.geo</code></td><td><img src="docs/images/cases/model.3d.png" alt="3D model renderer"><br><code>model.3d</code></td></tr>
  <tr><td><img src="docs/images/cases/artifact.html.png" alt="HTML artifact renderer"><br><code>artifact.html</code></td><td><img src="docs/images/cases/artifact.react.png" alt="React artifact renderer"><br><code>artifact.react</code></td></tr>
  <tr><td><img src="docs/images/cases/artifact.python.png" alt="Python artifact renderer"><br><code>artifact.python</code></td><td><img src="docs/images/cases/form.dynamic.png" alt="Dynamic form renderer"><br><code>form.dynamic</code></td></tr>
</table>
</details>

<details>
<summary><strong>Controlled business widgets</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/widget.weather.png" alt="Weather widget"><br><code>widget.weather</code></td><td width="50%"><img src="docs/images/cases/widget.stock.png" alt="Stock widget"><br><code>widget.stock</code></td></tr>
  <tr><td><img src="docs/images/cases/widget.sports.png" alt="Sports widget"><br><code>widget.sports</code></td><td><img src="docs/images/cases/widget.travel.png" alt="Travel widget"><br><code>widget.travel</code></td></tr>
  <tr><td><img src="docs/images/cases/widget.product.png" alt="Product widget"><br><code>widget.product</code></td><td><img src="docs/images/cases/widget.calendar.png" alt="Calendar widget"><br><code>widget.calendar</code></td></tr>
  <tr><td><img src="docs/images/cases/widget.email.png" alt="Email widget"><br><code>widget.email</code></td><td><img src="docs/images/cases/widget.logistics.png" alt="Logistics widget"><br><code>widget.logistics</code></td></tr>
</table>
</details>

## What is included

- Three output paths: controlled widgets, declarative renderer catalog, and sandboxed open artifacts.
- 34 exact Zod envelope variants and a registry with version, MIME, extension, priority, override, lazy-load, and fallback support.
- 39 deterministic offline scenarios covering all 34 protocol variants across text, charts, diagrams, data, media, documents, maps, 3D, forms, widgets, and code artifacts.
- A self-hosted React/TypeScript artifact runtime that compiles in an opaque, network-disabled iframe without a remote bundler.
- Playground, protocol inspector, and renderer gallery.
- MCP Apps, AG-UI, A2UI, OpenAI Apps, and Vercel AI SDK adapters.
- OpenAI-compatible and Anthropic provider interfaces with server-only credentials.
- Browser-native PDF/DOCX/XLSX/EPUB previews and an optional hardened LibreOffice conversion service.
- Vitest, Testing Library, Playwright, axe, CI, and generated real fixture files.

## Quick start

Requires Node.js 22.13+ (Node 24 recommended).

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Fixture mode works without credentials or network calls.

```bash
npm run typecheck
npm run lint -- --quiet
npm test
npm run test:e2e -- --project=chromium
npm run build
```

To enable presentation conversion:

```bash
docker compose up --build office-converter
cp .env.example .env.local
```

## Minimal envelope

```json
{
  "id": "hello",
  "type": "text.markdown",
  "version": "1.0.0",
  "payload": {
    "content": "# Hello ModelCanvas",
    "streaming": false
  }
}
```

See [protocol](docs/protocol.md), [architecture](docs/architecture.md), [renderer development](docs/renderer-development.md), [integrations](docs/integrations.md), [security](docs/security.md), and [deployment](docs/deployment.md).

## Important boundaries

- Demo data is explicitly labeled and deterministic.
- HTML and React run in sandboxed iframes without same-origin access; React uses a self-hosted TypeScript compiler and an offline dependency allowlist; Python runs in a terminable Worker.
- Unknown or invalid output never masquerades as a successful rich render.
- Provider keys remain server-side. Do not place secrets in any `NEXT_PUBLIC_*` variable.

Licensed under MIT. Third-party dependencies retain their respective licenses; see [references](docs/references.md).
