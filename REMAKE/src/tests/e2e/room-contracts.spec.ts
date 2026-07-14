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
test("browser: opens the fresh room view", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "A Dark Room" })).toBeVisible();
  await expect(page.getByLabel("room status")).toContainText(
    "the fire is dead",
  );
  await expect(page.getByLabel("room status")).toContainText(
    "the room is freezing",
  );
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
});

test("browser: keeps spike-only future systems hidden on the default entry", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "settings" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "space" })).toHaveCount(0);
  await expect(page.getByText("Phase 0.5 risk spike")).toHaveCount(0);
});

test("browser: keeps the clean parity entry free of debug and future tabs", async ({
  page,
}) => {
  await page.goto("/?debug=0");
  await expect(page.getByRole("tab", { name: "settings" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "space" })).toHaveCount(0);
  await expect(page.getByText("outside")).toHaveCount(0);
});

test("browser: exposes debug settings with default-off multipliers", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&debug=1");
  await expect(page.getByRole("tab", { name: "settings" })).toBeVisible();

  await page.getByRole("tab", { name: "settings" }).click();
  await expect(
    page.getByRole("checkbox", { name: "speed x 10" }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "income x 10" }),
  ).not.toBeChecked();
  await expect(page.getByLabel("debug info")).toContainText("speed1x");
  await expect(page.getByLabel("debug info")).toContainText("income1x");
});

test("browser: persists and resumes builder progression after dev load", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&debug=1");
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole("button", { name: "light fire" }).click();
  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("button", { name: "save" }).click();

  await page.reload();
  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("button", { name: "load" }).click();
  await advanceGame(page, 30_000);

  await page.getByRole("tab", { name: "A Firelit Room" }).click();
  await expect(page.getByLabel("notifications")).toContainText(
    "a ragged stranger stumbles through the door and collapses in the corner",
  );
});

test("browser: persists and resumes outside population growth after dev load", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&debug=1");
  await page.evaluate(() => window.localStorage.clear());
  await setState(page, "features.location.outside", true);
  await setState(page, 'game.buildings["hut"]', 2);
  await page.getByRole("tab", { name: "A Tiny Village" }).click();

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("button", { name: "save" }).click();

  await page.reload();
  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("button", { name: "load" }).click();
  await advanceGame(page, 30_000);

  await page.getByRole("tab", { name: "A Tiny Village" }).click();
  const village = page.getByRole("region", { name: "village", exact: true });
  await expect(village).toContainText("pop");
  await expect(village).toContainText("6/8");
});

test("browser: applies debug income multiplier from the settings tab", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&debug=1");
  await setState(page, "game.builder.level", 3);
  await setState(page, "stores.wood", 1);
  await expect(page.getByLabel("stores")).toContainText("wood +2/10s");

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("checkbox", { name: "income x 10" }).check();
  await expect(page.getByLabel("debug info")).toContainText("income10x");

  await page.getByRole("tab", { name: "A Dark Room" }).click();
  await expect(page.getByLabel("stores")).toContainText("wood +20/10s");
  await advanceGame(page, 10_000);
  await expect(page.getByLabel("stores")).toContainText("21");
});

test("browser: groups worker income rows inside stores", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 12);
  await setState(page, 'income["hunter"]', {
    delay: 10,
    stores: { fur: 150, meat: 150 },
  });
  await setState(page, 'income["charcutier"]', {
    delay: 10,
    stores: { meat: -50, wood: -50, "cured meat": 10 },
  });

  const income = page.getByLabel("income");
  await expect(income.locator(".incomeRow")).toHaveCount(2);
  await expect(income).toContainText("hunter");
  await expect(income).toContainText("fur +150/10s, meat +150/10s");
  await expect(income).toContainText("charcutier");
  await expect(income).toContainText(
    "meat -50/10s, wood -50/10s, cured meat +10/10s",
  );
});

test("browser: persists and restores the current dev save through localStorage", async ({
  page,
}) => {
  await page.goto("/?debug=1");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("button", { name: "save" }).click();
  await expect(page.getByLabel("dev save")).toContainText("saved");

  await page.reload();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("button", { name: "load" }).click();
  await expect(page.getByLabel("dev save")).toContainText("loaded");
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
});

test("browser: persists active event state through dev load", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await page.evaluate(() => window.localStorage.clear());
  await setState(page, "stores.wood", 100);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("room.mysterious-wanderer.wood"),
  );

  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "a wanderer arrives with an empty cart",
  );
  await page.evaluate(() => window.__adrTest?.save());

  await page.reload();
  await page.evaluate(() => window.__adrTest?.load());
  await expect(page.getByRole("dialog", { name: "event" })).toContainText(
    "a wanderer arrives with an empty cart",
  );
});

test("browser: keeps stores and build economy hidden before original room triggers", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("stores")).toHaveCount(0);
  await expect(page.getByLabel("build")).toHaveCount(0);
  await expect(page.getByLabel("craft")).toHaveCount(0);
  await expect(page.getByLabel("buy")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "A Silent Forest" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "gather wood" })).toHaveCount(
    0,
  );
  await expect(page.getByText("worker")).toHaveCount(0);
  await expect(page.getByText("outfit")).toHaveCount(0);
  await expect(page.getByText("dusty path")).toHaveCount(0);
  await expect(page.getByText("ship")).toHaveCount(0);
  await expect(page.getByText("fabricator")).toHaveCount(0);

  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByLabel("build")).toHaveCount(0);
  await expect(page.getByLabel("craft")).toHaveCount(0);
  await expect(page.getByLabel("buy")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "gather wood" })).toHaveCount(
    0,
  );
});

test("browser: lights the fire from the fresh room", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "light fire" }).click();

  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  await expect(page.getByLabel("room status")).toContainText(
    "the fire is burning",
  );
  await expect(page.getByRole("button", { name: "stoke fire" })).toBeVisible();
  await expect(page.getByLabel("notifications")).toContainText(
    "the light from the fire spills from the windows, out into the dark",
  );
});

test("browser: renders fire cooldown without shifting the room layout", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "light fire" }).click();

  const stoke = page.getByRole("button", { name: "stoke fire" });
  await expect(stoke).toBeDisabled();
  await expect(stoke).toContainText("10s");

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
});

test("browser: keeps outside action buttons fixed during cooldown", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, 'game.buildings["trap"]', 1);
  await page.getByRole("tab", { name: "A Silent Forest" }).click();

  const gather = page.getByRole("button", { name: "gather wood" });
  const traps = page.getByRole("button", { name: "check traps" });
  const gatherBefore = await gather.boundingBox();
  const trapsBefore = await traps.boundingBox();

  await gather.click();

  const gatherAfter = await gather.boundingBox();
  const trapsAfter = await traps.boundingBox();

  expect(Math.round(gatherAfter?.width ?? -1)).toBe(
    Math.round(gatherBefore?.width ?? -2),
  );
  expect(Math.round(gatherAfter?.height ?? -1)).toBe(
    Math.round(gatherBefore?.height ?? -2),
  );
  expect(Math.round(trapsAfter?.y ?? -1)).toBe(
    Math.round(trapsBefore?.y ?? -2),
  );
});

test("browser: keeps the fresh room within the target viewport width", async ({
  page,
}) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));

  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);
  expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
});

test("browser: groups stores and hides original hidden store types", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 12);
  await setState(page, "stores.compass", 1);
  await setState(page, "game.world.shipDirection", "southwest");
  await setState(page, "stores.bolas", 1);
  await setState(page, 'stores["laser rifle"]', 1);
  await setState(page, "stores.waterskin", 1);

  await expect(page.getByLabel("stores")).toContainText("wood");
  await expect(page.getByLabel("stores")).toContainText("compass");
  await expect(
    page.locator(".storeRow").filter({ hasText: "compass" }),
  ).toHaveAttribute("title", "the compass points southwest");
  await expect(page.getByLabel("weapons")).toContainText("bolas");
  await expect(page.getByLabel("weapons")).toContainText("laser rifle");
  await expect(page.getByLabel("stores")).not.toContainText("waterskin");
});

test("browser: keeps full Path outfitting scrollable without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.compass", 1);
  for (const key of [
    "alien alloy",
    "bayonet",
    "bolas",
    "bone spear",
    "bullets",
    "charm",
    "cured meat",
    "disruptor",
    "energy blade",
    "energy cell",
    "glowstone",
    "grenade",
    "hypo",
    "iron sword",
    "laser rifle",
    "medicine",
    "plasma rifle",
    "rifle",
    "steel sword",
    "stim",
    "torch",
  ]) {
    await setState(page, `stores["${key}"]`, 12);
  }

  await page.getByRole("tab", { name: "A Dusty Path" }).click();

  const dimensions = await page
    .locator(".pathPanel .playColumn")
    .evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

  expect(dimensions.clientHeight).toBeLessThanOrEqual(700);
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
  expect(dimensions.documentWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth,
  );
  const torchRow = page.locator(".outfitRow").filter({ hasText: "torch" });
  await expect(torchRow).toContainText("torch");
  await expect(torchRow).not.toContainText("0/12");
  await expect(page.getByRole("button", { name: "torch +10" })).toBeVisible();
});

test("browser: renders explicit room action costs", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "game.builder.level", 4);
  await setState(page, "game.temperature", { value: 3, text: "warm" });
  await setState(page, "stores.wood", 5);
  await expect(page.getByRole("button", { name: /trap/ })).toContainText(
    "wood: 10",
  );

  await setState(page, 'game.buildings["workshop"]', 1);
  await setState(page, "stores.cloth", 1);
  await expect(page.getByRole("button", { name: /torch/ })).toContainText(
    "wood: 1, cloth: 1",
  );

  await setState(page, 'game.buildings["trading post"]', 1);
  await setState(page, "stores.fur", 150);
  await setState(page, "stores.scales", 0);
  await expect(
    page.getByLabel("buy").getByRole("button", { name: /^scales/ }),
  ).toContainText("fur: 150");
});

test("browser: caps long room action columns before they dominate the room", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "game.builder.level", 4);
  await setState(page, "game.temperature", { value: 3, text: "warm" });
  await setState(page, "stores.wood", 5000);
  await setState(page, "stores.fur", 5000);
  await setState(page, "stores.meat", 5000);
  await setState(page, "stores.leather", 5000);
  await setState(page, "stores.scales", 5000);

  const build = await page.getByLabel("build").boundingBox();

  expect(build).not.toBeNull();
  expect(build!.height).toBeLessThanOrEqual(330);
});

test("browser: plays through the complete phase 3 room progression", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await page.getByRole("button", { name: "light fire" }).click();
  await advanceGame(page, 130000);

  await expect(
    page.getByRole("tab", { name: "A Silent Forest" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "A Silent Forest" }).click();
  await expect(page.getByLabel("outside notifications")).toContainText(
    "the sky is grey and the wind blows relentlessly",
  );
  await expect(page.getByLabel("stores")).toContainText("wood");
  await page.getByRole("button", { name: "gather wood" }).click();

  await page.getByRole("tab", { name: "A Firelit Room" }).click();
  await expect(page.getByLabel("stores")).toContainText("wood");
  await page.getByRole("button", { name: /trap/ }).click();
  await expect(page.getByRole("button", { name: /trap/ })).toContainText(
    "wood: 20",
  );
  await page.getByRole("tab", { name: "A Silent Forest" }).click();
  await expect(
    page.getByRole("region", { name: "forest", exact: true }),
  ).toContainText("trap");

  await advanceGame(page, 60000);
  await page.getByRole("button", { name: "gather wood" }).click();
  await advanceGame(page, 60000);
  await page.getByRole("button", { name: "gather wood" }).click();

  await page.getByRole("tab", { name: "A Firelit Room" }).click();
  await page.getByRole("button", { name: /cart/ }).click();
  await expect(page.getByLabel("notifications")).toContainText(
    "the rickety cart will carry more wood from the forest",
  );
});

test("browser: keeps the shell anchored when switching between room and outside", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, "stores.wood", 12);
  const before = await page.locator(".locationTabs").boundingBox();

  await page.getByRole("tab", { name: "A Silent Forest" }).click();
  const after = await page.locator(".locationTabs").boundingBox();

  expect(Math.round(after?.y ?? -1)).toBe(Math.round(before?.y ?? -2));
});

test("browser: renders phase 4 outside traps and worker controls", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, 'game.buildings["trap"]', 1);
  await setState(page, 'game.buildings["hut"]', 1);
  await setState(page, 'game.buildings["lodge"]', 1);
  await setState(page, "game.population", 2);

  await page.getByRole("tab", { name: "A Lonely Hut" }).click();
  await expect(page.getByRole("button", { name: "check traps" })).toBeVisible();
  await expect(page.getByRole("region", { name: "village" })).toContainText(
    "pop",
  );
  await expect(page.getByRole("region", { name: "workers" })).toContainText(
    "gatherer",
  );
  await expect(page.getByRole("region", { name: "workers" })).toContainText(
    "hunter",
  );

  await page.getByRole("button", { name: "hunter +1", exact: true }).click();
  await expect(page.getByRole("region", { name: "workers" })).toContainText(
    "hunter",
  );
  await expect(
    page.getByRole("button", { name: "hunter -1", exact: true }),
  ).toBeEnabled();

  await page.getByRole("button", { name: "check traps" }).click();
  await expect(
    page.getByRole("button", { name: /check traps/ }),
  ).toBeDisabled();
  await expect(page.getByLabel("outside notifications")).toContainText(
    "the traps contain",
  );
});

test("browser: keeps outside village population panel separate from stores", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, "stores.wood", 12);
  await setState(page, 'game.buildings["trap"]', 1);
  await setState(page, 'game.buildings["hut"]', 1);
  await page.getByRole("tab", { name: "A Lonely Hut" }).click();

  const stores = await page
    .getByRole("region", { name: "stores" })
    .boundingBox();
  const village = await page
    .getByRole("region", { name: "village" })
    .boundingBox();

  expect(stores).not.toBeNull();
  expect(village).not.toBeNull();
  expect(rectsOverlap(stores!, village!)).toBe(false);
});

test("browser: keeps outside village population panel aligned with action controls", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, 'game.buildings["trap"]', 1);
  await setState(page, 'game.buildings["hut"]', 1);
  await page.getByRole("tab", { name: "A Lonely Hut" }).click();

  const gather = await page
    .getByRole("button", { name: "gather wood" })
    .boundingBox();
  const traps = await page
    .getByRole("button", { name: "check traps" })
    .boundingBox();
  const village = await page
    .getByRole("region", { name: "village" })
    .boundingBox();

  expect(gather).not.toBeNull();
  expect(traps).not.toBeNull();
  expect(village).not.toBeNull();
  expect(Math.round(village!.x)).toBe(Math.round(gather!.x));
  expect(Math.round(village!.width)).toBe(Math.round(gather!.width));
  expect(village!.y).toBeGreaterThan(traps!.y + traps!.height);
  expect(rectsOverlap(gather!, village!)).toBe(false);
  expect(rectsOverlap(traps!, village!)).toBe(false);
});

test("browser: plays naturally into phase 4 village workers without direct state injection", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);

  await page.getByRole("button", { name: "light fire" }).click();
  await advanceGame(page, 130_000);
  await page.getByRole("tab", { name: "A Silent Forest" }).click();
  await page.getByRole("button", { name: "gather wood" }).click();
  await advanceGame(page, 60_000);

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: /^trap/ }).click();

  await gatherOutsideWood(page, 3);
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: /^cart/ }).click();

  await gatherOutsideWood(page, 10);
  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await page.getByRole("button", { name: /^trap/ }).click();
  await page.getByRole("button", { name: /^trap/ }).click();
  await page.getByRole("button", { name: /^hut/ }).click();

  await page
    .getByRole("tab", { name: /A .*Hut|A .*Forest|A .*Village/ })
    .click();
  for (let i = 0; i < 20; i += 1) {
    await dismissEvent(page);
    await page.getByRole("button", { name: "check traps" }).click();
    await advanceGame(page, 90_000);
    await dismissEvent(page);
    const lodge = page.getByRole("button", { name: /^lodge/ });
    if ((await lodge.count()) > 0 && (await lodge.isEnabled())) {
      break;
    }
  }

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await dismissEvent(page);
  await page.getByRole("button", { name: /^lodge/ }).click();

  await advanceGame(page, 180_000);
  await dismissEvent(page);
  await page.getByRole("tab", { name: /A .*Hut|A .*Village/ }).click();
  await expect(page.getByRole("region", { name: "workers" })).toContainText(
    "hunter",
  );
  await page.getByRole("button", { name: "hunter +1", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "hunter -1", exact: true }),
  ).toBeEnabled();
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
