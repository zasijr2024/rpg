import { expect, test } from "@playwright/test";
import { driveFreshSaveSpine } from "./fresh-save-spine.spec";

const SAVE_KEY = "adr-remake-dev-save";
const FIXTURE_URL = "http://127.0.0.1:41733/?testHarness=1";

test("browser: a build-external complete visible-control route restores at the production ending", async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(240_000);

  const fixturePage = await context.newPage();
  await driveFreshSaveSpine(fixturePage, testInfo, FIXTURE_URL);
  await fixturePage.evaluate(() => window.__adrTest?.save());
  const completedSave = await fixturePage.evaluate((key) => {
    return window.localStorage.getItem(key);
  }, SAVE_KEY);
  expect(completedSave).not.toBeNull();
  await fixturePage.close();

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.clear();
      if (value !== null) window.localStorage.setItem(key, value);
    },
    { key: SAVE_KEY, value: completedSave },
  );
  await page.goto("/");

  const ending = page.getByRole("region", { name: "ending" });
  await expect(ending).toContainText("score for this game");
  await expect(ending).toContainText("total score");
  expect(await page.evaluate(() => "__adrTest" in window)).toBe(false);

  await testInfo.attach("production-complete-spine-ending.png", {
    body: await page.screenshot({ fullPage: false }),
    contentType: "image/png",
  });
});
