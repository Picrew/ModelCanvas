# ModelCanvas

ModelCanvas is a protocol-driven rendering bridge for rich model output. A model or tool emits a versioned `RenderEnvelope`; the host validates it, resolves a compatible renderer, and renders it inside an appropriate trust boundary.

ModelCanvas 是一个面向模型富输出的协议化渲染桥。模型或工具只需返回带版本的 `RenderEnvelope`；宿主负责校验、选择兼容渲染器，并在正确的安全边界内呈现结果。

## What is included

- Three output paths: controlled widgets, declarative renderer catalog, and sandboxed open artifacts.
- 34 exact Zod envelope variants and a registry with version, MIME, extension, priority, override, lazy-load, and fallback support.
- 26 deterministic offline scenarios across text, charts, diagrams, data, media, documents, maps, 3D, forms, widgets, and code artifacts.
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
- HTML runs in a sandboxed iframe without same-origin access; React runs in Sandpack with an allowlist; Python runs in a terminable Worker.
- Unknown or invalid output never masquerades as a successful rich render.
- Provider keys remain server-side. Do not place secrets in any `NEXT_PUBLIC_*` variable.

Licensed under MIT. Third-party dependencies retain their respective licenses; see [references](docs/references.md).
