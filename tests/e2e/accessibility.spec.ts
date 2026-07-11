import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("playground has no serious automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/?scenario=weather");
  await expect(page.getByTestId("weather-widget")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});
