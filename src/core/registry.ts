import type { ComponentType } from "react";
import type {
  AnyRenderEnvelope,
  KnownRenderEnvelope,
  RenderType,
} from "@/src/schema";

export interface RendererCapabilities {
  mimeTypes?: string[];
  extensions?: string[];
  streaming?: boolean;
  editing?: boolean;
  fullscreen?: boolean;
  export?: string[];
}

export interface RendererComponentProps<
  T extends AnyRenderEnvelope = AnyRenderEnvelope,
> {
  envelope: T;
  onEvent?: (event: RendererEvent) => void;
}

export interface RendererEvent {
  type: string;
  renderer: string;
  action?: string;
  payload?: unknown;
}

export interface RendererModule<
  T extends AnyRenderEnvelope = AnyRenderEnvelope,
> {
  default: ComponentType<RendererComponentProps<T>>;
}

export interface RendererDefinition<
  T extends AnyRenderEnvelope = AnyRenderEnvelope,
> {
  id: string;
  type: string;
  version: string;
  displayName: string;
  priority?: number;
  supports?: RendererCapabilities;
  canRender(envelope: AnyRenderEnvelope): envelope is T;
  load(): Promise<RendererModule<T>>;
}

export interface RegistryTrace {
  candidates: Array<{ id: string; accepted: boolean; reason: string }>;
  selected?: string;
  fallback: boolean;
  loadMs?: number;
}

export interface RendererResolution<
  T extends AnyRenderEnvelope = AnyRenderEnvelope,
> {
  definition: RendererDefinition<T>;
  trace: RegistryTrace;
}

export interface RegistryManifestEntry {
  id: string;
  type: string;
  version: string;
  displayName: string;
  priority: number;
  supports: RendererCapabilities;
}

function compatibleVersion(
  rendererVersion: string,
  envelopeVersion: string,
): boolean {
  const rendererMajor = Number.parseInt(
    rendererVersion.split(".")[0] ?? "",
    10,
  );
  const envelopeMajor = Number.parseInt(
    envelopeVersion.split(".")[0] ?? "",
    10,
  );
  return Number.isFinite(rendererMajor) && rendererMajor === envelopeMajor;
}

function normalizeExtension(extension: string): string {
  return extension.trim().replace(/^\./, "").toLowerCase();
}

export class RendererRegistry {
  private readonly definitions = new Map<string, RendererDefinition>();
  private readonly moduleCache = new Map<string, Promise<RendererModule>>();

  constructor(private readonly fallbackDefinition: RendererDefinition) {
    this.register(fallbackDefinition);
  }

  register<T extends AnyRenderEnvelope>(
    definition: RendererDefinition<T>,
  ): () => void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Renderer ${definition.id} is already registered`);
    }
    this.definitions.set(
      definition.id,
      definition as unknown as RendererDefinition,
    );
    return () => this.unregister(definition.id);
  }

  unregister(id: string): boolean {
    if (id === this.fallbackDefinition.id) return false;
    this.moduleCache.delete(id);
    return this.definitions.delete(id);
  }

  has(id: string): boolean {
    return this.definitions.has(id);
  }

  private ranked(): RendererDefinition[] {
    return [...this.definitions.values()].sort(
      (left, right) =>
        (right.priority ?? 0) - (left.priority ?? 0) ||
        left.id.localeCompare(right.id),
    );
  }

  resolve(envelope: AnyRenderEnvelope): RendererResolution {
    const trace: RegistryTrace = { candidates: [], fallback: false };
    for (const definition of this.ranked()) {
      if (definition.id === this.fallbackDefinition.id) continue;
      if (definition.type !== envelope.type && definition.type !== "*") {
        trace.candidates.push({
          id: definition.id,
          accepted: false,
          reason: "type mismatch",
        });
        continue;
      }
      if (!compatibleVersion(definition.version, envelope.version)) {
        trace.candidates.push({
          id: definition.id,
          accepted: false,
          reason: "incompatible major version",
        });
        continue;
      }
      let accepted = false;
      try {
        accepted = definition.canRender(envelope);
      } catch {
        trace.candidates.push({
          id: definition.id,
          accepted: false,
          reason: "canRender threw an error",
        });
        continue;
      }
      trace.candidates.push({
        id: definition.id,
        accepted,
        reason: accepted ? "accepted" : "canRender rejected",
      });
      if (accepted) {
        trace.selected = definition.id;
        return { definition, trace };
      }
    }
    trace.fallback = true;
    trace.selected = this.fallbackDefinition.id;
    return { definition: this.fallbackDefinition, trace };
  }

  resolveWithOverride(
    envelope: AnyRenderEnvelope,
    id: string,
  ): RendererResolution {
    const definition = this.definitions.get(id);
    if (!definition || definition.id === this.fallbackDefinition.id)
      return this.resolve(envelope);
    const trace: RegistryTrace = { candidates: [], fallback: false };
    if (!compatibleVersion(definition.version, envelope.version)) {
      trace.candidates.push({
        id,
        accepted: false,
        reason: "incompatible major version",
      });
      trace.fallback = true;
      trace.selected = this.fallbackDefinition.id;
      return { definition: this.fallbackDefinition, trace };
    }
    try {
      if (definition.canRender(envelope)) {
        trace.candidates.push({
          id,
          accepted: true,
          reason: "selected by user override",
        });
        trace.selected = id;
        return { definition, trace };
      }
    } catch {
      trace.candidates.push({
        id,
        accepted: false,
        reason: "override canRender threw an error",
      });
    }
    trace.candidates.push({
      id,
      accepted: false,
      reason: "override rejected this envelope",
    });
    trace.fallback = true;
    trace.selected = this.fallbackDefinition.id;
    return { definition: this.fallbackDefinition, trace };
  }

  resolveByMime(mimeType: string): RendererDefinition {
    const normalized = mimeType.toLowerCase().split(";")[0]?.trim();
    return (
      this.ranked().find(
        (definition) =>
          definition.id !== this.fallbackDefinition.id &&
          definition.supports?.mimeTypes?.some((mime) => {
            const candidate = mime.toLowerCase();
            return candidate.endsWith("/*")
              ? normalized?.startsWith(candidate.slice(0, -1))
              : candidate === normalized;
          }),
      ) ?? this.fallbackDefinition
    );
  }

  resolveByExtension(extension: string): RendererDefinition {
    const normalized = normalizeExtension(extension);
    return (
      this.ranked().find(
        (definition) =>
          definition.id !== this.fallbackDefinition.id &&
          definition.supports?.extensions?.some(
            (value) => normalizeExtension(value) === normalized,
          ),
      ) ?? this.fallbackDefinition
    );
  }

  capabilities(type: RenderType | string): RegistryManifestEntry[] {
    return this.manifest().filter(
      (entry) => entry.type === type || entry.type === "*",
    );
  }

  manifest(): RegistryManifestEntry[] {
    return this.ranked().map((definition) => ({
      id: definition.id,
      type: definition.type,
      version: definition.version,
      displayName: definition.displayName,
      priority: definition.priority ?? 0,
      supports: definition.supports ?? {},
    }));
  }

  async load(resolution: RendererResolution): Promise<RendererModule> {
    const startedAt = globalThis.performance?.now() ?? Date.now();
    let pending = this.moduleCache.get(resolution.definition.id);
    if (!pending) {
      pending = resolution.definition.load() as Promise<RendererModule>;
      this.moduleCache.set(resolution.definition.id, pending);
    }
    try {
      const loaded = await pending;
      resolution.trace.loadMs = Math.round(
        (globalThis.performance?.now() ?? Date.now()) - startedAt,
      );
      return loaded;
    } catch (error) {
      this.moduleCache.delete(resolution.definition.id);
      if (resolution.definition.id === this.fallbackDefinition.id) throw error;
      resolution.trace.candidates.push({
        id: resolution.definition.id,
        accepted: false,
        reason:
          error instanceof Error
            ? `load failed: ${error.message}`
            : "load failed",
      });
      resolution.trace.fallback = true;
      resolution.trace.selected = this.fallbackDefinition.id;
      resolution.definition = this.fallbackDefinition;
      return this.load(resolution);
    }
  }
}

export function isKnownEnvelopeOf<T extends KnownRenderEnvelope["type"]>(
  envelope: AnyRenderEnvelope,
  type: T,
): envelope is Extract<KnownRenderEnvelope, { type: T }> {
  return envelope.type === type;
}
