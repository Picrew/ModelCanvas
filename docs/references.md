# Reference survey

Official repositories were reviewed as architectural references; no source code was copied. ModelCanvas keeps its own canonical protocol and uses adapters at system boundaries.

## Protocol and generative UI

- [MCP Apps](https://github.com/modelcontextprotocol/ext-apps): `ui://` resources, sandboxed inline UI, and bidirectional host communication informed the MCP adapter and artifact boundary. Apache-2.0.
- [AG-UI](https://github.com/ag-ui-protocol/ag-ui): event-oriented agent/frontend interaction informed message, tool, state, and lifecycle event mappings. Apache-2.0.
- [A2UI](https://github.com/a2ui-project/a2ui): declarative component surfaces informed the allow-listed dynamic UI adapter. Apache-2.0.
- [json-render](https://github.com/vercel-labs/json-render), [Tambo](https://github.com/tambo-ai/tambo), [CopilotKit](https://github.com/CopilotKit/CopilotKit), [assistant-ui](https://github.com/assistant-ui/assistant-ui), and [Vercel AI SDK](https://github.com/vercel/ai): catalog-based generative UI, streaming parts, tool lifecycle, and typed provider abstractions informed the registry and adapters.
- [OpenAI Apps SDK UI](https://github.com/openai/apps-sdk-ui), [Apps SDK examples](https://github.com/openai/openai-apps-sdk-examples), [AI Elements](https://github.com/vercel/ai-elements), and [Streamdown](https://github.com/vercel/streamdown): component resource and streaming-content patterns informed integration shapes and Markdown behavior.

## Renderer engines

- [Apache ECharts](https://github.com/apache/echarts) and [Vega-Lite](https://github.com/vega/vega-lite): interactive and declarative charts. ModelCanvas adds a data-only sanitation boundary.
- [Mermaid](https://github.com/mermaid-js/mermaid), [Excalidraw](https://github.com/excalidraw/excalidraw), and [React Flow](https://github.com/xyflow/xyflow): diagram syntax, editable canvas, and node-flow interaction.
- [Sandpack](https://github.com/codesandbox/sandpack), [LiveCodes](https://github.com/live-codes/livecodes), and [Pyodide](https://github.com/pyodide/pyodide): isolated code preview and browser Python. ModelCanvas chooses Sandpack plus a terminable Worker.
- [PDF.js](https://github.com/mozilla/pdf.js), [Univer](https://github.com/dream-num/univer), and LibreOffice headless: document preview and conversion. The current spreadsheet path is lightweight XLSX/table rendering; Univer remains a future editing option.
- [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), [deck.gl](https://github.com/visgl/deck.gl), and [three.js](https://github.com/mrdoob/three.js): spatial data and 3D rendering. The default map fixture is offline and token-free.
- [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js), [Peaks.js](https://github.com/bbc/peaks.js): waveform, regions, and timestamped audio navigation. ModelCanvas uses wavesurfer with native audio fallback.

## Product references

[Chainlit](https://github.com/Chainlit/chainlit), [LibreChat](https://github.com/danny-avila/LibreChat), [Open WebUI](https://github.com/open-webui/open-webui), [Cherry Studio](https://github.com/CherryHQ/cherry-studio), and [CopilotKit generative-ui](https://github.com/CopilotKit/generative-ui) were surveyed for chat/artifact layout, provider extensibility, and tool-result presentation. ModelCanvas deliberately stays a rendering bridge rather than becoming a full chat backend.

Dependency versions and transitive licenses should be regenerated for each release with an SBOM/license scanner; this document records design influence, not a substitute for legal review.
