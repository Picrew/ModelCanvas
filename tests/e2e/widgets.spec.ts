import { expect, test } from "@playwright/test";

test("gallery renders every business widget and all standard states", async ({
  page,
}) => {
  await page.goto("/gallery");
  for (const id of [
    "weather-widget",
    "stock-widget",
    "sports-widget",
    "travel-widget",
    "product-widget",
    "calendar-widget",
    "email-widget",
    "logistics-widget",
  ]) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
  await page.getByRole("button", { name: "loading", exact: true }).click();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(8);
  await page.getByRole("button", { name: "empty", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No data yet" })).toHaveCount(
    8,
  );
  await page.getByRole("button", { name: "error", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Provider unavailable" }),
  ).toHaveCount(8);
  await page.getByRole("button", { name: "ready", exact: true }).click();
});

test("calendar and email writes require explicit confirmation", async ({
  page,
}) => {
  await page.goto("/gallery");
  const calendar = page.getByTestId("calendar-widget");
  await calendar.getByRole("button", { name: "accepted" }).click();
  await expect(page.getByRole("alertdialog")).toContainText(
    "Confirmation required",
  );
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await calendar.getByRole("button", { name: "tentative" }).click();
  await page.getByRole("button", { name: "Confirm locally" }).click();
  await expect(calendar.getByRole("button", { name: "tentative" })).toHaveClass(
    /active/,
  );

  const email = page.getByTestId("email-widget");
  await email.getByRole("button", { name: "Reply" }).click();
  await page.getByRole("button", { name: "Confirm locally" }).click();
  await expect(email.getByText(/emitted as a local demo event/)).toBeVisible();
});

test("stock range and travel route controls remain interactive", async ({
  page,
}) => {
  await page.goto("/gallery");
  const stock = page.getByTestId("stock-widget");
  await stock.getByRole("button", { name: "1Y" }).click();
  await expect(stock.getByRole("button", { name: "1Y" })).toHaveClass(/active/);
  const sports = page.getByTestId("sports-widget");
  await sports.getByRole("button", { name: "SF", exact: true }).click();
  await expect(sports.getByText("Semi-finals")).toBeVisible();
  await sports.getByRole("button", { name: "QF", exact: true }).click();
  await expect(sports.getByText("Quarter-finals")).toBeVisible();
  await expect(
    page
      .getByTestId("travel-widget")
      .getByRole("button", { name: "View route" }),
  ).toHaveCount(2);
});
