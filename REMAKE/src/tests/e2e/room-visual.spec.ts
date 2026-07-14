import { expect, test, type Page } from "@playwright/test";

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

test("visual: matches the fresh room visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-fresh.png");
});

test("visual: matches the firelit room visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-firelit.png");
});

test("visual: matches the room stores visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 12);
  await setState(page, "stores.compass", 1);
  await setState(page, "stores.bolas", 1);
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-stores.png");
});

test("visual: matches the room build visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "game.builder.level", 4);
  await setState(page, "game.temperature", { value: 3, text: "warm" });
  await setState(page, "stores.wood", 5);
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-build.png");
});

test("visual: matches the room craft and buy visual baseline", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "game.builder.level", 4);
  await setState(page, "game.temperature", { value: 3, text: "warm" });
  await setState(page, "stores.wood", 5);
  await setState(page, "stores.cloth", 1);
  await setState(page, 'game.buildings["workshop"]', 1);
  await setState(page, "stores.fur", 150);
  await setState(page, "stores.scales", 0);
  await setState(page, 'game.buildings["trading post"]', 1);
  await expect(page.locator(".roomPanel")).toHaveScreenshot(
    "room-craft-buy.png",
  );
});

test("visual: matches the outside gather visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, "stores.wood", 12);
  await setState(page, 'game.buildings["trap"]', 1);
  await page.getByRole("tab", { name: "A Silent Forest" }).click();
  await expect(page.locator(".outsidePanel")).toHaveScreenshot(
    "outside-gather.png",
  );
});

test("visual: matches the phase 3 full shell visual baseline", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 12);
  await setState(page, "features.location.outside", true);
  await expect(page.locator(".appShell")).toHaveScreenshot("phase3-shell.png");
});

test("visual: keeps the full physical desktop framing stable", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&testSeed=phase3");
  await expect(page).toHaveScreenshot("desktop-viewport.png", {
    fullPage: false,
  });
});

test("visual: matches the phase 4 outside workers visual baseline", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, 'game.buildings["hut"]', 2);
  await setState(page, 'game.buildings["lodge"]', 1);
  await setState(page, "game.population", 5);
  await page.getByRole("tab", { name: "A Tiny Village" }).click();
  await expect(page.locator(".outsidePanel")).toHaveScreenshot(
    "outside-workers.png",
  );
});

test("visual: matches the path outfitting visual baseline", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 4);
  await setState(page, 'stores["bone spear"]', 1);
  await setState(page, 'character.perks["scout"]', true);
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await expect(page.locator(".pathPanel")).toHaveScreenshot("path-outfit.png");
});

test("visual: matches the old starship visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.spaceShip", true);
  await setState(page, "game.spaceShip.hull", 1);
  await setState(page, "game.spaceShip.thrusters", 2);
  await setState(page, 'stores["alien alloy"]', 3);
  await page.getByRole("tab", { name: "An Old Starship" }).click();
  await expect(page.locator(".shipPanel")).toHaveScreenshot("ship-panel.png");
});

test("visual: matches the thin space flight visual baseline", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&testSeed=space-slice");
  await page.getByRole("tab", { name: "An Old Starship" }).click();
  const ship = page.getByRole("region", { name: "An Old Starship" });
  const reinforce = ship.getByRole("button", { name: /reinforce hull/ });
  for (let alloy = 0; alloy < 6; alloy += 1) await reinforce.click();
  await ship.getByRole("button", { name: "lift off", exact: true }).click();
  await ship
    .getByRole("region", { name: "Ready to Leave?" })
    .getByRole("button", { name: "lift off" })
    .click();
  await page.evaluate(() => window.__adrTest?.advance(10_000));
  await expect(page.locator(".spacePanel")).toHaveScreenshot(
    "space-flight.png",
  );
});

test("visual: keeps ship and debris legible at the midpoint of ascent", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&testSeed=space-slice");
  await page.getByRole("tab", { name: "An Old Starship" }).click();
  const ship = page.getByRole("region", { name: "An Old Starship" });
  const reinforce = ship.getByRole("button", { name: /reinforce hull/ });
  for (let alloy = 0; alloy < 6; alloy += 1) await reinforce.click();
  await ship.getByRole("button", { name: "lift off", exact: true }).click();
  await ship
    .getByRole("region", { name: "Ready to Leave?" })
    .getByRole("button", { name: "lift off" })
    .click();
  await page.evaluate(() => window.__adrTest?.advance(30_000));
  await expect(page.locator(".spacePanel")).toHaveScreenshot(
    "space-flight-midpoint.png",
  );
});

test("visual: matches the whirring fabricator visual baseline", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.fabricator", true);
  await setState(page, 'character.blueprints["hypo"]', true);
  await setState(page, 'character.blueprints["kinetic armour"]', true);
  await setState(page, 'character.blueprints["stim"]', true);
  await setState(page, 'stores["alien alloy"]', 3);
  await setState(page, 'stores["energy blade"]', 1);
  await page.getByRole("tab", { name: "A Whirring Fabricator" }).click();
  await expect(page.locator(".fabricatorPanel")).toHaveScreenshot(
    "fabricator-panel.png",
  );
});

test("visual: matches the world movement visual baseline", async ({ page }) => {
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
  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("tab", { name: "world" }).click();
  await expect(page.locator(".worldPanel")).toHaveScreenshot("world-map.png");
});

test("visual: keeps a representative event dialog inside the desktop shell", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.fur", 100);
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.beggar"));
  await expect(page.locator(".appShell")).toHaveScreenshot(
    "event-dialog-shell.png",
  );
});

test("visual: keeps representative combat inside the desktop shell", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, 'outfit["bone spear"]', 1);
  await setState(page, 'outfit["cured meat"]', 2);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );
  await expect(page.locator(".appShell")).toHaveScreenshot(
    "combat-dialog-shell.png",
  );
});

test("visual: matches the score ending at each desktop target", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&testSeed=space-slice");
  await page.getByRole("tab", { name: "An Old Starship" }).click();
  const ship = page.getByRole("region", { name: "An Old Starship" });
  const reinforce = ship.getByRole("button", { name: /reinforce hull/ });
  for (let alloy = 0; alloy < 6; alloy += 1) await reinforce.click();
  await ship.getByRole("button", { name: "lift off", exact: true }).click();
  await ship
    .getByRole("region", { name: "Ready to Leave?" })
    .getByRole("button", { name: "lift off" })
    .click();
  await page.evaluate(() => window.__adrTest?.advance(60_000));
  await expect(page.locator(".endingPanel")).toHaveScreenshot(
    "score-ending.png",
  );
});
