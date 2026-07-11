# Architecture

ModelCanvas separates semantic output from presentation:

```text
model / tool / protocol adapter
            │
            ▼
      RenderEnvelope
            │
   limits → migrate → exact Zod validation
            │
            ▼
     RendererRegistry
   type/version/capability/priority
            │
     ┌──────┼────────┐
     ▼      ▼        ▼
 controlled declarative sandboxed artifact
            │
            ▼
    Inspector + host events
```

`src/schema` owns the wire contract. `src/core` owns parsing, migrations, serialization, and selection. `src/security` owns input limits and trust policies. Renderers never choose themselves; the registry resolves them before their lazy module is loaded. `RendererErrorBoundary` isolates runtime faults, while fallback output keeps unsupported types inspectable and downloadable.

The browser is the default execution environment. Optional server capabilities are intentionally narrow: provider calls, TTS proxying, and office-to-PDF conversion. No renderer receives provider credentials.
