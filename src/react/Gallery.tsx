"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Blocks,
  CheckCircle2,
  Layers3,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  allDemoScenarios,
  widgetFixtures,
  withDemoState,
} from "@/src/fixtures";
import { RendererHost } from "./RendererHost";
import { rendererRegistry } from "./renderer-registry";
import { LanguageToggle, useLanguage } from "./i18n";

export function Gallery() {
  const { tr } = useLanguage();
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All");
  const [widgetState, setWidgetState] = useState<
    "ready" | "loading" | "empty" | "error"
  >("ready");
  const manifest = rendererRegistry
    .manifest()
    .filter((item) => item.type !== "*");
  const technicalPrefixes = new Set(["math", "map", "science", "engineering"]);
  const groups = [
    "All",
    ...new Set(
      manifest.map((item) => {
        const prefix = item.type.split(".")[0] ?? "other";
        return technicalPrefixes.has(prefix) ? "Technical" : prefix;
      }),
    ),
  ];
  const filtered = manifest.filter(
    (item) =>
      (group === "All" ||
        (group === "Technical"
          ? technicalPrefixes.has(item.type.split(".")[0] ?? "")
          : item.type.startsWith(`${group}.`))) &&
      (!search ||
        `${item.displayName} ${item.type}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  const widgets = useMemo(
    () =>
      widgetFixtures.map((item) =>
        widgetState === "ready" ? item : withDemoState(item, widgetState),
      ),
    [widgetState],
  );
  return (
    <main className="docs-shell">
      <header className="docs-topbar">
        <Link href="/" className="button secondary">
          <ArrowLeft /> {tr("Playground", "工作台")}
        </Link>
        <div className="brand-link">
          <span className="logo-mark">
            <Blocks />
          </span>
          <span>
            <strong>{tr("Component Gallery", "组件库")}</strong>
            <small>
              {tr("Renderers, widgets and states", "渲染器、组件与状态")}
            </small>
          </span>
        </div>
        <div className="docs-actions">
          <LanguageToggle />
          <Link href="/inspector" className="button secondary">
            <ShieldCheck /> {tr("Inspector", "检查器")}
          </Link>
        </div>
      </header>
      <section className="docs-hero">
        <p className="eyebrow">{tr("Component Gallery", "组件库")}</p>
        <h1>{tr("Renderer registry", "渲染器注册表")}</h1>
        <p>
          {tr(
            "Search formats and capabilities, then open any renderer with its validated fixture.",
            "搜索格式和能力，并使用已验证的示例打开任意渲染器。",
          )}
        </p>
        <div className="gallery-stats">
          <div>
            <strong>{manifest.length}</strong>
            <span>{tr("registered renderers", "已注册渲染器")}</span>
          </div>
          <div>
            <strong>{widgetFixtures.length}</strong>
            <span>{tr("business widgets", "业务组件")}</span>
          </div>
          <div>
            <strong>3</strong>
            <span>{tr("rendering paths", "渲染路径")}</span>
          </div>
        </div>
      </section>
      <section className="gallery-section">
        <div className="gallery-heading">
          <div>
            <p className="eyebrow">{tr("Renderer registry", "渲染器注册表")}</p>
            <h2>{tr("All renderers", "全部渲染器")}</h2>
          </div>
          <label className="sidebar-search">
            <Search />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tr("Search renderers", "搜索渲染器")}
            />
          </label>
        </div>
        <div className="filter-row">
          {groups.map((item) => (
            <button
              type="button"
              className={group === item ? "active" : ""}
              key={item}
              onClick={() => setGroup(item)}
            >
              {item === "All" ? tr("All", "全部") : item}
            </button>
          ))}
        </div>
        <div className="capability-grid">
          {filtered.map((item) => {
            const scenario = allDemoScenarios.find(
              (demo) => demo.envelope.type === item.type,
            );
            return (
              <article key={item.id}>
                <div className="capability-icon">
                  <Layers3 />
                </div>
                <p className="eyebrow">{item.type}</p>
                <h3>{item.displayName}</h3>
                <div className="capability-tags">
                  {item.supports.streaming ? (
                    <span>{tr("Streaming", "流式")}</span>
                  ) : null}
                  {item.supports.editing ? (
                    <span>{tr("Editing", "可编辑")}</span>
                  ) : null}
                  {item.supports.fullscreen ? (
                    <span>{tr("Fullscreen", "全屏")}</span>
                  ) : null}
                  {item.supports.export?.map((format) => (
                    <span key={format}>{format}</span>
                  ))}
                </div>
                <dl>
                  <div>
                    <dt>MIME</dt>
                    <dd>
                      {item.supports.mimeTypes?.slice(0, 2).join(", ") ||
                        tr("Protocol data", "协议数据")}
                    </dd>
                  </div>
                  <div>
                    <dt>Extensions</dt>
                    <dd>
                      {item.supports.extensions
                        ?.map((value) => `.${value}`)
                        .slice(0, 4)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                </dl>
                {scenario ? (
                  <Link href={`/?scenario=${scenario.id}&case=1`}>
                    {tr("Open live demo", "打开实时示例")} →
                  </Link>
                ) : (
                  <span className="schema-ready">
                    <CheckCircle2 />{" "}
                    {tr(
                      "Schema + renderer registered",
                      "数据结构与渲染器已注册",
                    )}
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <section className="gallery-section widget-gallery">
        <div className="gallery-heading">
          <div>
            <p className="eyebrow">{tr("Controlled rendering", "受控渲染")}</p>
            <h2>{tr("Business widgets", "业务组件")}</h2>
          </div>
          <div className="segmented">
            {(["ready", "loading", "empty", "error"] as const).map((state) => (
              <button
                type="button"
                className={widgetState === state ? "active" : ""}
                key={state}
                onClick={() => setWidgetState(state)}
              >
                {state === "ready"
                  ? tr("ready", "就绪")
                  : state === "loading"
                    ? tr("loading", "加载中")
                    : state === "empty"
                      ? tr("empty", "空状态")
                      : tr("error", "错误")}
              </button>
            ))}
          </div>
        </div>
        <div className="widget-gallery-grid">
          {widgets.map((envelope) => (
            <article key={envelope.id}>
              <header>
                <code>{envelope.type}</code>
                <span>{tr("compact / full", "紧凑 / 完整")}</span>
              </header>
              <RendererHost envelope={envelope} />
            </article>
          ))}
        </div>
      </section>
      <section className="gallery-section states-grid">
        <div>
          <p className="eyebrow">{tr("Declarative", "声明式")}</p>
          <h2>{tr("Catalog only", "仅允许组件目录")}</h2>
          <p>
            {tr(
              "Dynamic forms can compose allow-listed fields, groups and wizard steps. Unknown component names never become executable React.",
              "动态表单只能组合允许列表中的字段、分组和向导步骤，未知组件名称不会成为可执行的 React。",
            )}
          </p>
          <Link className="button primary" href="/?scenario=form">
            {tr("Open form demo", "打开表单示例")}
          </Link>
        </div>
        <div>
          <p className="eyebrow">{tr("Open-ended", "开放式")}</p>
          <h2>{tr("Sandbox required", "必须使用沙箱")}</h2>
          <p>
            {tr(
              "HTML, React and Python have visible isolation, reset and stop controls. Generated code never runs in the host window.",
              "HTML、React 和 Python 都具有明确的隔离、重置和停止控制，生成的代码不会在宿主窗口中运行。",
            )}
          </p>
          <Link className="button secondary" href="/?scenario=html">
            {tr("Open sandbox demo", "打开沙箱示例")}
          </Link>
        </div>
      </section>
    </main>
  );
}
