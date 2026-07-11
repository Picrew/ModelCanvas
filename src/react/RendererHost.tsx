"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import type { RendererComponentProps, RendererEvent, RendererResolution } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";
import { RendererErrorBoundary } from "./RendererErrorBoundary";
import { rendererRegistry } from "./renderer-registry";

export interface RendererInspection {
  rendererId: string;
  displayName: string;
  capabilities: ReturnType<typeof rendererRegistry.capabilities>[number]["supports"];
  trace: RendererResolution["trace"];
  renderMs?: number;
  error?: string;
}

interface Props {
  envelope: AnyRenderEnvelope;
  rendererOverride?: string;
  onInspection?: (inspection: RendererInspection) => void;
  onEvent?: (event: RendererEvent) => void;
}

export function RendererHost({ envelope, rendererOverride, onInspection, onEvent }: Props) {
  const resolution = useMemo(() => {
    return rendererOverride
      ? rendererRegistry.resolveWithOverride(envelope, rendererOverride)
      : rendererRegistry.resolve(envelope);
  }, [envelope, rendererOverride]);
  const [loaded, setLoaded] = useState<{
    id: string;
    component: ComponentType<RendererComponentProps>;
  }>();
  const [loadFailure, setLoadFailure] = useState<{
    id: string;
    message: string;
  }>();

  useEffect(() => {
    let active = true;
    const startedAt = performance.now();
    void rendererRegistry.load(resolution).then((module) => {
      if (!active) return;
      setLoaded({ id: resolution.definition.id, component: module.default });
      setLoadFailure(undefined);
      onInspection?.({
        rendererId: resolution.definition.id,
        displayName: resolution.definition.displayName,
        capabilities: resolution.definition.supports ?? {},
        trace: resolution.trace,
        renderMs: Math.round(performance.now() - startedAt),
      });
    }).catch((error: unknown) => {
      if (!active) return;
      const message = error instanceof Error ? error.message : "Renderer module failed to load";
      setLoadFailure({ id: resolution.definition.id, message });
      onInspection?.({
        rendererId: resolution.definition.id,
        displayName: resolution.definition.displayName,
        capabilities: resolution.definition.supports ?? {},
        trace: resolution.trace,
        error: message,
      });
    });
    return () => { active = false; };
  }, [onInspection, resolution]);

  if (loadFailure?.id === resolution.definition.id) {
    return <div className="renderer-state" role="alert"><p className="eyebrow">Module load failed</p><h2>{loadFailure.message}</h2></div>;
  }

  if (loaded?.id !== resolution.definition.id) {
    return (
      <div className="renderer-loading" role="status" aria-live="polite" data-testid="renderer-loading">
        <LoaderCircle className="spin" aria-hidden="true" />
        <span>Loading {resolution.definition.displayName}</span>
      </div>
    );
  }

  const Renderer = loaded.component;

  return (
    <RendererErrorBoundary
      rendererId={`${resolution.definition.id}:${envelope.id}`}
      onError={(error) => onInspection?.({
        rendererId: resolution.definition.id,
        displayName: resolution.definition.displayName,
        capabilities: resolution.definition.supports ?? {},
        trace: resolution.trace,
        error: error.message,
      })}
    >
      <div className="renderer-root" data-renderer={resolution.definition.id}>
        <div className="trust-strip" title="Payload validated before renderer load">
          <ShieldCheck aria-hidden="true" /> Validated · {envelope.security?.trusted ? "trusted source" : "untrusted input"}
        </div>
        <Renderer envelope={envelope} onEvent={onEvent} />
      </div>
    </RendererErrorBoundary>
  );
}
