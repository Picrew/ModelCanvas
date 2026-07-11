"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileText,
  LoaderCircle,
  Maximize2,
  Minus,
  Plus,
  Search,
  ServerOff,
  Sheet,
} from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { JsonPrimitive, KnownRenderEnvelope } from "@/src/schema";

type DocumentEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "document.pdf" | "document.docx" | "document.presentation" }
>;
type SpreadsheetEnvelope = Extract<
  KnownRenderEnvelope,
  { type: "document.spreadsheet" }
>;
type EpubEnvelope = Extract<KnownRenderEnvelope, { type: "document.epub" }>;
type Source = DocumentEnvelope["payload"]["source"];

function sourceUrl(source: Source): string {
  if (source.url) return source.url;
  if (source.dataUrl) return source.dataUrl;
  return source.base64
    ? `data:${source.mimeType ?? "application/octet-stream"};base64,${source.base64}`
    : "";
}

function PdfView({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "document.pdf" }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(
    null,
  );
  const [page, setPage] = useState(envelope.payload.page);
  const [pages, setPages] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<number[]>([]);
  const url = sourceUrl(envelope.payload.source);
  useEffect(() => {
    let active = true;
    let loadingTask: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
    void import("pdfjs-dist").then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "/pdf.worker.min.mjs",
        window.location.origin,
      ).toString();
      loadingTask = pdfjs.getDocument({ url, enableXfa: false });
      loadingTask.onProgress = ({
        loaded,
        total,
      }: {
        loaded: number;
        total: number;
      }) =>
        active && setProgress(total ? Math.round((loaded / total) * 100) : 0);
      try {
        const document = await loadingTask.promise;
        if (!active) return;
        documentRef.current = document;
        setPages(document.numPages);
        setPage((value) => Math.min(value, document.numPages));
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "PDF failed to load",
          );
      }
    });
    return () => {
      active = false;
      void loadingTask?.destroy();
      documentRef.current = null;
    };
  }, [url]);
  useEffect(() => {
    let cancelled = false;
    const document = documentRef.current;
    if (!document || !canvasRef.current || page > document.numPages) return;
    void document.getPage(page).then(async (pdfPage) => {
      if (cancelled || !canvasRef.current) return;
      const viewport = pdfPage.getViewport({ scale });
      const context = canvasRef.current.getContext("2d");
      if (!context) return;
      const ratio = window.devicePixelRatio || 1;
      canvasRef.current.width = viewport.width * ratio;
      canvasRef.current.height = viewport.height * ratio;
      canvasRef.current.style.width = `${viewport.width}px`;
      canvasRef.current.style.height = `${viewport.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      await pdfPage.render({
        canvas: canvasRef.current,
        canvasContext: context,
        viewport,
      }).promise;
    });
    return () => {
      cancelled = true;
    };
  }, [page, pages, scale]);
  const search = async () => {
    const document = documentRef.current;
    if (!document || !query.trim()) {
      setMatches([]);
      return;
    }
    const found: number[] = [];
    for (let index = 1; index <= Math.min(document.numPages, 200); index += 1) {
      const text = await (await document.getPage(index)).getTextContent();
      if (
        text.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        found.push(index);
    }
    setMatches(found);
    if (found[0]) setPage(found[0]);
  };
  return (
    <section className="pdf-renderer" data-testid="pdf-renderer">
      <div className="renderer-toolbar">
        <button
          className="icon-button compact"
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          <ChevronLeft /> Prev
        </button>
        <label className="page-jump">
          <span className="sr-only">Page</span>
          <input
            type="number"
            min="1"
            max={pages || 1}
            value={page}
            onChange={(event) =>
              setPage(
                Math.min(pages || 1, Math.max(1, Number(event.target.value))),
              )
            }
          />{" "}
          / {pages || "—"}
        </label>
        <button
          className="icon-button compact"
          type="button"
          disabled={page >= pages}
          onClick={() => setPage((value) => value + 1)}
        >
          Next <ChevronRight />
        </button>
        <button
          className="icon-button compact"
          type="button"
          aria-label="Zoom out"
          onClick={() => setScale((value) => Math.max(0.5, value - 0.15))}
        >
          <Minus />
        </button>
        <output>{Math.round(scale * 100)}%</output>
        <button
          className="icon-button compact"
          type="button"
          aria-label="Zoom in"
          onClick={() => setScale((value) => Math.min(3, value + 0.15))}
        >
          <Plus />
        </button>
        <label className="toolbar-search">
          <Search />
          <span className="sr-only">Search PDF</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void search()}
            placeholder="Search text"
          />
        </label>
        <a
          className="icon-button"
          href={url}
          download={envelope.payload.source.fileName}
        >
          <Download /> Download
        </a>
        <button
          className="icon-button"
          type="button"
          onClick={() => frameRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      {matches.length ? (
        <div className="search-results">
          {matches.length} matching page(s):{" "}
          {matches.map((match) => (
            <button type="button" key={match} onClick={() => setPage(match)}>
              {match}
            </button>
          ))}
        </div>
      ) : null}
      <div className="pdf-workspace" ref={frameRef}>
        <aside aria-label="Page thumbnails">
          {Array.from({ length: pages }, (_, index) => (
            <button
              className={page === index + 1 ? "active" : ""}
              type="button"
              key={index}
              onClick={() => setPage(index + 1)}
            >
              <span>{index + 1}</span>
              <FileText />
            </button>
          ))}
        </aside>
        <div className="pdf-page">
          {error ? (
            <div className="renderer-state" role="alert">
              <FileText />
              <h2>PDF failed to load</h2>
              <p>{error}</p>
            </div>
          ) : pages ? (
            <canvas ref={canvasRef} />
          ) : (
            <div className="document-loading">
              <LoaderCircle className="spin" />
              <span>Loading PDF · {progress}%</span>
              <progress value={progress} max="100" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DocxView({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "document.docx" }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState("Loading document…");
  const [error, setError] = useState<string>();
  const url = sourceUrl(envelope.payload.source);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Document request failed (${response.status})`);
        setProgress("Rendering paragraphs, tables and images…");
        return response.arrayBuffer();
      })
      .then(async (buffer) => {
        const { renderAsync } = await import("docx-preview");
        if (!active || !containerRef.current) return;
        containerRef.current.replaceChildren();
        await renderAsync(buffer, containerRef.current, undefined, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          useBase64URL: true,
        });
        setProgress("");
      })
      .catch((cause) => {
        if (active && cause.name !== "AbortError")
          setError(
            cause instanceof Error ? cause.message : "DOCX failed to render",
          );
      });
    return () => {
      active = false;
      controller.abort();
      if (containerRef.current) containerRef.current.replaceChildren();
    };
  }, [url]);
  return (
    <section className="docx-renderer" data-testid="docx-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">
          Browser preview · original styles preserved where supported
        </span>
        <a
          className="icon-button"
          href={url}
          download={envelope.payload.source.fileName}
        >
          <Download /> Original
        </a>
      </div>
      {error ? (
        <div className="renderer-state" role="alert">
          <FileText />
          <h2>DOCX preview unavailable</h2>
          <p>{error}</p>
          <a className="button secondary" href={url} download>
            <FileDown /> Download original
          </a>
        </div>
      ) : (
        <>
          {progress ? (
            <div className="document-loading">
              <LoaderCircle className="spin" />
              {progress}
            </div>
          ) : null}
          <div ref={containerRef} className="docx-stage" />
        </>
      )}
    </section>
  );
}

function SpreadsheetView({
  envelope,
  onEvent,
}: {
  envelope: SpreadsheetEnvelope;
  onEvent?: RendererComponentProps["onEvent"];
}) {
  const [sheets, setSheets] = useState(envelope.payload.sheets ?? []);
  const [active, setActive] = useState(
    envelope.payload.activeSheet ?? envelope.payload.sheets?.[0]?.name ?? "",
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(
    Boolean(envelope.payload.source && !envelope.payload.sheets),
  );
  useEffect(() => {
    if (!envelope.payload.source || envelope.payload.sheets) return;
    let activeRequest = true;
    const url = sourceUrl(envelope.payload.source as Source);
    void fetch(url)
      .then((response) => response.arrayBuffer())
      .then(async (buffer) => {
        const { Workbook } = await import("exceljs");
        const workbook = new Workbook();
        await workbook.xlsx.load(new Uint8Array(buffer) as never);
        const toPrimitive = (value: unknown): JsonPrimitive => {
          if (value === null || value === undefined) return null;
          if (["string", "number", "boolean"].includes(typeof value))
            return value as JsonPrimitive;
          if (value instanceof Date) return value.toISOString();
          if (typeof value === "object") {
            const cell = value as {
              result?: unknown;
              text?: string;
              richText?: Array<{ text: string }>;
            };
            if (cell.result !== undefined) return toPrimitive(cell.result);
            if (cell.text !== undefined) return cell.text;
            if (cell.richText) return cell.richText.map((part) => part.text).join("");
          }
          return String(value);
        };
        const parsed = workbook.worksheets.map((worksheet) => {
          const rows: JsonPrimitive[][] = [];
          worksheet.eachRow({ includeEmpty: true }, (row) => {
            const values = Array.isArray(row.values) ? row.values.slice(1) : [];
            rows.push(values.map(toPrimitive));
          });
          return { name: worksheet.name, rows };
        });
        if (activeRequest) {
          setSheets(parsed);
          setActive(parsed[0]?.name ?? "");
          setLoading(false);
        }
      })
      .catch((cause) => {
        if (activeRequest) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Spreadsheet failed to parse",
          );
          setLoading(false);
        }
      });
    return () => {
      activeRequest = false;
    };
  }, [envelope.payload]);
  const sheet = sheets.find((item) => item.name === active) ?? sheets[0];
  const rows = useMemo(
    () =>
      sheet?.rows.filter(
        (row) =>
          !query ||
          row.some((cell) =>
            String(cell).toLowerCase().includes(query.toLowerCase()),
          ),
      ) ?? [],
    [query, sheet],
  );
  const exportCsv = () => {
    if (!sheet) return;
    const csv = sheet.rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
          })
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sheet.name}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section
      className="spreadsheet-renderer"
      data-testid="spreadsheet-renderer"
    >
      <div className="renderer-toolbar">
        <div className="sheet-tabs">
          {sheets.map((item) => (
            <button
              type="button"
              className={active === item.name ? "active" : ""}
              key={item.name}
              onClick={() => setActive(item.name)}
            >
              <Sheet /> {item.name}
            </button>
          ))}
        </div>
        <label className="toolbar-search">
          <Search />
          <span className="sr-only">Search sheet</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find cells"
          />
        </label>
        <button
          className="icon-button"
          type="button"
          onClick={exportCsv}
        >
          <Download /> CSV
        </button>
        <button
          className="button primary compact"
          type="button"
          onClick={() =>
            onEvent?.({
              type: "renderer.action",
              renderer: "document.spreadsheet",
              action: "convert-to-chart",
              payload: { sheet: active, rows: sheet?.rows.slice(0, 1_000) },
            })
          }
        >
          <BarChart3 /> Chart
        </button>
      </div>
      {loading ? (
        <div className="document-loading">
          <LoaderCircle className="spin" /> Parsing workbook…
        </div>
      ) : error ? (
        <div className="renderer-state" role="alert">
          <Sheet />
          <h2>Spreadsheet failed to load</h2>
          <p>{error}</p>
        </div>
      ) : sheet ? (
        <div className="sheet-scroll">
          <table>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {<th scope="row">{rowIndex + 1}</th>}
                  {row.map((cell, columnIndex) =>
                    rowIndex === 0 ? (
                      <th scope="col" key={columnIndex}>
                        {String(cell ?? "")}
                      </th>
                    ) : (
                      <td key={columnIndex}>{String(cell ?? "")}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No sheets in this workbook.</div>
      )}
    </section>
  );
}

function PresentationView({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "document.presentation" }>;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string>();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const url = sourceUrl(envelope.payload.source);
  const convert = async () => {
    setStatus("loading");
    setError(undefined);
    try {
      const source = await fetch(url);
      if (!source.ok)
        throw new Error(`Source request failed (${source.status})`);
      const file = new File(
        [await source.blob()],
        envelope.payload.source.fileName ?? "presentation.pptx",
        { type: envelope.payload.source.mimeType },
      );
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/convert-office", {
        method: "POST",
        body,
      });
      if (!response.ok) {
        const detail = (await response
          .json()
          .catch(() => ({ error: "Conversion service unavailable" }))) as {
          error?: string;
        };
        throw new Error(
          detail.error ?? `Conversion failed (${response.status})`,
        );
      }
      setPdfUrl(URL.createObjectURL(await response.blob()));
      setStatus("ready");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Conversion failed");
    }
  };
  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );
  return (
    <section
      className="presentation-renderer"
      data-testid="presentation-renderer"
    >
      <div className="renderer-toolbar">
        <span className="toolbar-note">LibreOffice headless → PDF.js</span>
        <button
          className="button primary compact"
          type="button"
          disabled={status === "loading"}
          onClick={() => void convert()}
        >
          {status === "loading" ? (
            <LoaderCircle className="spin" />
          ) : (
            <FileDown />
          )}{" "}
          Convert to PDF
        </button>
        <a
          className="icon-button"
          href={url}
          download={envelope.payload.source.fileName}
        >
          <Download /> Original
        </a>
      </div>
      {pdfUrl ? (
        <iframe
          title="Converted presentation PDF"
          src={pdfUrl}
          className="presentation-pdf"
        />
      ) : (
        <div className="presentation-fallback">
          <div className="slide-mock">
            <p>MODELCANVAS</p>
            <h2>A universal rendering bridge</h2>
            <div>
              <span>Validate</span>
              <ChevronRight />
              <span>Resolve</span>
              <ChevronRight />
              <span>Render safely</span>
            </div>
            <small>
              Fixture preview · use the converter for source fidelity
            </small>
          </div>
          {status === "error" ? (
            <div className="inline-error" role="alert">
              <ServerOff />
              <span>
                <strong>Conversion service unavailable</strong>
                {error}
              </span>
            </div>
          ) : (
            <p>
              Start the optional Docker service for a real PPTX → PDF
              conversion. The original file remains downloadable.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function EpubView({ envelope }: { envelope: EpubEnvelope }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<import("epubjs").Rendition | null>(null);
  const bookRef = useRef<import("epubjs").Book | null>(null);
  const [toc, setToc] = useState<import("epubjs").NavigationItem[]>([]);
  const [fontSize, setFontSize] = useState(100);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const url = sourceUrl(envelope.payload.source);
  useEffect(() => {
    let active = true;
    void import("epubjs").then(async ({ default: ePub }) => {
      if (!active || !stageRef.current) return;
      try {
        const book = ePub(url);
        bookRef.current = book;
        await book.ready;
        const navigation = await book.loaded.navigation;
        if (!active) return;
        setToc(navigation.toc);
        const rendition = book.renderTo(stageRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
        });
        renditionRef.current = rendition;
        rendition.themes.register("light", {
          body: { color: "#182038", background: "#fff" },
        });
        rendition.themes.register("dark", {
          body: { color: "#e9efff", background: "#11182b" },
        });
        rendition.themes.select(
          document.documentElement.dataset.theme === "dark" ? "dark" : "light",
        );
        rendition.on("relocated", (location) =>
          setProgress(Math.round((location.start.percentage ?? 0) * 100)),
        );
        await rendition.display(envelope.payload.initialChapter);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "EPUB failed to load",
        );
      }
    });
    return () => {
      active = false;
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
  }, [envelope.payload.initialChapter, url]);
  useEffect(
    () => renditionRef.current?.themes.fontSize(`${fontSize}%`),
    [fontSize],
  );
  return (
    <section className="epub-renderer">
      <div className="renderer-toolbar">
        <button
          className="icon-button compact"
          type="button"
          onClick={() => void renditionRef.current?.prev()}
        >
          <ChevronLeft /> Previous
        </button>
        <button
          className="icon-button compact"
          type="button"
          onClick={() => void renditionRef.current?.next()}
        >
          Next <ChevronRight />
        </button>
        <label>
          Font{" "}
          <input
            type="range"
            min="75"
            max="160"
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
          />
        </label>
        <output>{progress}% read</output>
        <a
          className="icon-button"
          href={url}
          download={envelope.payload.source.fileName}
        >
          <Download /> EPUB
        </a>
      </div>
      {error ? (
        <div className="renderer-state" role="alert">
          <BookOpen />
          <h2>EPUB failed to load</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="epub-workspace">
          <aside>
            {toc.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => void renditionRef.current?.display(item.href)}
              >
                {item.label}
              </button>
            ))}
          </aside>
          <div ref={stageRef} className="epub-stage" />
        </div>
      )}
    </section>
  );
}

export default function DocumentRenderer({
  envelope,
  onEvent,
}: RendererComponentProps) {
  if (envelope.type === "document.pdf")
    return (
      <PdfView
        envelope={
          envelope as Extract<KnownRenderEnvelope, { type: "document.pdf" }>
        }
      />
    );
  if (envelope.type === "document.docx")
    return (
      <DocxView
        envelope={
          envelope as Extract<KnownRenderEnvelope, { type: "document.docx" }>
        }
      />
    );
  if (envelope.type === "document.spreadsheet")
    return (
      <SpreadsheetView
        envelope={envelope as SpreadsheetEnvelope}
        onEvent={onEvent}
      />
    );
  if (envelope.type === "document.presentation")
    return (
      <PresentationView
        envelope={
          envelope as Extract<
            KnownRenderEnvelope,
            { type: "document.presentation" }
          >
        }
      />
    );
  if (envelope.type === "document.epub")
    return <EpubView envelope={envelope as EpubEnvelope} />;
  throw new Error("Document renderer received an incompatible envelope");
}
