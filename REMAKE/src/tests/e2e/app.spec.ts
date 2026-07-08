import { expect, test, type Page } from "@playwright/test";

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

declare global {
  interface Window {
    __adrTest?: {
      advance: (ms: number) => void;
      setState: (path: string, value: unknown) => void;
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

test("opens the fresh room view", async ({ page }) => {
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

test("keeps spike-only future systems hidden on the default entry", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "settings" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "space" })).toHaveCount(0);
  await expect(page.getByText("Phase 0.5 risk spike")).toHaveCount(0);
});

test("keeps the clean parity entry free of debug and future tabs", async ({
  page,
}) => {
  await page.goto("/?debug=0");
  await expect(page.getByRole("tab", { name: "settings" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "space" })).toHaveCount(0);
  await expect(page.getByText("outside")).toHaveCount(0);
});

test("exposes debug settings with default-off multipliers", async ({
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

test("persists and resumes builder progression after dev load", async ({
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

test("persists and resumes outside population growth after dev load", async ({
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
  await expect(village).toContainText("5/8");
});

test("applies debug income multiplier from the settings tab", async ({
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

test("groups worker income rows inside stores", async ({ page }) => {
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

test("persists and restores the current dev save through localStorage", async ({
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
  await expect(page.getByRole("tab", { name: "A Dark Room" })).toBeVisible();
  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByRole("button", { name: "load" }).click();
  await expect(page.getByLabel("dev save")).toContainText("loaded");
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
});

test("persists active event state through dev load", async ({ page }) => {
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

test("keeps stores and build economy hidden before original room triggers", async ({
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

test("lights the fire from the fresh room", async ({ page }) => {
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

test("renders fire cooldown without shifting the room layout", async ({
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

test("keeps outside action buttons fixed during cooldown", async ({ page }) => {
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

test("keeps the fresh room within the target viewport width", async ({
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

test("groups stores and hides original hidden store types", async ({
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

test("keeps full Path outfitting scrollable without horizontal overflow", async ({
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

test("renders explicit room action costs", async ({ page }) => {
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

test("caps long room action columns before they dominate the room", async ({
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

test("plays through the complete phase 3 room progression", async ({
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

test("keeps the shell anchored when switching between room and outside", async ({
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

test("renders phase 4 outside traps and worker controls", async ({ page }) => {
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

test("keeps outside village population panel separate from stores", async ({
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

test("keeps outside village population panel aligned with action controls", async ({
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

test("plays naturally into phase 4 village workers without direct state injection", async ({
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

test("renders the first production event runtime slice", async ({ page }) => {
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

test("schedules the first available event without forced triggering", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.fur", 50);
  await advanceGame(page, 6 * 60_000);

  await expect(page.getByRole("dialog", { name: "event" })).toBeVisible();
});

test("schedules the original marketing event from a fresh run", async ({
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

test("keeps event focus inside the modal dialog", async ({ page }) => {
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

test("keeps event dialog out of the stores column", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 100);
  await setState(page, "stores.fur", 50);
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.beggar"));

  const dialog = await page
    .getByRole("dialog", { name: "event" })
    .boundingBox();
  const stores = await page
    .getByRole("region", { name: "stores" })
    .boundingBox();

  expect(dialog).not.toBeNull();
  expect(stores).not.toBeNull();
  expect(rectsOverlap(dialog!, stores!)).toBe(false);
});

test("keeps long event text inside the shell at browser zoom", async ({
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

test("resolves the first combat encounter slice through the event panel", async ({
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

test("resolves a world-selected encounter through the event panel", async ({
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

test("uses combat drop controls when loot exceeds carrying capacity", async ({
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

test("returns to the room when combat death closes the event", async ({
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
  await expect(page.getByLabel("notifications")).toContainText(
    "the world fades",
  );
  await expect(page.getByLabel("combat")).toHaveCount(0);
});

test("renders late-game shield and stim combat controls", async ({ page }) => {
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

test("continues setpiece combat scenes without returning the outfit home", async ({
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
  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toContainText("man");
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the man is dead");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toContainText("chief");
  await expect(
    page.getByRole("button", { name: /disintegrate/ }),
  ).toBeVisible();

  await attackUntilWon(page, "the chief is dead");
  await advanceGame(page, 1000);
  await page.getByRole("button", { name: "leave" }).click();

  await expect(dialog).toContainText(
    "the camp is still, save for the crackling of the fires.",
  );
  await expect(dialog).toContainText("the mine is now safe for workers.");
});

test("routes the executioner antechamber into command deck combat in the browser", async ({
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

test("plays organically from fresh room to Path, World movement, and return without resource injection", async ({
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
  await expect(page.getByLabel("world map")).toContainText("@");
  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "west" }).click();
  await page.getByRole("button", { name: "return" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);
});

test("keeps Compass to Path to World contract at viewport extremes", async ({
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
  await expect(page.getByLabel("world map")).toContainText("@");
  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "west" }).click();
  await page.getByRole("button", { name: "return" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
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

async function progressEconomyToCompassAndCuredMeat(page: Page) {
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
      (await storeValue(page, "cured meat")) > 0
    ) {
      return;
    }
  }

  throw new Error("fresh progression did not reach Path with cured meat");
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
