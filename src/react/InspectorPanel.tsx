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
import { useLanguage } from "./i18n";

interface Props {
  envelope: AnyRenderEnvelope;
  parseResult: ParseResult;
  inspection?: RendererInspection;
}

export function InspectorPanel({ envelope, parseResult, inspection }: Props) {
  const { tr } = useLanguage();
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
      aria-label={tr("RenderEnvelope inspector", "RenderEnvelope 检查器")}
      data-testid="protocol-inspector"
    >
      <header>
        <div>
          <p className="eyebrow">{tr("Protocol Inspector", "协议检查器")}</p>
          <h2>{tr("Render decision", "渲染决策")}</h2>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={tab === "trace" ? "active" : ""}
            onClick={() => setTab("trace")}
          >
            <Route /> {tr("Trace", "追踪")}
          </button>
          <button
            type="button"
            className={tab === "schema" ? "active" : ""}
            onClick={() => setTab("schema")}
          >
            <ShieldCheck /> {tr("Validation", "验证")}
          </button>
          <button
            type="button"
            className={tab === "raw" ? "active" : ""}
            onClick={() => setTab("raw")}
          >
            <ChevronDown /> {tr("Raw JSON", "原始 JSON")}
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
            <Copy /> {tr("Copy JSON", "复制 JSON")}
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
                  ? tr("Envelope is valid", "Envelope 有效")
                  : tr("Envelope is invalid", "Envelope 无效")}
              </strong>
              <span>
                {parseResult.success
                  ? `Protocol ${envelope.version} · ${
                      parseResult.unknownType
                        ? tr("unknown type fallback", "未知类型备用处理")
                        : tr("exact discriminated union", "精确可辨识联合")
                    }`
                  : tr(
                      `${parseResult.issues.length} schema issue(s)`,
                      `${parseResult.issues.length} 个结构问题`,
                    )}
              </span>
            </div>
          </div>
          {parseResult.migrations.length ? (
            <div className="migration-list">
              <h3>{tr("Migrations", "迁移记录")}</h3>
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
                <CheckCircle2 /> {tr("No validation issues", "没有验证问题")}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="trace-panel">
          <div className="trace-summary">
            <div>
              <span>{tr("Selected renderer", "已选渲染器")}</span>
              <strong>
                {inspection?.displayName ?? tr("Resolving…", "正在解析…")}
              </strong>
              <code>{inspection?.rendererId ?? "—"}</code>
            </div>
            <div>
              <span>{tr("Render time", "渲染耗时")}</span>
              <strong>
                {inspection?.renderMs !== undefined
                  ? `${inspection.renderMs} ms`
                  : "—"}
              </strong>
              <Clock3 />
            </div>
            <div>
              <span>{tr("Fallback", "备用处理")}</span>
              <strong>
                {inspection?.trace.fallback ? tr("Yes", "是") : tr("No", "否")}
              </strong>
              {inspection?.trace.fallback ? (
                <AlertTriangle />
              ) : (
                <CheckCircle2 />
              )}
            </div>
          </div>
          {inspection?.capabilities ? (
            <div className="capability-row">
              <span>{tr("Capabilities", "能力")}</span>
              {inspection.capabilities.streaming ? (
                <b>{tr("Streaming", "流式")}</b>
              ) : null}
              {inspection.capabilities.editing ? (
                <b>{tr("Editing", "可编辑")}</b>
              ) : null}
              {inspection.capabilities.fullscreen ? (
                <b>{tr("Fullscreen", "全屏")}</b>
              ) : null}
              {inspection.capabilities.export?.map((format) => (
                <b key={format}>
                  {tr("Export", "导出")} {format}
                </b>
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
                {tr("Waiting for renderer resolution…", "等待渲染器解析…")}
              </div>
            ) : null}
            {candidates.length > visibleCandidates.length ? (
              <button
                className="trace-more"
                type="button"
                onClick={() => setAllCandidates(true)}
              >
                {tr(
                  `Show ${candidates.length - visibleCandidates.length} more candidates`,
                  `再显示 ${candidates.length - visibleCandidates.length} 个候选项`,
                )}
              </button>
            ) : allCandidates && candidates.length > 5 ? (
              <button
                className="trace-more"
                type="button"
                onClick={() => setAllCandidates(false)}
              >
                {tr("Show less", "收起")}
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
