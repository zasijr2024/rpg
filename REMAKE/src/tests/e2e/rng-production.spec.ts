import { expect, test, type Page } from "@playwright/test";

async function worldMap(page: Page): Promise<string[][]> {
  return page.evaluate(() => {
    return window.__adrTest?.getState("game.world.map") as string[][];
  });
}

test("scenario-seeded: independent production sessions generate different World maps", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();

  try {
    await first.goto("/?testHarness=1&testRng=production&testSeed=rng-map");
    await second.goto("/?testHarness=1&testRng=production&testSeed=rng-map");

    expect(await worldMap(first)).not.toEqual(await worldMap(second));
  } finally {
    await firstContext.close();
    await secondContext.close();
  }
});
