import { expect, test, type Page } from "@playwright/test";

const WORLD_RADIUS = 30;

async function setState(page: Page, path: string, value: unknown) {
  await page.evaluate(
    ({ path: statePath, value: stateValue }) => {
      window.__adrTest?.setState(statePath, stateValue);
    },
    { path, value },
  );
}

async function seedPathAndWorld(page: Page, eastTile: string) {
  const size = WORLD_RADIUS * 2 + 1;
  const map: string[][] = Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, y) =>
      x === WORLD_RADIUS && y === WORLD_RADIUS ? "A" : ",",
    ),
  );
  map[WORLD_RADIUS + 1][WORLD_RADIUS] = eastTile;

  await page.goto("/?testHarness=1");
  await setState(page, "config.events.randomDisabled", true);
  await setState(page, "game.world.map", map);
  await setState(page, "game.builder.level", 4);
  await setState(page, "game.temperature", { value: 3, text: "warm" });
  await setState(page, 'game.buildings["workshop"]', 1);
  await setState(page, "stores.compass", 1);
  await setState(page, 'stores["cured meat"]', 2);
  await setState(page, "stores.wood", 1);
  await setState(page, "stores.cloth", 1);
  await page
    .getByLabel("craft")
    .getByRole("button", { name: /^torch/ })
    .click();
  await expect(page.getByLabel("stores")).toContainText("torch");
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  await page
    .getByRole("button", { name: "cured meat +1", exact: true })
    .click();
}

test("scenario-seeded: home-only torch cannot pay a World event cost", async ({
  page,
}) => {
  await seedPathAndWorld(page, "V");
  await page.getByRole("button", { name: "embark" }).click();
  await page.getByRole("button", { name: "east" }).click();

  await expect(page.getByLabel("event")).toBeVisible();
  await expect(page.getByRole("button", { name: "go inside" })).toBeDisabled();
});

test("scenario-seeded: carried torch pays the World event cost", async ({
  page,
}) => {
  await seedPathAndWorld(page, "V");
  await page.getByRole("button", { name: "torch +1", exact: true }).click();
  await page.getByRole("button", { name: "embark" }).click();
  await page.getByRole("button", { name: "east" }).click();

  const enter = page.getByRole("button", { name: "go inside" });
  await expect(enter).toBeEnabled();
  await enter.click();
  await expect(page.getByLabel("event")).not.toContainText(
    "can't see what's inside.",
  );
});

test("scenario-seeded: Cave combat exposes the original continue-or-leave choice", async ({
  page,
}) => {
  await seedPathAndWorld(page, "V");
  await page.getByRole("button", { name: "torch +1", exact: true }).click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 2);
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(Array(20).fill(0)),
  );

  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "go inside" }).click();
  await page.getByRole("button", { name: /disintegrate/ }).click();

  const event = page.getByLabel("event");
  await expect(event.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(event.getByRole("button", { name: "leave cave" })).toBeVisible();
  await expect(
    event.getByRole("button", { name: "leave", exact: true }),
  ).toHaveCount(0);

  await event.getByRole("button", { name: "continue" }).click();
  await expect(event).toContainText(
    "the body of a wanderer lies in a small cavern.",
  );
});

test("scenario-seeded: canonical Town exposes its original schoolhouse route", async ({
  page,
}) => {
  await seedPathAndWorld(page, "O");
  await page.getByRole("button", { name: "torch +1", exact: true }).click();
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 4);
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(Array(40).fill(0)),
  );

  await page.getByRole("button", { name: "east" }).click();
  const event = page.getByLabel("event");
  await expect(event).toContainText("a small suburb lays ahead");
  await event.getByRole("button", { name: "explore" }).click();
  await expect(event).toContainText("windows of the schoolhouse");
  await event.getByRole("button", { name: /^enter/ }).click();
  await expect(event).toContainText("rusting locker");
  await event.getByRole("button", { name: "continue" }).click();

  const attack = event.getByRole("button", { name: /disintegrate/ });
  await attack.click();
  await page.evaluate(() => window.__adrTest?.advance(1000));
  await attack.click();
  await page.evaluate(() => window.__adrTest?.advance(1000));
  await attack.click();

  await expect(event.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(event.getByRole("button", { name: "leave town" })).toBeVisible();
});

test("scenario-seeded: canonical City exposes its original tower combat route", async ({
  page,
}) => {
  await seedPathAndWorld(page, "Y");
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, 'character.perks["precise"]', true);
  await setState(page, 'outfit["plasma rifle"]', 1);
  await setState(page, 'outfit["energy cell"]', 4);
  await page.evaluate(() =>
    window.__adrTest?.setRngSequence(Array(40).fill(0)),
  );

  await page.getByRole("button", { name: "east" }).click();
  const event = page.getByLabel("event");
  await expect(event).toContainText("a battered highway sign");
  await event.getByRole("button", { name: "explore" }).click();
  await expect(event).toContainText("the streets are empty");
  await event.getByRole("button", { name: "continue" }).click();
  await expect(event).toContainText("the old tower seems mostly intact");
  await event.getByRole("button", { name: /^enter/ }).click();

  const attack = event.getByRole("button", { name: /disintegrate/ });
  await attack.click();
  await page.evaluate(() => window.__adrTest?.advance(1000));
  await attack.click();
  await page.evaluate(() => window.__adrTest?.advance(1000));
  await attack.click();

  await expect(event.getByRole("button", { name: "continue" })).toBeVisible();
  await expect(event.getByRole("button", { name: "leave city" })).toBeVisible();
});

test("scenario-seeded: World and combat display the same expedition HP", async ({
  page,
}) => {
  await seedPathAndWorld(page, ",");
  await page.getByRole("button", { name: "embark" }).click();
  await setState(page, "game.world.health", 7);
  await expect(page.getByLabel("world status")).toContainText("hp7/10");

  await page.evaluate(() =>
    window.__adrTest?.triggerWorldEncounter({
      distance: 6,
      terrain: "forest",
    }),
  );

  await expect(page.getByLabel("combat")).toContainText("@ 7/10");
});
