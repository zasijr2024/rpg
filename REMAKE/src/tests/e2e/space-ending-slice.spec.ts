import { expect, test } from "@playwright/test";

test("scenario-seeded: visible Ship controls reach the Space loop and ending", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=space-slice");

  await page.getByRole("tab", { name: "An Old Starship" }).click();
  const ship = page.getByRole("region", { name: "An Old Starship" });
  const reinforce = ship.getByRole("button", { name: /reinforce hull/ });
  const liftOff = ship.getByRole("button", { name: "lift off", exact: true });
  await expect(liftOff).toBeDisabled();
  for (let alloy = 0; alloy < 6; alloy += 1) await reinforce.click();
  await expect(ship.getByLabel("ship status")).toContainText("hull:6");
  await expect(liftOff).toBeEnabled();

  await liftOff.click();
  const warning = ship.getByRole("region", { name: "Ready to Leave?" });
  await expect(warning).toContainText("won't be coming back");
  await warning.getByRole("button", { name: "lift off" }).click();

  const flight = page.getByRole("region", { name: "space flight" });
  await expect(flight).toBeFocused();
  await expect(
    flight.getByRole("heading", { name: "Troposphere" }),
  ).toBeVisible();
  await expect(flight).toContainText("hull: 6/6");
  await expect(flight.getByLabel(/ship and .* pieces of debris/)).toBeVisible();
  await page.keyboard.down("ArrowLeft");
  await page.evaluate(() => window.__adrTest?.advance(33));
  await page.keyboard.up("ArrowLeft");
  await page.evaluate(() => window.__adrTest?.save());
  const keyboardShipX = await page.evaluate(() => {
    const raw = window.localStorage.getItem("adr-remake-dev-save");
    if (!raw) return null;
    const save = JSON.parse(raw) as {
      payload?: { space?: { shipX?: unknown } };
    };
    return save.payload?.space?.shipX;
  });
  expect(keyboardShipX).toEqual(expect.any(Number));
  expect(keyboardShipX as number).toBeLessThan(350);
  await flight.getByRole("button", { name: "west" }).click();

  await page.evaluate(() =>
    (
      window as Window & { __adrTest?: { advance: (ms: number) => void } }
    ).__adrTest?.advance(10_000),
  );
  await expect(
    flight.getByRole("heading", { name: "Stratosphere" }),
  ).toBeVisible();
  await expect(flight).toContainText("altitude: 10");

  await page.evaluate(() =>
    (
      window as Window & { __adrTest?: { advance: (ms: number) => void } }
    ).__adrTest?.advance(50_000),
  );
  const ending = page.getByRole("region", { name: "ending" });
  await expect(ending).toContainText("score for this game: 300");
  await expect(ending).toContainText("total score: 300");
  await expect(ending.getByRole("button", { name: "restart." })).toBeVisible();
});
