import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of [
  "/",
  "/gallery",
  "/inspector",
  "/?scenario=stock&case=1",
  "/?scenario=pronunciation&case=1",
  "/?scenario=sports&case=1",
  "/?scenario=timeline&case=1",
  "/?scenario=math-geometry&case=1",
  "/?scenario=science-molecule&case=1",
  "/?scenario=engineering-timing&case=1",
]) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });
}
