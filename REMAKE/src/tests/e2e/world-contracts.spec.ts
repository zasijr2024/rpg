/* eslint-disable @typescript-eslint/no-unused-vars -- Contract slices retain shared local fixtures. */
import { expect, test, type Page } from "@playwright/test";

const TEST_WORLD_RADIUS = 30;
const TEST_WORLD_TILE = {
  BATTLEFIELD: "F",
  BOREHOLE: "B",
  CACHE: "U",
  CAVE: "V",
  COAL_MINE: "C",
  EXECUTIONER: "X",
  BARRENS: ".",
  FIELD: ",",
  FOREST: ";",
  HOUSE: "H",
  IRON_MINE: "I",
  OUTPOST: "P",
  SHIP: "W",
  SULPHUR_MINE: "S",
  SWAMP: "M",
  VILLAGE: "A",
} as const;

async function advanceGame(page: Page, ms: number) {
  await page.evaluate((advanceMs) => {
    window.__adrTest?.advance(advanceMs);
  }, ms);
}

async function setState(page: Page, path: string, value: unknown) {
  await page.evaluate(
    ({ path: statePath, value: stateValue }) => {
      window.__adrTest?.setState(statePath, stateValue);
    },
    { path, value },
  );
}

async function getState<T>(page: Page, path: string): Promise<T> {
  return page.evaluate((statePath) => {
    return window.__adrTest?.getState(statePath);
  }, path) as Promise<T>;
}

declare global {
  interface Window {
    __adrTest?: {
      advance: (ms: number) => void;
      setState: (path: string, value: unknown) => void;
      getState: (path: string) => unknown;
      setRngSequence: (values: number[]) => void;
      triggerEvent: () => void;
      triggerEventByKey: (key: string) => void;
      triggerWorldEncounter: (context: {
        distance: number;
        terrain: "forest" | "field" | "barrens" | ";" | "," | ".";
      }) => void;
      triggerWorldSetpiece: (scene: string) => void;
      save: () => void;
      load: () => boolean;
      refresh: () => void;
    };
  }
}
test("browser: plays organically from fresh room to Path, World movement, and return without resource injection", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1920");
  test.setTimeout(120_000);
  await page.goto("/?testHarness=1&debug=1");
  await page.evaluate(() => window.localStorage.clear());
  await setState(page, "config.events.randomDisabled", true);

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("checkbox", { name: "income x 10" }).check();
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: "light fire" }).click();
  await advanceGame(page, 130_000);

  await progressEconomyToCompassAndCuredMeat(page);

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toBeVisible();
  const compassMessage =
    /the compass points (north|south|east|west|northeast|northwest|southeast|southwest)/;
  await expect(page.getByLabel("notifications")).toContainText(compassMessage);
  await expect(
    page.locator(".storeRow").filter({ hasText: "compass" }),
  ).toHaveAttribute("title", compassMessage);
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await expect(page.getByRole("region", { name: "supplies" })).toContainText(
    "cured meat",
  );

  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "embark" })).toBeEnabled();
  await page.getByRole("button", { name: "embark" }).click();

  await expect(page.getByRole("tab", { name: "world" })).toBeVisible();
  await expect(page.locator(".worldMap")).toContainText("@");
  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "west" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
});

test("fresh-run: a player-created gatherer keeps the ten-second cadence", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(120_000);
  await page.goto("/?testHarness=1&debug=1");
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("checkbox", { name: "income x 10" }).check();
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: "light fire" }).click();
  await advanceGame(page, 130_000);
  await page.getByRole("tab", { name: /A .*Forest/ }).click();
  await page.getByRole("button", { name: "gather wood" }).click();
  await advanceGame(page, 60_000);
  await dismissEvent(page);
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: /^hut/ }).click();
  await advanceGame(page, 180_000);

  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  const wood = page.locator(".storeRow").filter({ hasText: "wood" });
  const incomeText = await page.getByLabel("income").innerText();
  const woodIncome = [...incomeText.matchAll(/wood \+(\d+)\/10s/g)];
  expect(woodIncome).not.toHaveLength(0);
  const woodPerTick = woodIncome.reduce(
    (total, match) => total + Number(match[1]),
    0,
  );
  expect(woodPerTick).toBeGreaterThan(0);
  const beforeCadence = await storeValue(page, "wood");
  await advanceGame(page, 9000);
  expect(await storeValue(page, "wood")).toBe(beforeCadence);
  await advanceGame(page, 1000);
  expect(await storeValue(page, "wood")).toBe(beforeCadence + woodPerTick);
  await expect(wood).toContainText(String(beforeCadence + woodPerTick));
});

test("fresh-run: a home torch cannot unlock a generated cave", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(120_000);
  const route = await prepareFreshTorchPathAndCave(page);

  await carryCuredMeat(page, 5);
  await page.getByRole("button", { name: "embark" }).click();
  await seedCaveCampCache(page, route);
  await followWorldRoute(page, route);

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Damp Cave");
  await expect(
    dialog.getByRole("button", { name: "go inside" }),
  ).toBeDisabled();
});

test("fresh-run: a carried torch unlocks the same generated cave cost", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(120_000);
  const route = await prepareFreshTorchPathAndCave(page);

  await carryCuredMeat(page, 5);
  const carryTorch = page.getByRole("button", {
    name: "torch +1",
    exact: true,
  });
  await expect(carryTorch).toBeEnabled();
  await carryTorch.click();
  await page.getByRole("button", { name: "embark" }).click();
  await seedCaveCampCache(page, route);
  await followWorldRoute(page, route);

  const dialog = page.getByRole("dialog", { name: "event" });
  const enter = dialog.getByRole("button", { name: "go inside" });
  await expect(enter).toBeEnabled();
  await enter.click();
  await expect(dialog).toContainText("the remains of an old camp");
});

test("fresh-run: clearing one generated Cave leaves another Cave enterable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(120_000);
  const firstCaveRoute = await prepareFreshTorchPathAndCave(page);

  await carryCuredMeat(page, 9);
  await page.getByRole("button", { name: "torch +1", exact: true }).click();
  await page.getByRole("button", { name: "embark" }).click();
  await seedCaveDepths(page, firstCaveRoute);
  await followWorldRoute(page, firstCaveRoute);

  const dialog = page.getByRole("dialog", { name: "event" });
  await dialog.getByRole("button", { name: "go inside" }).click();
  await winFistsOnlyCombat(page, "the beast is dead");
  await advanceGame(page, 1000);
  await page.evaluate(() => window.__adrTest?.setRngSequence([0]));
  await dialog.getByRole("button", { name: "continue" }).click();
  await expect(dialog).toContainText("the body of a wanderer");
  await dialog.getByRole("button", { name: "continue" }).click();
  await expect(dialog.getByLabel("combat")).toContainText("R 10/10");
  await winFistsOnlyCombat(page, "the beast is dead");
  await advanceGame(page, 1000);
  await page.evaluate(() => window.__adrTest?.setRngSequence([0]));
  await dialog.getByRole("button", { name: "continue" }).click();
  await expect(dialog).toContainText("the nest of a large animal");
  await dialog.getByRole("button", { name: "leave cave" }).click();
  await expect(dialog).toHaveCount(0);

  const clearedMap = await getState<string[][]>(page, "game.world.map");
  const current = {
    x: await getState<number>(page, "game.world.x"),
    y: await getState<number>(page, "game.world.y"),
  };
  expect(clearedMap[current.x]?.[current.y]).toBe(TEST_WORLD_TILE.OUTPOST);
  const secondCaveRoute = routeToNearestTileFrom(
    clearedMap,
    current,
    TEST_WORLD_TILE.CAVE,
  );
  expect(secondCaveRoute).not.toBeNull();

  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(Array(100).fill(0.9)),
  );
  await followWorldRoute(page, secondCaveRoute!);

  await expect(dialog).toContainText("A Damp Cave");
  const secondMap = await getState<string[][]>(page, "game.world.map");
  const secondCurrent = {
    x: await getState<number>(page, "game.world.x"),
    y: await getState<number>(page, "game.world.y"),
  };
  expect(secondMap[secondCurrent.x]?.[secondCurrent.y]).toBe(
    TEST_WORLD_TILE.CAVE,
  );
});

test("browser: keeps Compass to Path to World contract at viewport extremes", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1366" &&
      testInfo.project.name !== "chromium-3840",
  );
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();

  const compassMessage =
    /the compass points (north|south|east|west|northeast|northwest|southeast|southwest)/;
  await expect(page.getByLabel("notifications")).toContainText(compassMessage);
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  await expect(page.getByRole("tab", { name: "world" })).toBeVisible();
  await expect(page.locator(".worldMap")).toContainText("@");
  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "west" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("browser: moves by clicking the World map quadrants", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  const box = await worldMap.boundingBox();
  expect(box).not.toBeNull();
  await expect(worldMap.locator('[title="Wanderer"]')).toHaveAttribute(
    "title",
    "Wanderer",
  );

  await worldMap.click({
    position: { x: box!.width * 0.8, y: box!.height * 0.5 },
  });

  await expect(page.getByLabel("world status")).toContainText(/distance\s*1/);
  await expect(worldMap.locator('[title="The Village"]')).toHaveAttribute(
    "title",
    "The Village",
  );

  await worldMap.click({
    position: { x: box!.width * 0.2, y: box!.height * 0.5 },
  });

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
});

test("browser: moves by swiping the World map", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  const box = await worldMap.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.82, box!.y + box!.height * 0.5);
  await page.mouse.up();

  await expect(page.getByLabel("world status")).toContainText(/distance\s*1/);

  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.18, box!.y + box!.height * 0.5);
  await page.mouse.up();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
});

test("browser: moves the World map with keyboard input", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  await expect(
    page.getByRole("region", { name: "world", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");

  await expect(page.getByLabel("world status")).toContainText(/distance\s*1/);

  await page.keyboard.press("a");

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "A Dusty Path", exact: true }),
  ).toBeFocused();
});

test("browser: shows original World danger and supply condition status", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  await setState(page, "game.world.danger", true);
  await setState(page, "game.world.starvation", true);
  await setState(page, "game.world.thirst", true);

  await expect(page.getByLabel("world condition")).toContainText(
    "danger, starvation, thirst",
  );
});

test("browser: triggers a random World fight from browser movement after the original delay", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", false);
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 10);
  await setState(page, 'outfit["grenade"]', 1);
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 4,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.FIELD,
    ),
  );

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'outfit["cured meat"]', 10);
  await setState(page, "game.world.water", 30);
  await page.evaluate(() => window.__adrTest?.setRngSequence([0, 0]));

  for (let i = 0; i < 3; i += 1) {
    await page.getByRole("button", { name: "east" }).click();
  }

  await expect(page.getByRole("dialog", { name: "event" })).toHaveCount(0);
  await expect(await getState<number>(page, "game.world.fightMove")).toBe(3);

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Strange Bird");
  await expect(dialog).toContainText("strange bird");
  await expect(await getState<number>(page, "game.world.fightMove")).toBe(0);
});

test("fresh-run: encounter victory resumes the same World expedition", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(120_000);
  await page.goto("/?testHarness=1&debug=1");
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("checkbox", { name: "income x 10" }).check();
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: "light fire" }).click();
  await advanceGame(page, 130_000);
  await progressEconomyToCompassAndCuredMeat(page, 5);

  const map = await getState<string[][]>(page, "game.world.map");
  const route = encounterResumeRoute(map);
  expect(route).not.toBeNull();

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  for (let food = 0; food < 5; food += 1) {
    await page
      .getByRole("button", { name: "cured meat +1", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "embark" }).click();
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence([0.9, 0.9, ...Array(40).fill(0)]),
  );

  for (const direction of route!.slice(0, 6)) {
    await page.getByRole("button", { name: direction }).click();
  }

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Strange Bird");
  for (let attack = 0; attack < 8; attack += 1) {
    if (
      ((await dialog.textContent()) ?? "").includes("the strange bird is dead")
    ) {
      break;
    }
    await dialog.getByRole("button", { name: "punch" }).click();
    if (
      !((await dialog.textContent()) ?? "").includes("the strange bird is dead")
    ) {
      await advanceGame(page, 2000);
    }
  }
  await expect(dialog).toContainText("the strange bird is dead");
  await advanceGame(page, 1000);
  await dialog
    .getByRole("button", { name: /^take (everything|all you can)$/ })
    .click();

  const beforeLeave = {
    x: await getState<number>(page, "game.world.x"),
    y: await getState<number>(page, "game.world.y"),
    health: await getState<number>(page, "game.world.health"),
    water: await getState<number>(page, "game.world.water"),
    outfit: await getState<Record<string, number>>(page, "outfit"),
  };
  await dialog.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "world" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("world status")).toContainText("distance6");
  expect({
    x: await getState<number>(page, "game.world.x"),
    y: await getState<number>(page, "game.world.y"),
    health: await getState<number>(page, "game.world.health"),
    water: await getState<number>(page, "game.world.water"),
    outfit: await getState<Record<string, number>>(page, "outfit"),
  }).toEqual(beforeLeave);
  expect(await getState(page, "game.world.returnLocation")).toBeUndefined();
  expect(await getState(page, "game.expedition.baselineWorld")).toBeDefined();

  await page.getByRole("button", { name: route![6]! }).click();
  await expect(page.getByLabel("world status")).toContainText("distance7");
  expect(await getState<number>(page, "game.world.fightMove")).toBe(1);
});

test("fresh-run: death rolls back the expedition and enforces embark cooldown", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(120_000);
  await page.goto("/?testHarness=1&debug=1");
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("checkbox", { name: "income x 10" }).check();
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: "light fire" }).click();
  await advanceGame(page, 130_000);
  await progressEconomyToCompassAndCuredMeat(page, 5);

  const map = await getState<string[][]>(page, "game.world.map");
  const route = routeToNearestTile(map, TEST_WORLD_TILE.HOUSE);
  expect(route).not.toBeNull();

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  for (let food = 0; food < 3; food += 1) {
    await page
      .getByRole("button", { name: "cured meat +1", exact: true })
      .click();
  }
  await page.getByRole("button", { name: /^embark/ }).click();
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(Array(30).fill(0.9)),
  );

  for (const direction of route!.toAdjacent) {
    await page.getByRole("button", { name: direction }).click();
  }
  await page.getByRole("button", { name: route!.enter }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("An Old House");
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence([0.9, ...Array(30).fill(0)]),
  );
  await dialog.getByRole("button", { name: "go inside" }).click();
  await expect(dialog).toContainText("squatter");
  expect(await getState(page, "game.world.oldHouseVisited")).toBe(true);

  for (let attack = 0; attack < 10 && (await dialog.count()) > 0; attack += 1) {
    await advanceGame(page, 2000);
  }

  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /A .*Room/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  expect(await getState(page, "outfit")).toBeUndefined();
  expect(await getState(page, "game.world.oldHouseVisited")).toBeUndefined();

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  const embark = page.getByRole("button", { name: /^embark/ });
  await expect(embark).toBeDisabled();
  await expect(embark).toContainText("120s");

  await advanceGame(page, 119_999);
  await expect(embark).toBeDisabled();
  await expect(embark).toContainText("1s");
  await advanceGame(page, 1);
  await expect(embark).toBeEnabled();

  await embark.click();
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(Array(30).fill(0.9)),
  );
  for (const direction of route!.toAdjacent) {
    await page.getByRole("button", { name: direction }).click();
  }
  await expect(
    page.locator('.worldMap [title="An Old House"]').first(),
  ).toBeVisible();
});

test("browser: shows World danger and safer transitions from movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 10);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 8,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.FIELD,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'outfit["cured meat"]', 10);
  await setState(page, "game.world.water", 30);

  for (let step = 0; step < 8; step += 1) {
    await page.getByRole("button", { name: "east" }).click();
  }

  await expect(page.getByLabel("world status")).toContainText(/distance\s*8/);
  await expect(page.getByLabel("world condition")).toContainText("danger");
  await expect(page.getByLabel("world notifications")).toContainText(
    "dangerous to be this far from the village without proper protection",
  );

  await page.getByRole("button", { name: "west" }).click();

  await expect(page.getByLabel("world status")).toContainText(/distance\s*7/);
  await expect(page.getByLabel("world condition")).toHaveCount(0);
  await expect(page.getByLabel("world notifications")).toContainText(
    "safer here",
  );
});

test("browser: shows original World terrain narration while moving in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 4);

  await page.getByRole("button", { name: /^compass/ }).click();
  const terrainMap = worldMapWith(
    TEST_WORLD_RADIUS + 1,
    TEST_WORLD_RADIUS,
    TEST_WORLD_TILE.FIELD,
  );
  terrainMap[TEST_WORLD_RADIUS][TEST_WORLD_RADIUS] = TEST_WORLD_TILE.FOREST;
  terrainMap[TEST_WORLD_RADIUS + 2][TEST_WORLD_RADIUS] =
    TEST_WORLD_TILE.BARRENS;
  await setState(page, "game.world.map", terrainMap);
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'outfit["cured meat"]', 4);
  await setState(page, "game.world.water", 20);

  await page.getByRole("button", { name: "east" }).click();

  await expect(page.getByLabel("world notifications")).toContainText(
    "the trees yield to dry grass. the yellowed brush rustles in the wind.",
  );

  await page.getByRole("button", { name: "east" }).click();

  await expect(page.getByLabel("world notifications")).toContainText(
    "the grasses thin. soon, only dust remains.",
  );
});

test("browser: returns to the room on World starvation death in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 1);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.FIELD,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'outfit["cured meat"]', 0);
  await setState(page, "game.world.water", 20);

  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "north" }).click();

  await expect(page.getByLabel("world condition")).toContainText("starvation");
  await page.getByRole("button", { name: "south" }).click();
  await page.getByRole("button", { name: "east" }).click();

  await expect(page.getByRole("tab", { name: /A .*Room/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(page.getByLabel("notifications")).toContainText(
    "the world fades",
  );
});

test("browser: returns to the room on World dehydration death in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.FIELD,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "game.world.water", 0);
  await setState(page, "game.world.thirst", true);

  await page.getByRole("button", { name: "east" }).click();

  await expect(page.getByRole("tab", { name: /A .*Room/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(page.getByLabel("notifications")).toContainText(
    "the world fades",
  );
});

test("browser: buys the Scout map from an active World expedition in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  const hiddenMapText = await worldMap.textContent();
  await setState(page, "stores.fur", 1200);
  await setState(page, "stores.scales", 60);
  await setState(page, "stores.teeth", 20);
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.scout"));

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("The Scout");
  await page.getByRole("button", { name: /^buy map/ }).click();

  await expect(worldMap).not.toHaveText(hiddenMapText ?? "");
  await expect(page.getByRole("button", { name: /^buy map/ })).toBeVisible();
  await page.getByRole("button", { name: "say goodbye" }).click();
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await expect(page.getByLabel("notifications")).toContainText(
    "the map uncovers a bit of the world",
  );

  await setState(page, "game.world.seenAll", true);
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.scout"));
  await expect(dialog).toContainText("The Scout");
  await expect(page.getByRole("button", { name: /^buy map/ })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^learn scouting/ }),
  ).toBeVisible();
});

test("browser: uses an active World Outpost once in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 2,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.OUTPOST,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "game.world.water", 3);

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="An Outpost"]')).toHaveAttribute(
    "title",
    "An Outpost",
  );

  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("An Outpost");
  await expect(dialog).toContainText("a safe place in the wilds.");
  await expect(page.getByLabel("world status")).toContainText(/water\s*10\/10/);
  await expect(page.getByLabel("loot")).toContainText("cured meat");
  expect(await getState(page, "game.world.waterReplenished")).toBeUndefined();
  expect(await getState(page, 'game.world.usedOutposts["32,30"]')).toBe(true);

  await page.getByRole("button", { name: "take everything" }).click();
  await expect(page.getByLabel("loot")).not.toContainText("cured meat");
  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "west" }).click();
  await expect(worldMap.locator('[title="An Outpost"]')).toHaveCount(0);
  await expect(worldMap).toContainText("P");
});

test("browser: resets used World Outposts after safe return in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 2,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.OUTPOST,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "game.world.water", 3);

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="An Outpost"]')).toHaveAttribute(
    "title",
    "An Outpost",
  );

  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("An Outpost");
  await expect(page.getByLabel("world status")).toContainText(/water\s*10\/10/);
  await page.getByRole("button", { name: "take everything" }).click();
  await page.getByRole("button", { name: "leave" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "west" }).click();
  await expect(worldMap.locator('[title="An Outpost"]')).toHaveCount(0);
  await expect(worldMap).toContainText("P");

  await page.getByRole("button", { name: "west" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);

  await setState(page, 'stores["cured meat"]', 2);
  await setState(page, 'outfit["cured meat"]', 0);
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "game.world.water", 2);
  await expect(worldMap.locator('[title="An Outpost"]')).toHaveAttribute(
    "title",
    "An Outpost",
  );
  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "east" }).click();

  await expect(dialog).toContainText("An Outpost");
  await expect(page.getByLabel("world status")).toContainText(/water\s*10\/10/);
});

test("browser: enters a World mine landmark through map movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.COAL_MINE,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="Coal Mine"]')).toHaveAttribute(
    "title",
    "Coal Mine",
  );

  await page.getByRole("button", { name: "east" }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "The Coal Mine",
  );
  await expect(page.getByRole("button", { name: "attack" })).toBeVisible();
});

test("browser: enters a generated World mine through browser movement", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 30);

  await page.getByRole("button", { name: /^compass/ }).click();
  const generatedMap = await getState<string[][]>(page, "game.world.map");
  const route = routeToAdjacentTile(generatedMap, TEST_WORLD_TILE.IRON_MINE);
  expect(route).not.toBeNull();

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'outfit["cured meat"]', 30);
  await setState(page, "game.world.water", 100);

  for (const direction of route!.toAdjacent) {
    await page.getByRole("button", { name: direction }).click();
  }

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="Iron Mine"]')).toHaveAttribute(
    "title",
    "Iron Mine",
  );

  await page.getByRole("button", { name: route!.enter }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("The Iron Mine");
  await expect(dialog).toContainText(
    "an old iron mine sits here, tools abandoned and left to rust.",
  );
  await setState(page, "outfit.torch", 1);
  await dialog.getByRole("button", { name: /go inside/ }).click();
  await expect(getState<number>(page, "outfit.torch")).resolves.toBe(0);
  await expect(dialog.getByRole("button", { name: "punch" })).toBeVisible();
});

test("browser: clears the canonical World iron mine and unlocks the Outside worker", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "features.location.outside", true);
  await setState(page, "game.population", 1);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.IRON_MINE,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "outfit.torch", 1);
  await setState(page, "outfit.grenade", 1);

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("The Iron Mine");
  await expect(dialog).toContainText(
    "bleached bones are strewn about the entrance.",
  );
  await dialog.getByRole("button", { name: /go inside/ }).click();
  await expect(getState<number>(page, "outfit.torch")).resolves.toBe(0);
  await dialog.getByRole("button", { name: /lob grenade/ }).click();
  await expect(dialog).toContainText("the beastly matriarch is dead");
  await advanceGame(page, 1000);
  await dialog.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toContainText("the beast is dead.");
  await expect(dialog).toContainText("the mine is now safe for workers.");
  await dialog.getByRole("button", { name: "leave" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "west" }).click();
  await page.getByRole("tab", { name: /A .*Forest|A .*Village/ }).click();
  await expect(page.getByLabel("workers")).toContainText("iron miner");
});

test("browser: clears a World coal mine and unlocks the Outside worker in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(60_000);
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "features.location.outside", true);
  await setState(page, "game.population", 1);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.COAL_MINE,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, "character.health", 300);
  await setState(page, 'stores["kinetic armour"]', 1);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 20);

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("The Coal Mine");
  await expect(dialog).toContainText(
    "camp fires burn by the entrance to the mine.",
  );
  await clearCoalMineWithPlasma(page);
  await expect(dialog).toContainText("the mine is now safe for workers.");
  await page.getByRole("button", { name: "leave" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "west" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: /A .*Forest|A .*Village/ }).click();
  await expect(page.getByLabel("workers")).toContainText("coal miner");
});

test("browser: clears the canonical World sulphur mine through its original combat choices", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  test.setTimeout(60_000);
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "features.location.outside", true);
  await setState(page, "game.population", 1);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.SULPHUR_MINE,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, "game.world.health", 300);
  await setState(page, 'stores["kinetic armour"]', 1);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 30);

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("The Sulphur Mine");
  await expect(dialog).toContainText(
    "the military is already set up at the mine's entrance.",
  );
  await dialog.getByRole("button", { name: "attack", exact: true }).click();

  await attackWithPlasmaUntilWon(page, "the soldier is dead");
  await advanceGame(page, 1000);
  await expect(dialog.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "run" })).toBeVisible();
  await dialog.getByRole("button", { name: "continue" }).click();

  await attackWithPlasmaUntilWon(page, "the soldier is dead");
  await advanceGame(page, 1000);
  await dialog.getByRole("button", { name: "continue" }).click();

  await attackWithPlasmaUntilWon(page, "the veteran is dead");
  await advanceGame(page, 1000);
  await expect(dialog.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "run" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "continue" }).click();

  await expect(dialog).toContainText("the mine is now safe for workers.");
  await dialog.getByRole("button", { name: "leave" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "west" }).click();
  await page.getByRole("tab", { name: /A .*Forest|A .*Village/ }).click();
  await expect(page.getByLabel("workers")).toContainText("sulphur miner");
});

test("browser: enters the executioner battleship through World movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.EXECUTIONER,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  await expect(
    worldMap.locator('[title="A Ravaged Battleship"]'),
  ).toHaveAttribute("title", "A Ravaged Battleship");

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Ravaged Battleship");
  await expect(dialog).toContainText(
    "the remains of a massive battleship lie here",
  );
  await expect(dialog.getByRole("button", { name: "enter" })).toBeVisible();
});

test("browser: returns to the executioner antechamber through World movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "game.world.executioner", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.EXECUTIONER,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  await expect(
    worldMap.locator('[title="A Ravaged Battleship"]'),
  ).toHaveAttribute("title", "A Ravaged Battleship");

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Ravaged Battleship");
  await expect(dialog).toContainText(
    "the corridor leads to a bank of elevators",
  );
  await expect(
    dialog.getByRole("button", { name: "engineering" }),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "medical" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "martial" })).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "command deck" }),
  ).toHaveCount(0);

  await dialog.getByRole("button", { name: "medical" }).click();
  await expect(dialog).toContainText("Medical Wing");
});

test("browser: opens the executioner command deck through World movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "game.world.executioner", true);
  await setState(page, "game.world.engineering", true);
  await setState(page, "game.world.medical", true);
  await setState(page, "game.world.martial", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.EXECUTIONER,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Ravaged Battleship");
  await expect(dialog.getByRole("button", { name: "engineering" })).toHaveCount(
    0,
  );
  await expect(dialog.getByRole("button", { name: "medical" })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "martial" })).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "command deck" }),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "command deck" }).click();
  await expect(dialog).toContainText("Command Deck");
  await expect(dialog.getByRole("button", { name: "approach" })).toBeVisible();
});

test("browser: salvages the canonical Borehole through World movement", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 400);
  await setState(page, "stores.scales", 20);
  await setState(page, "stores.teeth", 10);
  await setState(page, 'stores["cured meat"]', 2);

  await page.getByRole("button", { name: /^compass/ }).click();
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.BOREHOLE,
    ),
  );
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await page.evaluate(() => window.__adrTest?.setRngSequence([0, 0.5]));

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="A Borehole"]')).toHaveAttribute(
    "title",
    "A Borehole",
  );

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Huge Borehole");
  await expect(dialog).toContainText(
    "a huge hole is cut deep into the earth, evidence of the past harvest.",
  );
  await expect(dialog).toContainText("they took what they came for, and left.");
  await expect(dialog).toContainText(
    "castoff from the mammoth drills can still be found by the edges of the precipice.",
  );
  await expect(page.getByLabel("loot")).toContainText("alien alloy");
  expect(await getState(page, "game.world.boreholeVisited")).toBe(true);

  await page.getByRole("button", { name: "take everything" }).click();
  await expect(page.getByLabel("loot")).not.toContainText("alien alloy");
  expect(await getState(page, 'outfit["alien alloy"]')).toBe(2);
  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await expect(worldMap.locator('[title="A Borehole"]')).toHaveCount(0);
});

test("browser: salvages a Battlefield landmark through World movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 1);
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.BATTLEFIELD,
    ),
  );

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="A Battlefield"]')).toHaveAttribute(
    "title",
    "A Battlefield",
  );

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Forgotten Battlefield");
  await expect(dialog).toContainText("a battle was fought here, long ago.");

  const loot = page.getByLabel("loot");
  await expect(loot).toContainText("alien alloy");
  await loot
    .locator(".combatLootRow", { hasText: "alien alloy" })
    .getByRole("button", { name: "take" })
    .click();
  await expect(loot).not.toContainText("alien alloy");
  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await expect(worldMap.locator('[title="A Battlefield"]')).toHaveCount(0);
});

test("browser: collects the canonical Destroyed Village cache through World movement", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  const prestigeStores = [
    5, 2, 0, 4, 0, 0, 1, 3, 0, 6, 2, 1, 1, 8, 1, 0, 0, 0, 1, 0, 7, 0, 2, 1,
  ];

  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "stores.compass", 1);
  await setState(page, "stores.wood", 3);
  await setState(page, 'stores["cured meat"]', 1);
  await setState(page, "previous.stores", prestigeStores);
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.CACHE,
    ),
  );

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  await expect(
    worldMap.locator('[title="A Destroyed Village"]'),
  ).toHaveAttribute("title", "A Destroyed Village");

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Destroyed Village");
  await expect(dialog).toContainText("a destroyed village lies in the dust.");
  await dialog.getByRole("button", { name: "enter" }).click();

  await expect(dialog).toContainText("there are still supplies inside.");
  await dialog.getByRole("button", { name: "take" }).click();

  await expect(dialog).toContainText(
    "all the work of a previous generation is here.",
  );
  await expect(await getState<number>(page, "stores.wood")).toBe(8);
  await expect(await getState<number>(page, 'stores["cured meat"]')).toBe(3);
  await expect(await getState<number>(page, 'stores["rifle"]')).toBe(1);
  await expect(await getState<number>(page, 'stores["bullets"]')).toBe(7);
  await expect(await getState<number>(page, 'stores["grenade"]')).toBe(2);
  await expect(await getState<unknown[]>(page, "previous.stores")).toEqual([]);
  await expect(
    getState<boolean>(page, "game.world.destroyedVillageVisited"),
  ).resolves.toBe(true);
  await expect(
    getState<boolean>(page, "game.world.cacheCollected"),
  ).resolves.toBe(true);

  await dialog.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await expect(worldMap.locator('[title="A Destroyed Village"]')).toHaveCount(
    0,
  );
});

test("browser: discovers the canonical Crashed Ship through World movement", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 3);
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 2,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.SHIP,
    ),
  );

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  await expect(
    worldMap.locator('[title="A Crashed Starship"]'),
  ).toHaveAttribute("title", "A Crashed Starship");

  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Crashed Ship");
  await expect(dialog).toContainText(
    "the familiar curves of a wanderer vessel rise up out of the dust and ash.",
  );
  await expect(dialog).toContainText(
    "lucky that the natives can't work the mechanisms.",
  );
  await expect(dialog).toContainText(
    "with a little effort, it might fly again.",
  );
  expect(await getState(page, "game.world.ship")).toBe(true);
  expect(await getState(page, "game.world.crashedShipVisited")).toBe(true);
  await page.getByRole("button", { name: "salvage" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await expect(worldMap.locator('[title="A Crashed Starship"]')).toHaveCount(0);
  await expect(worldMap).toContainText("#");
  const map = await getState<string[][]>(page, "game.world.map");
  expect(map[TEST_WORLD_RADIUS + 1]?.[TEST_WORLD_RADIUS]).toBe("#");
});

test("browser: enters an Old House through World movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 1);
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.HOUSE,
    ),
  );

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "game.world.water", 3);
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, "character.health", 80);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 10);

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="An Old House"]')).toHaveAttribute(
    "title",
    "An Old House",
  );

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("An Old House");
  await expect(dialog).toContainText(
    "an old house remains here, once white siding yellowed and peeling.",
  );
  await page.getByRole("button", { name: "go inside" }).click();

  await expect(dialog).toContainText("squatter");
  await attackUntilWon(page, "the squatter is dead");
  await advanceGame(page, 1000);

  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await expect(worldMap.locator('[title="An Old House"]')).toHaveCount(0);
});

test("browser: takes the Swamp wanderer route through World movement in the browser", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "stores.compass", 1);
  await setState(page, "stores.charm", 1);
  await setState(page, 'stores["cured meat"]', 1);
  await setState(
    page,
    "game.world.map",
    worldMapWith(
      TEST_WORLD_RADIUS + 1,
      TEST_WORLD_RADIUS,
      TEST_WORLD_TILE.SWAMP,
    ),
  );

  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
  await page.getByRole("button", { name: "charm +1", exact: true }).click();
  await page.getByRole("button", { name: "embark" }).click();

  const worldMap = page.locator(".worldMap");
  await expect(worldMap.locator('[title="A Murky Swamp"]')).toHaveAttribute(
    "title",
    "A Murky Swamp",
  );

  await page.getByRole("button", { name: "east" }).click();

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Murky Swamp");
  await expect(dialog).toContainText(
    "rotting reeds rise out of the swampy earth.",
  );
  await dialog.getByRole("button", { name: "enter" }).click();

  await expect(dialog).toContainText(
    "deep in the swamp is a moss-covered cabin.",
  );
  await dialog.getByRole("button", { name: "talk" }).click();

  await expect(dialog).toContainText(
    "the wanderer takes the charm and nods slowly.",
  );
  await expect(dialog).toContainText(
    "he speaks of once leading the great fleets to fresh worlds.",
  );
  expect(await getState(page, "outfit.charm")).toBe(0);
  expect(await getState(page, 'character.perks["gastronome"]')).toBe(true);
  expect(await getState(page, "game.world.swampVisited")).toBe(true);
  expect(await getState(page, 'game.world.resolvedLandmarks["31,30"]')).toBe(
    true,
  );
  await dialog.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("landmark", { exact: true })).toHaveCount(0);
  await expect(worldMap.locator('[title="A Murky Swamp"]')).toHaveCount(0);

  await page.getByRole("button", { name: "west" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("perks")).toContainText("gastronome");
});

async function gatherOutsideWood(page: Page, times: number) {
  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  for (let i = 0; i < times; i += 1) {
    await dismissEvent(page);
    await page.getByRole("button", { name: "gather wood" }).click();
    await advanceGame(page, 60_000);
  }
}

type BrowserWorldDirection = "north" | "south" | "west" | "east";

interface BrowserWorldRoute {
  toAdjacent: BrowserWorldDirection[];
  enter: BrowserWorldDirection;
}

function routeToAdjacentTile(
  map: string[][],
  targetTile: string,
): BrowserWorldRoute | null {
  const target = findWorldTile(map, targetTile);
  if (!target) return null;

  const start = { x: TEST_WORLD_RADIUS, y: TEST_WORLD_RADIUS };
  const queue: Array<{ x: number; y: number; route: BrowserWorldDirection[] }> =
    [{ ...start, route: [] }];
  const visited = new Set([worldPointKey(start.x, start.y)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const enter = directionFromTo(current, target);
    if (enter) return { toAdjacent: current.route, enter };

    for (const step of WORLD_ROUTE_STEPS) {
      const next = {
        x: current.x + step.dx,
        y: current.y + step.dy,
      };
      const key = worldPointKey(next.x, next.y);
      if (visited.has(key) || !isPassableWorldRouteTile(map, next.x, next.y)) {
        continue;
      }
      visited.add(key);
      queue.push({
        ...next,
        route: [...current.route, step.direction],
      });
    }
  }

  return null;
}

function encounterResumeRoute(map: string[][]): BrowserWorldDirection[] | null {
  const terrain = new Set<string>([
    TEST_WORLD_TILE.FIELD,
    TEST_WORLD_TILE.FOREST,
    TEST_WORLD_TILE.BARRENS,
  ]);

  function search(
    x: number,
    y: number,
    route: BrowserWorldDirection[],
  ): BrowserWorldDirection[] | null {
    if (route.length === 7) return route;
    const nextDistance = route.length + 1;

    for (const step of WORLD_ROUTE_STEPS) {
      const nextX = x + step.dx;
      const nextY = y + step.dy;
      const tile = map[nextX]?.[nextY];
      const distance =
        Math.abs(nextX - TEST_WORLD_RADIUS) +
        Math.abs(nextY - TEST_WORLD_RADIUS);
      if (!tile || !terrain.has(tile) || distance !== nextDistance) continue;
      if (nextDistance === 6 && tile !== TEST_WORLD_TILE.FIELD) continue;

      const result = search(nextX, nextY, [...route, step.direction]);
      if (result) return result;
    }
    return null;
  }

  return search(TEST_WORLD_RADIUS, TEST_WORLD_RADIUS, []);
}

function routeToNearestTile(
  map: string[][],
  targetTile: string,
): BrowserWorldRoute | null {
  return routeToNearestTileFrom(
    map,
    { x: TEST_WORLD_RADIUS, y: TEST_WORLD_RADIUS },
    targetTile,
  );
}

function routeToNearestTileFrom(
  map: string[][],
  start: { x: number; y: number },
  targetTile: string,
): BrowserWorldRoute | null {
  const queue: Array<{ x: number; y: number; route: BrowserWorldDirection[] }> =
    [{ ...start, route: [] }];
  const visited = new Set([worldPointKey(start.x, start.y)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const step of WORLD_ROUTE_STEPS) {
      const nextX = current.x + step.dx;
      const nextY = current.y + step.dy;
      if (map[nextX]?.[nextY] === targetTile) {
        return { toAdjacent: current.route, enter: step.direction };
      }

      const key = worldPointKey(nextX, nextY);
      if (visited.has(key) || !isPassableWorldRouteTile(map, nextX, nextY)) {
        continue;
      }
      visited.add(key);
      queue.push({
        x: nextX,
        y: nextY,
        route: [...current.route, step.direction],
      });
    }
  }
  return null;
}

const WORLD_ROUTE_STEPS: Array<{
  direction: BrowserWorldDirection;
  dx: number;
  dy: number;
}> = [
  { direction: "east", dx: 1, dy: 0 },
  { direction: "west", dx: -1, dy: 0 },
  { direction: "south", dx: 0, dy: 1 },
  { direction: "north", dx: 0, dy: -1 },
];

const WORLD_ROUTE_BLOCKERS = new Set<string>([
  TEST_WORLD_TILE.BATTLEFIELD,
  TEST_WORLD_TILE.BOREHOLE,
  TEST_WORLD_TILE.COAL_MINE,
  TEST_WORLD_TILE.EXECUTIONER,
  TEST_WORLD_TILE.HOUSE,
  TEST_WORLD_TILE.IRON_MINE,
  TEST_WORLD_TILE.OUTPOST,
  TEST_WORLD_TILE.SHIP,
  TEST_WORLD_TILE.SWAMP,
  "S",
  "V",
  "O",
  "Y",
  "U",
]);

function findWorldTile(
  map: string[][],
  targetTile: string,
): { x: number; y: number } | null {
  for (let x = 0; x < map.length; x += 1) {
    for (let y = 0; y < (map[x]?.length ?? 0); y += 1) {
      if (map[x]?.[y] === targetTile) return { x, y };
    }
  }
  return null;
}

function directionFromTo(
  from: { x: number; y: number },
  to: { x: number; y: number },
): BrowserWorldDirection | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1 && dy === 0) return "east";
  if (dx === -1 && dy === 0) return "west";
  if (dx === 0 && dy === 1) return "south";
  if (dx === 0 && dy === -1) return "north";
  return null;
}

function isPassableWorldRouteTile(
  map: string[][],
  x: number,
  y: number,
): boolean {
  const tile = map[x]?.[y];
  return tile !== undefined && !WORLD_ROUTE_BLOCKERS.has(tile);
}

function worldPointKey(x: number, y: number): string {
  return `${x},${y}`;
}

function worldMapWith(x: number, y: number, tile: string): string[][] {
  const size = TEST_WORLD_RADIUS * 2 + 1;
  const map = Array.from({ length: size }, () =>
    Array<string>(size).fill(TEST_WORLD_TILE.FIELD),
  );
  map[TEST_WORLD_RADIUS][TEST_WORLD_RADIUS] = TEST_WORLD_TILE.VILLAGE;
  map[x][y] = tile;
  return map;
}

async function clearCoalMineWithPlasma(page: Page) {
  await page.getByRole("button", { name: "attack" }).click();

  await attackUntilWon(page, "the man is dead");
  await advanceGame(page, 1000);
  await expect(page.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "run" })).toBeVisible();
  await page.getByRole("button", { name: "continue" }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "man",
  );
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the man is dead");
  await advanceGame(page, 1000);
  await expect(page.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "run" })).toBeVisible();
  await page.getByRole("button", { name: "continue" }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "chief",
  );
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the chief is dead");
  await advanceGame(page, 1000);
  await expect(page.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "run" })).toHaveCount(0);
  await page.getByRole("button", { name: "continue" }).click();
}

async function progressEconomyToCompassAndCuredMeat(
  page: Page,
  curedMeatTarget = 1,
) {
  for (let cycle = 0; cycle < 170; cycle += 1) {
    await dismissEvent(page);
    await page
      .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
      .click();
    await dismissEvent(page);
    await clickIfEnabled(page, "gather wood");
    await clickIfEnabled(page, "check traps");
    await clickIfEnabled(page, "hunter +1");
    if (await isVisible(page, "charcutier +1")) {
      await clickIfEnabled(page, "hunter -1");
      await clickIfEnabled(page, "charcutier +1");
    }

    await advanceGame(page, 60_000);
    await dismissEvent(page);

    await page.getByRole("tab", { name: /A .*Room/ }).click();
    await dismissEvent(page);
    await clickIfEnabled(page, /^trap/);
    await clickIfEnabled(page, /^cart/);
    await clickIfEnabled(page, /^hut/);
    await clickIfEnabled(page, /^lodge/);
    await clickIfEnabled(page, /^trading post/);
    await clickIfEnabled(page, /^smokehouse/);
    await buyUntilAtLeast(page, "scales", 20);
    await buyUntilAtLeast(page, "teeth", 10);
    await clickIfEnabled(page, /^compass/);

    if (
      (await page.getByRole("tab", { name: "A Dusty Path" }).count()) > 0 &&
      (await storeValue(page, "cured meat")) >= curedMeatTarget
    ) {
      return;
    }
  }

  throw new Error("fresh progression did not reach Path with cured meat");
}

async function prepareFreshTorchPathAndCave(page: Page) {
  await page.goto("/?testHarness=1&debug=1");
  await page.evaluate(() => window.localStorage.clear());
  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("checkbox", { name: "income x 10" }).check();
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: "light fire" }).click();
  await advanceGame(page, 130_000);
  await progressEconomyToCompassAndCuredMeat(page, 5);

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: /^tannery/ }).click();
  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  const dismissCharcutier = page.getByRole("button", {
    name: "charcutier -10",
    exact: true,
  });
  for (let batch = 0; batch < 7; batch += 1) {
    await dismissCharcutier.click();
  }
  await page.getByRole("button", { name: "hunter +10", exact: true }).click();
  await page.getByRole("button", { name: "tanner +1", exact: true }).click();
  await advanceGame(page, 100_000);

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: /^workshop/ }).click();
  const torch = page.getByRole("button", { name: /^torch/ });
  await expect(torch).toBeEnabled();
  await torch.click();

  const map = await getState<string[][]>(page, "game.world.map");
  const route = routeToNearestTile(map, TEST_WORLD_TILE.CAVE);
  expect(route).not.toBeNull();
  return route!;
}

async function carryCuredMeat(page: Page, amount: number) {
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  for (let food = 0; food < amount; food += 1) {
    await page
      .getByRole("button", { name: "cured meat +1", exact: true })
      .click();
  }
}

async function seedCaveCampCache(page: Page, route: BrowserWorldRoute) {
  const terrainFightChecks = Math.max(0, route.toAdjacent.length - 3);
  await page.evaluate(
    ({ checks }) =>
      window.__adrTest?.setRngSequence([...Array(checks).fill(0.9), 0.9]),
    { checks: terrainFightChecks },
  );
}

async function seedCaveDepths(page: Page, route: BrowserWorldRoute) {
  const terrainFightChecks = Math.max(0, route.toAdjacent.length - 3);
  await page.evaluate(
    ({ checks }) =>
      window.__adrTest?.setRngSequence([...Array(checks).fill(0.9), 0]),
    { checks: terrainFightChecks },
  );
}

async function followWorldRoute(page: Page, route: BrowserWorldRoute) {
  for (const direction of route.toAdjacent) {
    await page.getByRole("button", { name: direction }).click();
  }
  await page.getByRole("button", { name: route.enter }).click();
}

async function winFistsOnlyCombat(page: Page, victoryText: string) {
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(
      Array.from({ length: 60 }, () => [0, 0.9]).flat(),
    ),
  );
  const dialog = page.getByRole("dialog", { name: "event" });
  for (let attack = 0; attack < 12; attack += 1) {
    if ((await dialog.count()) === 0) {
      throw new Error("combat event closed before victory");
    }
    const text = (await dialog.textContent()) ?? "";
    if (text.includes(victoryText)) return;
    const hp = text.match(/@\s+(\d+)\/(\d+)/);
    if (hp && Number(hp[1]) <= 4) {
      const heal = dialog.getByRole("button", { name: "eat meat" });
      if (await heal.isEnabled().catch(() => false)) await heal.click();
    }
    await dialog.getByRole("button", { name: "punch" }).click();
    await advanceGame(page, 2000);
  }
  await expect(dialog).toContainText(victoryText);
}

async function buyUntilAtLeast(page: Page, label: string, target: number) {
  let current = await storeValue(page, label);
  while (current < target) {
    const clicked = await clickIfEnabled(page, new RegExp(`^${label}`));
    if (!clicked) return;
    current = await storeValue(page, label);
  }
}

async function storeValue(page: Page, label: string) {
  const stores = page.getByLabel("stores").first();
  if ((await stores.count()) === 0) return 0;
  const text = await stores.innerText();
  const match = text.match(new RegExp(`${label}\\s+(\\d+)`));
  return match ? Number(match[1]) : 0;
}

async function clickIfEnabled(page: Page, name: string | RegExp) {
  const button = page.getByRole("button", { name }).first();
  if ((await button.count()) === 0) return false;
  if (!(await button.isVisible().catch(() => false))) return false;
  if (await button.isDisabled().catch(() => true)) return false;
  await button.click();
  return true;
}

async function isVisible(page: Page, name: string | RegExp) {
  const button = page.getByRole("button", { name }).first();
  return (
    (await button.count()) > 0 && (await button.isVisible().catch(() => false))
  );
}

async function dismissEvent(page: Page) {
  const event = page.getByLabel("event");
  if ((await event.count()) === 0 || !(await event.isVisible())) return;
  const endButtons = [
    page.getByRole("button", { name: "turn him away" }),
    page.getByRole("button", { name: "say goodbye" }),
    page.getByRole("button", { name: "go home" }),
    page.getByRole("button", { name: "leave" }),
    page.getByRole("button", { name: "ignore them" }),
    page.getByRole("button", { name: "ignore it" }),
    page.getByRole("button", { name: "tell him to leave" }),
    page.getByRole("button", { name: "go back inside" }),
    page.getByRole("button", { name: "mourn" }),
  ];
  for (const button of endButtons) {
    if ((await button.count()) > 0 && (await button.first().isVisible())) {
      await button.first().click();
      return;
    }
  }
}

async function attackUntilWon(page: Page, victoryText: string) {
  const dialog = page.getByRole("dialog", { name: "event" });
  for (let attack = 0; attack < 5; attack += 1) {
    if ((await dialog.textContent())?.includes(victoryText)) return;
    await page.getByRole("button", { name: /disintegrate/ }).click();
    await advanceGame(page, 1000);
  }
  await expect(dialog).toContainText(victoryText);
}

async function attackWithPlasmaUntilWon(page: Page, victoryText: string) {
  const dialog = page.getByRole("dialog", { name: "event" });
  for (let attack = 0; attack < 90; attack += 1) {
    if ((await dialog.count()) === 0) {
      throw new Error("combat event closed before victory");
    }
    const text = (await dialog.textContent()) ?? "";
    if (text.includes(victoryText)) return;

    const hp = text.match(/@\s+(\d+)\/(\d+)/);
    if (hp && Number(hp[1]) <= 45) {
      const hypo = page.getByRole("button", { name: "use hypo" });
      const canUseHypo =
        (await hypo.count()) > 0 &&
        (await hypo.isEnabled({ timeout: 100 }).catch(() => false));
      if (canUseHypo) {
        await hypo.click();
      }
    }

    const shield = page.getByRole("button", { name: "shield" });
    if (
      (await shield.count()) > 0 &&
      (await shield.isEnabled({ timeout: 100 }).catch(() => false))
    ) {
      await shield.click();
    }

    const disintegrate = page.getByRole("button", { name: /disintegrate/ });
    if (
      (await disintegrate.count()) > 0 &&
      (await disintegrate.isEnabled({ timeout: 100 }).catch(() => false))
    ) {
      await disintegrate.click();
    }
    await advanceGame(page, 1000);
  }
  await expect(dialog).toContainText(victoryText);
}

function rectsOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}
