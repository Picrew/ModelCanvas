# ModelCanvas

[English Documentation](./README.md)

ModelCanvas 是一个面向大模型富内容输出的通用渲染协议、Renderer Registry、组件库与交互式 Playground。模型或工具输出带版本的 `RenderEnvelope`，宿主完成校验、迁移、Renderer 解析和安全隔离。

![ModelCanvas social preview](./public/og.png)

## 运行案例图库

以下截图全部来自正在运行的 ModelCanvas 前端，不是设计稿。每个案例都有通过 Schema 校验的 fixture，并会明确标注示例数据。运行应用后，在任意场景 URL 后添加 `&case=1`，即可打开聚焦的 ChatGPT 风格结果视图。

### 全部 34 种 RenderEnvelope 类型

<details open>
<summary><strong>文本、结构化数据、图表与图示</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/text.markdown.png" alt="Markdown 渲染器"><br><code>text.markdown</code></td><td width="50%"><img src="docs/images/cases/text.code.png" alt="代码渲染器"><br><code>text.code</code></td></tr>
  <tr><td><img src="docs/images/cases/text.math.png" alt="数学公式渲染器"><br><code>text.math</code></td><td><img src="docs/images/cases/data.table.png" alt="表格渲染器"><br><code>data.table</code></td></tr>
  <tr><td><img src="docs/images/cases/data.json.png" alt="JSON 渲染器"><br><code>data.json</code></td><td><img src="docs/images/cases/chart.echarts.png" alt="ECharts 渲染器"><br><code>chart.echarts</code></td></tr>
  <tr><td><img src="docs/images/cases/chart.vega-lite.png" alt="Vega-Lite 渲染器"><br><code>chart.vega-lite</code></td><td><img src="docs/images/cases/diagram.mermaid.png" alt="Mermaid 渲染器"><br><code>diagram.mermaid</code></td></tr>
  <tr><td><img src="docs/images/cases/diagram.excalidraw.png" alt="Excalidraw 渲染器"><br><code>diagram.excalidraw</code></td><td></td></tr>
</table>
</details>

<details>
<summary><strong>媒体与文档</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/media.image.png" alt="图片渲染器"><br><code>media.image</code></td><td width="50%"><img src="docs/images/cases/media.audio.png" alt="音频渲染器"><br><code>media.audio</code></td></tr>
  <tr><td><img src="docs/images/cases/media.video.png" alt="视频渲染器"><br><code>media.video</code></td><td><img src="docs/images/cases/audio.pronunciation.png" alt="发音渲染器"><br><code>audio.pronunciation</code></td></tr>
  <tr><td><img src="docs/images/cases/document.pdf.png" alt="PDF 渲染器"><br><code>document.pdf</code></td><td><img src="docs/images/cases/document.docx.png" alt="DOCX 渲染器"><br><code>document.docx</code></td></tr>
  <tr><td><img src="docs/images/cases/document.spreadsheet.png" alt="电子表格渲染器"><br><code>document.spreadsheet</code></td><td><img src="docs/images/cases/document.presentation.png" alt="演示文稿渲染器"><br><code>document.presentation</code></td></tr>
  <tr><td><img src="docs/images/cases/document.epub.png" alt="EPUB 渲染器"><br><code>document.epub</code></td><td></td></tr>
</table>
</details>

<details>
<summary><strong>Notebook、空间内容与开放式 Artifact</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/data.notebook.png" alt="Notebook 渲染器"><br><code>data.notebook</code></td><td width="50%"><img src="docs/images/cases/data.parquet.png" alt="Parquet 渲染器"><br><code>data.parquet</code></td></tr>
  <tr><td><img src="docs/images/cases/map.geo.png" alt="GeoJSON 地图渲染器"><br><code>map.geo</code></td><td><img src="docs/images/cases/model.3d.png" alt="3D 模型渲染器"><br><code>model.3d</code></td></tr>
  <tr><td><img src="docs/images/cases/artifact.html.png" alt="HTML Artifact 渲染器"><br><code>artifact.html</code></td><td><img src="docs/images/cases/artifact.react.png" alt="React Artifact 渲染器"><br><code>artifact.react</code></td></tr>
  <tr><td><img src="docs/images/cases/artifact.python.png" alt="Python Artifact 渲染器"><br><code>artifact.python</code></td><td><img src="docs/images/cases/form.dynamic.png" alt="动态表单渲染器"><br><code>form.dynamic</code></td></tr>
</table>
</details>

<details>
<summary><strong>受控业务 Widget</strong></summary>
<table>
  <tr><td width="50%"><img src="docs/images/cases/widget.weather.png" alt="天气 Widget"><br><code>widget.weather</code></td><td width="50%"><img src="docs/images/cases/widget.stock.png" alt="股票 Widget"><br><code>widget.stock</code></td></tr>
  <tr><td><img src="docs/images/cases/widget.sports.png" alt="体育 Widget"><br><code>widget.sports</code></td><td><img src="docs/images/cases/widget.travel.png" alt="旅行 Widget"><br><code>widget.travel</code></td></tr>
  <tr><td><img src="docs/images/cases/widget.product.png" alt="商品 Widget"><br><code>widget.product</code></td><td><img src="docs/images/cases/widget.calendar.png" alt="日历 Widget"><br><code>widget.calendar</code></td></tr>
  <tr><td><img src="docs/images/cases/widget.email.png" alt="邮件 Widget"><br><code>widget.email</code></td><td><img src="docs/images/cases/widget.logistics.png" alt="物流 Widget"><br><code>widget.logistics</code></td></tr>
</table>
</details>

## 功能

- 三条渲染路径：受控 Widget、声明式组件目录、开放式沙箱 Artifact。
- 34 种严格 Zod discriminated union，提供 JSON Schema、版本迁移、字段路径错误和未知类型 fallback。
- 39 个确定性离线场景，覆盖全部 34 种协议类型；无需商业 API Key。
- Markdown、代码、数学、JSON/YAML/XML/日志、表格、ECharts、Vega-Lite、Mermaid、Excalidraw。
- 图片、波形音频、发音、视频、PDF、DOCX、XLSX、PPTX、EPUB、Notebook、Parquet/Arrow。
- MapLibre 地图、Three.js 3D、HTML/React/Python Artifact、动态表单。
- Weather、Stock、Sports、Travel、Product、Calendar、Email、Logistics Widget。
- MCP Apps、AG-UI、A2UI、OpenAI Apps 与 Vercel AI SDK Adapter。
- Playground、Protocol Inspector、Component Gallery、深浅主题、移动端布局和可访问性测试。

## 快速开始

需要 Node.js 22.13+，推荐 Node.js 24。

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。Demo Provider 和本地 Fixture 默认可用。

```bash
npm run typecheck
npm run lint -- --quiet
npm run format:check
npm test
npm run build
npm run test:e2e
```

## Provider 与环境变量

复制 `.env.example` 后按需配置：

- `OPENAI_API_KEY`：OpenAI / OpenAI-compatible Provider 与 TTS，仅服务端读取。
- `ANTHROPIC_API_KEY`：Anthropic Provider，仅服务端读取。
- `OFFICE_CONVERTER_URL`：可选 LibreOffice 转换服务。

没有 Key 时，Fixture 模式不会伪装成实时数据，界面会明确显示 “Demo fixture / Example data”。

## RenderEnvelope 示例

```ts
const envelope = {
  id: "weather-beijing",
  type: "widget.weather",
  version: "1.0.0",
  payload: {
    location: "Beijing, China",
    temperature: 29,
    unit: "C",
    condition: "Partly cloudy",
    feelsLike: 31,
    humidity: 46,
    windSpeed: 12,
    precipitationProbability: 20,
    hourly: [],
    daily: [],
    updatedAt: "2026-07-11 08:00 CST",
    provider: "Demo fixture",
  },
};
```

所有模型输出必须先通过 `parseRenderEnvelope`，不能直接进入 Renderer。

## 注册自定义 Renderer

```ts
const unregister = rendererRegistry.register({
  id: "acme.widget.example",
  type: "widget.example",
  version: "1.0.0",
  displayName: "Example",
  priority: 200,
  supports: { mimeTypes: ["application/vnd.acme.example+json"] },
  canRender: (value) => value.type === "widget.example",
  load: () => import("./ExampleRenderer"),
});
```

Registry 支持动态注册/注销、优先级、版本、MIME、扩展名、用户 override、Lazy Loading、模块失败隔离与 fallback。

## 安全模型

- URL、文件名、MIME、扩展名、大小、JSON 深度和图表配置均有边界校验。
- HTML 与 React 在无 `allow-same-origin` 的 iframe 中运行，默认关闭网络；React/TypeScript 编译器为本地打包资源。
- Python 在可终止 Web Worker 中运行；Pyodide 资源随项目本地提供。
- 邮件、日历等写操作必须二次确认，Demo 只发出本地组件事件。
- API Key 不进入客户端 Bundle，用户文件默认不上传第三方。

## 文件与浏览器支持

支持 PDF、DOCX、XLS/XLSX/CSV、PPT/PPTX/ODF（可选转换服务）、EPUB、IPYNB、Parquet/Arrow、常见图片/音频/视频以及 GLTF/GLB/OBJ/STL/PLY。主验收覆盖 Chromium 桌面与 iPhone 13 WebKit 移动视口。

## 文档

- [架构](./docs/architecture.md)
- [协议](./docs/protocol.md)
- [安全](./docs/security.md)
- [能力矩阵](./docs/CAPABILITY_MATRIX.md)
- [验证记录](./docs/validation.md)
- [Renderer 开发](./docs/renderer-development.md)
- [集成与 Adapter](./docs/integrations.md)

## Docker Compose

```bash
docker compose up --build office-converter
```

转换服务限制上传大小、隔离临时目录、清洗文件名、设置超时并清理文件。服务不可用时，客户端展示明确 fallback。

## Roadmap、贡献与许可证

后续方向包括更大的离线依赖目录、更多可信数据 Provider、持久化会话与跨浏览器视觉基线。贡献说明见 [CONTRIBUTING.md](./CONTRIBUTING.md)，安全报告见 [SECURITY.md](./SECURITY.md)。项目使用 [MIT License](./LICENSE)。

## 致谢

架构与实现参考 MCP Apps、AG-UI、A2UI、OpenAI Apps SDK、Vercel AI SDK、ECharts、Vega-Lite、Mermaid、Excalidraw、PDF.js、Pyodide、MapLibre 和 Three.js；详见 [references.md](./docs/references.md)。
