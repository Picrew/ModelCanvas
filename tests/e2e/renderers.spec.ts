import { expect, test, type Page } from "@playwright/test";

async function openScenario(page: Page, id: string, testId?: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/?scenario=${id}`);
  await expect(page.locator(".renderer-root")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("renderer-error")).toHaveCount(0);
  if (testId)
    await expect(page.getByTestId(testId)).toBeVisible({ timeout: 20_000 });
  expect(errors, `${id} emitted browser errors`).toEqual([]);
}

test("text and structured-data renderers expose working controls", async ({
  page,
}) => {
  await openScenario(page, "code", "code-renderer");
  const code = page.getByTestId("code-renderer");
  await code.getByRole("button", { name: "Preview" }).click();
  await code.getByPlaceholder("Find").fill("load");
  await expect(code.locator(".search-hit")).toBeVisible();
  await code.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByLabel("Code editor")).toBeVisible();
  await openScenario(page, "math", "math-renderer");
  await expect(page.locator(".katex-display")).toBeVisible();
  await openScenario(page, "json", "json-renderer");
  await page.getByPlaceholder("Search values").fill("weather");
  await expect(page.locator(".search-hit").first()).toBeVisible();
  await openScenario(page, "parquet", "parquet-renderer");
  await expect(page.getByText("250,000")).toBeVisible();
});

test("charts and diagrams render real output", async ({ page }) => {
  await openScenario(page, "bar", "echarts-renderer");
  await expect(page.locator("canvas").first()).toBeVisible();
  await openScenario(page, "vega", "vega-renderer");
  await expect(page.locator(".vega-embed svg")).toBeVisible({
    timeout: 20_000,
  });
  await openScenario(page, "flow", "mermaid-renderer");
  await expect(page.locator(".diagram-surface svg")).toBeVisible();
  await openScenario(page, "excalidraw", "excalidraw-renderer");
  await expect(page.getByText(/elements · editable/)).toBeVisible();
});

test("media renderers load fixtures and interactive controls", async ({
  page,
}) => {
  await openScenario(page, "compare", "image-renderer");
  const slider = page.getByLabel("Image comparison position");
  await slider.fill("70");
  await expect(slider).toHaveValue("70");
  await page.getByRole("button", { name: "Rotate" }).click();
  await expect(page.locator(".image-transform")).toHaveCSS(
    "transform",
    /matrix/,
  );
  await openScenario(page, "audio", "audio-renderer");
  await expect(
    page
      .getByTestId("audio-renderer")
      .getByRole("heading", { name: "Transcript" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Registry/ }).click();
  await openScenario(page, "pronunciation", "pronunciation-renderer");
  await page.getByLabel("Pronounce 你好").click();
  await page.getByLabel("Voice").selectOption("uk");
  await expect(
    page.getByRole("link", { name: /Download demo WAV/ }),
  ).toHaveAttribute("download", "你好.wav");
  await page.getByRole("button", { name: /Regenerate/ }).click();
  await expect(
    page.getByRole("button", { name: /Regenerate #2/ }),
  ).toBeVisible();
  await openScenario(page, "video", "video-renderer");
  await expect(page.locator("video")).toBeVisible();
});

test("document renderers load genuine local files", async ({ page }) => {
  await openScenario(page, "pdf", "pdf-renderer");
  await expect(page.locator(".pdf-page canvas")).toBeVisible({
    timeout: 20_000,
  });
  await openScenario(page, "docx", "docx-renderer");
  await expect(page.locator(".docx-wrapper")).toBeVisible({ timeout: 20_000 });
  await openScenario(page, "xlsx", "spreadsheet-renderer");
  await page.getByRole("button", { name: "Coverage" }).click();
  await expect(page.getByRole("cell", { name: "Documents" })).toBeVisible();
  await openScenario(page, "pptx", "presentation-renderer");
  await expect(
    page.getByTestId("presentation-renderer").getByText(/LibreOffice/),
  ).toBeVisible();
  await openScenario(page, "epub", "epub-renderer");
  await expect(page.locator(".epub-workspace iframe")).toBeVisible({
    timeout: 20_000,
  });
  await openScenario(page, "notebook", "notebook-renderer");
  await expect(page.getByText("budget passed", { exact: true })).toBeVisible();
});

test("sandboxed HTML and React artifacts start, stop, reset and run", async ({
  page,
}) => {
  test.slow();
  await openScenario(page, "html", "html-artifact");
  const frame = page.frameLocator(
    'iframe[title*="HTML artifact"], iframe[title*="focus"]',
  );
  await expect(frame.getByRole("button", { name: "Start" })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByText("Runtime stopped")).toBeVisible();
  await page.getByRole("button", { name: "Run" }).click();
  await openScenario(page, "react", "react-artifact");
  const reactFrame = page.frameLocator(
    'iframe[title="React artifact preview"]',
  );
  await expect(reactFrame.getByText("8,160")).toBeVisible({ timeout: 30_000 });
  await reactFrame.getByLabel("Starting users").fill("20000");
  await expect(reactFrame.getByText("13,600")).toBeVisible();
});

test("game.canvas runs a playable keyboard and touch game", async ({
  page,
}) => {
  await openScenario(page, "tetris", "game-canvas");
  const game = page.getByTestId("game-canvas");
  const frame = page.frameLocator('iframe[title^="Canvas game preview"]');
  const canvas = frame.getByLabel("Playable Tetris board");
  const state = frame.locator("#game-state");
  await expect(canvas).toBeVisible();
  await expect(state).toHaveAttribute("data-running", "true");
  const startX = await state.getAttribute("data-x");
  await canvas.press("ArrowLeft");
  await expect(state).not.toHaveAttribute("data-x", startX ?? "");
  await frame.getByRole("button", { name: "Soft drop" }).click();
  await expect(state).not.toHaveAttribute("data-y", "-1");
  await frame
    .getByRole("button", { name: "Pause", exact: true })
    .first()
    .click();
  await expect(state).toHaveAttribute("data-running", "false");
  await frame.getByRole("button", { name: "Restart" }).click();
  await expect(state).toHaveAttribute("data-running", "true");
  await expect(frame.locator("#score")).toHaveText("0");
  await game.getByRole("button", { name: "Stop" }).click();
  await expect(game.getByText("Game stopped")).toBeVisible();
  await game.getByRole("button", { name: "Run" }).click();
  await expect(canvas).toBeVisible();
});

test("Python artifact executes offline in a terminable Worker", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add content" }).click();
  await page.getByRole("button", { name: "Paste envelope" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .fill(
      JSON.stringify({
        id: "python-e2e",
        type: "artifact.python",
        version: "1.0.0",
        security: {
          trusted: false,
          sandbox: true,
          allowScripts: true,
          allowNetwork: false,
          allowedOrigins: [],
        },
        payload: { code: "print(6 * 7)", packages: [], timeoutMs: 20000 },
      }),
    );
  await page.getByRole("button", { name: /Validate & render/ }).click();
  await expect(page.getByTestId("python-artifact")).toBeVisible();
  const python = page.getByTestId("python-artifact");
  await python.getByRole("button", { name: "Run", exact: true }).click();
  await expect(python.locator(".python-output header")).toContainText(
    /complete/i,
    { timeout: 25_000 },
  );
  await expect(python.locator(".python-output")).toContainText("42");
  await page.getByRole("button", { name: "Stop" }).click();
});

test("map, 3D and form renderers work without page errors", async ({
  page,
}) => {
  await openScenario(page, "map", "map-renderer");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({
    timeout: 20_000,
  });
  await openScenario(page, "3d", "model-3d-renderer");
  await expect(page.locator(".model-stage canvas")).toBeVisible();
  await page.getByRole("button", { name: /Wireframe/ }).click();
  await openScenario(page, "form", "dynamic-form");
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page.getByText("Renderer name is required")).toBeVisible();
});
