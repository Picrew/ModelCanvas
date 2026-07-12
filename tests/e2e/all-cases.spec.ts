import { expect, test } from "@playwright/test";

const cases = [
  ["text.markdown", "markdown"],
  ["text.code", "code"],
  ["text.math", "math"],
  ["data.table", "table"],
  ["data.json", "json"],
  ["chart.echarts", "bar"],
  ["chart.vega-lite", "vega"],
  ["diagram.mermaid", "timeline"],
  ["diagram.excalidraw", "excalidraw"],
  ["media.image", "compare"],
  ["media.audio", "audio"],
  ["media.video", "video"],
  ["audio.pronunciation", "pronunciation"],
  ["document.pdf", "pdf"],
  ["document.docx", "docx"],
  ["document.spreadsheet", "xlsx"],
  ["document.presentation", "pptx"],
  ["document.epub", "epub"],
  ["data.notebook", "notebook"],
  ["data.parquet", "parquet"],
  ["map.geo", "map"],
  ["model.3d", "3d"],
  ["artifact.html", "html"],
  ["artifact.react", "react"],
  ["artifact.python", "python"],
  ["widget.weather", "weather"],
  ["widget.stock", "stock"],
  ["widget.sports", "sports"],
  ["widget.travel", "travel"],
  ["widget.product", "product"],
  ["widget.calendar", "calendar"],
  ["widget.email", "email"],
  ["widget.logistics", "logistics"],
  ["form.dynamic", "form"],
] as const;

test("all 34 focused cases render without renderer failures", async ({
  page,
}) => {
  test.slow();
  for (const [type, scenario] of cases) {
    await page.goto(`/?scenario=${scenario}&case=1`);
    await expect(page.locator(".case-prompt"), type).toBeVisible();
    await expect(page.locator(".renderer-root"), type).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("renderer-error"), type).toHaveCount(0);
    await expect(page.getByTestId("renderer-loading"), type).toHaveCount(0, {
      timeout: 20_000,
    });
  }
});
