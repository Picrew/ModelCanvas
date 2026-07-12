# Validation record

Validation date: 2026-07-11. Environment: Node 23.10.0 (project supports Node 22.13+ and CI uses Node 24), npm 10.9.2, macOS. Results below are actual local executions.

## Ten iteration rounds

1. **Repository and static audit** — mapped the complete brief to implementation, found and fixed 61 formatting failures; typecheck and error-level lint passed.
2. **Protocol, registry, security, providers and adapters** — enforced fixtures for all 34 discriminated variants; expanded migration, JSON Schema, Adapter, file policy, Provider and TTS cache coverage. Unit/component result: 6 files, 28/28 tests passed.
3. **Text, data, chart and diagram renderers** — added and exercised Code, Math, Vega-Lite, Excalidraw and Parquet demos; verified search/editing, KaTeX, canvas/SVG and strict Mermaid output.
4. **Media and pronunciation** — exercised comparison slider, rotation, waveform/audio regions, transcript seeking, accent/speed/regeneration and video fixture controls.
5. **Documents** — loaded genuine PDF, DOCX, XLSX and generated EPUB files; verified PDF canvas, DOCX DOM, sheet switching, PPTX fallback, EPUB iframe, Notebook output and Parquet metadata.
6. **Artifacts and spatial** — verified HTML stop/reset and parent isolation, replaced the failed remote React bundler with a self-hosted offline React/TypeScript iframe runtime, executed and interacted with React, executed core Python in a terminable Pyodide Worker, and exercised MapLibre and Three.js controls.
7. **Widgets and forms** — tested all eight business widgets in ready/loading/empty/error states, Stock range, Travel controls, Calendar/Email confirmation and dynamic-form validation/submission.
8. **Playground, Inspector, focused cases, upload and accessibility** — verified raw envelopes, exact validation paths, renderer trace/fallback, all 34 focused `case=1` routes, PDF upload, CSV-to-chart conversion, direct `.ipynb` normalization, dark/mobile behavior and axe serious/critical result of zero.
9. **Visual and performance posture** — generated stable screenshots for Weather, Stock, ECharts, Mermaid, Pronunciation, PDF, Spreadsheet, React Artifact, Map and 3D; visually inspected the prior React blank-state defect and its corrected interactive result. All heavyweight renderer engines remain lazy-loaded.
10. **Clean environment regression** — removed `node_modules`, build caches and output; `npm ci` succeeded from the lockfile, followed by all gates and both desktop/mobile browser projects.

## Final commands and results

| Command                                                           | Result                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `npm ci` after removing `node_modules`, `dist`, `.next`, `.turbo` | Passed; 1 low audit finding                                         |
| `npm run typecheck`                                               | Passed; 0 TypeScript errors                                         |
| `npm run lint -- --quiet`                                         | Passed; 0 error-level findings                                      |
| `npm run format:check`                                            | Passed                                                              |
| `npm test -- --reporter=verbose`                                  | 6 files, 28/28 tests passed                                         |
| `npm run build`                                                   | Passed; all five vinext build environments and all routes generated |
| `npm run test:e2e`                                                | 54/54 passed: 27 Chromium desktop + 27 iPhone 13 mobile             |
| `npm run test:a11y`                                               | 14/14 passed across core and featured routes                        |
| Visual evidence                                                   | 34 focused README cases + 10 regression screenshots                 |

## Problems found and fixed

- Async RendererHost race could bind a stale component to a new envelope.
- Formatting was not CI-clean and generated runtime assets were not excluded from format/lint scans.
- Six protocol types lacked direct demos: Code, Math, Vega-Lite, Excalidraw, EPUB and Parquet.
- The demo search placeholder was hard-coded to 26 after the catalog expanded to 32.
- The remote Sandpack React preview rendered as a blank black panel when its external service was unavailable. It was replaced with a bundled Babel + React runtime loaded into an opaque, network-disabled iframe; TSX, CSS, multi-file imports, editing, auto-refresh, stop/reset and runtime errors now work locally.
- Browser tests initially used broad locators and coupled unrelated artifact navigations; they were tightened and split to eliminate hidden race/flakiness.
- Widget roots lacked stable test boundaries; all eight now expose explicit test IDs.

## Known limitations

- Pyodide's universal module references Node branches; Vite externalizes those branches for the browser Worker. Core Python is validated offline. pandas/Matplotlib wheel loading remains disabled unless a package origin is explicitly allowed; the scientific demo output is visibly labeled as fixture data.
- High-fidelity PPTX/DOCX/ODF conversion requires the optional Dockerized LibreOffice service; browser fallback remains explicit.
- Some lazy chunks exceed 500 kB (Excalidraw, Three.js, ECharts and similar engines), but they are not loaded on the initial renderer path. The standalone React compiler runtime is about 3.2 MB and is fetched only by React artifacts.
- `npm audit` reports one low-severity transitive development advisory; there are no moderate, high or critical findings.
- npm prints peer warnings for older Radix dependencies nested inside Excalidraw under React 19; the tested Excalidraw flows pass.

No required test is skipped. No remote push or deployment was performed during this ten-round validation cycle.
