import { describe, expect, it } from "vitest";
import { createGameEngine, OutsideRuntime } from "../../engine";
import type { Rng } from "../../engine";
import {
  OUTSIDE_GATHER_DELAY,
  OUTSIDE_TRAPS_DELAY,
} from "../../content/original/outside/outsideData";

function sequenceRng(values: number[]): Rng {
  let index = 0;
  return {
    next: () => values[Math.min(index++, values.length - 1)] ?? 0,
    nextInt: (maxExclusive) =>
      Math.floor(
        (values[Math.min(index++, values.length - 1)] ?? 0) * maxExclusive,
      ),
    fork: () => sequenceRng(values),
  };
}

describe("OutsideRuntime", () => {
  it("stays hidden before the original outside unlock", () => {
    const outside = new OutsideRuntime(createGameEngine());

    expect(outside.snapshot()).toMatchObject({
      unlocked: false,
      title: "A Silent Forest",
    });
    expect(outside.gatherWood()).toBe(false);
  });

  it("initializes original outside state once unlocked", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    outside.initialize();

    expect(outside.snapshot()).toMatchObject({
      unlocked: true,
      title: "A Silent Forest",
      gatherAmount: 10,
    });
    expect(engine.state.get("game.population")).toBe(0);
    expect(engine.state.get("game.workers")).toEqual({});
  });

  it("emits the original first forest arrival once", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    outside.onArrival();
    outside.onArrival();

    expect(engine.state.get("game.outside.seenForest")).toBe(true);
    expect(
      outside.snapshot().notifications.map((item) => item.message),
    ).toEqual(["the sky is grey and the wind blows relentlessly"]);
  });

  it("keeps outside snapshots side-effect free", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    outside.initialize();

    const stateBefore = engine.state.snapshot();
    const notificationsBefore = engine.notifications.list();

    outside.snapshot();
    outside.snapshot();

    expect(engine.state.snapshot()).toEqual(stateBefore);
    expect(engine.notifications.list()).toEqual(notificationsBefore);
  });

  it("uses original village title thresholds for the outside title", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    outside.initialize();
    engine.state.set('game.buildings["hut"]', 1);
    expect(outside.snapshot().title).toBe("A Lonely Hut");

    engine.state.set('game.buildings["hut"]', 4);
    expect(outside.snapshot().title).toBe("A Tiny Village");

    engine.state.set('game.buildings["hut"]', 15);
    expect(outside.snapshot().title).toBe("A Raucous Village");
  });

  it("gathers wood with original cooldown and cart amount", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    outside.initialize();
    expect(outside.gatherWood()).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(10);
    expect(outside.snapshot().gatherCooldown).toMatchObject({
      active: true,
      remainingMs: OUTSIDE_GATHER_DELAY * 1000,
    });
    expect(outside.gatherWood()).toBe(false);

    engine.clock.advanceBy(OUTSIDE_GATHER_DELAY * 1000);
    engine.state.set('game.buildings["cart"]', 1);
    expect(outside.gatherWood()).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(60);
  });

  it("checks traps with original baited drop count, messages, and cooldown", () => {
    const engine = createGameEngine({ rng: sequenceRng([0.1, 0.7, 0.999]) });
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set('game.buildings["trap"]', 2);
    engine.state.set("stores.bait", 1);

    expect(outside.checkTraps()).toBe(true);

    expect(engine.state.get("stores.fur")).toBe(1);
    expect(engine.state.get("stores.meat")).toBe(1);
    expect(engine.state.get("stores.charm")).toBe(1);
    expect(engine.state.get("stores.bait")).toBe(0);
    expect(outside.snapshot().trapCooldown).toMatchObject({
      active: true,
      remainingMs: OUTSIDE_TRAPS_DELAY * 1000,
    });
    expect(outside.checkTraps()).toBe(false);
    expect(outside.snapshot().notifications.at(-1)?.message).toBe(
      "the traps contain scraps of fur, bits of meat and a crudely made charm",
    );
  });

  it("schedules original population growth once huts exist", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.5, 0]) });
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set('game.buildings["hut"]', 2);
    outside.initialize();

    engine.clock.advanceBy(29_999);
    expect(engine.state.get("game.population")).toBe(0);

    engine.clock.advanceBy(1);
    expect(engine.state.get("game.population")).toBe(6);
    expect(outside.snapshot()).toMatchObject({
      title: "A Tiny Village",
      population: 6,
      maxPopulation: 8,
    });
    expect(outside.snapshot().notifications.at(-1)?.message).toBe(
      "a small group arrives, all dust and bones.",
    );
  });

  it("unlocks building-dependent workers and assigns villagers from gatherers", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 3);
    engine.state.set('game.buildings["lodge"]', 1);
    outside.initialize();

    expect(
      outside.snapshot().workerRows.map((row) => [row.key, row.value]),
    ).toEqual([
      ["gatherer", 3],
      ["hunter", 0],
      ["trapper", 0],
    ]);

    expect(outside.increaseWorker("hunter", 2)).toBe(true);
    expect(outside.increaseWorker("trapper", 10)).toBe(true);
    expect(
      outside.snapshot().workerRows.map((row) => [row.key, row.value]),
    ).toEqual([
      ["gatherer", 0],
      ["hunter", 2],
      ["trapper", 1],
    ]);

    expect(outside.decreaseWorker("hunter", 1)).toBe(true);
    expect(
      outside.snapshot().workerRows.map((row) => [row.key, row.value]),
    ).toEqual([
      ["gatherer", 1],
      ["hunter", 1],
      ["trapper", 1],
    ]);
  });

  it("collects worker income and blocks consuming jobs when stores are missing", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 1);
    engine.state.set('game.buildings["lodge"]', 1);
    outside.initialize();

    outside.increaseWorker("trapper", 1);
    engine.clock.advanceBy(1000);
    expect(engine.state.get("stores.bait", true)).toBe(0);
    expect(engine.state.get("stores.meat", true)).toBe(0);

    engine.state.set("stores.meat", 1);
    engine.clock.advanceBy(10_000);
    expect(engine.state.get("stores.meat")).toBe(0);
    expect(engine.state.get("stores.bait")).toBe(1);
  });

  it("applies debug income multiplier to worker income display and collection", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 2);
    engine.state.set("config.debug.incomeMultiplier", 10, true);
    outside.initialize();

    expect(outside.snapshot().workerRows[0]?.income).toEqual([
      {
        store: "wood",
        amount: 20,
        delay: 10,
        text: "+20 per 10s",
      },
    ]);

    engine.clock.advanceBy(1000);
    expect(engine.state.get("stores.wood")).toBe(20);
  });

  it("kills villagers and removes excess assigned workers in original order", () => {
    const engine = createGameEngine();
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 3);
    engine.state.set('game.workers["hunter"]', 2);
    engine.state.set('game.workers["trapper"]', 1);
    outside.initialize();

    outside.killVillagers(2);

    expect(engine.state.get("game.population")).toBe(1);
    expect(engine.state.get('game.workers["hunter"]')).toBe(0);
    expect(engine.state.get('game.workers["trapper"]')).toBe(1);
    expect(
      outside.snapshot().workerRows.map((row) => [row.key, row.value]),
    ).toEqual([
      ["gatherer", 0],
      ["hunter", 0],
      ["trapper", 1],
    ]);

    outside.killVillagers(10);
    expect(engine.state.get("game.population")).toBe(0);
    expect(engine.state.get('game.workers["trapper"]')).toBe(0);
  });

  it("destroys occupied huts and returns the original victim count", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.75]) });
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set('game.buildings["hut"]', 3);
    engine.state.set("game.population", 5);

    expect(outside.destroyHuts(1)).toBe(1);
    expect(engine.state.get('game.buildings["hut"]')).toBe(2);
    expect(engine.state.get("game.population")).toBe(4);
    expect(outside.snapshot()).toMatchObject({
      title: "A Tiny Village",
      population: 4,
      maxPopulation: 8,
    });
  });

  it("can destroy empty huts without killing villagers when allowEmpty is set", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.99]) });
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set('game.buildings["hut"]', 3);
    engine.state.set("game.population", 4);

    expect(outside.destroyHuts(1, true)).toBe(0);
    expect(engine.state.get('game.buildings["hut"]')).toBe(2);
    expect(engine.state.get("game.population")).toBe(4);
  });
});
