import { expect, test, type Page } from "@playwright/test";

async function advanceGame(page: Page, ms: number) {
  await page.evaluate((advanceMs) => {
    window.__adrTest?.advance(advanceMs);
  }, ms);
}

test("scenario-seeded: stim halves weapon cooldowns only for its visible three-second window", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=stim-lifecycle");

  const boost = page.getByRole("button", { name: "boost" });
  const stab = page.getByRole("button", { name: "stab" });
  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "snarling beast",
  );

  await boost.click();
  await stab.click();
  await expect(stab).toContainText("1s");

  await advanceGame(page, 2999);
  await expect(stab).toBeEnabled();
  await stab.click();
  await expect(stab).toContainText("1s");

  await advanceGame(page, 1000);
  await expect(stab).toBeEnabled();
  await stab.click();
  await expect(stab).toContainText("2s");
});
