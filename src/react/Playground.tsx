"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  BarChart3,
  Blocks,
  Braces,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  FileJson,
  FileText,
  FileUp,
  GalleryHorizontalEnd,
  History,
  Image,
  Layers3,
  Maximize2,
  Menu,
  MessageSquareText,
  Moon,
  PanelRight,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import {
  APP_BASE_PATH,
  deserializeRenderEnvelope,
  ipynbEnvelope,
  parseRenderEnvelope,
  withBasePath,
  type ParseResult,
  type RendererEvent,
} from "@/src/core";
import {
  allDemoScenarios,
  defaultScenario,
  findAnyScenario,
  type DemoScenario,
} from "@/src/fixtures";
import type {
  AnyRenderEnvelope,
  JsonPrimitive,
  KnownRenderEnvelope,
} from "@/src/schema";
import { validateFile } from "@/src/security";
import { InspectorPanel } from "./InspectorPanel";
import { LanguageToggle, useLanguage, type Locale } from "./i18n";
import { RendererHost, type RendererInspection } from "./RendererHost";
import {
  rendererCapabilityCatalog,
  rendererRegistry,
} from "./renderer-registry";

interface SessionItem {
  id: string;
  prompt: string;
  scenario: DemoScenario;
  createdAt: string;
  replayed?: boolean;
}
type ProviderId = "demo" | "deepseek" | "openai" | "anthropic" | "compatible";

const providerLabels: Record<ProviderId, string> = {
  demo: "Demo Provider",
  deepseek: "DeepSeek V4 Flash",
  openai: "OpenAI",
  anthropic: "Anthropic",
  compatible: "FreeLLM API",
};

const chineseCategoryLabels: Record<string, string> = {
  "Start here": "入门",
  Charts: "图表",
  Media: "媒体",
  "Data & spatial": "数据与空间",
  Documents: "文档",
  Artifacts: "交互作品",
  Technical: "专业技术",
};

const renderCapabilityCount = Object.keys(rendererCapabilityCatalog).length;

function downloadJson(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function inferUploadEnvelope(file: File, objectUrl: string): unknown {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const definition = rendererRegistry.resolveByExtension(extension);
  const common = {
    id: `upload-${Date.now()}`,
    version: "1.0.0",
    presentation: { title: file.name },
    source: { provider: "Local upload", createdAt: new Date().toISOString() },
    security: {
      trusted: false,
      sandbox: true,
      allowScripts: false,
      allowNetwork: false,
      allowedOrigins: [],
    },
  };
  const source = {
    url: objectUrl,
    mimeType: file.type || undefined,
    fileName: file.name,
    size: file.size,
  };
  switch (definition.type) {
    case "media.image":
      return {
        ...common,
        type: definition.type,
        payload: { source, alt: `Uploaded image ${file.name}` },
      };
    case "media.audio":
      return {
        ...common,
        type: definition.type,
        payload: { source, title: file.name, waveform: true },
      };
    case "media.video":
      return { ...common, type: definition.type, payload: { source } };
    case "document.pdf":
    case "document.docx":
    case "document.presentation":
      return { ...common, type: definition.type, payload: { source } };
    case "document.spreadsheet":
      return { ...common, type: definition.type, payload: { source } };
    case "document.epub":
      return { ...common, type: definition.type, payload: { source } };
    case "model.3d":
      return {
        ...common,
        type: definition.type,
        payload: {
          source,
          format: extension,
          background: "#0b1020",
          wireframe: false,
        },
      };
    default:
      return {
        ...common,
        type: "unknown.upload",
        payload: {},
        fallback: {
          text: `No safe preview is registered for .${extension || "unknown"}.`,
          downloadUrl: objectUrl,
        },
      };
  }
}

function csvEnvelope(text: string, file: File): unknown {
  const separator = file.name.toLowerCase().endsWith(".tsv") ? "\t" : ",";
  const lines = text.trim().split(/\r?\n/).slice(0, 100_001);
  const headers = (lines.shift() ?? "")
    .split(separator)
    .map((header) => header.trim());
  const rows = lines.map(
    (line) =>
      Object.fromEntries(
        line.split(separator).map((cell, index) => {
          const value = cell.trim();
          const number = Number(value);
          return [
            headers[index] ?? `column_${index + 1}`,
            value !== "" && Number.isFinite(number) ? number : value,
          ];
        }),
      ) as Record<string, JsonPrimitive>,
  );
  return {
    id: `csv-${Date.now()}`,
    type: "data.table",
    version: "1.0.0",
    presentation: { title: file.name },
    source: { provider: "Local upload", createdAt: new Date().toISOString() },
    payload: {
      columns: headers.map((key) => ({ key, label: key, type: "auto" })),
      rows,
      pageSize: 25,
      sourceFormat: separator === "\t" ? "tsv" : "csv",
    },
  };
}

function scenarioForEnvelope(
  envelope: KnownRenderEnvelope,
  title = "Pasted RenderEnvelope",
  replayed = false,
  locale: Locale = "en",
): DemoScenario {
  return {
    id: `custom-${envelope.id}`,
    title,
    description:
      locale === "zh"
        ? replayed
          ? "稳定复刻 · 完全一致的已验证结果"
          : "模型新生成 · 已验证结果"
        : replayed
          ? "Stable replay · identical validated envelope"
          : "Fresh model result · validated envelope",
    category: "Start here",
    prompt: title,
    envelope,
    replayed,
  };
}

export function Playground() {
  const { locale, tr } = useLanguage();
  const [scenario, setScenario] = useState(defaultScenario);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<ProviderId>("deepseek");
  const [targetType, setTargetType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<SessionItem[]>([]);
  const [inspection, setInspection] = useState<RendererInspection>();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState<string>();
  const [providerError, setProviderError] = useState<string>();
  const [dark, setDark] = useState(false);
  const [rendererOverride, setRendererOverride] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [eventNotice, setEventNotice] = useState<string>();
  const [caseMode, setCaseMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLElement>(null);
  const artifactRef = useRef<HTMLElement>(null);
  const objectUrls = useRef<string[]>([]);
  const envelope = scenario.envelope as AnyRenderEnvelope;
  const activeProviderLabel =
    provider === "demo"
      ? tr("Demo Provider", "演示模式")
      : providerLabels[provider];
  const parseResult = useMemo<ParseResult>(
    () => parseRenderEnvelope(envelope),
    [envelope],
  );
  const categories = useMemo(
    () => [...new Set(allDemoScenarios.map((item) => item.category))],
    [],
  );
  const renderTypeOptions = useMemo(
    () =>
      rendererRegistry
        .manifest()
        .filter((item) => item.type !== "*")
        .sort((left, right) => left.type.localeCompare(right.type)),
    [],
  );
  const visibleScenarios = useMemo(
    () =>
      allDemoScenarios.filter(
        (item) =>
          !search ||
          `${item.title} ${item.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [search],
  );
  const matchingRenderers = rendererRegistry.capabilities(envelope.type);

  useEffect(() => {
    const saved = localStorage.getItem("modelcanvas-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved ? saved === "dark" : prefers;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    const selectedId = new URLSearchParams(window.location.search).get(
      "scenario",
    );
    setCaseMode(
      new URLSearchParams(window.location.search).get("case") === "1",
    );
    const selected = allDemoScenarios.find((item) => item.id === selectedId);
    if (selected) setScenario(selected);
    return () => objectUrls.current.forEach(URL.revokeObjectURL);
  }, []);
  const toggleTheme = () =>
    setDark((value) => {
      const next = !value;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      localStorage.setItem("modelcanvas-theme", next ? "dark" : "light");
      return next;
    });
  const chooseScenario = (next: DemoScenario) => {
    setScenario(next);
    setRendererOverride("");
    setProviderError(undefined);
    setSidebarOpen(false);
    window.history.replaceState(
      null,
      "",
      `${APP_BASE_PATH || window.location.pathname}?scenario=${next.id}`,
    );
    window.requestAnimationFrame(() =>
      artifactRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };
  const handleInspection = useCallback(
    (value: RendererInspection) => setInspection(value),
    [],
  );
  const runPrompt = async () => {
    if (isSubmitting) return;
    const value = prompt.trim();
    if (!value) return;
    setProviderError(undefined);
    if (provider === "demo") {
      const next = targetType
        ? (allDemoScenarios.find((item) => item.envelope.type === targetType) ??
          findAnyScenario(value))
        : findAnyScenario(value);
      chooseScenario(next);
      setHistory((current) =>
        [
          {
            id: `${Date.now()}`,
            prompt: value,
            scenario: next,
            createdAt: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            replayed: true,
          },
          ...current,
        ].slice(0, 20),
      );
      setPrompt("");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(withBasePath("/api/model"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          prompt: value,
          renderType: targetType || undefined,
        }),
      });
      const responseText = await response.text();
      let body: {
        envelope?: unknown;
        error?: string;
        replayed?: boolean;
        replayId?: string;
      };
      try {
        body = JSON.parse(responseText) as typeof body;
      } catch {
        throw new Error(
          `${activeProviderLabel} gateway request failed (${response.status}).`,
        );
      }
      if (!response.ok || !body.envelope)
        throw new Error(body.error ?? `${activeProviderLabel} request failed`);
      const parsed = parseRenderEnvelope(body.envelope);
      if (!parsed.success || parsed.unknownType)
        throw new Error(
          parsed.issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join("\n"),
        );
      const next = scenarioForEnvelope(
        parsed.data as KnownRenderEnvelope,
        value,
        body.replayed,
        locale,
      );
      chooseScenario(next);
      setHistory((current) => [
        {
          id: `${Date.now()}`,
          prompt: value,
          scenario: next,
          createdAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          replayed: body.replayed,
        },
        ...current,
      ]);
      setPrompt("");
    } catch (cause) {
      setProviderError(
        cause instanceof Error ? cause.message : "Provider request failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handlePaste = () => {
    const parsed = deserializeRenderEnvelope(pasteValue);
    if (!parsed.success || parsed.unknownType) {
      setPasteError(
        parsed.issues
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join("\n"),
      );
      return;
    }
    chooseScenario(
      scenarioForEnvelope(
        parsed.data as KnownRenderEnvelope,
        tr("Pasted RenderEnvelope", "已粘贴的 RenderEnvelope"),
        false,
        locale,
      ),
    );
    setPasteOpen(false);
    setPasteError(undefined);
  };
  const handleUpload = async (file: File) => {
    const extension = file.name.split(".").pop() ?? "";
    const definition = rendererRegistry.resolveByExtension(extension);
    const policy = {
      maxBytes: 25_000_000,
      extensions: definition.supports?.extensions?.length
        ? definition.supports.extensions
        : [extension],
      mimeTypes: definition.supports?.mimeTypes?.filter(
        (mime) => !mime.endsWith("/*"),
      ) ?? [file.type],
    };
    const checked = validateFile(file, policy);
    if (!checked.ok) {
      setProviderError(checked.reason);
      return;
    }
    let input: unknown;
    if (["csv", "tsv"].includes(extension.toLowerCase()))
      input = csvEnvelope(await file.text(), file);
    else if (["json", "ipynb", "geojson"].includes(extension.toLowerCase())) {
      try {
        input = JSON.parse(await file.text()) as unknown;
        if (!(input as Record<string, unknown>)?.type) {
          if (extension.toLowerCase() === "geojson")
            input = {
              id: `geo-${file.lastModified}-${file.size}`,
              type: "map.geo",
              version: "1.0.0",
              payload: { geojson: input },
            };
          else if (extension.toLowerCase() === "ipynb")
            input = ipynbEnvelope(input, file.name);
        }
      } catch {
        setProviderError(
          tr("The uploaded JSON is malformed", "上传的 JSON 格式不正确"),
        );
        return;
      }
    } else {
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      input = inferUploadEnvelope(file, url);
    }
    const parsed = parseRenderEnvelope(input);
    if (!parsed.success) {
      setProviderError(
        parsed.issues
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join("\n"),
      );
      return;
    }
    chooseScenario(
      scenarioForEnvelope(
        parsed.data as KnownRenderEnvelope,
        file.name,
        false,
        locale,
      ),
    );
  };
  const handleEvent = (event: RendererEvent) => {
    if (event.action === "convert-to-chart" && envelope.type === "data.table") {
      const columns = envelope.payload.columns.filter(
        (column) => column.type === "number" || column.type === "auto",
      );
      const labelColumn =
        envelope.payload.columns.find((column) => !columns.includes(column)) ??
        envelope.payload.columns[0];
      const valueColumn = columns[0] ?? envelope.payload.columns[1];
      if (labelColumn && valueColumn) {
        const chartInput = {
          id: `${envelope.id}-chart`,
          type: "chart.echarts",
          version: "1.0.0",
          presentation: {
            title: `${valueColumn.label} by ${labelColumn.label}`,
          },
          source: envelope.source,
          payload: {
            option: {
              tooltip: { trigger: "axis" },
              xAxis: {
                type: "category",
                data: envelope.payload.rows.map((row) =>
                  String(row[labelColumn.key] ?? ""),
                ),
              },
              yAxis: { type: "value" },
              series: [
                {
                  type: "bar",
                  data: envelope.payload.rows.map((row) =>
                    Number(row[valueColumn.key] ?? 0),
                  ),
                  itemStyle: { color: "#5b8cff" },
                },
              ],
            },
          },
        };
        const parsed = parseRenderEnvelope(chartInput);
        if (parsed.success && !parsed.unknownType)
          chooseScenario(
            scenarioForEnvelope(
              parsed.data as KnownRenderEnvelope,
              tr("Chart from selected table", "由所选表格生成的图表"),
              false,
              locale,
            ),
          );
      }
    }
    setEventNotice(
      `${event.action ?? event.type} · ${tr("local event captured", "已捕获本地事件")}`,
    );
    window.setTimeout(() => setEventNotice(undefined), 3_000);
  };

  return (
    <main className={`playground-shell ${caseMode ? "case-mode" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <button
            className="mobile-menu"
            type="button"
            aria-label={tr("Open examples", "打开示例")}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </button>
          <Link href="/" className="brand-link">
            <span className="logo-mark">
              <Blocks />
            </span>
            <span>
              <strong>ModelCanvas</strong>
              <small>{tr("Universal render bridge", "通用渲染桥接器")}</small>
            </span>
          </Link>
        </div>
        <nav aria-label={tr("Primary navigation", "主导航")}>
          <Link href="/" className="active">
            <MessageSquareText /> {tr("Playground", "工作台")}
          </Link>
          <Link href="/gallery">
            <GalleryHorizontalEnd /> {tr("Gallery", "组件库")}
          </Link>
          <Link href="/inspector">
            <Braces /> {tr("Inspector", "检查器")}
          </Link>
        </nav>
        <div className="top-actions">
          <span className="offline-badge">
            <span />{" "}
            {tr(
              `${renderCapabilityCount} render capabilities`,
              `${renderCapabilityCount} 种渲染能力`,
            )}
          </span>
          <LanguageToggle />
          <button
            className="icon-button square"
            type="button"
            aria-label={
              dark
                ? tr("Use light theme", "使用浅色主题")
                : tr("Use dark theme", "使用深色主题")
            }
            onClick={toggleTheme}
          >
            {dark ? <Sun /> : <Moon />}
          </button>
          <a
            className="github-button"
            href="https://github.com/Picrew/ModelCanvas"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </header>
      <div className="playground-grid">
        <aside className={`scenario-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-heading">
            <div>
              <p className="eyebrow">{tr("Offline scenarios", "离线场景")}</p>
              <h2>{tr("Examples", "示例")}</h2>
            </div>
            <button
              className="icon-button square mobile-only"
              type="button"
              aria-label={tr("Close examples", "关闭示例")}
              onClick={() => setSidebarOpen(false)}
            >
              <X />
            </button>
          </div>
          <label className="sidebar-search">
            <Search />
            <span className="sr-only">{tr("Search examples", "搜索示例")}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tr(
                `Search ${allDemoScenarios.length} demos`,
                `搜索 ${allDemoScenarios.length} 个示例`,
              )}
            />
          </label>
          <div className="scenario-groups">
            {categories.map((category) => (
              <section key={category}>
                <h3>
                  {locale === "zh"
                    ? (chineseCategoryLabels[category] ?? category)
                    : category}
                  <span>
                    {
                      visibleScenarios.filter(
                        (item) => item.category === category,
                      ).length
                    }
                  </span>
                </h3>
                {visibleScenarios
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <button
                      className={scenario.id === item.id ? "active" : ""}
                      type="button"
                      key={item.id}
                      onClick={() => chooseScenario(item)}
                    >
                      <span className="scenario-icon">
                        {item.category === "Charts" ? (
                          <BarChart3 />
                        ) : item.category === "Media" ? (
                          <Volume2 />
                        ) : item.category === "Artifacts" ? (
                          <Layers3 />
                        ) : item.category === "Documents" ? (
                          <FileText />
                        ) : item.id === "compare" ? (
                          <Image />
                        ) : (
                          <Blocks />
                        )}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      {scenario.id === item.id ? <Check /> : <ChevronDown />}
                    </button>
                  ))}
              </section>
            ))}
          </div>
          {history.length ? (
            <section className="history-section">
              <h3>
                <History /> {tr("Session history", "会话历史")}
              </h3>
              {history.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => chooseScenario(item.scenario)}
                >
                  <Clock3 />
                  <span>
                    <strong>{item.prompt}</strong>
                    <small>{item.createdAt}</small>
                  </span>
                </button>
              ))}
            </section>
          ) : null}
        </aside>
        <section className="conversation-panel" ref={conversationRef}>
          <div className="conversation-heading">
            <div>
              <p className="eyebrow">{tr("Conversation", "对话")}</p>
              <h1>
                {tr(
                  "Turn model output into trusted UI",
                  "把模型输出转化为可信界面",
                )}
              </h1>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => {
                setHistory([]);
                setScenario(defaultScenario);
                setPrompt("");
              }}
            >
              <Trash2 /> {tr("Clear", "清空")}
            </button>
          </div>
          <div className="messages">
            <article className="message assistant intro-message">
              <span className="message-avatar">
                <Sparkles />
              </span>
              <div>
                <h2>
                  {tr("What would you like to render?", "你想渲染什么？")}
                </h2>
                <p>
                  {tr(
                    `Ask a model naturally, upload a file, or open any of the ${renderCapabilityCount} render capabilities.`,
                    "直接向模型提问、上传文件，或打开任意一种渲染能力。",
                  )}
                </p>
                <div className="suggestion-row">
                  {(locale === "zh"
                    ? [
                        "北京未来七天天气",
                        "“你好”怎么读并下载音频",
                        "创建一个项目时间线",
                      ]
                    : [
                        "Beijing weather for the next seven days",
                        'Pronounce "hello" and create audio',
                        "Create a project timeline",
                      ]
                  ).map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => setPrompt(suggestion)}
                    >
                      {suggestion}
                      <Plus />
                    </button>
                  ))}
                </div>
              </div>
            </article>
            {history
              .slice(0, 3)
              .reverse()
              .map((item) => (
                <div key={item.id}>
                  <article className="message user">
                    <div>
                      <p>{item.prompt}</p>
                    </div>
                    <span className="message-avatar">{tr("You", "你")}</span>
                  </article>
                  <article className="message assistant">
                    <span className="message-avatar">
                      <Sparkles />
                    </span>
                    <div>
                      <p>
                        {item.replayed
                          ? tr("Replayed", "已复刻")
                          : tr("Generated", "已生成")}
                        {tr(" and routed to ", "并路由至 ")}
                        <strong>{item.scenario.envelope.type}</strong>
                        {tr(
                          ". The artifact panel shows the live result.",
                          "。下方结果区会显示实时效果。",
                        )}
                      </p>
                      <button
                        type="button"
                        className="message-card"
                        onClick={() => chooseScenario(item.scenario)}
                      >
                        <span>{item.scenario.title}</span>
                        <small>{item.scenario.description}</small>
                        <PanelRight />
                      </button>
                    </div>
                  </article>
                </div>
              ))}
          </div>
          <div className="composer">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void runPrompt();
                }
              }}
              placeholder={tr("Message ModelCanvas", "给 ModelCanvas 发消息")}
              aria-label={tr("Prompt", "提问内容")}
            />
            {isSubmitting ? (
              <div
                className="composer-loading"
                role="status"
                aria-live="polite"
              >
                <span className="composer-loading-spinner" aria-hidden="true" />
                <strong>
                  {activeProviderLabel} {tr("is generating…", "正在生成…")}
                </strong>
                <span>{tr("Please wait", "请稍候")}</span>
              </div>
            ) : null}
            <div className="composer-row">
              <div className="composer-tools">
                <button
                  className="composer-add"
                  type="button"
                  aria-label={tr("Add content", "添加内容")}
                  aria-expanded={toolsOpen}
                  onClick={() => setToolsOpen((value) => !value)}
                >
                  <Plus />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
                {toolsOpen ? (
                  <div className="composer-menu">
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      <FileUp /> {tr("Upload a file", "上传文件")}
                    </button>
                    <button
                      type="button"
                      aria-label={tr("Paste envelope", "粘贴渲染数据")}
                      onClick={() => {
                        setToolsOpen(false);
                        setPasteOpen(true);
                      }}
                    >
                      <FileJson /> {tr("Paste an envelope", "粘贴渲染数据")}
                    </button>
                  </div>
                ) : null}
              </div>
              <div>
                <label className="effect-select">
                  <Layers3 />
                  <span className="sr-only">
                    {tr("Target effect", "目标效果")}
                  </span>
                  <select
                    value={targetType}
                    aria-label={tr("Target effect", "目标效果")}
                    onChange={(event) => setTargetType(event.target.value)}
                  >
                    <option value="">
                      {tr("Auto effect", "自动选择效果")}
                    </option>
                    {renderTypeOptions.map((item) => (
                      <option value={item.type} key={item.type}>
                        {item.type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="provider-select">
                  <span className="fixture-dot" />
                  <span className="sr-only">{tr("Provider", "模型服务")}</span>
                  <select
                    value={provider}
                    onChange={(event) =>
                      setProvider(event.target.value as ProviderId)
                    }
                  >
                    {Object.entries(providerLabels).map(([id, label]) => (
                      <option value={id} key={id}>
                        {id === "demo"
                          ? tr("Demo Provider", "演示模式")
                          : label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={`send-button${isSubmitting ? " is-loading" : ""}`}
                  type="button"
                  aria-label={
                    isSubmitting
                      ? tr("Generating response", "正在生成回复")
                      : tr("Send prompt", "发送提问")
                  }
                  aria-busy={isSubmitting}
                  disabled={!prompt.trim() || isSubmitting}
                  onClick={() => void runPrompt()}
                >
                  {isSubmitting ? (
                    <span className="send-loading-spinner" aria-hidden="true" />
                  ) : (
                    <ArrowUp />
                  )}
                </button>
              </div>
            </div>
          </div>
          {providerError ? (
            <div className="composer-error" role="alert">
              {providerError}
            </div>
          ) : null}
        </section>
        <section className="artifact-panel" ref={artifactRef}>
          {caseMode ? (
            <div className="case-prompt">
              <p>{scenario.prompt}</p>
              <div>
                <h1>{scenario.title}</h1>
                <span>{scenario.description}</span>
              </div>
            </div>
          ) : null}
          <header className="artifact-heading">
            <div>
              <p className="eyebrow">{tr("Artifact", "渲染结果")}</p>
              <h2>{scenario.title}</h2>
              <span>{envelope.type}</span>
            </div>
            <div>
              <label className="renderer-select">
                <span className="sr-only">
                  {tr("Renderer override", "指定渲染器")}
                </span>
                <select
                  value={rendererOverride}
                  onChange={(event) => setRendererOverride(event.target.value)}
                >
                  <option value="">
                    {tr("Auto", "自动")} ·{" "}
                    {matchingRenderers[0]?.displayName ??
                      tr("Fallback", "备用渲染器")}
                  </option>
                  {matchingRenderers.map((renderer) => (
                    <option value={renderer.id} key={renderer.id}>
                      {renderer.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="icon-button square"
                type="button"
                aria-label={tr("Copy envelope", "复制渲染数据")}
                onClick={() =>
                  void navigator.clipboard.writeText(
                    JSON.stringify(envelope, null, 2),
                  )
                }
              >
                <Copy />
              </button>
              <button
                className="icon-button square"
                type="button"
                aria-label={tr("Export example", "导出示例")}
                onClick={() => downloadJson(envelope, `${envelope.id}.json`)}
              >
                <Download />
              </button>
              <button
                className="icon-button square"
                type="button"
                aria-label={tr("Fullscreen artifact", "全屏显示结果")}
                onClick={() => artifactRef.current?.requestFullscreen()}
              >
                <Maximize2 />
              </button>
            </div>
          </header>
          <div className="artifact-meta">
            <span>
              <ShieldCheck /> {tr("Validated", "已验证")}
            </span>
            <span>
              <span className="fixture-dot" />
              {scenario.id.startsWith("custom-")
                ? scenario.replayed
                  ? tr("Stable replay", "稳定复刻")
                  : `${activeProviderLabel} ${tr("generated", "已生成")}`
                : tr("Fixture data", "示例数据")}
            </span>
            <button
              type="button"
              onClick={() =>
                conversationRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              <MessageSquareText /> {tr("Ask another", "继续提问")}
            </button>
            <button
              type="button"
              onClick={() => setInspectorOpen((value) => !value)}
            >
              <Braces />{" "}
              {inspectorOpen
                ? tr("Hide inspector", "隐藏检查器")
                : tr("Show inspector", "显示检查器")}
            </button>
          </div>
          <div
            className="artifact-scroll"
            role="region"
            aria-label={tr("Rendered artifact", "已渲染结果")}
            tabIndex={0}
          >
            <RendererHost
              envelope={envelope}
              rendererOverride={rendererOverride || undefined}
              onInspection={handleInspection}
              onEvent={handleEvent}
            />
          </div>
          {inspectorOpen ? (
            <InspectorPanel
              envelope={envelope}
              parseResult={parseResult}
              inspection={inspection}
            />
          ) : null}
          {eventNotice ? (
            <div className="event-toast">
              <Check /> {eventNotice}
            </div>
          ) : null}
        </section>
      </div>
      {pasteOpen ? (
        <div className="modal-backdrop">
          <section
            className="paste-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paste-title"
          >
            <header>
              <div>
                <p className="eyebrow">
                  {tr("Validate before render", "渲染前先验证")}
                </p>
                <h2 id="paste-title">
                  {tr("Paste RenderEnvelope", "粘贴 RenderEnvelope")}
                </h2>
              </div>
              <button
                className="icon-button square"
                type="button"
                aria-label={tr("Close", "关闭")}
                onClick={() => setPasteOpen(false)}
              >
                <X />
              </button>
            </header>
            <textarea
              value={pasteValue}
              onChange={(event) => setPasteValue(event.target.value)}
              spellCheck={false}
              placeholder={
                '{\n  "id": "example",\n  "type": "text.markdown",\n  "version": "1.0.0",\n  "payload": { "content": "# Hello" }\n}'
              }
            />
            {pasteError ? (
              <pre className="inline-error" role="alert">
                {pasteError}
              </pre>
            ) : null}
            <footer>
              <button
                className="button secondary"
                type="button"
                onClick={() => setPasteOpen(false)}
              >
                {tr("Cancel", "取消")}
              </button>
              <button
                className="button primary"
                type="button"
                onClick={handlePaste}
              >
                <ShieldCheck /> {tr("Validate & render", "验证并渲染")}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
