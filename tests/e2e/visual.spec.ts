import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const visualScenarios = [
  "weather",
  "stock",
  "bar",
  "flow",
  "pronunciation",
  "pdf",
  "xlsx",
  "react",
  "map",
  "3d",
];

test("captures stable visual evidence for ten critical demos", async ({
  page,
}) => {
  test.slow();
  const output = path.resolve("output/playwright/visual");
  await mkdir(output, { recursive: true });
  for (const scenario of visualScenarios) {
    await page.goto(`/?scenario=${scenario}`, { waitUntil: "networkidle" });
    const artifact = page.locator(".artifact-panel");
    await expect(artifact).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("renderer-loading")).toHaveCount(0, {
      timeout: 30_000,
    });
    if (scenario === "react")
      await expect(
        page
          .frameLocator('iframe[title="React artifact preview"]')
          .getByText("8,160"),
      ).toBeVisible({ timeout: 30_000 });
    await artifact.screenshot({
      path: path.join(output, `${scenario}.png`),
      animations: "disabled",
    });
  }
});
