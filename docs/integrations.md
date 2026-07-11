# Integrations

Adapters in `src/adapters` translate without replacing the canonical protocol:

- MCP Apps: `ui://modelcanvas/{id}` resources with the vendor MIME type and structured content.
- AG-UI: message, tool, state-delta, error, and completion events.
- A2UI: declarative surfaces converted to allow-listed ModelCanvas structures.
- OpenAI Apps: component resources and tool result metadata.
- Vercel AI SDK: UI message parts and tool invocation output.

Providers in `src/providers` implement a small streaming contract. The demo provider is deterministic. Hosted provider requests go through `/api/model`, where keys remain server-side and error classes are normalized. Copy `.env.example` to `.env.local` only when enabling a provider.

Keep adapters loss-aware: unsupported fields remain raw/inspectable or become fallback content. Never claim an adapter is wire-compatible when it is only a semantic mapping.
