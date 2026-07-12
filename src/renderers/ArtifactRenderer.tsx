"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Code2,
  Download,
  Eraser,
  Eye,
  Maximize2,
  Play,
  RotateCcw,
  ShieldAlert,
  Square,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";
import { buildArtifactSrcDoc } from "@/src/security";

type HtmlEnvelope = Extract<KnownRenderEnvelope, { type: "artifact.html" }>;
type ReactEnvelope = Extract<KnownRenderEnvelope, { type: "artifact.react" }>;
type PythonEnvelope = Extract<KnownRenderEnvelope, { type: "artifact.python" }>;

function downloadText(content: string, name: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeInlineScript(content: string) {
  return content.replace(/<\/script/gi, "<\\/script");
}

function ArtifactTabs({
  tab,
  setTab,
}: {
  tab: "preview" | "code";
  setTab: (tab: "preview" | "code") => void;
}) {
  return (
    <div className="segmented">
      <button
        type="button"
        className={tab === "preview" ? "active" : ""}
        onClick={() => setTab("preview")}
      >
        <Eye /> Preview
      </button>
      <button
        type="button"
        className={tab === "code" ? "active" : ""}
        onClick={() => setTab("code")}
      >
        <Code2 /> Code
      </button>
    </div>
  );
}

function HtmlArtifact({ envelope }: { envelope: HtmlEnvelope }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [running, setRunning] = useState(true);
  const [key, setKey] = useState(0);
  const [logs, setLogs] = useState<Array<{ level: string; message: string }>>(
    [],
  );
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const srcDoc = useMemo(
    () =>
      buildArtifactSrcDoc(
        envelope.payload.html,
        envelope.payload.allowedOrigins,
      ),
    [envelope.payload],
  );
  useEffect(() => {
    if (!running) return;
    setReady(false);
    const listener = (event: MessageEvent) => {
      if (
        event.source !== frameRef.current?.contentWindow ||
        !event.data ||
        event.data.channel !== "modelcanvas-artifact"
      )
        return;
      if (event.data.level === "ready") {
        setReady(true);
        return;
      }
      setLogs((current) => [
        ...current.slice(-99),
        {
          level: String(event.data.level),
          message: Array.isArray(event.data.args)
            ? event.data.args.join(" ")
            : "",
        },
      ]);
    };
    window.addEventListener("message", listener);
    const timeout = window.setTimeout(() => {
      if (!ready)
        setLogs((current) => [
          ...current,
          {
            level: "error",
            message: `Runtime did not become ready within ${envelope.payload.timeoutMs} ms`,
          },
        ]);
    }, envelope.payload.timeoutMs);
    return () => {
      window.removeEventListener("message", listener);
      window.clearTimeout(timeout);
    };
  }, [envelope.payload.timeoutMs, key, ready, running]);
  return (
    <section className="artifact-renderer" data-testid="html-artifact">
      <div className="artifact-security">
        <ShieldAlert />
        <span>
          <strong>Untrusted HTML</strong> · sandbox iframe · no same-origin ·{" "}
          {envelope.payload.allowedOrigins.length
            ? `${envelope.payload.allowedOrigins.length} network origin(s)`
            : "network off"}
        </span>
      </div>
      <div className="renderer-toolbar">
        <ArtifactTabs tab={tab} setTab={setTab} />
        <button
          className="icon-button"
          type="button"
          onClick={() => setRunning((value) => !value)}
        >
          {running ? <Square /> : <Play />}
          {running ? "Stop" : "Run"}
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => {
            setKey((value) => value + 1);
            setRunning(true);
            setLogs([]);
          }}
        >
          <RotateCcw /> Reset
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => containerRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            downloadText(
              envelope.payload.html,
              `${envelope.id}.html`,
              "text/html",
            )
          }
        >
          <Download /> HTML
        </button>
      </div>
      <div className="artifact-stage" ref={containerRef}>
        {tab === "code" ? (
          <pre className="artifact-code">{envelope.payload.html}</pre>
        ) : running ? (
          <iframe
            key={key}
            ref={frameRef}
            title={envelope.presentation?.title ?? "HTML artifact"}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="artifact-stopped">
            <Square />
            <h2>Runtime stopped</h2>
            <p>The iframe was removed and its execution context released.</p>
          </div>
        )}
      </div>
      <div className="console-panel">
        <header>
          <Terminal /> Console{" "}
          <span>{ready ? "ready" : running ? "starting" : "stopped"}</span>
          <button type="button" onClick={() => setLogs([])}>
            <Eraser /> Clear
          </button>
        </header>
        {logs.length ? (
          <div>
            {logs.map((log, index) => (
              <pre className={log.level} key={`${index}-${log.message}`}>
                [{log.level}] {log.message}
              </pre>
            ))}
          </div>
        ) : (
          <p>No console output</p>
        )}
      </div>
    </section>
  );
}

const allowedReactDependencies = new Set(["react"]);

function ReactArtifact({ envelope }: { envelope: ReactEnvelope }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [key, setKey] = useState(0);
  const [running, setRunning] = useState(true);
  const [status, setStatus] = useState("starting");
  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState({ ...envelope.payload.files });
  const [activeFile, setActiveFile] = useState(envelope.payload.entry);
  const [runtimeSource, setRuntimeSource] = useState<string>();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const unsafe = Object.keys(envelope.payload.dependencies).filter(
    (name) => !allowedReactDependencies.has(name),
  );
  useEffect(() => {
    let active = true;
    void fetch("/react-artifact-runtime.js")
      .then((response) => {
        if (!response.ok)
          throw new Error(`Runtime request failed (${response.status})`);
        return response.text();
      })
      .then((source) => {
        if (active) setRuntimeSource(source);
      })
      .catch((cause) => {
        setStatus("error");
        setLogs([
          cause instanceof Error ? cause.message : "Runtime failed to load",
        ]);
      });
    return () => {
      active = false;
    };
  }, []);
  const srcDoc = useMemo(
    () =>
      `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src data:"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{min-height:100%;margin:0}body{background:#0d1323;color:#eef2ff}</style></head><body><div id="root"></div><script>${escapeInlineScript(runtimeSource ?? "")}</script></body></html>`,
    [runtimeSource],
  );
  const sendFiles = () =>
    frameRef.current?.contentWindow?.postMessage(
      {
        channel: "modelcanvas-react",
        type: "run",
        entry: envelope.payload.entry,
        files,
      },
      "*",
    );
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.source !== frameRef.current?.contentWindow ||
        event.data?.channel !== "modelcanvas-react"
      )
        return;
      if (event.data.type === "runtime-ready") sendFiles();
      if (event.data.type === "ready") setStatus("ready");
      if (event.data.type === "error") {
        setStatus("error");
        setLogs((current) => [
          ...current.slice(-49),
          String(event.data.message),
        ]);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  });
  useEffect(() => {
    if (!running) return;
    setStatus("compiling");
    const refresh = window.setTimeout(sendFiles, 450);
    return () => window.clearTimeout(refresh);
  }, [files, key, running]);
  useEffect(() => {
    if (!running || status === "ready" || status === "error") return;
    const timeout = window.setTimeout(() => {
      setStatus("error");
      setLogs((current) => [
        ...current,
        `Compilation exceeded ${envelope.payload.timeoutMs} ms`,
      ]);
    }, envelope.payload.timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [envelope.payload.timeoutMs, key, running, status]);
  if (unsafe.length)
    return (
      <div className="renderer-state" role="alert">
        <TriangleAlert />
        <h2>Dependency policy rejected this artifact</h2>
        <p>Not available in the offline allow-list: {unsafe.join(", ")}</p>
      </div>
    );
  return (
    <section
      className="artifact-renderer react-artifact"
      data-testid="react-artifact"
    >
      <div className="artifact-security">
        <ShieldAlert />
        <span>
          <strong>React sandbox</strong> · local TypeScript compiler · no
          network · isolated origin
        </span>
      </div>
      <div className="renderer-toolbar">
        <ArtifactTabs tab={tab} setTab={setTab} />
        <button
          className="icon-button"
          type="button"
          onClick={() => setRunning((value) => !value)}
        >
          {running ? <Square /> : <Play />} {running ? "Stop" : "Run"}
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => {
            setFiles({ ...envelope.payload.files });
            setActiveFile(envelope.payload.entry);
            setLogs([]);
            setStatus("starting");
            setRunning(true);
            setKey((value) => value + 1);
          }}
        >
          <RotateCcw /> Reset
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => containerRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            downloadText(
              Object.entries(files)
                .map(([name, code]) => `// ${name}\n${code}`)
                .join("\n\n"),
              `${envelope.id}.txt`,
            )
          }
        >
          <Download /> Export
        </button>
      </div>
      <div className="local-react-stage" ref={containerRef}>
        {tab === "code" ? (
          <div className="local-react-editor">
            <div className="filter-row">
              {Object.keys(files).map((name) => (
                <button
                  type="button"
                  className={name === activeFile ? "active" : ""}
                  key={name}
                  onClick={() => setActiveFile(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <textarea
              aria-label="React artifact code"
              value={files[activeFile] ?? ""}
              onChange={(event) =>
                setFiles((current) => ({
                  ...current,
                  [activeFile]: event.target.value,
                }))
              }
              spellCheck={false}
            />
          </div>
        ) : running && runtimeSource ? (
          <iframe
            key={key}
            ref={frameRef}
            title="React artifact preview"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            srcDoc={srcDoc}
            onLoad={sendFiles}
          />
        ) : running ? (
          <div className="inline-loader">Loading local React runtime…</div>
        ) : (
          <div className="artifact-stopped">
            <Square />
            <h2>Runtime stopped</h2>
          </div>
        )}
      </div>
      <div className="console-panel">
        <header>
          <Terminal /> React runtime <span>{status}</span>
          <button type="button" onClick={() => setLogs([])}>
            <Eraser /> Clear
          </button>
        </header>
        {logs.length ? (
          logs.map((log, index) => <pre key={`${index}-${log}`}>{log}</pre>)
        ) : (
          <p>No compiler errors</p>
        )}
      </div>
    </section>
  );
}

interface PythonOutput {
  type: "stdout" | "stderr" | "result";
  text: string;
}

function PythonArtifact({ envelope }: { envelope: PythonEnvelope }) {
  const [code, setCode] = useState(envelope.payload.code);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Ready in isolated Worker");
  const [outputs, setOutputs] = useState<PythonOutput[]>([]);
  const [workerKey, setWorkerKey] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const canLoadPackages =
    envelope.security?.allowNetwork === true &&
    envelope.security.allowedOrigins.some(
      (origin) => origin.includes("jsdelivr") || origin.includes("pyodide"),
    );
  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus("stopped");
    setMessage("Worker terminated");
  };
  const run = () => {
    stop();
    setOutputs([]);
    setStatus("loading");
    setMessage("Starting Worker…");
    const worker = new Worker(
      new URL("../workers/python.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    const timeout = window.setTimeout(() => {
      worker.terminate();
      setStatus("error");
      setMessage(
        `Execution exceeded ${envelope.payload.timeoutMs} ms and was terminated`,
      );
    }, envelope.payload.timeoutMs);
    worker.onmessage = (event: MessageEvent<Record<string, unknown>>) => {
      if (event.data.type === "status") {
        setStatus(String(event.data.status));
        setMessage(String(event.data.message));
        if (event.data.status === "complete" || event.data.status === "error")
          window.clearTimeout(timeout);
      }
      if (event.data.type === "stdout" || event.data.type === "stderr")
        setOutputs((current) => [
          ...current,
          {
            type: event.data.type as "stdout" | "stderr",
            text: String(event.data.text),
          },
        ]);
      if (event.data.type === "result" && event.data.value !== undefined)
        setOutputs((current) => [
          ...current,
          { type: "result", text: String(event.data.value) },
        ]);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      setStatus("error");
      setMessage(event.message);
    };
    worker.postMessage({
      type: "run",
      code,
      packages: envelope.payload.packages,
      allowPackages: canLoadPackages,
    });
  };
  useEffect(() => () => workerRef.current?.terminate(), [workerKey]);
  const fixture = envelope.payload.fixtureOutput;
  return (
    <section
      className="artifact-renderer python-artifact"
      data-testid="python-artifact"
    >
      <div className="artifact-security">
        <ShieldAlert />
        <span>
          <strong>Python Worker</strong> · host DOM unavailable · terminable
          runtime ·{" "}
          {canLoadPackages ? "approved package origin" : "network off"}
        </span>
      </div>
      <div className="renderer-toolbar">
        <button
          className="button primary compact"
          type="button"
          onClick={run}
          disabled={status === "loading" || status === "running"}
        >
          <Play /> Run
        </button>
        <button className="icon-button" type="button" onClick={stop}>
          <Square /> Stop
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => {
            stop();
            setCode(envelope.payload.code);
            setOutputs([]);
            setStatus("idle");
            setMessage("Environment cleared");
            setWorkerKey((value) => value + 1);
          }}
        >
          <RotateCcw /> Clear environment
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            downloadText(code, `${envelope.id}.py`, "text/x-python")
          }
        >
          <Download /> Python
        </button>
      </div>
      {envelope.payload.packages.length && !canLoadPackages ? (
        <div className="guard-banner">
          <TriangleAlert /> Scientific wheels (
          {envelope.payload.packages.join(", ")}) are not fetched because
          network access is off. The deterministic fixture output below is
          labeled and the Worker will report the policy error.
        </div>
      ) : null}
      <div className="python-grid">
        <textarea
          className="python-editor"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          aria-label="Python code"
        />
        <div className="python-output">
          <header>
            <Terminal /> {status}
            <span>{message}</span>
          </header>
          {outputs.map((output, index) => (
            <pre className={output.type} key={`${index}-${output.text}`}>
              {output.text}
            </pre>
          ))}
          {!outputs.length && fixture ? (
            <div className="fixture-output">
              <p className="eyebrow">
                Example output · fixture, not live execution
              </p>
              {fixture.stdout ? <pre>{fixture.stdout}</pre> : null}
              {fixture.table ? (
                <table>
                  <thead>
                    <tr>
                      {fixture.table.columns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fixture.table.rows.map((row, index) => (
                      <tr key={index}>
                        {fixture.table!.columns.map((column) => (
                          <td key={column.key}>
                            {String(row[column.key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function ArtifactRenderer({ envelope }: RendererComponentProps) {
  if (envelope.type === "artifact.html")
    return <HtmlArtifact envelope={envelope as HtmlEnvelope} />;
  if (envelope.type === "artifact.react")
    return <ReactArtifact envelope={envelope as ReactEnvelope} />;
  if (envelope.type === "artifact.python")
    return <PythonArtifact envelope={envelope as PythonEnvelope} />;
  throw new Error("Artifact renderer received an incompatible envelope");
}
