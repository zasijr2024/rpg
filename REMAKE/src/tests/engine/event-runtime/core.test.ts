/* eslint-disable @typescript-eslint/no-unused-vars -- Contract slices retain shared local fixtures. */
import { describe, expect, it } from "vitest";
import {
  createGameEngine,
  EventRuntime,
  ExpeditionTransaction,
  type GameLocationKey,
  type Rng,
  WorldRuntime,
} from "../../../engine";

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

function defeatImmortalWanderer(
  events: EventRuntime,
  engine: ReturnType<typeof createGameEngine>,
): void {
  let guard = 0;
  while (events.snapshot()?.combat?.phase === "fighting" && guard < 100) {
    const combat = events.snapshot()?.combat;
    if (
      combat?.enemyStatus === "meditation" &&
      combat.actions.some(
        (action) => action.key === "shield" && !action.disabled,
      )
    ) {
      expect(events.chooseCombatAction("shield")).toBe(true);
    }
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    if (events.snapshot()?.combat?.phase === "fighting") {
      engine.clock.advanceBy(1000);
    }
    guard += 1;
  }
  expect(guard).toBeLessThan(100);
  expect(events.snapshot()?.combat).toMatchObject({
    phase: "won",
    loot: {
      "fleet beacon": 1,
    },
  });
}

function worldBackedEvents(
  engine: ReturnType<typeof createGameEngine>,
): EventRuntime {
  return new EventRuntime(engine, () => "room", {}, new WorldRuntime(engine));
}

describe("EventRuntime core contracts", () => {
  it("schedules and triggers the first original Room event slice deterministically", () => {
    const location: GameLocationKey = "room";
    const engine = createGameEngine({ rng: sequenceRng([0, 0, 0]) });
    const events = new EventRuntime(engine, () => location);

    engine.state.set("stores.fur", 50);
    events.update();

    engine.clock.advanceBy(179_999);
    expect(events.snapshot()).toBeNull();

    engine.clock.advanceBy(1);
    expect(events.snapshot()).toMatchObject({
      title: "The Beggar",
      sceneKey: "start",
      text: [
        "a beggar arrives.",
        "asks for any spare furs to keep him warm at night.",
      ],
    });
  });

  it("can disable passive random event scheduling for deterministic scenarios", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("stores.fur", 50);
    events.update();
    engine.clock.advanceBy(6 * 60_000);

    expect(events.snapshot()).toBeNull();
    expect(events.triggerByKeyForTest("room.beggar")).toBe(true);
  });

  it("applies button costs, chance scene branching, scene rewards, and event end", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.4]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.fur", 50);
    expect(events.triggerAvailable()).toBe(true);

    expect(events.choose("50furs")).toBe(true);
    expect(engine.state.get("stores.fur")).toBe(0);
    expect(engine.state.get("stores.scales")).toBe(20);
    expect(events.snapshot()).toMatchObject({
      title: "The Beggar",
      sceneKey: "scales",
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("disables unaffordable event buttons without applying costs", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.fur", 1);
    events.triggerAvailable();

    const snapshot = events.snapshot();
    expect(
      snapshot?.buttons.find((button) => button.key === "50furs"),
    ).toMatchObject({
      disabled: true,
    });
    expect(events.choose("50furs")).toBe(false);
    expect(engine.state.get("stores.fur")).toBe(1);
  });

  it("includes the original Marketing event pool and applies the Penrose flag", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerAvailable()).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "marketing.penrose",
      title: "Penrose",
      buttons: [
        {
          key: "give in",
          link: "https://penrose.doublespeakgames.com/?utm_source=adarkroom&utm_medium=crosspromote&utm_campaign=event",
        },
        {
          key: "ignore",
        },
      ],
    });

    expect(events.choose("give in")).toBe(true);

    expect(engine.state.get("marketing.penrose")).toBe(true);
  });

  it("runs a global event onLoad side effect", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("game.thieves", 1);
    engine.state.set("game.stolen", { wood: 7, fur: 2 });
    engine.state.set("income.thieves", { delay: 10, stores: { wood: -1 } });
    expect(events.triggerByKeyForTest("global.thief")).toBe(true);

    expect(events.choose("kill")).toBe(true);

    expect(engine.state.get("game.thieves")).toBe(2);
    expect(engine.state.get("income.thieves")).toBeUndefined();
    expect(engine.state.get("stores.wood")).toBe(7);
    expect(engine.state.get("stores.fur")).toBe(2);
  });

  it("runs an outside event side effect through injected handlers", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const killed: number[] = [];
    const events = new EventRuntime(engine, () => "outside", {
      killVillagers: (count) => killed.push(count),
    });

    engine.state.set("game.population", 12);
    engine.state.set("stores.medicine", 1);
    expect(events.triggerByKeyForTest("outside.sickness")).toBe(true);

    expect(events.choose("ignore")).toBe(true);
    expect(killed).toEqual([1]);
  });

  it("schedules and restores delayed event actions", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wood", 100);
    expect(events.triggerByKeyForTest("room.mysterious-wanderer.wood")).toBe(
      true,
    );
    expect(events.choose("wood100")).toBe(true);

    const lifecycle = events.lifecycleSnapshot();
    const restored = new EventRuntime(engine, () => "room");
    engine.clock.clearAll();
    restored.restoreLifecycle(lifecycle);
    engine.clock.advanceBy(60_000);

    expect(engine.state.get("stores.wood")).toBe(300);
    expect(engine.notifications.list("room").at(-1)?.message).toBe(
      "the mysterious wanderer returns, cart piled high with wood.",
    );
  });

  it("clears owned event and delayed-action timers during lifecycle restore", () => {
    const passiveEngine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const passiveEvents = new EventRuntime(passiveEngine, () => "room");

    passiveEngine.state.set("stores.fur", 50);
    passiveEvents.update();
    passiveEngine.state.set("config.events.randomDisabled", true);
    passiveEvents.restoreLifecycle(null);
    passiveEngine.clock.advanceBy(6 * 60_000);

    expect(passiveEvents.snapshot()).toBeNull();

    const delayedEngine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const delayedEvents = new EventRuntime(delayedEngine, () => "room");

    delayedEngine.state.set("config.events.randomDisabled", true);
    delayedEngine.state.set("stores.wood", 100);
    expect(
      delayedEvents.triggerByKeyForTest("room.mysterious-wanderer.wood"),
    ).toBe(true);
    expect(delayedEvents.choose("wood100")).toBe(true);

    delayedEvents.restoreLifecycle(null);
    delayedEngine.clock.advanceBy(60_000);

    expect(delayedEngine.state.get("stores.wood")).toBe(0);
    expect(
      delayedEngine.notifications
        .list("room")
        .some((entry) => entry.message.includes("returns, cart piled high")),
    ).toBe(false);
  });

  it("keeps merchant events open for repeat buys and hides unavailable buttons", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.fur", 405);
    engine.state.set("stores.scales", 15);
    engine.state.set("stores.teeth", 5);
    expect(events.triggerByKeyForTest("room.nomad")).toBe(true);

    expect(events.choose("buyBait")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "room.nomad",
      sceneKey: "start",
    });
    expect(engine.state.get("stores.fur")).toBe(400);
    expect(engine.state.get("stores.bait")).toBe(1);

    expect(events.choose("buyCompass")).toBe(true);

    expect(engine.state.get("stores.fur")).toBe(100);
    expect(engine.state.get("stores.compass")).toBe(1);
    expect(
      events.snapshot()?.buttons.some((button) => button.key === "buyCompass"),
    ).toBe(false);
  });

  it("runs original Noises Inside store trade formulas", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.4]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wood", 20);
    expect(events.triggerByKeyForTest("room.noises-inside")).toBe(true);

    expect(events.choose("investigate")).toBe(true);

    expect(events.snapshot()).toMatchObject({
      eventKey: "room.noises-inside",
      sceneKey: "scales",
    });
    expect(engine.state.get("stores.wood")).toBe(18);
    expect(engine.state.get("stores.scales")).toBe(1);
  });

  it("runs the original Shady Builder hut branch", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.9]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('game.buildings["hut"]', 5);
    engine.state.set("stores.wood", 300);
    expect(events.triggerByKeyForTest("room.shady-builder")).toBe(true);

    expect(events.choose("build")).toBe(true);

    expect(engine.state.get("stores.wood")).toBe(0);
    expect(engine.state.get('game.buildings["hut"]')).toBe(6);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "build",
    });
  });

  it("schedules delayed fur returns for the original Wanderer fur slice", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0, 0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.fur", 100);
    expect(events.triggerByKeyForTest("room.mysterious-wanderer.fur")).toBe(
      true,
    );
    expect(events.choose("fur100")).toBe(true);

    engine.clock.advanceBy(60_000);

    expect(engine.state.get("stores.fur")).toBe(300);
    expect(engine.notifications.list("room").at(-1)?.message).toBe(
      "the mysterious wanderer returns, cart piled high with furs.",
    );
  });

  it("runs the original Master lodging cost and perk training choices", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("features.location.world", true);
    engine.state.set('stores["cured meat"]', 100);
    engine.state.set("stores.fur", 100);
    engine.state.set("stores.torch", 1);
    engine.state.set('character.perks["evasive"]', true);
    expect(events.triggerByKeyForTest("room.master")).toBe(true);

    expect(events.choose("agree")).toBe(true);

    expect(engine.state.get('stores["cured meat"]')).toBe(0);
    expect(engine.state.get("stores.fur")).toBe(0);
    expect(engine.state.get("stores.torch")).toBe(0);
    expect(events.snapshot()?.buttons.map((button) => button.key)).toEqual([
      "precision",
      "force",
      "nothing",
    ]);

    expect(events.choose("precision")).toBe(true);

    expect(engine.state.get('character.perks["precise"]')).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("runs the original Scout map and scouting training buttons", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const mapApplications: string[] = [];
    const events = new EventRuntime(engine, () => "room", {
      canApplyMap: () => true,
      applyMap: () => mapApplications.push("applyMap"),
    });

    engine.state.set("features.location.world", true);
    engine.state.set("stores.fur", 1200);
    engine.state.set("stores.scales", 60);
    engine.state.set("stores.teeth", 20);
    expect(events.triggerByKeyForTest("room.scout")).toBe(true);

    expect(events.choose("buyMap")).toBe(true);

    expect(mapApplications).toEqual(["applyMap"]);
    expect(engine.state.get("stores.fur")).toBe(1000);
    expect(engine.state.get("stores.scales")).toBe(50);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the map uncovers a bit of the world",
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "room.scout",
      sceneKey: "start",
    });

    expect(events.choose("learn")).toBe(true);

    expect(engine.state.get("stores.fur")).toBe(0);
    expect(engine.state.get("stores.scales")).toBe(0);
    expect(engine.state.get("stores.teeth")).toBe(0);
    expect(engine.state.get('character.perks["scout"]')).toBe(true);
    expect(
      events.snapshot()?.buttons.some((button) => button.key === "learn"),
    ).toBe(false);
  });

  it("hides the Scout map button when the map capability is absent", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("features.location.world", true);
    engine.state.set("stores.fur", 1200);
    engine.state.set("stores.scales", 60);
    engine.state.set("stores.teeth", 20);
    expect(events.triggerByKeyForTest("room.scout")).toBe(true);

    expect(events.snapshot()?.buttons.map((button) => button.key)).toEqual([
      "learn",
      "leave",
    ]);
    expect(events.choose("buyMap")).toBe(false);
    expect(engine.state.get("stores.fur")).toBe(1200);
    expect(engine.state.get("stores.scales")).toBe(60);
  });

  it("hides the Scout map button when the world map is fully revealed", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room", {
      canApplyMap: () => true,
      applyMap: () => {
        throw new Error("fully revealed maps should not apply");
      },
    });

    engine.state.set("features.location.world", true);
    engine.state.set("game.world.seenAll", true);
    expect(events.triggerByKeyForTest("room.scout")).toBe(true);

    expect(events.snapshot()?.buttons.map((button) => button.key)).toEqual([
      "learn",
      "leave",
    ]);
  });

  it("runs ruined trap destruction and reward branching", () => {
    const engine = createGameEngine({ rng: sequenceRng([0.4, 0, 0.6]) });
    const events = new EventRuntime(engine, () => "outside");

    engine.state.set('game.buildings["trap"]', 3);
    expect(events.triggerByKeyForTest("outside.ruined-trap")).toBe(true);

    expect(engine.state.get('game.buildings["trap"]')).toBe(1);
    expect(events.choose("track")).toBe(true);

    expect(events.snapshot()).toMatchObject({
      sceneKey: "catch",
    });
    expect(engine.state.get("stores.fur")).toBe(100);
    expect(engine.state.get("stores.meat")).toBe(100);
    expect(engine.state.get("stores.teeth")).toBe(10);
  });

  it("runs plague side effects through injected handlers", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0, 0.4]) });
    const killed: number[] = [];
    const events = new EventRuntime(engine, () => "outside", {
      killVillagers: (count) => killed.push(count),
    });

    engine.state.set("game.population", 60);
    engine.state.set("stores.medicine", 5);
    expect(events.triggerByKeyForTest("outside.plague")).toBe(true);

    expect(events.choose("heal")).toBe(true);

    expect(engine.state.get("stores.medicine")).toBe(0);
    expect(killed).toEqual([4]);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "healed",
    });
  });
});
