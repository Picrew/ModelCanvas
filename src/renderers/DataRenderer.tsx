"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import katex from "katex";
import { BarChart3, Check, ChevronDown, ChevronRight, Clipboard, Code2, Download, Eye, EyeOff, FileJson, Search } from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { JsonValue, KnownRenderEnvelope } from "@/src/schema";

type CodeEnvelope = Extract<KnownRenderEnvelope, { type: "text.code" }>;
type MathEnvelope = Extract<KnownRenderEnvelope, { type: "text.math" }>;
type JsonEnvelope = Extract<KnownRenderEnvelope, { type: "data.json" }>;
type TableEnvelope = Extract<KnownRenderEnvelope, { type: "data.table" }>;
type NotebookEnvelope = Extract<KnownRenderEnvelope, { type: "data.notebook" }>;
type ParquetEnvelope = Extract<KnownRenderEnvelope, { type: "data.parquet" }>;

function copy(value: string) { return navigator.clipboard.writeText(value); }

function CodeView({ envelope }: { envelope: CodeEnvelope }) {
  const [query, setQuery] = useState("");
  const [wrap, setWrap] = useState(envelope.payload.wrap);
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(envelope.payload.editable);
  const [code, setCode] = useState(envelope.payload.code);
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const large = lines.length > 10_000 || code.length > 1_000_000;
  const visibleLines = large ? lines.slice(0, 2_000) : lines;
  return (
    <section className="code-renderer" data-testid="code-renderer">
      <div className="renderer-toolbar">
        <span className="file-name"><Code2 /> {envelope.payload.fileName ?? "untitled"}<b>{envelope.payload.language}</b></span>
        <label className="toolbar-search"><Search /><span className="sr-only">Search code</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find" /></label>
        <button className="icon-button" type="button" onClick={() => setWrap((value) => !value)}>{wrap ? <EyeOff /> : <Eye />} Wrap</button>
        <button className="icon-button" type="button" onClick={() => { void copy(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1_500); }); }}>{copied ? <Check /> : <Clipboard />} {copied ? "Copied" : "Copy"}</button>
        <button className="icon-button" type="button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronRight /> : <ChevronDown />} {collapsed ? "Expand" : "Collapse"}</button>
        {envelope.payload.editable ? <button className="icon-button" type="button" onClick={() => setEditing((value) => !value)}><Code2 /> {editing ? "Preview" : "Edit"}</button> : null}
      </div>
      {large ? <div className="guard-banner">Large file guard: showing the first 2,000 of {lines.length.toLocaleString()} lines.</div> : null}
      {collapsed ? null : editing ? (
        <textarea className="code-editor" value={code} spellCheck={false} onChange={(event) => setCode(event.target.value)} aria-label="Code editor" />
      ) : (
        <pre className={wrap ? "code-lines wrap" : "code-lines"}>{visibleLines.map((line, index) => {
          const match = query && line.toLowerCase().includes(query.toLowerCase());
          const diffClass = envelope.payload.diff ? line.startsWith("+") ? "diff-add" : line.startsWith("-") ? "diff-remove" : "" : "";
          return <span className={`${match ? "search-hit" : ""} ${diffClass}`} key={`${index}-${line.slice(0, 12)}`}><i>{index + envelope.payload.startLine}</i><code>{line || " "}</code></span>;
        })}</pre>
      )}
    </section>
  );
}

function MathView({ envelope }: { envelope: MathEnvelope }) {
  const [error, setError] = useState<string>();
  let html = "";
  try {
    html = katex.renderToString(envelope.payload.latex, { displayMode: envelope.payload.display === "block", throwOnError: true, strict: "warn", trust: false });
  } catch (cause) {
    if (!error) queueMicrotask(() => setError(cause instanceof Error ? cause.message : "Invalid LaTeX"));
  }
  return error ? <div className="renderer-state" role="alert"><h2>Formula error</h2><p>{error}</p><pre>{envelope.payload.latex}</pre></div> : <div className={`math-renderer ${envelope.payload.display}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

function JsonNode({ value, path, depth = 0, query }: { value: JsonValue; path: string; depth?: number; query: string }) {
  const [open, setOpen] = useState(depth < 2);
  if (value === null || typeof value !== "object") {
    const stringValue = typeof value === "string" ? `"${value}"` : String(value);
    return <span className={query && stringValue.toLowerCase().includes(query.toLowerCase()) ? "search-hit" : `json-${typeof value}`}>{stringValue}</span>;
  }
  const entries = Array.isArray(value) ? value.map((child, index) => [String(index), child] as const) : Object.entries(value);
  const brace = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  return (
    <span className="json-node">
      <button className="json-toggle" type="button" aria-label={`${open ? "Collapse" : "Expand"} ${path}`} onClick={() => setOpen((value) => !value)}>{open ? <ChevronDown /> : <ChevronRight />}</button>
      <span>{brace[0]}</span>{!open ? <span className="json-count"> {entries.length} items </span> : null}
      {open ? <span className="json-children">{entries.map(([key, child], index) => {
        const childPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`;
        return <span className="json-entry" key={childPath}><button className="json-key" type="button" title={`Copy ${childPath}`} onClick={() => void copy(childPath)}>{Array.isArray(value) ? "" : `"${key}": `}</button><JsonNode value={child} path={childPath} depth={depth + 1} query={query} />{index < entries.length - 1 ? "," : ""}</span>;
      })}</span> : null}<span>{brace[1]}</span>
    </span>
  );
}

function JsonView({ envelope }: { envelope: JsonEnvelope }) {
  const [mode, setMode] = useState<"tree" | "raw">("tree");
  const [query, setQuery] = useState("");
  const serialized = useMemo(() => JSON.stringify(envelope.payload.data, null, 2), [envelope]);
  return (
    <section className="json-renderer" data-testid="json-renderer">
      <div className="renderer-toolbar">
        <span className="file-name"><FileJson /> {envelope.payload.format.toUpperCase()}</span>
        <div className="segmented"><button className={mode === "tree" ? "active" : ""} type="button" onClick={() => setMode("tree")}>Tree</button><button className={mode === "raw" ? "active" : ""} type="button" onClick={() => setMode("raw")}>Raw</button></div>
        <label className="toolbar-search"><Search /><span className="sr-only">Search structured data</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search values" /></label>
        <button className="icon-button" type="button" onClick={() => void copy(serialized)}><Clipboard /> Copy</button>
      </div>
      {serialized.length > 1_000_000 ? <div className="guard-banner">Large data guard active. Tree depth is limited.</div> : null}
      {mode === "raw" ? <pre className="json-raw">{serialized}</pre> : <div className="json-tree"><JsonNode value={envelope.payload.data} path="$" query={query} /></div>}
    </section>
  );
}

function escapeCsvCell(value: string | number | boolean | null) {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function TableView({ envelope, onChart }: { envelope: TableEnvelope; onChart: () => void }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: 1 | -1 }>();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set(envelope.payload.columns.filter((column) => column.hidden).map((column) => column.key)));
  const rows = useMemo(() => {
    let result = envelope.payload.rows.map((row, index) => ({ row, originalIndex: index }));
    if (query) result = result.filter(({ row }) => Object.values(row).some((value) => String(value).toLowerCase().includes(query.toLowerCase())));
    if (sort) result.sort((left, right) => String(left.row[sort.key] ?? "").localeCompare(String(right.row[sort.key] ?? ""), undefined, { numeric: true }) * sort.direction);
    return result;
  }, [envelope.payload.rows, query, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / envelope.payload.pageSize));
  const visibleRows = rows.slice(page * envelope.payload.pageSize, (page + 1) * envelope.payload.pageSize);
  const visibleColumns = envelope.payload.columns.filter((column) => !hidden.has(column.key));
  const selectedRows = envelope.payload.rows.filter((_row, index) => selected.has(index));
  const numericValues = selectedRows.flatMap((row) => Object.values(row).filter((value): value is number => typeof value === "number"));
  const exportCsv = () => {
    const csv = [visibleColumns.map((column) => escapeCsvCell(column.label)).join(","), ...rows.map(({ row }) => visibleColumns.map((column) => escapeCsvCell(row[column.key] ?? null)).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${envelope.id}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  return (
    <section className="table-renderer" data-testid="table-renderer">
      <div className="renderer-toolbar table-tools">
        <label className="toolbar-search"><Search /><span className="sr-only">Search table</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search rows" /></label>
        <details className="column-picker"><summary><Eye /> Columns</summary><div>{envelope.payload.columns.map((column) => <label key={column.key}><input type="checkbox" checked={!hidden.has(column.key)} onChange={() => setHidden((current) => { const next = new Set(current); next.has(column.key) ? next.delete(column.key) : next.add(column.key); return next; })} /> {column.label}</label>)}</div></details>
        <button className="icon-button" type="button" onClick={exportCsv}><Download /> CSV</button>
        <button className="button primary compact" type="button" onClick={onChart}><BarChart3 /> Convert to chart</button>
      </div>
      <div className="table-scroll"><table><caption>{envelope.payload.caption ?? `${rows.length} rows`}</caption><thead><tr><th scope="col" className="select-cell"><span className="sr-only">Select</span></th>{visibleColumns.map((column) => <th scope="col" key={column.key}><button type="button" onClick={() => setSort((current) => current?.key === column.key ? { key: column.key, direction: current.direction === 1 ? -1 : 1 } : { key: column.key, direction: 1 })}>{column.label}{sort?.key === column.key ? sort.direction === 1 ? " ↑" : " ↓" : ""}</button></th>)}</tr></thead><tbody>{visibleRows.map(({ row, originalIndex }) => <tr key={originalIndex} className={selected.has(originalIndex) ? "selected" : ""}><td className="select-cell"><input aria-label={`Select row ${originalIndex + 1}`} type="checkbox" checked={selected.has(originalIndex)} onChange={() => setSelected((current) => { const next = new Set(current); next.has(originalIndex) ? next.delete(originalIndex) : next.add(originalIndex); return next; })} /></td>{visibleColumns.map((column) => <td key={column.key} data-type={column.type}>{String(row[column.key] ?? "—")}</td>)}</tr>)}</tbody></table></div>
      <div className="table-footer"><span>{rows.length} rows · page {page + 1} of {pageCount}</span><div><button className="icon-button compact" type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button><button className="icon-button compact" type="button" disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>Next</button></div></div>
      {selected.size ? <div className="selection-summary"><strong>{selected.size} selected</strong><span>Numeric cells: {numericValues.length}</span><span>Sum: {numericValues.reduce((sum, value) => sum + value, 0).toLocaleString()}</span><span>Average: {numericValues.length ? (numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length).toFixed(1) : "—"}</span></div> : null}
    </section>
  );
}

function NotebookView({ envelope }: { envelope: NotebookEnvelope }) {
  const [raw, setRaw] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  if (raw) return <section className="notebook-renderer"><div className="renderer-toolbar"><button className="icon-button" type="button" onClick={() => setRaw(false)}><Eye /> Notebook</button></div><pre className="json-raw">{JSON.stringify(envelope.payload, null, 2)}</pre></section>;
  return (
    <section className="notebook-renderer" data-testid="notebook-renderer">
      <div className="renderer-toolbar"><span className="toolbar-note">{envelope.payload.cells.length} cells · safe MIME output</span><button className="icon-button" type="button" onClick={() => setRaw(true)}><FileJson /> Raw JSON</button></div>
      <div className="notebook-cells">{envelope.payload.cells.map((cell) => {
        const isCollapsed = collapsed.has(cell.id);
        return <article className={`notebook-cell ${cell.cellType}`} key={cell.id}><button className="cell-gutter" type="button" aria-label={`${isCollapsed ? "Expand" : "Collapse"} cell`} onClick={() => setCollapsed((current) => { const next = new Set(current); next.has(cell.id) ? next.delete(cell.id) : next.add(cell.id); return next; })}>{isCollapsed ? <ChevronRight /> : <ChevronDown />}{cell.cellType === "code" ? `[${cell.executionCount ?? " "}]` : "M"}</button>{isCollapsed ? <span className="cell-collapsed">{cell.source.split("\n")[0]}…</span> : <div className="cell-content">{cell.cellType === "markdown" ? <div className="notebook-markdown">{cell.source.split("\n").map((line, index) => <Fragment key={index}>{line.startsWith("## ") ? <h2>{line.slice(3)}</h2> : <p>{line}</p>}</Fragment>)}</div> : <><pre>{cell.source}</pre>{cell.outputs.map((output, index) => <div className={`cell-output ${output.outputType}`} key={index}>{output.text ? <pre>{output.text}</pre> : output.data ? Object.entries(output.data).map(([mime, value]) => <div key={mime}><small>{mime}</small><pre>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</pre></div>) : null}</div>)}</>}</div>}</article>;
      })}</div>
    </section>
  );
}

function ParquetView({ envelope }: { envelope: ParquetEnvelope }) {
  return <section className="data-summary"><p className="eyebrow">Columnar dataset</p><div className="metric-grid"><div><span>Rows</span><strong>{envelope.payload.rowCount?.toLocaleString() ?? "Unknown"}</strong></div><div><span>Columns</span><strong>{envelope.payload.columns.length}</strong></div><div><span>Preview</span><strong>{envelope.payload.preview.length}</strong></div></div><h3>Schema</h3><div className="schema-list">{envelope.payload.columns.map((column) => <div key={column.name}><code>{column.name}</code><span>{column.type}</span></div>)}</div>{envelope.payload.preview.length ? <pre>{JSON.stringify(envelope.payload.preview, null, 2)}</pre> : <div className="empty-state">Load a Parquet or Arrow fixture to inspect rows.</div>}</section>;
}

export default function DataRenderer({ envelope, onEvent }: RendererComponentProps) {
  if (envelope.type === "text.code") return <CodeView envelope={envelope as CodeEnvelope} />;
  if (envelope.type === "text.math") return <MathView envelope={envelope as MathEnvelope} />;
  if (envelope.type === "data.json") return <JsonView envelope={envelope as JsonEnvelope} />;
  if (envelope.type === "data.table") return <TableView envelope={envelope as TableEnvelope} onChart={() => onEvent?.({ type: "renderer.action", renderer: "data.table", action: "convert-to-chart", payload: envelope.payload })} />;
  if (envelope.type === "data.notebook") return <NotebookView envelope={envelope as NotebookEnvelope} />;
  if (envelope.type === "data.parquet") return <ParquetView envelope={envelope as ParquetEnvelope} />;
  throw new Error("Data renderer received an incompatible envelope");
}

