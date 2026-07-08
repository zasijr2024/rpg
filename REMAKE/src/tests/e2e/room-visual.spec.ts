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

test("matches the fresh room visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-fresh.png");
});

test("matches the firelit room visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-firelit.png");
});

test("matches the room stores visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 12);
  await setState(page, "stores.compass", 1);
  await setState(page, "stores.bolas", 1);
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-stores.png");
});

test("matches the room build visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "game.builder.level", 4);
  await setState(page, "game.temperature", { value: 3, text: "warm" });
  await setState(page, "stores.wood", 5);
  await expect(page.locator(".roomPanel")).toHaveScreenshot("room-build.png");
});

test("matches the room craft and buy visual baseline", async ({ page }) => {
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

test("matches the outside gather visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, "stores.wood", 12);
  await setState(page, 'game.buildings["trap"]', 1);
  await page.getByRole("tab", { name: "A Silent Forest" }).click();
  await expect(page.locator(".outsidePanel")).toHaveScreenshot(
    "outside-gather.png",
  );
});

test("matches the phase 3 full shell visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.wood", 12);
  await setState(page, "features.location.outside", true);
  await expect(page.locator(".appShell")).toHaveScreenshot("phase3-shell.png");
});

test("matches the phase 4 outside workers visual baseline", async ({
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

test("matches the path outfitting visual baseline", async ({ page }) => {
  await page.goto("/?testHarness=1");
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 4);
  await setState(page, 'stores["bone spear"]', 1);
  await setState(page, 'character.perks["scout"]', true);
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await expect(page.locator(".pathPanel")).toHaveScreenshot("path-outfit.png");
});

test("matches the world movement visual baseline", async ({ page }) => {
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
