import { expect, test, type Page } from "@playwright/test";

const WORLD_RADIUS = 30;

async function setState(page: Page, path: string, value: unknown) {
  await page.evaluate(
    ({ path: statePath, value: stateValue }) => {
      window.__adrTest?.setState(statePath, stateValue);
    },
    { path, value },
  );
}

async function advanceGame(page: Page, ms: number) {
  await page.evaluate((advanceMs) => {
    window.__adrTest?.advance(advanceMs);
  }, ms);
}

async function winCombat(page: Page) {
  const disintegrate = page.getByRole("button", { name: /disintegrate/ });
  for (let attack = 0; attack < 5; attack += 1) {
    if (!(await disintegrate.isVisible().catch(() => false))) return;
    await disintegrate.click();
    await advanceGame(page, 1000);
  }
  await expect(disintegrate).toHaveCount(0);
}

test("scenario-seeded: clearing one Cave leaves another Cave enterable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  const size = WORLD_RADIUS * 2 + 1;
  const map = Array.from({ length: size }, () => Array<string>(size).fill(","));
  map[WORLD_RADIUS][WORLD_RADIUS] = "A";
  map[WORLD_RADIUS + 1][WORLD_RADIUS] = "V";
  map[WORLD_RADIUS + 3][WORLD_RADIUS] = "V";

  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "game.world.map", map);
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 3);
  await setState(page, "stores.torch", 1);
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click({ clickCount: 3 });
  await page.getByRole("button", { name: "torch +1", exact: true }).click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "game.world.health", 100);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 10);
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(Array(80).fill(0)),
  );

  await page.getByRole("button", { name: "east" }).click();
  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Damp Cave");
  await dialog.getByRole("button", { name: "go inside" }).click();
  await winCombat(page);
  await advanceGame(page, 1000);
  await page.evaluate(() => window.__adrTest?.setRngSequence([0]));
  await dialog.getByRole("button", { name: "continue" }).click();
  await expect(dialog).toContainText("the body of a wanderer");
  await dialog.getByRole("button", { name: "continue" }).click();
  await winCombat(page);
  await advanceGame(page, 1000);
  await page.evaluate(() => window.__adrTest?.setRngSequence([0]));
  await dialog.getByRole("button", { name: "continue" }).click();
  await expect(dialog).toContainText("the nest of a large animal");
  await dialog.getByRole("button", { name: "leave cave" }).click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__adrTest?.getState('game.world.resolvedLandmarks["31,30"]'),
      ),
    )
    .toBe(true);

  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "east" }).click();

  await expect(dialog).toContainText("A Damp Cave");
  await expect
    .poll(() =>
      page.evaluate(() => window.__adrTest?.getState("game.world.map")),
    )
    .toMatchObject({
      31: { 30: "P" },
      33: { 30: "V" },
    });
});
