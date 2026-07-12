import { expect, test } from "@playwright/test";
import path from "node:path";

async function upload(
  page: import("@playwright/test").Page,
  file: string | { name: string; mimeType: string; buffer: Buffer },
) {
  await page.locator('input[type="file"]').setInputFiles(file);
}

test("uploads a real PDF and a CSV that converts to a chart", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await upload(page, path.resolve("public/fixtures/protocol-brief.pdf"));
  await expect(page.getByTestId("pdf-renderer")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator(".pdf-page canvas")).toBeVisible();

  await upload(page, {
    name: "metrics.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "renderer,renderMs\nMarkdown,18\nECharts,62\nMermaid,74\n",
    ),
  });
  await expect(page.getByTestId("table-renderer")).toBeVisible();
  await page
    .getByTestId("table-renderer")
    .getByRole("button", { name: /Convert to chart/ })
    .click();
  await expect(page.getByTestId("echarts-renderer")).toBeVisible();

  await upload(page, {
    name: "analysis.ipynb",
    mimeType: "application/x-ipynb+json",
    buffer: Buffer.from(
      JSON.stringify({
        metadata: { kernelspec: { language: "python" } },
        cells: [
          { cell_type: "markdown", source: ["## Uploaded notebook"] },
          {
            cell_type: "code",
            source: ["print('safe')"],
            execution_count: 1,
            outputs: [
              { output_type: "stream", name: "stdout", text: ["safe\n"] },
            ],
          },
        ],
      }),
    ),
  });
  await expect(page.getByTestId("notebook-renderer")).toBeVisible();
  await expect(page.getByText("Uploaded notebook")).toBeVisible();
  await expect(page.getByText("safe", { exact: true })).toBeVisible();
});

test("dangerous HTML remains inside a sandbox and cannot alter the host", async ({
  page,
}) => {
  await page.goto("/inspector", { waitUntil: "networkidle" });
  await page
    .locator(".envelope-editor")
    .getByRole("button", { name: "Sandbox", exact: true })
    .click();
  await expect(page.getByTestId("html-artifact")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Inspect a RenderEnvelope" }),
  ).toBeVisible();
  await expect(page.locator("main.inspector-page")).toBeVisible();
  const iframe = page.locator('iframe[sandbox="allow-scripts"]');
  await expect(iframe).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(iframe).not.toHaveAttribute("sandbox", /allow-same-origin/);
});

test("invalid schema is blocked with exact paths before renderer loading", async ({
  page,
}) => {
  await page.goto("/inspector", { waitUntil: "networkidle" });
  await page
    .locator(".envelope-editor")
    .getByRole("button", { name: "Invalid", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fix validation issues first" }),
  ).toBeVisible();
  await page
    .getByTestId("protocol-inspector")
    .getByRole("button", { name: "Validation" })
    .click();
  await expect(page.getByText("$.payload.humidity")).toBeVisible();
  await expect(page.locator(".renderer-root")).toHaveCount(0);
});
