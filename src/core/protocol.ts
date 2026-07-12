import { z } from "zod";
import {
  RENDER_PROTOCOL_VERSION,
  RenderEnvelopeSchema,
  RenderTypeSchema,
  type AnyRenderEnvelope,
  type JsonValue,
  type KnownRenderEnvelope,
  type UnknownRenderEnvelope,
} from "@/src/schema";
import { assertJsonWithinLimits } from "@/src/security/json";

export interface ValidationIssue {
  path: string;
  message: string;
  code: string;
}

export interface MigrationStep {
  from: string;
  to: string;
  description: string;
}

export type ParseResult =
  | {
      success: true;
      data: AnyRenderEnvelope;
      issues: ValidationIssue[];
      migrations: MigrationStep[];
      unknownType: boolean;
    }
  | {
      success: false;
      issues: ValidationIssue[];
      migrations: MigrationStep[];
      input?: unknown;
    };

const legacyTypeAliases: Record<string, KnownRenderEnvelope["type"]> = {
  markdown: "text.markdown",
  code: "text.code",
  math: "text.math",
  table: "data.table",
  json: "data.json",
  echarts: "chart.echarts",
  vega: "chart.vega-lite",
  mermaid: "diagram.mermaid",
  html: "artifact.html",
  react: "artifact.react",
  python: "artifact.python",
};

function cloneJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export function migrateEnvelope(input: unknown): {
  value: unknown;
  migrations: MigrationStep[];
} {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { value: input, migrations: [] };
  }

  const value = cloneJson(input) as Record<string, unknown>;
  const migrations: MigrationStep[] = [];
  const originalVersion =
    typeof value.version === "string" ? value.version : "unversioned";

  if (typeof value.type === "string" && legacyTypeAliases[value.type]) {
    const previousType = value.type;
    value.type = legacyTypeAliases[previousType];
    migrations.push({
      from: originalVersion,
      to: RENDER_PROTOCOL_VERSION,
      description: `Mapped legacy render type ${previousType} to ${value.type}`,
    });
  }

  if (value.data !== undefined && value.payload === undefined) {
    value.payload = value.data;
    delete value.data;
    migrations.push({
      from: originalVersion,
      to: RENDER_PROTOCOL_VERSION,
      description: "Renamed top-level data to payload",
    });
  }

  if (
    value.version === "v1" ||
    value.version === "1" ||
    value.version === "0.1.0"
  ) {
    value.version = RENDER_PROTOCOL_VERSION;
    migrations.push({
      from: originalVersion,
      to: RENDER_PROTOCOL_VERSION,
      description: "Normalized protocol version",
    });
  }

  return { value, migrations };
}

function issuePath(path: PropertyKey[]): string {
  if (path.length === 0) return "$";
  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") return `${result}[${segment}]`;
    const key = String(segment);
    return /^[A-Za-z_$][\w$]*$/.test(key)
      ? `${result}.${key}`
      : `${result}[${JSON.stringify(key)}]`;
  }, "$");
}

function zodIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issuePath(issue.path),
    message: issue.message,
    code: issue.code,
  }));
}

const UnknownEnvelopeSchema = z
  .object({
    id: z.string().min(1).max(160),
    type: z.string().min(1).max(160),
    version: z.string().min(1).max(80),
    payload: z.record(z.string(), z.never()).default({}),
    fallback: z
      .object({
        text: z.string().max(100_000).optional(),
        markdown: z.string().max(100_000).optional(),
        imageUrl: z.string().max(16_384).optional(),
        downloadUrl: z.string().max(16_384).optional(),
      })
      .strict()
      .optional(),
    metadata: z.record(z.string(), z.custom<JsonValue>()).optional(),
  })
  .passthrough();

export function parseRenderEnvelope(input: unknown): ParseResult {
  const limited = assertJsonWithinLimits(input);
  if (!limited.ok) {
    return {
      success: false,
      migrations: [],
      input,
      issues: [
        { path: limited.path, message: limited.message, code: limited.code },
      ],
    };
  }

  const { value, migrations } = migrateEnvelope(input);
  const type =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>).type
      : undefined;

  if (typeof type === "string" && !RenderTypeSchema.safeParse(type).success) {
    const unknown = UnknownEnvelopeSchema.safeParse(value);
    if (!unknown.success) {
      return {
        success: false,
        issues: zodIssues(unknown.error),
        migrations,
        input: value,
      };
    }
    return {
      success: true,
      data: unknown.data as UnknownRenderEnvelope,
      issues: [
        {
          path: "$.type",
          message: `No registered protocol schema for ${type}; fallback required`,
          code: "unknown_type",
        },
      ],
      migrations,
      unknownType: true,
    };
  }

  const parsed = RenderEnvelopeSchema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      issues: zodIssues(parsed.error),
      migrations,
      input: value,
    };
  }

  return {
    success: true,
    data: parsed.data,
    issues: [],
    migrations,
    unknownType: false,
  };
}

export function serializeRenderEnvelope(envelope: AnyRenderEnvelope): string {
  const parsed = parseRenderEnvelope(envelope);
  if (!parsed.success) {
    const detail = parsed.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Cannot serialize invalid RenderEnvelope: ${detail}`);
  }
  return JSON.stringify(parsed.data);
}

export function deserializeRenderEnvelope(serialized: string): ParseResult {
  if (new TextEncoder().encode(serialized).byteLength > 2_000_000) {
    return {
      success: false,
      migrations: [],
      issues: [
        {
          path: "$",
          message: "Serialized envelope exceeds 2 MB",
          code: "payload_too_large",
        },
      ],
    };
  }
  try {
    return parseRenderEnvelope(JSON.parse(serialized) as unknown);
  } catch (error) {
    return {
      success: false,
      migrations: [],
      issues: [
        {
          path: "$",
          message: error instanceof Error ? error.message : "Invalid JSON",
          code: "invalid_json",
        },
      ],
    };
  }
}
