# Product design iteration log

Date: 2026-07-11. Scope: local-only iteration; no push or deployment.

The visual direction was grounded in the current official ChatGPT interface at 1440 × 900. The goal was to reuse its quiet, content-first hierarchy without cloning product-specific branding or removing ModelCanvas's renderer, protocol, and fixture capabilities.

1. Reframed the Playground from three simultaneous technical columns into a conversation-first screen with the artifact below the fold.
2. Replaced saturated dashboard tokens, gradients, heavy shadows, and uppercase labels with a neutral light/dark system and weaker boundaries.
3. Simplified the top bar and scenario rail; replaced CSS art and emoji with the existing Lucide icon system.
4. Reworked the empty conversation state, suggestion cards, message spacing, and copy into compact, human prompts.
5. Consolidated upload and raw-envelope actions into an accessible add-content menu; disabled send until content exists.
6. Tightened the artifact header and trust metadata, and added a direct “Ask another” return path.
7. Made protocol detail progressive: the inspector is closed by default and renderer candidates collapse to the selected path plus four alternatives.
8. Rebuilt Gallery capabilities from a card wall into a compact registry list and replaced marketing-style page copy with utility copy.
9. Validated the 390 × 844 mobile layout, added direct `.ipynb` conversion, fixed contrast tokens, and made horizontal forecast content keyboard reachable.
10. Ran same-viewport side-by-side visual QA, fixed menu regressions and Python Worker cold-start performance, then completed the full test/build regression.

Evidence is stored under `output/design-audit/`; renderer screenshots are under `output/playwright/visual/`.

## Complete case-gallery extension

The follow-up case-gallery pass added a focused ChatGPT-style result route for every one of the 34 protocol types, promoted all business widgets to individually openable scenarios, created 34 browser-rendered README images, and added durable desktop/mobile coverage that opens every focused case. Four supplied visual references drove deeper stock, pronunciation/audio, sports bracket, and Mermaid timeline refinements; the comparison and QA evidence is recorded in `design-qa.md`.

## Professional technical category extension

The 2026-07-15 extension added one unified `Technical` product category with 16 representative protocol types across Math, Maps, Science and Engineering. The selection favors broadly reusable primitives: sampled plots and distributions instead of executable equations; semantic places, routes, heatmaps and tracks on one map engine; structured molecules, reactions and optics; and data-only circuits, waveforms, timing diagrams and logic gates. Region maps remain covered by `map.geo`; floor plans, cell/crystal/astronomy scenes, mechanical CAD and semiconductor cross-sections are intentionally deferred until their domain schemas and interaction requirements justify dedicated renderers. The current catalog contains 50 protocol types, 55 deterministic scenarios and 50 browser-rendered README images.
