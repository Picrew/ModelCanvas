"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Braces, ShieldAlert, ShieldCheck, WandSparkles } from "lucide-react";
import { defaultScenario } from "@/src/fixtures";
import { deserializeRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";
import { InspectorPanel } from "./InspectorPanel";
import { RendererHost, type RendererInspection } from "./RendererHost";

const dangerousPreset = JSON.stringify({ id: "blocked-html", type: "artifact.html", version: "1.0.0", payload: { html: "<h1>Isolated</h1><script>parent.document.body.innerHTML='pwned'<\/script><img src=x onerror=alert(1)>", allowedOrigins: [], timeoutMs: 5000 }, security: { trusted: false, sandbox: true, allowScripts: true, allowNetwork: false, allowedOrigins: [] }, fallback: { text: "Artifact blocked or isolated" } }, null, 2);
const invalidPreset = JSON.stringify({ id: "bad-weather", type: "widget.weather", version: "1.0.0", payload: { location: "Beijing", humidity: 140 } }, null, 2);

export function ProtocolInspector() {
  const [raw, setRaw] = useState(JSON.stringify(defaultScenario.envelope, null, 2)); const [inspection, setInspection] = useState<RendererInspection>();
  const result = useMemo(() => deserializeRenderEnvelope(raw), [raw]); const envelope = result.success ? result.data : defaultScenario.envelope as AnyRenderEnvelope;
  return <main className="docs-shell inspector-page"><header className="docs-topbar"><Link href="/" className="button secondary"><ArrowLeft /> Playground</Link><div className="brand-link"><span className="logo-mark"><i /><i /><i /></span><span><strong>Protocol Inspector</strong><small>Validate · resolve · trace</small></span></div><Link href="/gallery" className="button secondary"><Braces /> Gallery</Link></header><section className="docs-hero compact"><p className="eyebrow">RenderEnvelope workbench</p><h1>Trust the trace, not the payload.</h1><p>Edit any field to see exact schema paths, version migrations, registry selection and fallback behavior before rendering.</p></section><div className="inspector-workbench"><section className="envelope-editor"><header><div><p className="eyebrow">Input</p><h2>Raw envelope</h2></div><div><button type="button" onClick={() => setRaw(JSON.stringify(defaultScenario.envelope, null, 2))}><WandSparkles /> Valid</button><button type="button" onClick={() => setRaw(invalidPreset)}><ShieldAlert /> Invalid</button><button type="button" onClick={() => setRaw(dangerousPreset)}><ShieldCheck /> Sandbox</button></div></header><textarea value={raw} onChange={(event) => setRaw(event.target.value)} spellCheck={false} aria-label="Raw RenderEnvelope JSON" /></section><section className="inspector-output"><div className="inspector-render-stage">{result.success ? <RendererHost envelope={result.data} onInspection={setInspection} /> : <div className="renderer-state" role="alert"><ShieldAlert /><p className="eyebrow">Render blocked</p><h2>Fix validation issues first</h2><p>Invalid model output never reaches a renderer module.</p></div>}</div><InspectorPanel envelope={envelope} parseResult={result} inspection={inspection} /></section></div></main>;
}

