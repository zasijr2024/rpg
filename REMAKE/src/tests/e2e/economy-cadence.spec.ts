import { expect, test, type Page } from "@playwright/test";

async function setState(page: Page, path: string, value: unknown) {
  await page.evaluate(
    ({ path: statePath, value: stateValue }) => {
      window.__adrTest?.setState(statePath, stateValue);
    },
    { path, value },
  );
}

async function advanceGame(page: Page, ms: number) {
  await page.evaluate((advanceMs) => window.__adrTest?.advance(advanceMs), ms);
}

test("scenario-seeded: worker income keeps its ten-second browser cadence", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&debug=1");
  await setState(page, "features.location.outside", true);
  await setState(page, "game.population", 1);
  await setState(page, "stores.wood", 1);

  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  const woodRow = page.locator(".storeRow").filter({ hasText: "wood" });
  await expect(woodRow).toContainText("1");

  await advanceGame(page, 9000);
  await expect(woodRow).toContainText("1");

  await advanceGame(page, 1000);
  await expect(woodRow).toContainText("2");

  await advanceGame(page, 1000);
  await expect(woodRow).toContainText("2");

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("checkbox", { name: "income x 10" }).check();
  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  await expect(page.getByLabel("income")).toContainText("wood +10/10s");

  await advanceGame(page, 8000);
  await expect(woodRow).toContainText("2");

  await advanceGame(page, 1000);
  await expect(woodRow).toContainText("12");
});
