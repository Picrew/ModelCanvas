"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Blocks,
  Braces,
  ShieldAlert,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { defaultScenario } from "@/src/fixtures";
import { deserializeRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";
import { InspectorPanel } from "./InspectorPanel";
import { LanguageToggle, useLanguage } from "./i18n";
import { RendererHost, type RendererInspection } from "./RendererHost";

const dangerousPreset = JSON.stringify(
  {
    id: "blocked-html",
    type: "artifact.html",
    version: "1.0.0",
    payload: {
      html: "<h1>Isolated</h1><script>parent.document.body.innerHTML='pwned'<\/script><img src=x onerror=alert(1)>",
      allowedOrigins: [],
      timeoutMs: 5000,
    },
    security: {
      trusted: false,
      sandbox: true,
      allowScripts: true,
      allowNetwork: false,
      allowedOrigins: [],
    },
    fallback: { text: "Artifact blocked or isolated" },
  },
  null,
  2,
);
const invalidPreset = JSON.stringify(
  {
    id: "bad-weather",
    type: "widget.weather",
    version: "1.0.0",
    payload: { location: "Beijing", humidity: 140 },
  },
  null,
  2,
);

export function ProtocolInspector() {
  const { tr } = useLanguage();
  const [raw, setRaw] = useState(
    JSON.stringify(defaultScenario.envelope, null, 2),
  );
  const [inspection, setInspection] = useState<RendererInspection>();
  const result = useMemo(() => deserializeRenderEnvelope(raw), [raw]);
  const envelope = result.success
    ? result.data
    : (defaultScenario.envelope as AnyRenderEnvelope);
  return (
    <main className="docs-shell inspector-page">
      <header className="docs-topbar">
        <Link href="/" className="button secondary">
          <ArrowLeft /> {tr("Playground", "工作台")}
        </Link>
        <div className="brand-link">
          <span className="logo-mark">
            <Blocks />
          </span>
          <span>
            <strong>{tr("Protocol Inspector", "协议检查器")}</strong>
            <small>
              {tr("Validate · resolve · trace", "验证 · 解析 · 追踪")}
            </small>
          </span>
        </div>
        <div className="docs-actions">
          <LanguageToggle />
          <Link href="/gallery" className="button secondary">
            <Braces /> {tr("Gallery", "组件库")}
          </Link>
        </div>
      </header>
      <section className="docs-hero compact">
        <p className="eyebrow">{tr("Protocol workbench", "协议工作台")}</p>
        <h1>{tr("Inspect a RenderEnvelope", "检查 RenderEnvelope")}</h1>
        <p>
          {tr(
            "Edit the input and follow validation, renderer selection, and fallback behavior before anything is rendered.",
            "编辑输入内容，并在渲染前查看验证、渲染器选择和备用处理过程。",
          )}
        </p>
      </section>
      <div className="inspector-workbench">
        <section className="envelope-editor">
          <header>
            <div>
              <p className="eyebrow">{tr("Input", "输入")}</p>
              <h2>{tr("Raw envelope", "原始数据")}</h2>
            </div>
            <div>
              <button
                type="button"
                onClick={() =>
                  setRaw(JSON.stringify(defaultScenario.envelope, null, 2))
                }
              >
                <WandSparkles /> {tr("Valid", "有效")}
              </button>
              <button type="button" onClick={() => setRaw(invalidPreset)}>
                <ShieldAlert /> {tr("Invalid", "无效")}
              </button>
              <button type="button" onClick={() => setRaw(dangerousPreset)}>
                <ShieldCheck /> {tr("Sandbox", "沙箱")}
              </button>
            </div>
          </header>
          <textarea
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            spellCheck={false}
            aria-label={tr(
              "Raw RenderEnvelope JSON",
              "原始 RenderEnvelope JSON",
            )}
          />
        </section>
        <section className="inspector-output">
          <div className="inspector-render-stage">
            {result.success ? (
              <RendererHost
                envelope={result.data}
                onInspection={setInspection}
              />
            ) : (
              <div className="renderer-state" role="alert">
                <ShieldAlert />
                <p className="eyebrow">{tr("Render blocked", "渲染已阻止")}</p>
                <h2>{tr("Fix validation issues first", "请先修复验证问题")}</h2>
                <p>
                  {tr(
                    "Invalid model output never reaches a renderer module.",
                    "无效的模型输出不会进入任何渲染器模块。",
                  )}
                </p>
              </div>
            )}
          </div>
          <InspectorPanel
            envelope={envelope}
            parseResult={result}
            inspection={inspection}
          />
        </section>
      </div>
    </main>
  );
}
