import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "adr-remake-dev-save";
const FIXTURE_FACTORY_URL =
  "http://127.0.0.1:41733/?testHarness=1&testSeed=phase3";

const scenarios = [
  {
    location: "fabricator",
    chunk: /\/assets\/FabricatorView-[^/]+\.js(?:\?.*)?$/,
    region: "A Whirring Fabricator",
  },
  {
    location: "ship",
    chunk: /\/assets\/ShipView-[^/]+\.js(?:\?.*)?$/,
    region: "An Old Starship",
  },
  {
    location: "space",
    chunk: /\/assets\/SpaceView-[^/]+\.js(?:\?.*)?$/,
    region: "space flight",
  },
] as const;

test("browser: failed late-game chunks preserve the save and recover after reload", async ({
  page,
}) => {
  const saves = await createLateGameSaves(page);
  await page.goto("/");

  for (const scenario of scenarios) {
    await page.route(scenario.chunk, (route) => route.abort("failed"));
    await installSave(page, saves[scenario.location]);

    await expect(
      page.getByRole("alert").getByRole("heading", {
        name: `${scenario.location} could not be loaded`,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "retry location" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "reload game" }),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
    ).not.toBeNull();

    await page.unroute(scenario.chunk);
    await page.getByRole("button", { name: "retry location" }).click();
    await expect(
      page.getByRole("region", { name: scenario.region }),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
    ).not.toBeNull();
  }
});

test("browser: the split production event catalog preserves scene transitions", async ({
  page,
}) => {
  const save = await createSave(page, async () => {
    await setFixtureState(page, "stores.fur", 100);
    await page.evaluate(() =>
      window.__adrTest?.triggerEventByKey("room.beggar"),
    );
  });
  await page.goto("/");
  await installSave(page, save);

  const event = page.getByRole("dialog", { name: "event" });
  await expect(
    event.getByRole("heading", { name: "The Beggar" }),
  ).toBeVisible();
  await expect(event).toContainText("asks for any spare furs");
  await event.getByRole("button", { name: "turn him away" }).click();
  await expect(event).toBeHidden();
});

async function installSave(page: Page, raw: string) {
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: SAVE_KEY, value: raw },
  );
  await page.reload();
}

async function createLateGameSaves(page: Page) {
  return {
    fabricator: await createSave(page, async () => {
      await setFixtureState(page, "features.location.fabricator", true);
      await setFixtureState(page, 'character.blueprints["hypo"]', true);
      await setFixtureState(page, 'stores["alien alloy"]', 10);
      await page.getByRole("tab", { name: "A Whirring Fabricator" }).click();
    }),
    ship: await createSave(page, async () => {
      await setFixtureState(page, "features.location.spaceShip", true);
      await setFixtureState(page, "game.spaceShip.hull", 20);
      await setFixtureState(page, "game.spaceShip.thrusters", 1);
      await page.getByRole("tab", { name: "An Old Starship" }).click();
    }),
    space: await createSave(page, async () => {
      await setFixtureState(page, "features.location.spaceShip", true);
      await setFixtureState(page, "game.spaceShip.hull", 20);
      await setFixtureState(page, "game.spaceShip.thrusters", 1);
      await page.getByRole("tab", { name: "An Old Starship" }).click();
      await page.getByRole("button", { name: "lift off" }).click();
      await page
        .getByRole("region", { name: "Ready to Leave?" })
        .getByRole("button", { name: "lift off" })
        .click();
    }),
  };
}

async function createSave(page: Page, configure: () => Promise<void>) {
  await page.goto(FIXTURE_FACTORY_URL);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => "__adrTest" in window))
    .toBe(true);
  await configure();
  await page.evaluate(() => window.__adrTest?.save());
  const raw = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    SAVE_KEY,
  );
  if (raw === null) throw new Error("expected serialized session save");
  return raw;
}

async function setFixtureState(page: Page, path: string, value: unknown) {
  await page.evaluate(
    ({ statePath, stateValue }) => {
      window.__adrTest?.setState(statePath, stateValue);
      window.__adrTest?.refresh();
    },
    { statePath: path, stateValue: value },
  );
}
