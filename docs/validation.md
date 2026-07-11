# Validation record

Validation date: 2026-07-11.

## Round 1 — contract and containment

- `npm run typecheck`: passed with strict TypeScript.
- `npm run lint -- --quiet`: passed with no error-level findings.
- `npm test`: 4 files, 16 tests passed.
- Coverage includes all 26 fixtures, migration, exact validation paths, unknown fallback, serialization, URL/CSP/chart policies, registry priority/fallback, MCP round-trip, and renderer error containment.

## Round 2 — desktop browser

- Playwright Chromium: 6/6 passed.
- Verified weather → chart → weather transitions without stale-renderer exceptions.
- Verified PDF canvas, ExcelJS workbook cells, Three.js STL canvas, pasted Markdown and Excalidraw envelopes, form validation/confirmation, Gallery and Inspector.
- axe reported no serious or critical violations in the tested Playground state (color contrast is visually reviewed separately because automated canvas/gradient checks are noisy).
- Manual headed CLI inspection reported zero console errors; the 1600×1000 3D layout was visually inspected.

## Round 3 — mobile, build, and dependency posture

- Playwright iPhone 13 / WebKit: 6/6 passed, including the responsive scenario drawer.
- `npm run build`: passed all five vinext environments and generated all application/API routes.
- `npm audit`: reduced from 25 findings (10 high) to one low transitive development-only Babel advisory. No moderate, high, or critical findings remain.
- Replaced vulnerable SheetJS with ExcelJS; pinned safe XML, UUID, PostCSS, nanoid, and lodash transitive versions; upgraded Cloudflare/Vite/Wrangler/Next tooling.
- KaTeX CSS and font assets are copied locally before dev/build. PDF.js and Pyodide runtime assets are also locally pinned.

Known build notes: Pyodide publishes a universal module that references Node built-ins; Vite externalizes those branches for the browser Worker. Lazy renderer chunks can exceed 500 kB for engines such as Excalidraw/Three/ECharts, but they are not part of the initial renderer path.
