import { expect, test } from "@playwright/test";

test("opens the fresh room view", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A Dark Room" })).toBeVisible();
  await expect(page.getByLabel("room status")).toContainText("the fire is dead");
  await expect(page.getByLabel("room status")).toContainText("the room is freezing");
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
});

test("keeps spike-only future systems hidden on the default entry", async ({
  page
}) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "space" })).toHaveCount(0);
  await expect(page.getByText("Phase 0.5 risk spike")).toHaveCount(0);
});

test("lights the fire from the fresh room", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "light fire" }).click();

  await expect(
    page.getByRole("heading", { name: "A Firelit Room" })
  ).toBeVisible();
  await expect(page.getByLabel("room status")).toContainText("the fire is burning");
  await expect(page.getByRole("button", { name: "stoke fire" })).toBeVisible();
  await expect(page.getByLabel("notifications")).toContainText(
    "the light from the fire spills from the windows, out into the dark"
  );
});
