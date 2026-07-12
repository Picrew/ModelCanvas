"use client";

import { AlertTriangle, Braces, Download, FileQuestion } from "lucide-react";
import type { RendererComponentProps } from "@/src/core";

export default function FallbackRenderer({ envelope }: RendererComponentProps) {
  const fallback = "fallback" in envelope ? envelope.fallback : undefined;
  return (
    <section
      className="renderer-state renderer-fallback"
      role="status"
      data-testid="fallback-renderer"
    >
      <div className="state-icon">
        <AlertTriangle aria-hidden="true" />
      </div>
      <div>
        <p className="eyebrow">Safe fallback</p>
        <h2>
          No compatible renderer for <code>{envelope.type}</code>
        </h2>
        <p>
          {fallback?.text ??
            "The payload was not passed to an unknown component. Inspect the envelope or register a compatible renderer."}
        </p>
        {fallback?.markdown ? (
          <pre className="fallback-copy">{fallback.markdown}</pre>
        ) : null}
        <div className="button-row">
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              navigator.clipboard.writeText(JSON.stringify(envelope, null, 2))
            }
          >
            <Braces aria-hidden="true" /> Copy envelope
          </button>
          {fallback?.downloadUrl ? (
            <a
              className="button secondary"
              href={fallback.downloadUrl}
              download
            >
              <Download aria-hidden="true" /> Download source
            </a>
          ) : null}
        </div>
      </div>
      <FileQuestion className="fallback-mark" aria-hidden="true" />
    </section>
  );
}
