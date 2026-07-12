# Design QA

## Evidence

- Source visual truth:
  - `output/case-qa/reference-stock.png`
  - `output/case-qa/reference-pronunciation.png`
  - `output/case-qa/reference-sports.png`
  - `output/case-qa/reference-timeline.png`
- Browser-rendered implementation:
  - `docs/images/cases/widget.stock.png`
  - `docs/images/cases/audio.pronunciation.png`
  - `docs/images/cases/widget.sports.png`
  - `docs/images/cases/diagram.mermaid.png`
- Full-view comparison input: `output/case-qa/compare.html`
- Full-view comparison capture: `output/case-qa/combined.png`
- Additional mobile evidence: `output/case-qa/mobile-stock.png`, `output/case-qa/mobile-sports.png`
- Viewports: 1440 × 900 desktop and 390 × 844 mobile
- State: light theme, focused `case=1` view, deterministic fixture data

## Findings

No actionable P0, P1, or P2 findings remain.

- Typography: the implementation uses the existing system font stack with restrained 500–600 display weights, compact metadata, and the same large-number hierarchy visible in the stock reference. Chinese, Pinyin, and mixed Latin text wrap cleanly.
- Spacing and layout: prompt bubbles, response headings, result widths, card radii, chart padding, stage tabs, and Mermaid toolbar spacing follow the reference hierarchy. Mobile cases collapse without horizontal overflow or clipped controls.
- Colors and tokens: neutral white/gray surfaces, low-contrast borders, red negative stock state, selected pills, and subtle fixture labels map to the reference intent while retaining WCAG contrast.
- Image and asset fidelity: ECharts and Mermaid generate real vector output; country flags use local Twemoji source assets. No placeholder imagery, CSS art, handcrafted SVG, or emoji substitutes were introduced.
- Copy and content: the four featured prompts mirror the supplied Chinese examples. Financial and tournament values are explicitly labeled illustrative fixture data rather than live facts.
- Icons and controls: visible controls use the existing Lucide family with consistent stroke weight. Stock ranges, audio playback/download, sports stages, Mermaid source/run/zoom/export/fullscreen, and focused case URLs are functional.
- Accessibility: the four focused cases plus Playground, Gallery, and Inspector pass serious/critical axe checks on desktop and mobile.

## Focused comparison notes

- Stock: retains the source's large quote, negative delta, segmented range control, red area line, axis grid, and three-column metrics. The implementation intentionally uses synthetic values with a visible source label.
- Pronunciation: retains plain-language explanation, prominent play affordance, Pinyin/IPA, and download action. The implementation adds voice/speed controls plus a local WAV fallback because provider MP3 requires a configured server key.
- Sports: retains stage pills, quarter-final match cards, scores, flags, upcoming dates, and share affordance. A compact responsive grid replaces connector lines at narrow widths.
- Mermaid: retains the named tool header, source toggle, run control, fullscreen affordance, neutral canvas, and wide project timeline. ModelCanvas additionally exposes zoom and SVG export.

## Comparison history

1. P1 — the initial stock implementation mounted an ECharts SVG but the global icon rule reduced it to 17 × 17, leaving the chart visually blank. Fixed with scoped chart SVG sizing; post-fix evidence is `docs/images/cases/widget.stock.png`.
2. P2 — the first pronunciation playback test surfaced an autoplay-policy error as a destructive alert. Fixed by treating `NotAllowedError` as a non-destructive browser policy state while preserving manual playback and download.
3. P2 — focused case pages initially retained the technical trust strip and bordered the plain pronunciation response. Fixed by hiding the trust strip in case mode and removing the pronunciation-only outer border.
4. P2 — six business widgets were only visible inside Gallery and could not be opened as independent cases. Fixed with `allDemoScenarios`, focused case URLs, Gallery links, and a durable 34-type coverage test.
5. Post-fix pass — all 34 focused cases were opened in the in-app browser; `34 checked / 0 renderer failures`. Desktop and mobile featured interactions were exercised and screenshots regenerated.

## Verification

- `tests/e2e/all-cases.spec.ts`: 34/34 types passed on desktop and mobile.
- `npm run test:a11y`: 14/14 route/device checks passed.
- Featured interactions: stock range, pronunciation audio/download, sports stage tabs, Mermaid source/run/zoom/export/fullscreen.
- Browser-rendered evidence captured; no ModelCanvas renderer error states remained.

## Follow-up polish

- P3: a future live-data adapter could replace the stock and tournament fixtures when the host supplies an authenticated, citable provider.

final result: passed
