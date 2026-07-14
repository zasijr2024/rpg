import { expect, test } from "@playwright/test";

test("manual-a11y: Space fixture runs the normal clock without console controls", async ({
  page,
}) => {
  await page.goto("/?manualFixture=space-realtime");

  await expect(
    page.getByText(/Development evidence fixture:.*normal real-time clock/),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "An Old Starship" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "lift off", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() => page.evaluate(() => !("__adrTest" in window)))
    .toBe(true);

  await page.getByRole("button", { name: "lift off", exact: true }).click();
  const flight = page.getByRole("region", { name: "space flight" });
  await expect(flight).toBeVisible();
  await expect(flight).toContainText("altitude: 0");
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(1_200);
  await page.keyboard.up("ArrowLeft");
  await expect(flight).not.toContainText("altitude: 0");
});
