# Renderer development

1. Add or extend an exact payload schema and discriminated-union entry.
2. Implement a client renderer accepting `RendererComponentProps`.
3. Register a lazy module in `src/react/renderer-registry.ts` with id, type, protocol version, capabilities, priority, and a narrow `canRender` predicate.
4. Add a deterministic fixture, unit coverage, and at least one browser flow.

Renderers must treat payloads as untrusted even after structural validation. Do not evaluate strings as code, inject unsanitized markup, fetch arbitrary origins, or retain workers/WebGL/audio resources after unmount. Expensive libraries must stay behind dynamic imports. Actions should emit host events; external writes require a confirmation UI.

For an unsupported type, improve the fallback renderer rather than weakening validation. A renderer load failure must leave the trace intact and resolve the safe fallback.
