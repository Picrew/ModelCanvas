import type { JsonValue, KnownRenderEnvelope } from "@/src/schema";

type NotebookEnvelope = Extract<KnownRenderEnvelope, { type: "data.notebook" }>;
type NotebookCell = NotebookEnvelope["payload"]["cells"][number];
type NotebookOutput = Extract<
  NotebookCell,
  { cellType: "code" }
>["outputs"][number];

interface IpynbCell {
  id?: unknown;
  cell_type?: unknown;
  source?: unknown;
  execution_count?: unknown;
  outputs?: unknown;
}

interface IpynbDocument {
  cells?: unknown;
  metadata?: unknown;
}

function textValue(value: unknown): string {
  if (Array.isArray(value))
    return value.filter((item) => typeof item === "string").join("");
  return typeof value === "string" ? value : "";
}

function jsonValue(value: unknown): JsonValue | undefined {
  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return undefined;
  }
}

function normalizeOutputs(value: unknown): NotebookOutput[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 2_000).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const output = entry as Record<string, unknown>;
    const outputType = output.output_type;
    if (
      outputType !== "stream" &&
      outputType !== "error" &&
      outputType !== "display_data" &&
      outputType !== "execute_result"
    )
      return [];
    const data =
      output.data &&
      typeof output.data === "object" &&
      !Array.isArray(output.data)
        ? Object.fromEntries(
            Object.entries(output.data).flatMap(([mime, item]) => {
              const normalized = jsonValue(item);
              return normalized === undefined ? [] : [[mime, normalized]];
            }),
          )
        : undefined;
    const traceback = Array.isArray(output.traceback)
      ? output.traceback.filter((item) => typeof item === "string").join("\n")
      : "";
    return [
      {
        outputType,
        text: textValue(output.text) || traceback || undefined,
        name: typeof output.name === "string" ? output.name : undefined,
        data,
      } satisfies NotebookOutput,
    ];
  });
}

export function ipynbEnvelope(
  input: unknown,
  fileName: string,
): NotebookEnvelope {
  if (!input || typeof input !== "object")
    throw new Error("Notebook JSON must be an object");
  const notebook = input as IpynbDocument;
  if (!Array.isArray(notebook.cells))
    throw new Error("Notebook is missing a cells array");
  const cells: NotebookCell[] = notebook.cells
    .slice(0, 10_000)
    .flatMap((entry, index): NotebookCell[] => {
      if (!entry || typeof entry !== "object") return [];
      const cell = entry as IpynbCell;
      const cellType = cell.cell_type;
      if (cellType !== "markdown" && cellType !== "code") return [];
      const common = {
        id: typeof cell.id === "string" ? cell.id : `cell-${index + 1}`,
        source: textValue(cell.source),
      };
      if (cellType === "markdown") return [{ ...common, cellType }];
      return [
        {
          ...common,
          cellType,
          language: "python",
          executionCount:
            typeof cell.execution_count === "number"
              ? cell.execution_count
              : undefined,
          outputs: normalizeOutputs(cell.outputs),
        },
      ];
    });
  const metadata =
    notebook.metadata &&
    typeof notebook.metadata === "object" &&
    !Array.isArray(notebook.metadata)
      ? (jsonValue(notebook.metadata) as Record<string, JsonValue>)
      : undefined;
  return {
    id: `notebook-${Date.now()}`,
    type: "data.notebook",
    version: "1.0.0",
    presentation: { title: fileName },
    source: { provider: "Local upload", createdAt: new Date().toISOString() },
    payload: { cells, metadata },
  };
}
