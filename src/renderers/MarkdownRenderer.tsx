"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";
import { validateUrl } from "@/src/security";

type MarkdownEnvelope = Extract<KnownRenderEnvelope, { type: "text.markdown" }>;

function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="icon-button code-copy"
      type="button"
      aria-label={`${label} code`}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1_500);
        });
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

function MermaidFence({ code }: { code: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme:
          document.documentElement.dataset.theme === "dark"
            ? "dark"
            : "neutral",
        htmlLabels: false,
      });
      try {
        const rendered = await mermaid.render(`markdown-mermaid-${id}`, code);
        if (active) setSvg(rendered.svg);
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Invalid Mermaid syntax",
          );
      }
    });
    return () => {
      active = false;
    };
  }, [code, id]);
  if (error)
    return (
      <div className="inline-error" role="alert">
        Mermaid: {error}
      </div>
    );
  return svg ? (
    <div
      className="markdown-mermaid"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  ) : (
    <div className="inline-loader">Rendering diagram…</div>
  );
}

function CodePre({ children }: { children?: ReactNode }) {
  const child = Children.count(children) === 1 ? Children.only(children) : null;
  if (!isValidElement<{ className?: string; children?: ReactNode }>(child))
    return <pre>{children}</pre>;
  const className = child.props.className ?? "";
  const language = className.replace("language-", "") || "text";
  const code = String(child.props.children ?? "").replace(/\n$/, "");
  if (language === "mermaid") return <MermaidFence code={code} />;
  return (
    <div className="markdown-code">
      <div className="code-toolbar">
        <span>{language}</span>
        <CopyButton value={code} />
      </div>
      <pre>
        <code className={className}>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ envelope }: RendererComponentProps) {
  if (envelope.type !== "text.markdown")
    throw new Error("Markdown renderer received an incompatible envelope");
  const markdownEnvelope = envelope as MarkdownEnvelope;
  return (
    <article className="markdown-renderer" data-testid="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSanitize, rehypeKatex]}
        components={{
          pre: CodePre,
          a: ({ href, children }) => {
            const result = validateUrl(href ?? "");
            if (!result.ok)
              return (
                <span className="unsafe-link" title={result.reason}>
                  {children}
                </span>
              );
            return (
              <a href={result.url} target="_blank" rel="noreferrer noopener">
                {children}
                <ExternalLink aria-hidden="true" />
              </a>
            );
          },
          img: ({ src, alt }) => {
            const result = validateUrl(typeof src === "string" ? src : "", {
              allowData: true,
              allowBlob: true,
            });
            return result.ok ? (
              <img src={result.url} alt={alt ?? ""} loading="lazy" />
            ) : (
              <span className="inline-error">Image blocked</span>
            );
          },
        }}
      >
        {markdownEnvelope.payload.content}
      </ReactMarkdown>
      {markdownEnvelope.payload.streaming ? (
        <div className="stream-status">
          <span /> Stream-safe preview · incomplete blocks render as text
        </div>
      ) : null}
    </article>
  );
}
