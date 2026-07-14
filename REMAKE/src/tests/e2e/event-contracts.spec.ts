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
test("browser: renders the first production event runtime slice", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.fur", 50);
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.beggar"));

  await expect(page.getByLabel("event")).toContainText("The Beggar");
  await expect(page.getByLabel("event")).toContainText("a beggar arrives.");
  await expect(page.getByRole("button", { name: /give 50/ })).toBeEnabled();

  await page.getByRole("button", { name: /give 50/ }).click();
  await expect(page.getByLabel("stores")).not.toContainText("fur");
  await expect(page.getByLabel("event")).toContainText(
    /leaves (a pile of small scales|a pile of small teeth|some scraps of cloth) behind\./,
  );
});

test("browser: schedules the first available event without forced triggering", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.fur", 50);
  await advanceGame(page, 6 * 60_000);

  await expect(page.getByRole("dialog", { name: "event" })).toBeVisible();
});

test("browser: schedules the original marketing event from a fresh run", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await advanceGame(page, 6 * 60_000);

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("Penrose");
  await expect(dialog).toContainText("a strange thrumming");
  await expect(page.getByRole("button", { name: "give in" })).toBeVisible();
});

test("browser: keeps event focus inside the modal dialog", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.fur", 50);
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.beggar"));

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: /give 50/ })).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "turn him away" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /give 50/ })).toBeFocused();
});

test("browser: keeps focus owned by the dialog through combat cooldown, victory, and close", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, 'outfit["grenade"]', 1);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );

  const dialog = page.getByRole("dialog", { name: "event" });
  const lob = page.getByRole("button", { name: "lob" });
  await expect(lob).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "take" }).first(),
  ).toBeFocused();

  await advanceGame(page, 1000);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "leave" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "A Dusty Path", exact: true }),
  ).toBeFocused();
});

test("browser: keeps the dialog focused when its only combat action is cooling down", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );

  const dialog = page.getByRole("dialog", { name: "event" });
  const punch = page.getByRole("button", { name: "punch" });
  await expect(punch).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(punch).toBeDisabled();
  await expect(dialog).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(dialog).toBeFocused();
});

test("browser: keeps event dialog out of the stores column", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 100);
  await setState(page, "stores.fur", 50);
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.beggar"));

  const dialog = await page
    .getByRole("dialog", { name: "event" })
    .boundingBox();
  const stores = await page.locator(".storesPanel").boundingBox();

  expect(dialog).not.toBeNull();
  expect(stores).not.toBeNull();
  expect(rectsOverlap(dialog!, stores!)).toBe(false);
});

test("browser: keeps long event text inside the shell at browser zoom", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await page.evaluate(() => {
    document.body.style.zoom = "150%";
  });
  await setState(page, "stores.wood", 100);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("room.mysterious-wanderer.wood"),
  );

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "builder's not sure he's to be trusted",
  );
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);
  expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
});

test("browser: resolves the first combat encounter slice through the event panel", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, 'outfit["grenade"]', 1);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "snarling beast",
  );
  await expect(page.getByLabel("combat")).toContainText("@ 10/10");
  await expect(page.getByLabel("combat")).toContainText("R 5/5");

  await page.getByRole("button", { name: /lob/ }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "the snarling beast is dead",
  );
  await expect(
    page.getByRole("button", { name: "take everything" }),
  ).toBeVisible();

  await advanceGame(page, 1000);

  await page.getByRole("button", { name: "take everything" }).click();
  await page.getByRole("button", { name: "leave" }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toHaveCount(0);
});

test("browser: resolves a world-selected encounter through the event panel", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, 'outfit["grenade"]', 1);
  await page.evaluate(() =>
    window.__adrTest?.triggerWorldEncounter({
      distance: 6,
      terrain: "forest",
    }),
  );

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "snarling beast",
  );
  await page.getByRole("button", { name: /lob/ }).click();
  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "the snarling beast is dead",
  );

  await advanceGame(page, 1000);

  await page.getByRole("button", { name: "take everything" }).click();
  await page.getByRole("button", { name: "leave" }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toHaveCount(0);
});

test("browser: uses combat drop controls when loot exceeds carrying capacity", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, 'outfit["cured meat"]', 9);
  await setState(page, 'outfit["grenade"]', 1);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );

  await page.getByRole("button", { name: /lob/ }).click();
  await expect(
    page.getByRole("button", { name: "take all you can" }),
  ).toBeVisible();

  await advanceGame(page, 1000);

  await page.getByRole("button", { name: "take all you can" }).click();
  await expect(page.getByLabel("loot")).toContainText("meat [2]");
  await expect(
    page.getByRole("button", { name: "drop carried items for meat" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "drop carried items for meat" }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("menuitem", { name: "drop cured meat x1 for meat" }),
  ).toBeHidden();

  await page
    .getByRole("button", { name: "drop carried items for meat" })
    .focus();
  await expect(
    page.getByRole("button", { name: "drop carried items for meat" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("menuitem", { name: "drop cured meat x1 for meat" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "drop carried items for meat" }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("menuitem", { name: "drop cured meat x1 for meat" }),
  ).toBeHidden();

  await page
    .getByRole("button", { name: "drop carried items for meat" })
    .click();
  await expect(
    page.getByRole("button", { name: "drop carried items for meat" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("menuitem", { name: "drop cured meat x1 for meat" })
    .click();

  await expect(page.getByLabel("loot")).toContainText("meat [1]");
  await expect(page.getByLabel("loot")).toContainText("cured meat [1]");
});

test("browser: returns to the room when combat death closes the event", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "character.health", 1);
  await setState(page, 'outfit["cured meat"]', 2);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "snarling beast",
  );

  await advanceGame(page, 1000);

  await expect(page.getByRole("dialog", { name: "event" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /A .*Room/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("region", { name: /A .*Room/ })).toBeFocused();
  await expect(page.getByLabel("notifications")).toContainText(
    "the world fades",
  );
  await expect(page.getByLabel("combat")).toHaveCount(0);
});

test("browser: renders late-game shield and stim combat controls", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, 'stores["kinetic armour"]', 1);
  await setState(page, "character.health", 30);
  await setState(page, 'outfit["stim"]', 1);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );

  await expect(page.getByRole("button", { name: "shield" })).toBeVisible();
  await expect(page.getByRole("button", { name: "boost" })).toBeVisible();

  await page.getByRole("button", { name: "shield" }).click();
  await expect(page.getByRole("button", { name: /shield/ })).toContainText(
    "10s",
  );

  await page.getByRole("button", { name: "boost" }).click();
  await expect(page.getByLabel("combat")).toContainText("@ 20/85");
  await expect(page.getByRole("button", { name: /boost/ })).toContainText(
    "10s",
  );
});

test("browser: continues setpiece combat scenes without returning the outfit home", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, 'stores["plasma rifle"]', 0);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 20);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("setpiece.coalmine"),
  );

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("The Coal Mine");
  await page.getByRole("button", { name: "attack" }).click();

  await attackUntilWon(page, "the man is dead");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "continue" }).click();

  await expect(dialog).toContainText("man");
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the man is dead");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "continue" }).click();

  await expect(dialog).toContainText("chief");
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the chief is dead");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "continue" }).click();

  await expect(dialog).toContainText(
    "the camp is still, save for the crackling of the fires.",
  );
  await expect(dialog).toContainText("the mine is now safe for workers.");
});

test("browser: routes the executioner antechamber into command deck combat in the browser", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/?testHarness=1");
  await setState(page, "game.world.engineering", true);
  await setState(page, "game.world.medical", true);
  await setState(page, "game.world.martial", true);
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, 'character.perks["evasive"]', true);
  await setState(page, 'stores["kinetic armour"]', 1);
  await setState(page, 'stores["cargo drone"]', 1);
  await setState(page, "stores.wood", 1);
  await setState(page, "character.health", 85);
  await setState(page, 'stores["plasma rifle"]', 0);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 240);
  await setState(page, 'outfit["hypo"]', 12);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("executioner.antechamber"),
  );

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toContainText("A Ravaged Battleship");
  await expect(
    page.getByRole("button", { name: "command deck" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "command deck" }).click();
  await expect(dialog).toContainText("Command Deck");
  await page.getByRole("button", { name: "approach" }).click();
  await expect(dialog).toContainText("says it can't die.");
  await page.getByRole("button", { name: "observe" }).click();
  await expect(dialog).toContainText("immortal wanderer");

  await attackWithPlasmaUntilWon(page, "the immortal wanderer is defeated");
  await expect(page.getByLabel("loot")).toContainText("fleet beacon [1]");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "take everything" }).click();
  await expect(page.getByLabel("loot")).not.toContainText("fleet beacon [1]");
  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toContainText("time to get out of here.");
  await page.getByRole("button", { name: "leave" }).click();
  await expect(dialog).toHaveCount(0);
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
  await page.getByRole("button", { name: "leave" }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "man",
  );
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the man is dead");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "leave" }).click();

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "chief",
  );
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the chief is dead");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "leave" }).click();
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
      window.__adrTest?.setRngSequence([...Array(checks).fill(0.9), 0.3]),
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
