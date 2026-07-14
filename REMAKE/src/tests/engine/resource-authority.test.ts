import { describe, expect, it } from "vitest";
import type { OriginalCombatDefinition } from "../../content/original/events/eventData";
import {
  CombatRuntime,
  EventRuntime,
  ExpeditionTransaction,
  WorldRuntime,
  createGameEngine,
} from "../../engine";
import {
  WORLD_RADIUS,
  WORLD_TILE,
  type WorldMapGrid,
} from "../../content/original/world/worldData";

interface ItemCostCase {
  resource: "torch" | "charm" | "grenade";
  eventKey: string;
  beforeTarget: string[];
  target: string;
}

const ITEM_COST_CASES: ItemCostCase[] = [
  {
    resource: "torch",
    eventKey: "setpiece.cave-camp-cache",
    beforeTarget: [],
    target: "enter",
  },
  {
    resource: "charm",
    eventKey: "setpiece.swamp",
    beforeTarget: ["enter"],
    target: "talk",
  },
  {
    resource: "grenade",
    eventKey: "executioner.martial-armory-blast",
    beforeTarget: ["continue"],
    target: "blast",
  },
];

describe("active expedition resource authority", () => {
  for (const resourceCase of ITEM_COST_CASES) {
    it(`uses carried ${resourceCase.resource} and ignores home-only stock`, () => {
      const homeOnly = activeWorldEvents();
      homeOnly.engine.state.set(`stores["${resourceCase.resource}"]`, 1);
      reachCostButton(homeOnly.events, resourceCase);

      expect(costButton(homeOnly.events, resourceCase.target)?.disabled).toBe(
        true,
      );
      expect(homeOnly.events.choose(resourceCase.target)).toBe(false);
      expect(
        homeOnly.engine.state.get(`stores["${resourceCase.resource}"]`),
      ).toBe(1);

      const carriedOnly = activeWorldEvents({
        inventory: { [resourceCase.resource]: 1 },
      });
      reachCostButton(carriedOnly.events, resourceCase);

      expect(
        costButton(carriedOnly.events, resourceCase.target)?.disabled,
      ).toBe(false);
      expect(carriedOnly.events.choose(resourceCase.target)).toBe(true);
      expect(
        carriedOnly.expedition.inventoryQuantity(resourceCase.resource),
      ).toBe(0);
      expect(
        carriedOnly.engine.state.get(
          `stores["${resourceCase.resource}"]`,
          true,
        ),
      ).toBe(0);
    });
  }

  it("uses expedition water instead of home water", () => {
    const insufficient = activeWorldEvents({ water: 4 });
    insufficient.engine.state.set('stores["water"]', 100);
    expect(
      insufficient.events.triggerByKeyForTest(
        "executioner.engineering-fire-guard-post",
      ),
    ).toBe(true);
    expect(insufficient.events.choose("continue")).toBe(true);
    expect(costButton(insufficient.events, "water")?.disabled).toBe(true);
    expect(insufficient.events.choose("water")).toBe(false);
    expect(insufficient.expedition.water()).toBe(4);

    const exact = activeWorldEvents({ water: 5 });
    expect(
      exact.events.triggerByKeyForTest(
        "executioner.engineering-fire-guard-post",
      ),
    ).toBe(true);
    expect(exact.events.choose("continue")).toBe(true);
    expect(costButton(exact.events, "water")?.disabled).toBe(false);
    expect(exact.events.choose("water")).toBe(true);
    expect(exact.expedition.water()).toBe(0);
  });

  it("uses expedition HP instead of character HP", () => {
    const insufficient = activeWorldEvents({ health: 9 });
    insufficient.engine.state.set("character.health", 85);
    expect(
      insufficient.events.triggerByKeyForTest(
        "executioner.engineering-fire-guard-post",
      ),
    ).toBe(true);
    expect(insufficient.events.choose("continue")).toBe(true);
    expect(costButton(insufficient.events, "run")?.disabled).toBe(true);
    expect(insufficient.events.choose("run")).toBe(false);
    expect(insufficient.expedition.health()).toBe(9);
    expect(insufficient.engine.state.get("character.health")).toBe(85);

    const exact = activeWorldEvents({ health: 10 });
    exact.engine.state.set("character.health", 85);
    expect(
      exact.events.triggerByKeyForTest(
        "executioner.engineering-fire-guard-post",
      ),
    ).toBe(true);
    expect(exact.events.choose("continue")).toBe(true);
    expect(costButton(exact.events, "run")?.disabled).toBe(false);
    expect(exact.events.choose("run")).toBe(true);
    expect(exact.expedition.health()).toBe(0);
    expect(exact.expedition.active()).toBe(false);
    expect(exact.events.snapshot()).toBeNull();
    expect(exact.engine.state.get("game.world.dead")).toBe(true);
    expect(exact.engine.state.get("game.world.returnLocation")).toBe("room");
    expect(exact.engine.state.get("character.health")).toBe(85);
  });

  it("keeps Room event costs on home stores", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);
    engine.state.set("stores.medicine", 1);
    engine.state.set("outfit.medicine", 5);
    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 20 });
    const events = new EventRuntime(
      engine,
      () => "world",
      {},
      undefined,
      expedition,
    );

    expect(events.triggerByKeyForTest("room.sick-man")).toBe(true);
    expect(costButton(events, "help")?.disabled).toBe(false);
    expect(events.choose("help")).toBe(true);
    expect(engine.state.get("stores.medicine", true)).toBe(0);
    expect(engine.state.get("outfit.medicine")).toBe(5);
  });

  it("keeps non-World water costs on home stores", () => {
    const engine = createGameEngine();
    const events = new EventRuntime(engine, () => "room");
    engine.state.set("stores.water", 4);
    engine.state.set("outfit.water", 100);

    expect(
      events.triggerByKeyForTest("executioner.engineering-fire-guard-post"),
    ).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(costButton(events, "water")?.disabled).toBe(true);
    expect(events.choose("water")).toBe(false);
    expect(engine.state.get("stores.water")).toBe(4);
    expect(engine.state.get("outfit.water")).toBe(100);
  });

  it.each([
    "executioner.engineering-rd-blueprint",
    "executioner.martial-training-robot",
  ])("routes %s regeneration into expedition HP", (eventKey) => {
    const active = activeWorldEvents({
      health: 2,
      inventory: { "alien alloy": 1 },
    });
    active.engine.state.set('stores["kinetic armour"]', 1);
    active.engine.state.set("character.health", 17);

    expect(active.events.triggerByKeyForTest(eventKey)).toBe(true);
    expect(active.events.choose("use")).toBe(true);

    expect(active.expedition.health()).toBe(85);
    expect(active.engine.state.get("character.health")).toBe(17);
    expect(active.expedition.inventoryQuantity("alien alloy")).toBe(0);
  });

  it("shares HP between World travel and consecutive combats while medicine stays carried", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);
    const world = new WorldRuntime(engine, expedition);
    const map = terrainMap();

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set('outfit["cured meat"]', 2, true);
    engine.state.set('outfit["medicine"]', 1, true);
    engine.state.set('stores["medicine"]', 12, true);
    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 20 });

    const firstCombat = new CombatRuntime(engine, {}, expedition);
    firstCombat.start(testCombat());
    engine.clock.advanceBy(1000);
    expect(firstCombat.snapshot()?.playerHp).toBe(7);
    expect(expedition.health()).toBe(7);
    firstCombat.clear();

    world.move("east");
    world.move("north");
    expect(expedition.health()).toBe(10);
    expect(expedition.inventoryQuantity("cured meat")).toBe(1);

    const secondCombat = new CombatRuntime(engine, {}, expedition);
    secondCombat.start(testCombat());
    expect(secondCombat.snapshot()?.playerHp).toBe(10);
    engine.clock.advanceBy(1000);
    expect(secondCombat.snapshot()?.playerHp).toBe(7);
    expect(secondCombat.chooseAction("heal:medicine")).toBe(true);
    expect(expedition.health()).toBe(10);
    expect(expedition.inventoryQuantity("medicine")).toBe(0);
    expect(engine.state.get('stores["medicine"]')).toBe(12);
  });

  it("does not expose home-only medicine during expedition combat", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);
    engine.state.set('stores["medicine"]', 12, true);
    expedition.begin({ position: { x: 30, y: 30 }, health: 7, water: 20 });

    const combat = new CombatRuntime(engine, {}, expedition);
    combat.start(testCombat());

    expect(
      combat
        .snapshot()
        ?.actions.some((action) => action.key === "heal:medicine"),
    ).toBe(false);
    expect(combat.chooseAction("heal:medicine")).toBe(false);
    expect(expedition.health()).toBe(7);
    expect(engine.state.get('stores["medicine"]')).toBe(12);
  });
});

function activeWorldEvents(options?: {
  health?: number;
  water?: number;
  inventory?: Record<string, number>;
}) {
  const engine = createGameEngine();
  const expedition = new ExpeditionTransaction(engine);
  for (const [key, amount] of Object.entries(options?.inventory ?? {})) {
    engine.state.set(`outfit["${key}"]`, amount, true);
  }
  expedition.begin({
    position: { x: 30, y: 30 },
    health: options?.health ?? 20,
    water: options?.water ?? 20,
  });
  const events = new EventRuntime(
    engine,
    () => "world",
    {},
    undefined,
    expedition,
  );
  return { engine, expedition, events };
}

function reachCostButton(events: EventRuntime, itemCase: ItemCostCase): void {
  expect(events.triggerByKeyForTest(itemCase.eventKey)).toBe(true);
  for (const button of itemCase.beforeTarget) {
    expect(events.choose(button)).toBe(true);
  }
}

function costButton(events: EventRuntime, key: string) {
  return events.snapshot()?.buttons.find((button) => button.key === key);
}

function terrainMap(): WorldMapGrid {
  const size = WORLD_RADIUS * 2 + 1;
  return Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, y) =>
      x === WORLD_RADIUS && y === WORLD_RADIUS
        ? WORLD_TILE.VILLAGE
        : WORLD_TILE.FIELD,
    ),
  );
}

function testCombat(): OriginalCombatDefinition {
  return {
    enemy: "test",
    enemyName: "test target",
    deathMessage: "the target is down",
    chara: "t",
    damage: 3,
    hit: 1,
    attackDelay: 1,
    health: 20,
    loot: {},
  };
}
