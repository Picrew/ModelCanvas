"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Route,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ParseResult } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";
import type { RendererInspection } from "./RendererHost";

interface Props {
  envelope: AnyRenderEnvelope;
  parseResult: ParseResult;
  inspection?: RendererInspection;
}

export function InspectorPanel({ envelope, parseResult, inspection }: Props) {
  const [tab, setTab] = useState<"trace" | "raw" | "schema">("trace");
  const [allCandidates, setAllCandidates] = useState(false);
  const raw = useMemo(() => JSON.stringify(envelope, null, 2), [envelope]);
  const candidates = inspection?.trace.candidates ?? [];
  const visibleCandidates = allCandidates
    ? candidates
    : candidates.filter((candidate, index) => candidate.accepted || index < 4);
  return (
    <section
      className="inspector-panel"
      aria-label="RenderEnvelope inspector"
      data-testid="protocol-inspector"
    >
      <header>
        <div>
          <p className="eyebrow">Protocol Inspector</p>
          <h2>Render decision</h2>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={tab === "trace" ? "active" : ""}
            onClick={() => setTab("trace")}
          >
            <Route /> Trace
          </button>
          <button
            type="button"
            className={tab === "schema" ? "active" : ""}
            onClick={() => setTab("schema")}
          >
            <ShieldCheck /> Validation
          </button>
          <button
            type="button"
            className={tab === "raw" ? "active" : ""}
            onClick={() => setTab("raw")}
          >
            <ChevronDown /> Raw JSON
          </button>
        </div>
      </header>
      {tab === "raw" ? (
        <div className="raw-panel">
          <button
            className="icon-button"
            type="button"
            onClick={() => void navigator.clipboard.writeText(raw)}
          >
            <Copy /> Copy JSON
          </button>
          <pre>{raw}</pre>
        </div>
      ) : tab === "schema" ? (
        <div className="validation-panel">
          <div
            className={`validation-summary ${parseResult.success ? "valid" : "invalid"}`}
          >
            {parseResult.success ? <CheckCircle2 /> : <XCircle />}
            <div>
              <strong>
                {parseResult.success
                  ? "Envelope is valid"
                  : "Envelope is invalid"}
              </strong>
              <span>
                {parseResult.success
                  ? `Protocol ${envelope.version} · ${parseResult.unknownType ? "unknown type fallback" : "exact discriminated union"}`
                  : `${parseResult.issues.length} schema issue(s)`}
              </span>
            </div>
          </div>
          {parseResult.migrations.length ? (
            <div className="migration-list">
              <h3>Migrations</h3>
              {parseResult.migrations.map((migration, index) => (
                <div key={`${index}-${migration.description}`}>
                  <span>{migration.from}</span>
                  <strong>→</strong>
                  <span>{migration.to}</span>
                  <p>{migration.description}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="issue-list">
            {parseResult.issues.length ? (
              parseResult.issues.map((issue, index) => (
                <div key={`${issue.path}-${index}`}>
                  <AlertTriangle />
                  <code>{issue.path}</code>
                  <span>{issue.message}</span>
                  <small>{issue.code}</small>
                </div>
              ))
            ) : (
              <div className="empty-issues">
                <CheckCircle2 /> No validation issues
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="trace-panel">
          <div className="trace-summary">
            <div>
              <span>Selected renderer</span>
              <strong>{inspection?.displayName ?? "Resolving…"}</strong>
              <code>{inspection?.rendererId ?? "—"}</code>
            </div>
            <div>
              <span>Render time</span>
              <strong>
                {inspection?.renderMs !== undefined
                  ? `${inspection.renderMs} ms`
                  : "—"}
              </strong>
              <Clock3 />
            </div>
            <div>
              <span>Fallback</span>
              <strong>{inspection?.trace.fallback ? "Yes" : "No"}</strong>
              {inspection?.trace.fallback ? (
                <AlertTriangle />
              ) : (
                <CheckCircle2 />
              )}
            </div>
          </div>
          {inspection?.capabilities ? (
            <div className="capability-row">
              <span>Capabilities</span>
              {inspection.capabilities.streaming ? <b>Streaming</b> : null}
              {inspection.capabilities.editing ? <b>Editing</b> : null}
              {inspection.capabilities.fullscreen ? <b>Fullscreen</b> : null}
              {inspection.capabilities.export?.map((format) => (
                <b key={format}>Export {format}</b>
              ))}
            </div>
          ) : null}
          <div className="resolution-path">
            {visibleCandidates.map((candidate, index) => (
              <div
                className={candidate.accepted ? "accepted" : "rejected"}
                key={`${candidate.id}-${index}`}
              >
                <span>{index + 1}</span>
                <code>{candidate.id}</code>
                <p>{candidate.reason}</p>
                {candidate.accepted ? <CheckCircle2 /> : <XCircle />}
              </div>
            ))}
            {!inspection ? (
              <div className="trace-waiting">
                Waiting for renderer resolution…
              </div>
            ) : null}
            {candidates.length > visibleCandidates.length ? (
              <button
                className="trace-more"
                type="button"
                onClick={() => setAllCandidates(true)}
              >
                Show {candidates.length - visibleCandidates.length} more
                candidates
              </button>
            ) : allCandidates && candidates.length > 5 ? (
              <button
                className="trace-more"
                type="button"
                onClick={() => setAllCandidates(false)}
              >
                Show less
              </button>
            ) : null}
          </div>
          {inspection?.error ? (
            <div className="inline-error">{inspection.error}</div>
          ) : null}
        </div>
      )}
    </section>
  );
}
