import { expect, test } from "@playwright/test";

test("opens the implementation scaffold", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A Dark Room" })).toBeVisible();
  await expect(page.getByText("Headless engine online.")).toBeVisible();
});

