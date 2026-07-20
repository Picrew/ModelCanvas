"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Code2,
  Download,
  Eraser,
  Eye,
  Focus,
  Gamepad2,
  Maximize2,
  Play,
  RotateCcw,
  ShieldAlert,
  Square,
  Terminal,
} from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";
import { buildGameCanvasSrcDoc } from "@/src/security";

type GameCanvasEnvelope = Extract<KnownRenderEnvelope, { type: "game.canvas" }>;

type RuntimeLog = { level: string; message: string };

function downloadGame(html: string, id: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${id}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Controls({ envelope }: { envelope: GameCanvasEnvelope }) {
  if (!envelope.payload.controls.length) return null;
  return (
    <div className="game-control-guide" aria-label="Game controls">
      <Gamepad2 />
      {envelope.payload.controls.map((control) => (
        <span key={`${control.keys.join("+")}-${control.action}`}>
          <kbd>{control.keys.join(" / ")}</kbd> {control.action}
        </span>
      ))}
    </div>
  );
}

function GameCanvas({ envelope }: { envelope: GameCanvasEnvelope }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [running, setRunning] = useState(true);
  const [runtimeKey, setRuntimeKey] = useState(0);
  const [status, setStatus] = useState<"starting" | "ready" | "stopped">(
    "starting",
  );
  const [logs, setLogs] = useState<RuntimeLog[]>([]);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const srcDoc = useMemo(
    () =>
      buildGameCanvasSrcDoc(
        envelope.payload.html,
        envelope.payload.allowedOrigins,
      ),
    [envelope.payload.allowedOrigins, envelope.payload.html],
  );
  const stageHeight = Math.min(
    760,
    Math.max(390, envelope.presentation?.height ?? envelope.payload.height),
  );

  const focusGame = useCallback(() => {
    frameRef.current?.focus();
    frameRef.current?.contentWindow?.focus();
  }, []);

  useEffect(() => {
    if (!running) return;
    readyRef.current = false;
    setStatus("starting");
    const listener = (event: MessageEvent) => {
      if (
        event.source !== frameRef.current?.contentWindow ||
        event.data?.channel !== "modelcanvas-game"
      )
        return;
      if (event.data.type === "ready") {
        readyRef.current = true;
        setStatus("ready");
        focusGame();
        return;
      }
      if (event.data.type === "event") {
        const detail =
          event.data.detail == null
            ? ""
            : ` ${JSON.stringify(event.data.detail)}`;
        setLogs((current) => [
          ...current.slice(-99),
          { level: "event", message: `${String(event.data.event)}${detail}` },
        ]);
        return;
      }
      if (event.data.type === "console")
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
      if (!readyRef.current)
        setLogs((current) => [
          ...current,
          {
            level: "error",
            message: `Game did not become ready within ${envelope.payload.timeoutMs} ms`,
          },
        ]);
    }, envelope.payload.timeoutMs);
    return () => {
      window.removeEventListener("message", listener);
      window.clearTimeout(timeout);
    };
  }, [envelope.payload.timeoutMs, focusGame, running, runtimeKey]);

  return (
    <section
      className="artifact-renderer game-canvas-renderer"
      data-testid="game-canvas"
    >
      <div className="artifact-security">
        <ShieldAlert />
        <span>
          <strong>Canvas game sandbox</strong> · isolated iframe · keyboard and
          pointer input ·{" "}
          {envelope.payload.allowedOrigins.length
            ? "allow-listed network"
            : "network off"}
        </span>
      </div>
      <div className="renderer-toolbar">
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
        <button
          className="icon-button"
          type="button"
          onClick={() => {
            setRunning((value) => {
              const next = !value;
              setStatus(next ? "starting" : "stopped");
              return next;
            });
          }}
        >
          {running ? <Square /> : <Play />}
          {running ? "Stop" : "Run"}
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => {
            setRuntimeKey((value) => value + 1);
            setRunning(true);
            setLogs([]);
          }}
        >
          <RotateCcw /> Restart
        </button>
        <button className="icon-button" type="button" onClick={focusGame}>
          <Focus /> Focus game
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => void containerRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => downloadGame(envelope.payload.html, envelope.id)}
        >
          <Download /> HTML
        </button>
      </div>
      <Controls envelope={envelope} />
      <div className="artifact-stage game-canvas-stage" ref={containerRef}>
        {tab === "code" ? (
          <pre className="artifact-code" style={{ height: stageHeight }}>
            {envelope.payload.html}
          </pre>
        ) : running ? (
          <iframe
            key={runtimeKey}
            ref={frameRef}
            title={`Canvas game preview: ${envelope.presentation?.title ?? envelope.id}`}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            referrerPolicy="no-referrer"
            tabIndex={0}
            style={{ height: stageHeight }}
            onLoad={focusGame}
          />
        ) : (
          <div className="artifact-stopped" style={{ minHeight: stageHeight }}>
            <Square />
            <h2>Game stopped</h2>
            <p>The animation loop and input listeners were released.</p>
          </div>
        )}
      </div>
      <div className="console-panel">
        <header>
          <Terminal /> Game runtime <span>{status}</span>
          <small>
            {envelope.payload.width} × {envelope.payload.height}
          </small>
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
          <p>No game events</p>
        )}
      </div>
    </section>
  );
}

export default function GameCanvasRenderer({
  envelope,
}: RendererComponentProps) {
  if (envelope.type !== "game.canvas")
    throw new Error("Game canvas renderer received an incompatible envelope");
  return <GameCanvas envelope={envelope as GameCanvasEnvelope} />;
}
