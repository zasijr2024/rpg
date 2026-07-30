import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "adr-remake-save";
const STORAGE_SETUP_URL = "http://127.0.0.1:41732/__playwright-storage";
const FIXTURE_FACTORY_URL =
  "http://127.0.0.1:41733/?testHarness=1&testSeed=phase3";

test("fresh-run: production bundle completes a command/save/reload smoke without dev surfaces", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  expect(await hasTestHarness(page)).toBe(false);
  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  expect(await hasTestHarness(page)).toBe(false);
});

test("browser: production bundle starts when browser storage reads are blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("storage blocked", "SecurityError");
    };
  });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  await expect(
    page.getByRole("alert", { name: "saving status" }),
  ).toContainText("storage-blocked");
  expect(await hasTestHarness(page)).toBe(false);
});

test("scenario-seeded: production bundle loads Fabricator, Ship, and active-Space lazy routes", async ({
  page,
}) => {
  const saves = await createLateGameSaves(page);
  await page.goto("/");

  await installSave(page, saves.fabricator);
  await expect(
    page.getByRole("region", { name: "A Whirring Fabricator" }),
  ).toBeVisible();

  await installSave(page, saves.ship);
  await expect(
    page.getByRole("region", { name: "An Old Starship" }),
  ).toBeVisible();

  await installSave(page, saves.space);
  await expect(
    page.getByRole("region", { name: "space flight" }),
  ).toBeVisible();
  await expect(page.getByText("altitude:")).toBeVisible();
  expect(await hasTestHarness(page)).toBe(false);

  await page.reload();
  await expect(
    page.getByRole("region", { name: "space flight" }),
  ).toBeVisible();
});

async function installSave(page: Page, raw: string) {
  await page.route(STORAGE_SETUP_URL, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>storage setup</title>",
    }),
  );
  try {
    await page.goto(STORAGE_SETUP_URL);
    await page.evaluate(
      ({ key, value }) => window.localStorage.setItem(key, value),
      { key: SAVE_KEY, value: raw },
    );
  } finally {
    await page.unroute(STORAGE_SETUP_URL);
  }
  await page.goto("/");
}

async function hasTestHarness(page: Page) {
  return page.evaluate(() => "__adrTest" in window);
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
  await expect.poll(() => hasTestHarness(page)).toBe(true);
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
