# RenderEnvelope protocol

Protocol version: `1.0.0`.

Every envelope has `id`, `type`, `version`, and a type-specific `payload`. Optional common fields are `presentation`, `source`, `fallback`, `security`, `actions`, and JSON `metadata`. All known variants are strict Zod objects; unexpected fields are rejected.

Parsing performs four steps: JSON byte/node/depth limits, legacy migration, type dispatch, exact validation. Legacy aliases such as `markdown` and a legacy top-level `data` field migrate to `text.markdown` and `payload`. Unknown future types may pass only through the explicitly limited fallback schema and are marked `unknownType`.

The canonical schemas live in `src/schema/render-envelope.ts`. `renderEnvelopeJsonSchema` is generated from the same Zod source, avoiding drift. Validation errors use JSONPath-style paths such as `$.payload.content`.

Compatibility follows semantic major versions: a `1.x` renderer can accept a `1.x` envelope. Incompatible major versions fall back. Serialize only with `serializeRenderEnvelope`; it revalidates before writing JSON.
