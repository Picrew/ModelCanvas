import { expect, test } from "@playwright/test";

test("switches safely between controlled and chart renderers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?scenario=bar");
  await expect(page.getByTestId("echarts-renderer")).toBeVisible();
  if ((page.viewportSize()?.width ?? 1280) < 900)
    await page.getByRole("button", { name: "Open examples" }).click();
  await page.getByRole("button", { name: /Beijing · 7 day weather/ }).click();
  await expect(page.getByTestId("weather-widget")).toBeVisible();
  if ((page.viewportSize()?.width ?? 1280) < 900)
    await page.getByRole("button", { name: "Open examples" }).click();
  await page.getByRole("button", { name: /Bar chart/ }).click();
  await expect(page.getByTestId("echarts-renderer")).toBeVisible();
  expect(errors).toEqual([]);
});

test("renders document and spatial fixtures", async ({ page }) => {
  await page.goto("/?scenario=pdf");
  await expect(page.getByTestId("pdf-renderer")).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await page.goto("/?scenario=xlsx");
  await expect(page.getByTestId("spreadsheet-renderer")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Markdown" })).toBeVisible();
  await page.goto("/?scenario=3d");
  await expect(page.getByTestId("model-3d-renderer")).toBeVisible();
  await expect(page.locator(".model-stage canvas")).toBeVisible();
});

test("validates pasted envelopes and exposes inspector details", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("weather-widget")).toBeVisible();
  await page.getByRole("button", { name: "Paste envelope" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .fill(
      JSON.stringify({
        id: "e2e",
        type: "text.markdown",
        version: "1.0.0",
        payload: { content: "# E2E envelope", streaming: false },
      }),
    );
  await page.getByRole("button", { name: /Validate & render/ }).click();
  await expect(
    page.getByRole("heading", { name: "E2E envelope" }),
  ).toBeVisible();
  await page
    .getByTestId("protocol-inspector")
    .getByRole("button", { name: "Validation" })
    .click();
  await expect(page.getByText("No validation issues")).toBeVisible();

  await page.getByRole("button", { name: "Paste envelope" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .fill(
      JSON.stringify({
        id: "drawing-e2e",
        type: "diagram.excalidraw",
        version: "1.0.0",
        payload: { elements: [], appState: {}, files: {}, editable: true },
      }),
    );
  await page.getByRole("button", { name: /Validate & render/ }).click();
  await expect(page.getByText("Add Excalidraw elements to begin")).toBeVisible();
});

test("runs dynamic form validation and local confirmation", async ({
  page,
}) => {
  await page.goto("/?scenario=form");
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page.getByText("Renderer name is required")).toBeVisible();
  await expect(page.getByText("Primary format is required")).toBeVisible();
  await page.getByLabel(/Renderer name/).fill("CAD preview");
  await page.getByLabel(/Primary format/).selectOption("binary");
  await page.getByRole("button", { name: /Next/ }).click();
  await page.getByRole("button", { name: /Submit request/ }).click();
  await page.getByRole("button", { name: /Confirm/ }).click();
  await expect(page.getByTestId("form-success")).toBeVisible();
});

test("opens gallery and inspector routes", async ({ page }) => {
  await page.goto("/gallery");
  await expect(
    page.getByRole("heading", { name: /Every renderer has a contract/i }),
  ).toBeVisible();
  await page.goto("/inspector");
  await expect(
    page.getByRole("heading", { name: /Trust the trace, not the payload/i }),
  ).toBeVisible();
});
