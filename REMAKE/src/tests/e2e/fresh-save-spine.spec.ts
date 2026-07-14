import { expect, test, type Page, type TestInfo } from "@playwright/test";

const WORLD_RADIUS = 30;

interface Milestone {
  name: string;
  elapsedMs: number;
}

const EXPECTED_MILESTONES: Milestone[] = [
  { name: "builder", elapsedMs: 30_000 },
  { name: "outside", elapsedMs: 50_000 },
  { name: "compass", elapsedMs: 30_730_000 },
  { name: "first expedition", elapsedMs: 38_530_000 },
  { name: "fabricator", elapsedMs: 44_102_000 },
  { name: "ship", elapsedMs: 44_102_000 },
  { name: "ending", elapsedMs: 44_162_000 },
];

class FreshRunClock {
  readonly milestones: Milestone[] = [];
  elapsedMs = 0;

  constructor(private readonly page: Page) {}

  async advance(ms: number) {
    await this.page.evaluate((advanceMs) => {
      (
        window as Window & {
          __adrTest?: { advance: (durationMs: number) => void };
        }
      ).__adrTest?.advance(advanceMs);
    }, ms);
    this.elapsedMs += ms;
  }

  mark(name: string) {
    this.milestones.push({ name, elapsedMs: this.elapsedMs });
  }
}

if (process.env.ADR_FRESH_SPINE_LIBRARY !== "1") {
  test("fresh-run: visible progression reaches the ending and records pacing", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-1366" &&
        !testInfo.project.name.startsWith("release-"),
    );
    test.setTimeout(
      testInfo.project.name === "release-webkit" ? 300_000 : 180_000,
    );
    await driveFreshSaveSpine(page, testInfo);
  });
}

export async function driveFreshSaveSpine(
  page: Page,
  testInfo: TestInfo,
  url = "/?testHarness=1",
) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(url);
  const clock = new FreshRunClock(page);

  await page.getByRole("button", { name: "light fire" }).click();
  await advanceThroughOpening(page, clock);
  await expect(page.getByRole("tab", { name: /A .*Forest/ })).toBeVisible();

  await progressToCompass(page, clock);
  clock.mark("compass");
  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toBeVisible();

  await prepareFirstExpedition(page, clock);

  const map = await getState<string[][]>(page, "game.world.map");
  const landmarks = ["I", "C", "S", "B", "W", "X"].map((tile) => ({
    tile,
    point: findTile(map, tile),
  }));
  const ironRoute = routeToTile(map, "I");
  expect(ironRoute).not.toBeNull();
  await carry(page, "cured meat", 8);
  await carry(page, "torch", 1);
  await carry(page, "bone spear", 1);
  await page.getByRole("button", { name: "embark" }).click();
  clock.mark("first expedition");
  await followRoute(page, ironRoute!, false);
  const event = page.getByRole("dialog", { name: "event" });
  await expect(event).toContainText("The Iron Mine");
  await event.getByRole("button", { name: /go inside/ }).click();
  await winCombat(page, clock, "the beastly matriarch is dead", "stab");
  await chooseEvent(page, "leave");
  await expect(event).toContainText("the mine is now safe for workers");
  await chooseEvent(page, "leave");
  await followRoute(page, ironRoute!, true);
  await expect(page.getByRole("tab", { name: "world" })).toHaveCount(0);

  const coalRoute = routeToTile(map, "C");
  expect(coalRoute).not.toBeNull();
  await setOutfit(page, "cured meat", 14);
  await page.getByRole("button", { name: "embark" }).click();
  await followRoute(page, coalRoute!, false);
  await expect(event).toContainText("The Coal Mine");
  await chooseEvent(page, "attack");
  await winCombat(page, clock, "the man is dead", "stab");
  await chooseEvent(page, "continue");
  await winCombat(page, clock, "the man is dead", "stab");
  await chooseEvent(page, "continue");
  await winCombat(page, clock, "the chief is dead", "stab");
  await chooseEvent(page, "continue");
  await expect(event).toContainText("the mine is now safe for workers");
  await chooseEvent(page, "leave");
  await followRoute(page, coalRoute!, true);

  await prepareDeepExpeditions(page, clock);

  const executionerRoute = routeToTile(map, "X");
  expect(executionerRoute).not.toBeNull();
  await setOutfit(page, "bone spear", 0);
  await setOutfit(page, "iron sword", 1);
  await setOutfit(page, "cured meat", 34);
  await page.getByRole("button", { name: "embark" }).click();
  await followRoute(page, executionerRoute!, false);
  await expect(event).toContainText("A Ravaged Battleship");
  await chooseEvent(page, "enter");
  await chooseEvent(page, "continue");
  await chooseEvent(page, "continue");
  await winCombat(page, clock, "the ancient beast is dead", "swing");
  await chooseEvent(page, "leave");
  await chooseEvent(page, "power cycle");
  await winCombat(page, clock, "the automated turret is destroyed", "swing");
  await chooseEvent(page, "leave");
  await chooseEvent(page, "take device and leave");

  await page.getByRole("button", { name: "enter", exact: true }).click();
  await expect(event).toContainText("bank of elevators");
  await chooseEvent(page, "martial", [0.5]);
  await chooseEvent(page, "continue");
  await chooseEvent(page, "continue right");
  await winCombat(page, clock, "the defence turret is destroyed", "swing");
  await takeEverythingIfVisible(page);
  await chooseEvent(page, "leave");
  await winCombat(page, clock, "the mechanical quadruped is dead", "swing");
  await takeEverythingIfVisible(page);
  await chooseEvent(page, "leave");
  await chooseEvent(page, "continue");
  await chooseEvent(page, "continue");
  await expect(page.getByLabel("loot")).toContainText("plasma rifle blueprint");
  await takeEverythingIfVisible(page);
  await chooseEvent(page, "leave");
  await followRoute(page, executionerRoute!, true);

  const fabricatorTab = page.getByRole("tab", {
    name: "A Whirring Fabricator",
  });
  await expect(fabricatorTab).toBeVisible();
  await fabricatorTab.click();
  await expect(page.getByLabel("blueprints")).toContainText("plasma rifle");
  await page.getByRole("button", { name: /plasma rifle/ }).click();
  clock.mark("fabricator");

  const shipRoute = routeToTile(map, "W");
  expect(shipRoute).not.toBeNull();
  await setOutfit(page, "laser rifle", 0);
  await setOutfit(page, "energy cell", 0);
  await setOutfit(page, "torch", 0);
  await setOutfit(page, "cured meat", 34);
  await page.getByRole("button", { name: "embark" }).click();
  await followRoute(page, shipRoute!, false);
  await expect(event).toContainText("A Crashed Ship");
  await chooseEvent(page, "salvage");
  await followRoute(page, shipRoute!, true);

  const shipTab = page.getByRole("tab", { name: "An Old Starship" });
  await expect(shipTab).toBeVisible();
  clock.mark("ship");
  await shipTab.click();
  const ship = page.getByRole("region", { name: "An Old Starship" });
  await ship.getByRole("button", { name: /reinforce hull/ }).click();
  await ship.getByRole("button", { name: "lift off", exact: true }).click();
  await ship
    .getByRole("region", { name: "Ready to Leave?" })
    .getByRole("button", { name: "lift off" })
    .click();

  await setRng(page, [0.9]);
  const flight = page.getByRole("region", { name: "space flight" });
  await flight.getByRole("button", { name: "west" }).click();
  await clock.advance(60_000);
  const ending = page.getByRole("region", { name: "ending" });
  await expect(ending).toContainText("score for this game");
  clock.mark("ending");

  expect(clock.milestones).toEqual(EXPECTED_MILESTONES);
  await testInfo.attach("fresh-save-map-landmarks.json", {
    body: JSON.stringify(landmarks, null, 2),
    contentType: "application/json",
  });
  if (testInfo.project.name.startsWith("release-")) {
    await testInfo.attach("fresh-spine-ending-full-viewport.png", {
      body: await page.screenshot({ fullPage: false }),
      contentType: "image/png",
    });
  }

  await attachPacing(testInfo, clock.milestones);
  return { milestones: clock.milestones, landmarks };
}

async function advanceThroughOpening(page: Page, clock: FreshRunClock) {
  let builderMarked = false;
  let outsideMarked = false;
  for (let step = 0; step < 13; step += 1) {
    await clock.advance(10_000);
    if (
      !builderMarked &&
      ((await getState<number | undefined>(page, "game.builder.level")) ??
        -1) >= 1
    ) {
      clock.mark("builder");
      builderMarked = true;
    }
    if (
      !outsideMarked &&
      (await page.getByRole("tab", { name: /A .*Forest/ }).count()) > 0
    ) {
      clock.mark("outside");
      outsideMarked = true;
    }
  }
  if (!builderMarked || !outsideMarked) {
    throw new Error("fresh progression did not reach the opening milestones");
  }
}

async function progressToCompass(page: Page, clock: FreshRunClock) {
  for (let cycle = 0; cycle < 120; cycle += 1) {
    await dismissEvent(page);
    await page
      .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
      .click();
    await dismissEvent(page);
    await clickIfEnabled(page, "gather wood");
    await clickIfEnabled(page, "check traps");
    await clickIfEnabled(page, "hunter +10");
    await clickIfEnabled(page, "hunter +1");
    if (await isVisible(page, "charcutier +10")) {
      await clickIfEnabled(page, "hunter -10");
      await clickIfEnabled(page, "charcutier +10");
    }
    if (await isVisible(page, "charcutier +1")) {
      await clickIfEnabled(page, "hunter -1");
      await clickIfEnabled(page, "charcutier +1");
    }

    await clock.advance(10 * 60_000);
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

    if ((await page.getByRole("tab", { name: "A Dusty Path" }).count()) > 0) {
      return;
    }
  }

  throw new Error("fresh progression did not reach the Compass milestone");
}

async function prepareFirstExpedition(page: Page, clock: FreshRunClock) {
  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  await drainWorker(page, "charcutier");
  await assignWorker(page, "hunter", 30);
  await clock.advance(60 * 60_000);
  await dismissEvent(page);

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await expect(page.getByRole("button", { name: /^tannery/ })).toBeEnabled();
  await page.getByRole("button", { name: /^tannery/ }).click();
  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  await drainWorker(page, "hunter");
  await assignWorker(page, "hunter", 30);
  await assignWorker(page, "tanner", 10);
  await assignWorker(page, "charcutier", 10);
  await clock.advance(60 * 60_000);
  await dismissEvent(page);
  await drainWorker(page, "tanner");
  await drainWorker(page, "charcutier");
  await assignWorker(page, "hunter", 50);
  await clock.advance(10 * 60_000);
  await dismissEvent(page);

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  await buyUntilAtLeast(page, "scales", 10);
  await expect(page.getByRole("button", { name: /^workshop/ })).toBeEnabled();
  await page.getByRole("button", { name: /^workshop/ }).click();
  for (const craft of [/^waterskin/, /^rucksack/, /^bone spear/, /^torch/]) {
    const button = page.getByRole("button", { name: craft });
    await expect(button).toBeEnabled();
    await button.click();
  }
}

async function drainWorker(page: Page, worker: string) {
  const button = page.getByRole("button", {
    name: `${worker} -10`,
    exact: true,
  });
  while (await button.isEnabled().catch(() => false)) await button.click();
}

async function assignWorker(page: Page, worker: string, target: number) {
  for (let assigned = 0; assigned < target; assigned += 10) {
    const ten = page.getByRole("button", {
      name: `${worker} +10`,
      exact: true,
    });
    if (await ten.isEnabled().catch(() => false)) {
      await ten.click();
      continue;
    }
    const one = page.getByRole("button", {
      name: `${worker} +1`,
      exact: true,
    });
    if (!(await one.isEnabled().catch(() => false))) return;
    await one.click();
    assigned -= 9;
  }
}

async function carry(page: Page, item: string, amount: number) {
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  for (let count = 0; count < amount; count += 1) {
    await page.getByRole("button", { name: `${item} +1`, exact: true }).click();
  }
}

async function setOutfit(page: Page, item: string, target: number) {
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  const path = `outfit["${item}"]`;
  let current = (await getState<number | undefined>(page, path)) ?? 0;
  const direction = current < target ? "+1" : "-1";
  while (current !== target) {
    await page
      .getByRole("button", { name: `${item} ${direction}`, exact: true })
      .click();
    current += direction === "+1" ? 1 : -1;
  }
}

async function prepareDeepExpeditions(page: Page, clock: FreshRunClock) {
  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  await drainWorker(page, "hunter");
  await assignWorker(page, "iron miner", 10);
  await assignWorker(page, "coal miner", 10);
  await assignWorker(page, "charcutier", 10);
  await assignWorker(page, "hunter", 20);
  await clock.advance(60 * 60_000);
  await dismissEvent(page);
  await drainWorker(page, "hunter");
  await drainWorker(page, "charcutier");
  await clock.advance(10 * 60_000);
  await dismissEvent(page);

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  const steelworks = page.getByRole("button", { name: /^steelworks/ });
  await expect(steelworks).toBeEnabled();
  await steelworks.click();

  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  await drainWorker(page, "hunter");
  await assignWorker(page, "steelworker", 10);
  await clock.advance(10 * 60_000);
  await dismissEvent(page);

  await page.getByRole("tab", { name: /A .*Room/ }).click();
  for (const craft of [/^water tank/, /^wagon/, /^iron sword/]) {
    const button = page.getByRole("button", { name: craft });
    await expect(button).toBeEnabled();
    await button.click();
  }

  await page
    .getByRole("tab", { name: /A .*Forest|A .*Hut|A .*Village/ })
    .click();
  await drainWorker(page, "iron miner");
  await drainWorker(page, "coal miner");
  await assignWorker(page, "charcutier", 10);
  await clock.advance(10 * 60_000);
  await dismissEvent(page);
}

type WorldDirection = "north" | "south" | "east" | "west";

interface WorldRoute {
  steps: WorldDirection[];
}

const WORLD_STEPS: ReadonlyArray<{
  direction: WorldDirection;
  dx: number;
  dy: number;
}> = [
  { direction: "east", dx: 1, dy: 0 },
  { direction: "west", dx: -1, dy: 0 },
  { direction: "south", dx: 0, dy: 1 },
  { direction: "north", dx: 0, dy: -1 },
];

const LANDMARK_TILES = new Set([
  "I",
  "C",
  "S",
  "H",
  "V",
  "O",
  "Y",
  "P",
  "W",
  "B",
  "F",
  "M",
  "U",
  "X",
]);

function routeToTile(map: string[][], targetTile: string): WorldRoute | null {
  const queue: Array<{ x: number; y: number; steps: WorldDirection[] }> = [
    { x: WORLD_RADIUS, y: WORLD_RADIUS, steps: [] },
  ];
  const visited = new Set([`${WORLD_RADIUS},${WORLD_RADIUS}`]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const step of WORLD_STEPS) {
      const x = current.x + step.dx;
      const y = current.y + step.dy;
      const tile = map[x]?.[y];
      if (tile === undefined) continue;
      const steps = [...current.steps, step.direction];
      if (tile === targetTile) return { steps };
      const key = `${x},${y}`;
      if (visited.has(key) || LANDMARK_TILES.has(tile)) continue;
      visited.add(key);
      queue.push({ x, y, steps });
    }
  }
  return null;
}

async function followRoute(page: Page, route: WorldRoute, reverse: boolean) {
  const steps = reverse
    ? [...route.steps].reverse().map(oppositeDirection)
    : route.steps;
  for (const direction of steps) {
    await setRng(page, [0.99]);
    await page
      .getByRole("button", { name: direction, exact: true })
      .click({ force: true });
  }
}

function oppositeDirection(direction: WorldDirection): WorldDirection {
  if (direction === "north") return "south";
  if (direction === "south") return "north";
  if (direction === "east") return "west";
  return "east";
}

async function chooseEvent(page: Page, name: string, rng = [0]) {
  await setRng(page, rng);
  await page
    .getByRole("dialog", { name: "event" })
    .getByRole("button", { name, exact: true })
    .click({ force: true });
}

async function takeEverythingIfVisible(page: Page) {
  const button = page.getByRole("button", { name: "take everything" });
  if (await button.isEnabled().catch(() => false)) await button.click();
}

async function winCombat(
  page: Page,
  clock: FreshRunClock,
  victoryText: string,
  attackName: string,
) {
  const event = page.getByRole("dialog", { name: "event" });
  for (let attack = 0; attack < 80; attack += 1) {
    if (((await event.textContent()) ?? "").includes(victoryText)) return;
    await setRng(page, [0]);
    await event.getByRole("button", { name: attackName }).click();
    await setRng(page, [0.99, 0.99, 0.99]);
    await clock.advance(2_000);
  }
  await expect(event).toContainText(victoryText);
}

async function setRng(page: Page, values: number[]) {
  await page.evaluate((sequence) => {
    (
      window as Window & {
        __adrTest?: { setRngSequence: (rngValues: number[]) => void };
      }
    ).__adrTest?.setRngSequence(sequence);
  }, values);
}

async function getState<T>(page: Page, path: string): Promise<T> {
  return page.evaluate((statePath) => {
    return (
      window as Window & {
        __adrTest?: { getState: (requestedPath: string) => unknown };
      }
    ).__adrTest?.getState(statePath);
  }, path) as Promise<T>;
}

async function buyUntilAtLeast(page: Page, label: string, target: number) {
  let current = await storeValue(page, label);
  while (current < target) {
    if (!(await clickIfEnabled(page, new RegExp(`^${label}`)))) return;
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
  const event = page.getByRole("dialog", { name: "event" });
  if ((await event.count()) === 0 || !(await event.isVisible())) return;
  const choices = [
    "turn him away",
    "say goodbye",
    "go home",
    "leave",
    "ignore them",
    "ignore it",
    "tell him to leave",
    "go back inside",
    "mourn",
  ];
  for (const name of choices) {
    const button = event.getByRole("button", { name, exact: true }).first();
    if ((await button.count()) > 0 && (await button.isVisible())) {
      await button.click();
      return;
    }
  }
}

function findTile(map: string[][], tile: string) {
  for (let x = 0; x < map.length; x += 1) {
    for (let y = 0; y < (map[x]?.length ?? 0); y += 1) {
      if (map[x]?.[y] === tile) {
        return {
          x,
          y,
          distance: Math.abs(x - WORLD_RADIUS) + Math.abs(y - WORLD_RADIUS),
        };
      }
    }
  }
  return null;
}

async function attachPacing(testInfo: TestInfo, milestones: Milestone[]) {
  await testInfo.attach("fresh-save-pacing.json", {
    body: JSON.stringify({ evidence: "fresh-run", milestones }, null, 2),
    contentType: "application/json",
  });
}
