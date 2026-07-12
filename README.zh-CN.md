# ModelCanvas

[English Documentation](./README.md)

ModelCanvas 是一个面向大模型富内容输出的通用渲染协议、Renderer Registry、组件库与交互式 Playground。模型或工具输出带版本的 `RenderEnvelope`，宿主完成校验、迁移、Renderer 解析和安全隔离。

![ModelCanvas social preview](./public/og.png)

## 真实运行案例

下图全部来自 ModelCanvas 本地前端的实际运行结果，不是设计稿。每个案例都有经过 Schema 校验的 fixture，样例数据会明确标注，不会伪装成实时数据。完整 34 类截图见英文 README 的 **All 34 RenderEnvelope types**。

<table>
  <tr><td width="50%"><img src="docs/images/cases/widget.stock.png" alt="ModelCanvas 股票结果"><br><strong>股票</strong>：区间切换、ECharts 曲线、指标与数据来源</td><td width="50%"><img src="docs/images/cases/audio.pronunciation.png" alt="ModelCanvas 发音与音频结果"><br><strong>发音</strong>：拼音、IPA、本地音频下载与可选 Provider MP3</td></tr>
  <tr><td><img src="docs/images/cases/widget.sports.png" alt="ModelCanvas 体育对阵图"><br><strong>体育</strong>：阶段切换、完赛比分与待赛场次</td><td><img src="docs/images/cases/diagram.mermaid.png" alt="ModelCanvas Mermaid 时间线"><br><strong>Mermaid</strong>：源码编辑、运行、缩放、SVG 导出和全屏</td></tr>
</table>

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
