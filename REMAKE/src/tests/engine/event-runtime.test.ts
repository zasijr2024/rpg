import { describe, expect, it } from "vitest";
import {
  createGameEngine,
  EventRuntime,
  type GameLocationKey,
  type Rng,
  WorldRuntime,
} from "../../engine";

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

describe("EventRuntime", () => {
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

  it("hides the Scout map button until the World map bridge is wired", () => {
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

  it("can snapshot a combat-shaped original encounter scene", () => {
    const engine = createGameEngine();
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("encounter.snarling-beast")).toBe(true);

    expect(events.snapshot()?.combat).toMatchObject({
      active: true,
      enemy: "snarling beast",
      health: 5,
    });
  });

  it("mounts later-tier encounter data through the combat boundary", () => {
    const engine = createGameEngine();
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("encounter.soldier")).toBe(true);

    expect(events.snapshot()).toMatchObject({
      eventKey: "encounter.soldier",
      title: "A Soldier",
      combat: {
        active: true,
        ranged: true,
        enemy: "soldier",
        enemyName: "soldier",
        damage: 8,
        hit: 0.8,
        attackDelay: 2,
        health: 50,
        enemyHp: 50,
        loot: {},
      },
    });
  });

  it("selects original world encounters from terrain and distance", () => {
    const nearFieldEngine = createGameEngine({ rng: sequenceRng([0.75]) });
    const nearFieldEvents = worldBackedEvents(nearFieldEngine);

    expect(
      nearFieldEvents.triggerWorldEncounter({
        distance: 6,
        terrain: "field",
      }),
    ).toBe(true);
    expect(nearFieldEvents.snapshot()).toMatchObject({
      eventKey: "encounter.two-headed-creature",
      title: "A Two-Headed Creature",
      combat: {
        enemy: "two-headed creature",
        health: 10,
      },
    });

    const farBarrensEngine = createGameEngine({ rng: sequenceRng([0]) });
    const farBarrensEvents = worldBackedEvents(farBarrensEngine);

    expect(
      farBarrensEvents.triggerWorldEncounter({
        distance: 21,
        terrain: ".",
      }),
    ).toBe(true);
    expect(farBarrensEvents.snapshot()).toMatchObject({
      eventKey: "encounter.soldier",
      title: "A Soldier",
      combat: {
        enemy: "soldier",
        ranged: true,
      },
    });
  });

  it("routes original world landmark scenes into focused setpiece events", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = worldBackedEvents(engine);

    expect(events.triggerWorldSetpiece("borehole")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.borehole",
      title: "A Huge Borehole",
      sceneKey: "start",
      text: [
        "a huge hole is cut deep into the earth, evidence of the past harvest.",
        "they took what they came for, and left.",
        "castoff from the mammoth drills can still be found by the edges of the precipice.",
      ],
    });
  });

  it("routes city world landmark variants into existing focused setpiece keys", () => {
    const cacheEngine = createGameEngine({ rng: sequenceRng([0.87]) });
    const cacheEvents = worldBackedEvents(cacheEngine);

    expect(cacheEvents.triggerWorldSetpiece("city")).toBe(true);
    expect(cacheEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-cache",
      title: "A Ruined City",
      sceneKey: "start",
    });

    const medicineEngine = createGameEngine({ rng: sequenceRng([0.99]) });
    const medicineEvents = worldBackedEvents(medicineEngine);

    expect(medicineEvents.triggerWorldSetpiece("city")).toBe(true);
    expect(medicineEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-medicine",
      title: "A Ruined City",
      sceneKey: "start",
    });
  });

  it("routes the executioner landmark by original first-visit state", () => {
    const firstVisitEngine = createGameEngine({ rng: sequenceRng([0]) });
    const firstVisitEvents = worldBackedEvents(firstVisitEngine);

    expect(firstVisitEvents.triggerWorldSetpiece("executioner")).toBe(true);
    expect(firstVisitEvents.snapshot()).toMatchObject({
      eventKey: "executioner.intro-defences",
      title: "A Ravaged Battleship",
    });

    const returnEngine = createGameEngine({ rng: sequenceRng([0]) });
    const returnEvents = worldBackedEvents(returnEngine);
    returnEngine.state.set("game.world.executioner", true);

    expect(returnEvents.triggerWorldSetpiece("executioner")).toBe(true);
    expect(returnEvents.snapshot()).toMatchObject({
      eventKey: "executioner.antechamber",
      title: "A Ravaged Battleship",
    });
  });

  it("resolves basic combat attacks, weapon cooldowns, and enemy attack timing", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0, 0]) });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("encounter.snarling-beast")).toBe(true);

    expect(events.chooseCombatAction("attack:fists")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 4,
      playerHp: 10,
    });
    expect(
      events
        .snapshot()
        ?.combat?.actions.find((action) => action.key === "attack:fists"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 2000,
    });

    engine.clock.advanceBy(1000);

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 4,
      playerHp: 9,
    });
  });

  it("uses original armour health, healing item values, and healing cooldowns in combat", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["l armour"]', 1);
    engine.state.set("character.health", 5);
    engine.state.set('outfit["cured meat"]', 2);
    expect(events.triggerByKeyForTest("encounter.snarling-beast")).toBe(true);

    expect(events.snapshot()?.combat).toMatchObject({
      playerHp: 5,
      playerMaxHp: 15,
    });

    expect(events.chooseCombatAction("heal:cured meat")).toBe(true);

    expect(events.snapshot()?.combat).toMatchObject({
      playerHp: 13,
      playerMaxHp: 15,
    });
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(
      events
        .snapshot()
        ?.combat?.actions.find((action) => action.key === "heal:cured meat"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 5000,
    });
    expect(events.chooseCombatAction("heal:cured meat")).toBe(false);

    engine.clock.advanceBy(5000);

    expect(events.chooseCombatAction("heal:cured meat")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      playerHp: 15,
      playerMaxHp: 15,
    });
    expect(engine.state.get('outfit["cured meat"]')).toBe(0);
  });

  it("uses stun weapon effects to skip enemy attacks", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('outfit["bolas"]', 1);
    expect(events.triggerByKeyForTest("encounter.snarling-beast")).toBe(true);
    expect(
      events.snapshot()?.combat?.actions.map((action) => action.key),
    ).toEqual(["attack:fists", "attack:bolas"]);

    expect(events.chooseCombatAction("attack:bolas")).toBe(true);
    engine.clock.advanceBy(1000);

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 5,
      playerHp: 10,
    });
    expect(engine.state.get('outfit["bolas"]')).toBe(0);
  });

  it("applies original world-death effects and closes combat when enemy damage reaches zero health", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("character.health", 1);
    engine.state.set('outfit["cured meat"]', 2);
    expect(events.triggerByKeyForTest("encounter.snarling-beast")).toBe(true);

    engine.clock.advanceBy(1000);

    expect(events.snapshot()).toBeNull();
    expect(engine.state.get("character.health")).toBe(0);
    expect(engine.state.get("character.dead")).toBe(true);
    expect(engine.state.get("game.world.dead")).toBe(true);
    expect(engine.state.get("outfit", true)).toBe(0);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the world fades",
    );
  });

  it("rolls original encounter loot and transfers it to outfit once", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0, 0.5, 0, 0, 0.9]),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('outfit["grenade"]', 1);
    expect(events.triggerByKeyForTest("encounter.snarling-beast")).toBe(true);

    expect(events.chooseCombatAction("attack:grenade")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      status: "the snarling beast is dead",
      loot: {
        fur: 2,
        meat: 1,
      },
    });
    expect(engine.state.get('outfit["grenade"]')).toBe(0);
    expect(
      events
        .snapshot()
        ?.combat?.actions.find((action) => action.key === "takeEverything"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 1000,
    });
    expect(events.chooseCombatAction("takeEverything")).toBe(false);

    engine.clock.advanceBy(1000);

    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("takeEverything")).toBe(false);

    expect(engine.state.get('outfit["fur"]')).toBe(2);
    expect(engine.state.get('outfit["meat"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]', true)).toBe(0);

    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
    expect(engine.state.get("game.world.returnLocation")).toBe("path");
    expect(engine.state.get('stores["fur"]')).toBe(2);
    expect(engine.state.get('stores["meat"]')).toBe(1);
    expect(engine.state.get('outfit["fur"]')).toBe(0);
    expect(engine.state.get('outfit["meat"]')).toBe(0);
  });

  it("drives a focused sulphur mine setpiece traversal through military combat scenes", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 300);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    const firePlasmaUntilWon = (
      expectedEnemy: string,
      attacksRequired: number,
    ) => {
      expect(events.snapshot()?.combat).toMatchObject({
        enemy: expectedEnemy,
        phase: "fighting",
      });
      for (let attack = 0; attack < attacksRequired; attack += 1) {
        if (attack > 0) {
          engine.clock.advanceBy(1000);
        }
        expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
      }
      expect(events.snapshot()?.combat).toMatchObject({
        enemy: expectedEnemy,
        phase: "won",
      });
    };

    expect(events.triggerByKeyForTest("setpiece.sulphurmine")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      title: "The Sulphur Mine",
      sceneKey: "start",
      text: [
        "the military is already set up at the mine's entrance.",
        "soldiers patrol the perimeter, rifles slung over their shoulders.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    firePlasmaUntilWon("soldier", 5);
    expect(events.snapshot()?.combat).toMatchObject({
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      sceneKey: "a2",
      combat: {
        enemy: "soldier",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    firePlasmaUntilWon("soldier", 5);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      sceneKey: "a3",
      combat: {
        enemy: "veteran",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);

    firePlasmaUntilWon("veteran", 6);
    expect(events.snapshot()?.combat).toMatchObject({
      loot: {
        bayonet: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      sceneKey: "cleared",
      text: [
        "the military presence has been cleared.",
        "the mine is now safe for workers.",
      ],
    });
    expect(engine.state.get("game.world.sulphurmine")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the sulphur mine is clear of dangers",
    );

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused outpost setpiece through replenishment and scene loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.4]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.outpost")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.outpost",
      title: "An Outpost",
      sceneKey: "start",
      text: ["a safe place in the wilds."],
      loot: {
        loot: {
          "cured meat": 7,
        },
      },
    });
    expect(engine.state.get("game.world.outpostUsed")).toBe(true);
    expect(engine.state.get("game.world.waterReplenished")).toBe(true);
    expect(
      engine.notifications.list("event").map((entry) => entry.message),
    ).toEqual(["a safe place in the wilds.", "water replenished"]);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(7);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused borehole setpiece through alien-alloy scene loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.5]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.borehole")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.borehole",
      title: "A Huge Borehole",
      sceneKey: "start",
      text: [
        "a huge hole is cut deep into the earth, evidence of the past harvest.",
        "they took what they came for, and left.",
        "castoff from the mammoth drills can still be found by the edges of the precipice.",
      ],
      loot: {
        loot: {
          "alien alloy": 2,
        },
      },
    });
    expect(engine.state.get("game.world.boreholeVisited")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(2);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused battlefield setpiece through original scene loot rolls", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(20).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.battlefield")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.battlefield",
      title: "A Forgotten Battlefield",
      sceneKey: "start",
      text: [
        "a battle was fought here, long ago.",
        "battered technology from both sides lays dormant on the blasted landscape.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 5,
          "laser rifle": 1,
          "energy cell": 5,
          grenade: 1,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.world.battlefieldVisited")).toBe(true);

    expect(events.chooseLootAction("take:rifle")).toBe(true);
    expect(events.chooseLootAction("take:bullets")).toBe(true);
    expect(events.chooseLootAction("take:energy cell")).toBe(true);
    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(1);
    expect(engine.state.get('outfit["energy cell"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toMatchObject({
      bullets: 4,
      "energy cell": 4,
      "laser rifle": 1,
      grenade: 1,
      "alien alloy": 1,
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused crashed-ship setpiece through salvage discovery", () => {
    const engine = createGameEngine();
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.crashed-ship")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.crashed-ship",
      title: "A Crashed Ship",
      sceneKey: "start",
      text: [
        "the familiar curves of a wanderer vessel rise up out of the dust and ash. ",
        "lucky that the natives can't work the mechanisms.",
        "with a little effort, it might fly again.",
      ],
      buttons: [
        {
          key: "leavel",
          text: "salvage",
        },
      ],
    });
    expect(engine.state.get("game.world.ship")).toBe(true);
    expect(engine.state.get("game.world.crashedShipVisited")).toBe(true);

    expect(events.choose("leavel")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused destroyed-village cache setpiece through collection", () => {
    const engine = createGameEngine();
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wood", 3);
    engine.state.set(
      "previous.stores",
      [5, 2, 0, 4, 0, 0, 1, 3, 0, 6, 2, 1, 1, 8, 1, 0, 0, 0, 1, 0, 7, 0, 2, 1],
    );

    expect(events.triggerByKeyForTest("setpiece.destroyed-village")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.destroyed-village",
      title: "A Destroyed Village",
      sceneKey: "start",
      text: [
        "a destroyed village lies in the dust.",
        "charred bodies litter the ground.",
      ],
    });
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the metallic tang of wanderer afterburner hangs in the air.",
    );

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.destroyed-village",
      sceneKey: "underground",
      text: [
        "a shack stands at the center of the village.",
        "there are still supplies inside.",
      ],
    });

    expect(events.choose("take")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.destroyed-village",
      sceneKey: "exit",
      text: [
        "all the work of a previous generation is here.",
        "ripe for the picking.",
      ],
    });
    expect(engine.state.get("game.world.destroyedVillageVisited")).toBe(true);
    expect(engine.state.get("game.world.cacheCollected")).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(8);
    expect(engine.state.get("stores.fur")).toBe(2);
    expect(engine.state.get("stores.iron")).toBe(4);
    expect(engine.state.get('stores["cured meat"]')).toBe(3);
    expect(engine.state.get("stores.teeth")).toBe(6);
    expect(engine.state.get("stores.cloth")).toBe(8);
    expect(engine.state.get('stores["bone spear"]')).toBe(1);
    expect(engine.state.get("stores.rifle")).toBe(1);
    expect(engine.state.get("stores.bullets")).toBe(7);
    expect(engine.state.get("stores.grenade")).toBe(2);
    expect(engine.state.get("stores.bolas")).toBe(1);
    expect(engine.state.get("previous.stores")).toEqual([]);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives focused cave setpiece combat through beast and lizard scenes", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(20).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 10);

    expect(events.triggerByKeyForTest("setpiece.cave-depths")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-depths",
      title: "A Damp Cave",
      sceneKey: "start",
      text: [
        "the mouth of the cave is wide and dark.",
        "can't see what's inside.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "beast",
      phase: "fighting",
      enemyHp: 5,
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-depths",
      sceneKey: "narrow",
      text: [
        "the cave narrows a few feet in.",
        "the walls are moist and moss-covered",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "cave lizard",
      phase: "fighting",
      enemyHp: 6,
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-depths",
      sceneKey: "cleared",
      text: [
        "the torch sputters and dies in the damp air",
        "the darkness is absolute",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused cave camp branch through supply-cache loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.cave-camp-cache")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      title: "A Damp Cave",
      sceneKey: "start",
      text: [
        "the mouth of the cave is wide and dark.",
        "can't see what's inside.",
      ],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      sceneKey: "camp",
      text: [
        "the remains of an old camp sits just inside the cave.",
        "bedrolls, torn and blackened, lay beneath a thin layer of dust.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          leather: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.leather")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      sceneKey: "lizard",
      combat: {
        enemy: "lizard",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      sceneKey: "supply-cache",
      text: ["a small supply cache is hidden at the back of the cave."],
      loot: {
        loot: {
          cloth: 5,
          leather: 5,
          iron: 5,
          "cured meat": 5,
          steel: 5,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.caveCampCacheCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(19);
    expect(engine.state.get('outfit["cured meat"]')).toBe(6);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.leather")).toBe(6);
    expect(engine.state.get("outfit.scales")).toBe(1);
    expect(engine.state.get("outfit.teeth")).toBe(1);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get("outfit.iron")).toBe(5);
    expect(engine.state.get("outfit.steel")).toBe(5);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused cave wanderer-body branch through nest loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.cave-wanderer-nest")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      title: "A Damp Cave",
      sceneKey: "start",
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 5,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "wanderer-body",
      text: [
        "the body of a wanderer lies in a small cavern.",
        "rot's been to work on it, and some of the pieces are missing.",
        "can't tell what left it here.",
      ],
      loot: {
        loot: {
          "iron sword": 1,
          "cured meat": 1,
          torch: 1,
          medicine: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["iron sword"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "large-beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "nest",
      text: ["the nest of a large animal lies at the back of the cave."],
      loot: {
        loot: {
          meat: 5,
          fur: 5,
          scales: 5,
          teeth: 5,
          cloth: 5,
        },
      },
    });
    expect(engine.state.get("game.world.caveWandererNestCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get("outfit.fur")).toBe(7);
    expect(engine.state.get("outfit.teeth")).toBe(7);
    expect(engine.state.get("outfit.meat")).toBe(5);
    expect(engine.state.get("outfit.scales")).toBe(5);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused cave old-case branch through small-beast and lizard combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.cave-old-case")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      title: "A Damp Cave",
      sceneKey: "start",
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "narrow",
      text: [
        "the cave narrows a few feet in.",
        "the walls are moist and moss-covered",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 5,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "lizard",
      combat: {
        enemy: "lizard",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "old-case",
      text: [
        "an old case is wedged behind a rock, covered in a thick layer of dust.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.caveOldCaseCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get("outfit.fur")).toBe(1);
    expect(engine.state.get("outfit.teeth")).toBe(2);
    expect(engine.state.get("outfit.scales")).toBe(1);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused swamp setpiece through the charm-gated wanderer scene", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.swamp")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.swamp",
      title: "A Murky Swamp",
      sceneKey: "start",
      text: [
        "rotting reeds rise out of the swampy earth.",
        "a lone frog sits in the muck, silently.",
      ],
      buttons: [
        {
          key: "enter",
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.swamp",
      sceneKey: "cabin",
      text: [
        "deep in the swamp is a moss-covered cabin.",
        "an old wanderer sits inside, in a seeming trance.",
      ],
      buttons: [
        {
          key: "talk",
          cost: { charm: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("talk")).toBe(false);

    engine.state.set("stores.charm", 1);
    expect(events.choose("talk")).toBe(true);
    expect(engine.state.get("stores.charm", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.swamp",
      sceneKey: "talk",
      text: [
        "the wanderer takes the charm and nods slowly.",
        "he speaks of once leading the great fleets to fresh worlds.",
        "unfathomable destruction to fuel wanderer hungers.",
        "his time here, now, is his penance.",
      ],
    });
    expect(engine.state.get('character.perks["gastronome"]')).toBe(true);
    expect(engine.state.get("game.world.swampVisited")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives focused old-house non-combat loot branches through scene loot", () => {
    const medicineEngine = createGameEngine({
      rng: sequenceRng([0, 0.1, 0, 0.99]),
    });
    const medicineEvents = new EventRuntime(medicineEngine, () => "room");

    expect(medicineEvents.triggerByKeyForTest("setpiece.old-house")).toBe(true);
    expect(medicineEvents.choose("enter")).toBe(true);
    expect(medicineEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.old-house",
      sceneKey: "medicine",
      text: [
        "the house has been ransacked.",
        "but there is a cache of medicine under the floorboards.",
      ],
      loot: {
        loot: {
          medicine: 4,
        },
      },
    });
    expect(medicineEngine.state.get("game.world.oldHouseVisited")).toBe(true);

    const restoredMedicine = new EventRuntime(medicineEngine, () => "room");
    restoredMedicine.restoreLifecycle(medicineEvents.lifecycleSnapshot());
    expect(restoredMedicine.snapshot()).toMatchObject({
      eventKey: "setpiece.old-house",
      sceneKey: "medicine",
      loot: {
        loot: {
          medicine: 4,
        },
      },
    });

    expect(restoredMedicine.chooseLootAction("takeEverything")).toBe(true);
    expect(medicineEngine.state.get('outfit["medicine"]')).toBe(4);
    expect(restoredMedicine.snapshot()?.loot?.loot).toEqual({});
    expect(restoredMedicine.choose("leave")).toBe(true);
    expect(restoredMedicine.snapshot()).toBeNull();

    const suppliesEngine = createGameEngine({
      rng: sequenceRng([0, 0.3, 0, 0, 0, 0, 0, 0]),
    });
    const suppliesEvents = new EventRuntime(suppliesEngine, () => "room");

    expect(suppliesEvents.triggerByKeyForTest("setpiece.old-house")).toBe(true);
    expect(suppliesEvents.choose("enter")).toBe(true);
    expect(suppliesEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.old-house",
      sceneKey: "supplies",
      text: [
        "the house is abandoned, but not yet picked over.",
        "still a few drops of water in the old well.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          leather: 1,
          cloth: 1,
        },
      },
    });
    expect(suppliesEngine.state.get("game.world.oldHouseVisited")).toBe(true);
    expect(suppliesEngine.state.get("game.world.waterReplenished")).toBe(true);
    expect(suppliesEngine.notifications.list("event").at(-1)?.message).toBe(
      "water replenished",
    );

    expect(suppliesEvents.chooseLootAction("take:cured meat")).toBe(true);
    expect(suppliesEvents.chooseLootAction("takeEverything")).toBe(true);
    expect(suppliesEngine.state.get('outfit["cured meat"]')).toBe(1);
    expect(suppliesEngine.state.get('outfit["leather"]')).toBe(1);
    expect(suppliesEngine.state.get('outfit["cloth"]')).toBe(1);
    expect(suppliesEvents.snapshot()?.loot?.loot).toEqual({});
    expect(suppliesEvents.choose("leave")).toBe(true);
    expect(suppliesEvents.snapshot()).toBeNull();
  });

  it("drives a focused old-house setpiece through the occupied combat branch", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.9, 0, 0, 0, 0, 0, 0]),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 2);

    expect(events.triggerByKeyForTest("setpiece.old-house")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.old-house",
      title: "An Old House",
      sceneKey: "start",
      text: [
        "an old house remains here, once white siding yellowed and peeling.",
        "the door hangs open.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.old-house",
      sceneKey: "occupied",
      combat: {
        enemy: "squatter",
        phase: "fighting",
        enemyHp: 10,
      },
    });
    expect(engine.state.get("game.world.oldHouseVisited")).toBe(true);

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        leather: 1,
        cloth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get('outfit["leather"]')).toBe(1);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);

    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
    expect(engine.state.get("game.world.returnLocation")).toBe("path");
  });

  it("drives a focused town clinic branch through torch-gated medicine loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.99]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.town-clinic")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic",
      sceneKey: "clinic",
      text: [
        "a squat building up ahead.",
        "a green cross barely visible behind grimy windows.",
      ],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic",
      sceneKey: "medicine",
      text: ["some medicine abandoned in the drawers."],
      loot: {
        loot: {
          medicine: 4,
        },
      },
    });
    expect(engine.state.get("game.world.townClinicCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["medicine"]')).toBe(4);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town clinic madman branch through combat and ransacked ending", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(40).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 4);

    expect(events.triggerByKeyForTest("setpiece.town-clinic-madman")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic-madman",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic-madman",
      sceneKey: "clinic",
      text: [
        "a squat building up ahead.",
        "a green cross barely visible behind grimy windows.",
      ],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic-madman",
      sceneKey: "madman",
      combat: {
        enemy: "madman",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 2,
        "cured meat": 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic-madman",
      sceneKey: "ransacked",
      text: ["the clinic has been ransacked.", "only dust and stains remain."],
    });
    expect(engine.state.get("game.world.townClinicMadmanCleared")).toBe(true);

    expect(engine.state.get('outfit["energy cell"]')).toBe(3);
    expect(engine.state.get("outfit.cloth")).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town schoolhouse branch through chained combat and camp loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.town-schoolhouse")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "schoolhouse",
      text: [
        "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
        "the double doors creak endlessly in the wind.",
      ],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "locker",
      text: ["a small cache of supplies is tucked inside a rusting locker."],
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          bullets: 1,
          medicine: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "thug",
      combat: {
        enemy: "thug",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 5,
        leather: 5,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "scavenger",
      combat: {
        enemy: "scavenger",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        leather: 5,
        "steel sword": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "camp",
      text: [
        "scavenger had a small camp in the school.",
        "collected scraps spread across the floor like they fell from heaven.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          steel: 5,
          "cured meat": 5,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.townSchoolhouseCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cured meat"]')).toBe(8);
    expect(engine.state.get("outfit.leather")).toBe(10);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get('outfit["steel sword"]')).toBe(2);
    expect(engine.state.get("outfit.steel")).toBe(5);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(2);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town park branch through vigilante combat and rifle loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 300);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.town-park-vigilante")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "ambush",
      combat: {
        enemy: "thug",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 5,
        leather: 5,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "park",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 25,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        teeth: 1,
        fur: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "commotion",
      text: [
        "something's causing a commotion a ways down the road.",
        "a fight, maybe.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "vigilante",
      combat: {
        enemy: "vigilante",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        leather: 5,
        "steel sword": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "wanderer-rifle",
      text: [
        "beneath the wanderer's rags, clutched in one of its many hands, a glint of steel.",
        "worth killing for, it seems.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
        },
      },
    });
    expect(engine.state.get("game.world.townParkVigilanteCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(15);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get("outfit.leather")).toBe(10);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get("outfit.teeth")).toBe(1);
    expect(engine.state.get("outfit.fur")).toBe(5);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get("outfit.rifle")).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town caravan branch through vigilante combat and trinket loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.town-caravan-vigilante")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      title: "A Deserted Town",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "ambush",
      combat: {
        enemy: "thug",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 5,
        leather: 5,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "caravan",
      text: [
        "an overturned caravan is spread across the pockmarked street.",
        "it's been picked over by scavengers, but there's still some things worth taking.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          bullets: 1,
          medicine: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "food-basket",
      text: [
        "a small basket of food is hidden under a park bench, with a note attached.",
        "can't read the words.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "vigilante",
      combat: {
        enemy: "vigilante",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        leather: 5,
        "steel sword": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "trinkets",
      text: [
        "eye for an eye seems fair.",
        "always worked before, at least.",
        "picking the bones finds some useful trinkets.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
          iron: 5,
          torch: 1,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.townCaravanVigilanteCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cured meat"]')).toBe(9);
    expect(engine.state.get("outfit.leather")).toBe(10);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get("outfit.torch")).toBe(2);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(2);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get("outfit.iron")).toBe(5);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital branch through torch-gated stockpile loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(30).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.city-hospital")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital",
      title: "A Ruined City",
      sceneKey: "start",
      text: [
        "a battered highway sign stands guard at the entrance to this once-great city.",
        "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
        "might be things worth having still inside.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital",
      sceneKey: "corridors",
      text: [
        "empty corridors.",
        "the place has been swept clean by scavengers.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital",
      sceneKey: "operating-theatre",
      text: [
        "someone has locked and barricaded the door to this operating theatre.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital",
      sceneKey: "stockpile",
      text: ["someone had been stockpiling loot here."],
      loot: {
        loot: {
          "energy cell": 1,
          medicine: 3,
          bullets: 2,
          torch: 1,
          grenade: 1,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityHospitalCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(3);
    expect(engine.state.get('outfit["bullets"]')).toBe(2);
    expect(engine.state.get('outfit["torch"]')).toBe(1);
    expect(engine.state.get('outfit["grenade"]')).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital old-man branch into the medicine cabinet", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(60).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.rucksack", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-hospital-medicine")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-medicine",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-medicine",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-medicine",
      sceneKey: "old-man",
      combat: {
        enemy: "old man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-medicine",
      sceneKey: "dried-meat",
      text: ["strips of meat are hung up to dry in this ward."],
      loot: {
        loot: {
          "cured meat": 3,
        },
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-medicine",
      sceneKey: "medicine-cabinet",
      text: [
        "a pristine medicine cabinet at the end of a hallway.",
        "the rest of the hospital is empty.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          medicine: 3,
          teeth: 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityHospitalMedicineCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(20);
    expect(engine.state.get('outfit["cured meat"]')).toBe(4);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(4);
    expect(engine.state.get('outfit["teeth"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital old-man branch into the small cache", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(60).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-hospital-cache")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-cache",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-cache",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-cache",
      sceneKey: "old-man",
      combat: {
        enemy: "old man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-cache",
      sceneKey: "cache",
      text: ["the old man had a small cache of interesting items."],
      loot: {
        loot: {
          "alien alloy": 1,
          medicine: 1,
          "cured meat": 3,
          bolas: 1,
          fur: 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityHospitalCacheCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(19);
    expect(engine.state.get('outfit["cured meat"]')).toBe(4);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(2);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(engine.state.get('outfit["bolas"]')).toBe(1);
    expect(engine.state.get('outfit["fur"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital old-man branch into operating theatres", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(
      events.triggerByKeyForTest("setpiece.city-hospital-old-man-theatres"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-theatres",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-theatres",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-theatres",
      sceneKey: "old-man",
      combat: {
        enemy: "old man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-theatres",
      sceneKey: "dried-meat",
      text: ["strips of meat are hung up to dry in this ward."],
      loot: {
        loot: {
          "cured meat": 3,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-theatres",
      sceneKey: "operating-theatres",
      text: [
        "the stench of rot and death fills the operating theatres.",
        "a few items are scattered on the ground.",
        "there is nothing else here.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          medicine: 1,
          teeth: 3,
          scales: 4,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(
      engine.state.get("game.world.cityHospitalOldManTheatresCleared"),
    ).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(20);
    expect(engine.state.get('outfit["cured meat"]')).toBe(4);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(2);
    expect(engine.state.get('outfit["teeth"]')).toBe(3);
    expect(engine.state.get('outfit["scales"]')).toBe(4);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital old-man branch through squatters", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(
      events.triggerByKeyForTest("setpiece.city-hospital-old-man-squatters"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-squatters",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-squatters",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-squatters",
      sceneKey: "old-man",
      combat: {
        enemy: "old man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-squatters",
      sceneKey: "squatters",
      combat: {
        enemy: "squatters",
        phase: "fighting",
        enemyHp: 40,
      },
    });

    engine.clock.advanceBy(1000);
    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 3,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-old-man-squatters",
      sceneKey: "operating-theatres",
      text: [
        "the stench of rot and death fills the operating theatres.",
        "a few items are scattered on the ground.",
        "there is nothing else here.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          medicine: 1,
          teeth: 3,
          scales: 4,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(
      engine.state.get("game.world.cityHospitalOldManSquattersCleared"),
    ).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(16);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cloth"]')).toBe(4);
    expect(engine.state.get('outfit["medicine"]')).toBe(3);
    expect(engine.state.get('outfit["teeth"]')).toBe(3);
    expect(engine.state.get('outfit["scales"]')).toBe(4);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital ward branch through lizard combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-hospital-ward")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-ward",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-ward",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-ward",
      sceneKey: "corridors",
      text: [
        "empty corridors.",
        "the place has been swept clean by scavengers.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-ward",
      sceneKey: "lizards",
      combat: {
        enemy: "lizards",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 3,
        teeth: 2,
        scales: 3,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-ward",
      sceneKey: "operating-theatres",
      text: [
        "the stench of rot and death fills the operating theatres.",
        "a few items are scattered on the ground.",
        "there is nothing else here.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          medicine: 1,
          teeth: 3,
          scales: 4,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityHospitalWardCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["meat"]')).toBe(3);
    expect(engine.state.get('outfit["teeth"]')).toBe(5);
    expect(engine.state.get('outfit["scales"]')).toBe(7);
    expect(engine.state.get('outfit["medicine"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital squatters branch through operating-theatres loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-hospital-squatters")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-squatters",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-squatters",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-squatters",
      sceneKey: "corridors",
      text: [
        "empty corridors.",
        "the place has been swept clean by scavengers.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-squatters",
      sceneKey: "squatters",
      combat: {
        enemy: "squatters",
        phase: "fighting",
        enemyHp: 40,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 3,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-squatters",
      sceneKey: "operating-theatres",
      text: [
        "the stench of rot and death fills the operating theatres.",
        "a few items are scattered on the ground.",
        "there is nothing else here.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          medicine: 1,
          teeth: 3,
          scales: 4,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityHospitalSquattersCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(17);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get('outfit["cloth"]')).toBe(3);
    expect(engine.state.get('outfit["medicine"]')).toBe(2);
    expect(engine.state.get('outfit["teeth"]')).toBe(3);
    expect(engine.state.get('outfit["scales"]')).toBe(4);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital deformed branch through equipment loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-hospital-deformed")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-deformed",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-deformed",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-deformed",
      sceneKey: "corridors",
      text: [
        "empty corridors.",
        "the place has been swept clean by scavengers.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-deformed",
      sceneKey: "operating-theatre",
      text: [
        "someone has locked and barricaded the door to this operating theatre.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-deformed",
      sceneKey: "deformed",
      combat: {
        enemy: "deformed",
        phase: "fighting",
        enemyHp: 40,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 2,
        steel: 1,
        scales: 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-deformed",
      sceneKey: "equipment",
      text: [
        "the warped man lies dead.",
        "the operating theatre has a lot of curious equipment.",
      ],
      loot: {
        loot: {
          "energy cell": 2,
          medicine: 3,
          cloth: 1,
          steel: 2,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityHospitalDeformedCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cloth"]')).toBe(2);
    expect(engine.state.get('outfit["teeth"]')).toBe(2);
    expect(engine.state.get('outfit["steel"]')).toBe(3);
    expect(engine.state.get('outfit["scales"]')).toBe(2);
    expect(engine.state.get('outfit["medicine"]')).toBe(3);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city hospital tentacles branch through victim-remains loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-hospital-tentacles")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-tentacles",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-tentacles",
      sceneKey: "hospital",
      text: ["the shell of an abandoned hospital looms ahead."],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-tentacles",
      sceneKey: "corridors",
      text: [
        "empty corridors.",
        "the place has been swept clean by scavengers.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-tentacles",
      sceneKey: "operating-theatre",
      text: [
        "someone has locked and barricaded the door to this operating theatre.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-tentacles",
      sceneKey: "tentacles",
      combat: {
        enemy: "tentacles",
        phase: "fighting",
        enemyHp: 60,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 10,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-hospital-tentacles",
      sceneKey: "victims",
      text: [
        "the tentacular horror is defeated.",
        "inside, the remains of its victims are everywhere.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          rifle: 1,
          teeth: 2,
          cloth: 3,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityHospitalTentaclesCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(15);
    expect(engine.state.get('outfit["meat"]')).toBe(10);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]')).toBe(2);
    expect(engine.state.get('outfit["cloth"]')).toBe(3);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city soldier patrol branch through chained combat and supplies", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    expect(events.triggerByKeyForTest("setpiece.city-soldier-patrol")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-soldier-patrol",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-soldier-patrol",
      sceneKey: "checkpoint",
      text: [
        "orange traffic cones are set across the street, faded and cracked.",
        "lights flash through the alleys between buildings.",
      ],
    });
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-soldier-patrol",
      sceneKey: "soldier",
      combat: {
        enemy: "soldier",
        phase: "fighting",
        enemyHp: 50,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-soldier-patrol",
      sceneKey: "voices",
      text: [
        "more voices can be heard ahead.",
        "they must be here for a reason.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-soldier-patrol",
      sceneKey: "second-soldier",
      combat: {
        enemy: "soldier",
        phase: "fighting",
        enemyHp: 50,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-soldier-patrol",
      sceneKey: "supplies",
      text: [
        "searching the bodies yields a few supplies.",
        "more soldiers will be on their way.",
        "time to move on.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
          "cured meat": 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.citySoldierPatrolCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(20);
    expect(engine.state.get('outfit["rifle"]')).toBe(2);
    expect(engine.state.get('outfit["bullets"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["medicine"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city commando branch through burning settlement loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 28);

    expect(
      events.triggerByKeyForTest("setpiece.city-commando-settlement"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-settlement",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-settlement",
      sceneKey: "checkpoint",
      text: [
        "orange traffic cones are set across the street, faded and cracked.",
        "lights flash through the alleys between buildings.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-settlement",
      sceneKey: "soldier",
      combat: {
        enemy: "soldier",
        phase: "fighting",
        enemyHp: 50,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-settlement",
      sceneKey: "gunfire",
      text: [
        "the sound of gunfire carries on the wind.",
        "the street ahead glows with firelight.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-settlement",
      sceneKey: "commando",
      combat: {
        enemy: "commando",
        phase: "fighting",
        enemyHp: 55,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        rifle: 1,
        bullets: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-settlement",
      sceneKey: "burning-settlement",
      text: [
        "the small settlement has clearly been burning a while.",
        "the bodies of the wanderers that lived here are still visible in the flames.",
        "still time to rescue a few supplies.",
      ],
      loot: {
        loot: {
          "laser rifle": 1,
          "energy cell": 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityCommandoSettlementCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(19);
    expect(engine.state.get('outfit["cured meat"]')).toBe(3);
    expect(engine.state.get("outfit.bullets")).toBe(2);
    expect(engine.state.get("outfit.rifle")).toBe(2);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city commando branch through body supplies loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 28);

    expect(events.triggerByKeyForTest("setpiece.city-commando-supplies")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-supplies",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-supplies",
      sceneKey: "checkpoint",
      text: [
        "orange traffic cones are set across the street, faded and cracked.",
        "lights flash through the alleys between buildings.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-supplies",
      sceneKey: "soldier",
      combat: {
        enemy: "soldier",
        phase: "fighting",
        enemyHp: 50,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-supplies",
      sceneKey: "gunfire",
      text: [
        "the sound of gunfire carries on the wind.",
        "the street ahead glows with firelight.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-supplies",
      sceneKey: "commando",
      combat: {
        enemy: "commando",
        phase: "fighting",
        enemyHp: 55,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        rifle: 1,
        bullets: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-commando-supplies",
      sceneKey: "supplies",
      text: [
        "searching the bodies yields a few supplies.",
        "more soldiers will be on their way.",
        "time to move on.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
          "cured meat": 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityCommandoSuppliesCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cured meat"]')).toBe(3);
    expect(engine.state.get("outfit.bullets")).toBe(3);
    expect(engine.state.get("outfit.rifle")).toBe(3);
    expect(engine.state.get("outfit.medicine")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city subway branch through lizard and rat combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.rucksack", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-subway")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway",
      sceneKey: "empty-streets",
      text: [
        "the streets are empty.",
        "the air is filled with dust, driven relentlessly by the hard winds.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway",
      sceneKey: "lizard",
      combat: {
        enemy: "lizard",
        phase: "fighting",
        enemyHp: 20,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 5,
        teeth: 5,
        meat: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway",
      sceneKey: "subway-platform",
      text: [
        "street above the subway platform is blown away.",
        "lets some light down into the dusty haze.",
        "a sound comes from the tunnel, just ahead.",
      ],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway",
      sceneKey: "rats",
      combat: {
        enemy: "rats",
        phase: "fighting",
        enemyHp: 60,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 5,
        teeth: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway",
      sceneKey: "battle-platform",
      text: [
        "the tunnel opens up at another platform.",
        "the walls are scorched from an old battle.",
        "bodies and supplies from both sides litter the ground.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
          "laser rifle": 1,
          "energy cell": 1,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.citySubwayCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(14);
    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(1);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city subway branch through scavenged loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-subway-scavenged")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-scavenged",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-scavenged",
      sceneKey: "empty-streets",
      text: [
        "the streets are empty.",
        "the air is filled with dust, driven relentlessly by the hard winds.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-scavenged",
      sceneKey: "lizard",
      combat: {
        enemy: "lizard",
        phase: "fighting",
        enemyHp: 20,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 5,
        teeth: 5,
        meat: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-scavenged",
      sceneKey: "subway-platform",
      text: [
        "street above the subway platform is blown away.",
        "lets some light down into the dusty haze.",
        "a sound comes from the tunnel, just ahead.",
      ],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: true,
        },
        {
          key: "leave",
        },
      ],
    });
    expect(events.choose("enter")).toBe(false);

    engine.state.set("stores.torch", 1);
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-scavenged",
      sceneKey: "rats",
      combat: {
        enemy: "rats",
        phase: "fighting",
        enemyHp: 60,
      },
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 5,
        teeth: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-scavenged",
      sceneKey: "scavenged",
      text: [
        "not much here.",
        "scavengers must have gotten to this place already.",
      ],
      loot: {
        loot: {
          torch: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.citySubwayScavengedCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(13);
    expect(engine.state.get("outfit.scales")).toBe(5);
    expect(engine.state.get("outfit.teeth")).toBe(10);
    expect(engine.state.get("outfit.meat")).toBe(5);
    expect(engine.state.get("outfit.fur")).toBe(5);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city subway branch through beast and rubble loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(
      events.triggerByKeyForTest("setpiece.city-subway-beast-rubble"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-beast-rubble",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-beast-rubble",
      sceneKey: "empty-streets",
      text: [
        "the streets are empty.",
        "the air is filled with dust, driven relentlessly by the hard winds.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-beast-rubble",
      sceneKey: "lizard",
      combat: {
        enemy: "lizard",
        phase: "fighting",
        enemyHp: 20,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 5,
        teeth: 5,
        meat: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-beast-rubble",
      sceneKey: "beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) {
        engine.clock.advanceBy(1000);
      }
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 1,
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-beast-rubble",
      sceneKey: "rubble",
      text: [
        "the debris is denser here.",
        "maybe some useful stuff in the rubble.",
      ],
      loot: {
        loot: {
          bullets: 1,
          steel: 1,
          "alien alloy": 1,
          cloth: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-subway-beast-rubble",
      sceneKey: "scavenged",
      text: [
        "not much here.",
        "scavengers must have gotten to this place already.",
      ],
      loot: {
        loot: {
          torch: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.citySubwayBeastRubbleCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(15);
    expect(engine.state.get("outfit.scales")).toBe(5);
    expect(engine.state.get("outfit.teeth")).toBe(6);
    expect(engine.state.get("outfit.meat")).toBe(6);
    expect(engine.state.get("outfit.fur")).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get("outfit.steel")).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(engine.state.get("outfit.cloth")).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city military camp branch through sniper and veteran combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.rucksack", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-military-camp")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp",
      sceneKey: "checkpoint",
      text: [
        "orange traffic cones are set across the street, faded and cracked.",
        "lights flash through the alleys between buildings.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp",
      sceneKey: "sniper",
      combat: {
        enemy: "sniper",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp",
      sceneKey: "camp",
      text: [
        "looks like a camp of sorts up ahead.",
        "rusted chainlink is pulled across an alleyway.",
        "fires burn in the courtyard beyond.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp",
      sceneKey: "veteran",
      combat: {
        enemy: "veteran",
        phase: "fighting",
        enemyHp: 45,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        bayonet: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp",
      sceneKey: "outpost",
      text: [
        "the small military outpost is well supplied.",
        "arms and munitions, relics from the war, are neatly arranged on the store-room floor.",
        "just as deadly now as they were then.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
          grenade: 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityMilitaryCampCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(13);
    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(1);
    expect(engine.state.get('outfit["grenade"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city military camp branch through body supplies loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(
      events.triggerByKeyForTest("setpiece.city-military-camp-supplies"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp-supplies",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp-supplies",
      sceneKey: "checkpoint",
      text: [
        "orange traffic cones are set across the street, faded and cracked.",
        "lights flash through the alleys between buildings.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp-supplies",
      sceneKey: "sniper",
      combat: {
        enemy: "sniper",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp-supplies",
      sceneKey: "camp",
      text: [
        "looks like a camp of sorts up ahead.",
        "rusted chainlink is pulled across an alleyway.",
        "fires burn in the courtyard beyond.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp-supplies",
      sceneKey: "veteran",
      combat: {
        enemy: "veteran",
        phase: "fighting",
        enemyHp: 45,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        bayonet: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-military-camp-supplies",
      sceneKey: "supplies",
      text: [
        "searching the bodies yields a few supplies.",
        "more soldiers will be on their way.",
        "time to move on.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
          "cured meat": 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityMilitaryCampSuppliesCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(13);
    expect(engine.state.get('outfit["cured meat"]')).toBe(3);
    expect(engine.state.get("outfit.bullets")).toBe(2);
    expect(engine.state.get("outfit.rifle")).toBe(2);
    expect(engine.state.get("outfit.bayonet")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city shanty market branch through shop loot and youth combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-shanty-market")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-market",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-market",
      sceneKey: "shanty-town",
      text: [
        "a large shanty town sprawls across the streets.",
        "faces, darkened by soot and blood, stare out from crooked huts.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-market",
      sceneKey: "frail-man",
      combat: {
        enemy: "frail man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        leather: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-market",
      sceneKey: "shop",
      text: [
        "an improvised shop is set up on the sidewalk.",
        "the owner stands by, stoic.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          rifle: 1,
          bullets: 1,
          "alien alloy": 1,
          medicine: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-market",
      sceneKey: "youth",
      combat: {
        enemy: "youth",
        phase: "fighting",
        enemyHp: 45,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-market",
      sceneKey: "canvas-sack",
      text: [
        "the young settler was carrying a canvas sack.",
        "it contains travelling gear, and a few trinkets.",
        "there's nothing else here.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          bolas: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityShantyMarketCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(15);
    expect(engine.state.get('outfit["steel sword"]')).toBe(2);
    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    expect(engine.state.get('outfit["leather"]')).toBe(1);
    expect(engine.state.get('outfit["bolas"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city shanty crowd branch through squatters combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-shanty-crowd")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd",
      sceneKey: "shanty-town",
      text: [
        "a large shanty town sprawls across the streets.",
        "faces, darkened by soot and blood, stare out from crooked huts.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd",
      sceneKey: "frail-man",
      combat: {
        enemy: "frail man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        leather: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd",
      sceneKey: "crowd",
      text: [
        "more squatters are crowding around now.",
        "someone throws a stone.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd",
      sceneKey: "squatters",
      combat: {
        enemy: "squatters",
        phase: "fighting",
        enemyHp: 40,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd",
      sceneKey: "belongings",
      text: [
        "the remaining settlers flee from the violence, their belongings forgotten.",
        "there's not much, but some useful things can still be found.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          "energy cell": 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityShantyCrowdCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(16);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cloth"]')).toBe(2);
    expect(engine.state.get('outfit["leather"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city shanty crowd branch through squatters and sack loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-shanty-crowd-sack")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-sack",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-sack",
      sceneKey: "shanty-town",
      text: [
        "a large shanty town sprawls across the streets.",
        "faces, darkened by soot and blood, stare out from crooked huts.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-sack",
      sceneKey: "frail-man",
      combat: {
        enemy: "frail man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        leather: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-sack",
      sceneKey: "crowd",
      text: [
        "more squatters are crowding around now.",
        "someone throws a stone.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-sack",
      sceneKey: "squatters",
      combat: {
        enemy: "squatters",
        phase: "fighting",
        enemyHp: 40,
      },
    });

    engine.clock.advanceBy(1000);
    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-sack",
      sceneKey: "canvas-sack",
      text: [
        "the young settler was carrying a canvas sack.",
        "it contains travelling gear, and a few trinkets.",
        "there's nothing else here.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          bolas: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityShantyCrowdSackCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(15);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cloth"]')).toBe(2);
    expect(engine.state.get('outfit["leather"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]')).toBe(1);
    expect(engine.state.get('outfit["bolas"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city shanty crowd branch through youth combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-shanty-crowd-youth")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-youth",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-youth",
      sceneKey: "shanty-town",
      text: [
        "a large shanty town sprawls across the streets.",
        "faces, darkened by soot and blood, stare out from crooked huts.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-youth",
      sceneKey: "frail-man",
      combat: {
        enemy: "frail man",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
        leather: 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-youth",
      sceneKey: "crowd",
      text: [
        "more squatters are crowding around now.",
        "someone throws a stone.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-youth",
      sceneKey: "youth",
      combat: {
        enemy: "youth",
        phase: "fighting",
        enemyHp: 45,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-shanty-crowd-youth",
      sceneKey: "canvas-sack",
      text: [
        "the young settler was carrying a canvas sack.",
        "it contains travelling gear, and a few trinkets.",
        "there's nothing else here.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          bolas: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityShantyCrowdYouthCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(15);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["bolas"]')).toBe(1);
    expect(engine.state.get('outfit["medicine"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cloth"]')).toBe(2);
    expect(engine.state.get('outfit["leather"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city drying hut branch through meat loot and squatter combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-drying-hut")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut",
      sceneKey: "shanty-town",
      text: [
        "a large shanty town sprawls across the streets.",
        "faces, darkened by soot and blood, stare out from crooked huts.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut",
      sceneKey: "broken-people",
      text: [
        "nothing but downcast eyes.",
        "the people here were broken a long time ago.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut",
      sceneKey: "drying-meat",
      text: [
        "strips of meat hang drying by the side of the street.",
        "the people back away, avoiding eye contact.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut",
      sceneKey: "squatter",
      combat: {
        enemy: "squatter",
        phase: "fighting",
        enemyHp: 20,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut",
      sceneKey: "hut",
      text: [
        "inside the hut, a child cries.",
        "a few belongings rest against the walls.",
        "there's nothing else here.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
          bolas: 1,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityDryingHutCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cured meat"]')).toBe(5);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]')).toBe(1);
    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(1);
    expect(engine.state.get('outfit["bolas"]')).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city drying hut branch through squatter and sack loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-drying-hut-sack")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut-sack",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut-sack",
      sceneKey: "shanty-town",
      text: [
        "a large shanty town sprawls across the streets.",
        "faces, darkened by soot and blood, stare out from crooked huts.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut-sack",
      sceneKey: "broken-people",
      text: [
        "nothing but downcast eyes.",
        "the people here were broken a long time ago.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut-sack",
      sceneKey: "drying-meat",
      text: [
        "strips of meat hang drying by the side of the street.",
        "the people back away, avoiding eye contact.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut-sack",
      sceneKey: "squatter",
      combat: {
        enemy: "squatter",
        phase: "fighting",
        enemyHp: 20,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-hut-sack",
      sceneKey: "canvas-sack",
      text: [
        "the young settler was carrying a canvas sack.",
        "it contains travelling gear, and a few trinkets.",
        "there's nothing else here.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          bolas: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityDryingHutSackCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cured meat"]')).toBe(6);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]')).toBe(1);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["bolas"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city drying meat branch through youth combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.city-drying-meat-youth")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-meat-youth",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-meat-youth",
      sceneKey: "shanty-town",
      text: [
        "a large shanty town sprawls across the streets.",
        "faces, darkened by soot and blood, stare out from crooked huts.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-meat-youth",
      sceneKey: "broken-people",
      text: [
        "nothing but downcast eyes.",
        "the people here were broken a long time ago.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-meat-youth",
      sceneKey: "drying-meat",
      text: [
        "strips of meat hang drying by the side of the street.",
        "the people back away, avoiding eye contact.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-meat-youth",
      sceneKey: "youth",
      combat: {
        enemy: "youth",
        phase: "fighting",
        enemyHp: 45,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-drying-meat-youth",
      sceneKey: "canvas-sack",
      text: [
        "the young settler was carrying a canvas sack.",
        "it contains travelling gear, and a few trinkets.",
        "there's nothing else here.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          bolas: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityDryingMeatYouthCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(16);
    expect(engine.state.get('outfit["cured meat"]')).toBe(6);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    expect(engine.state.get('outfit["teeth"]')).toBe(1);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["bolas"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city old-tower branch through thug and bird combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.city-old-tower")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower",
      title: "A Ruined City",
      sceneKey: "start",
      text: [
        "a battered highway sign stands guard at the entrance to this once-great city.",
        "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
        "might be things worth having still inside.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower",
      sceneKey: "empty-streets",
      text: [
        "the streets are empty.",
        "the air is filled with dust, driven relentlessly by the hard winds.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower",
      sceneKey: "tower",
      text: [
        "the old tower seems mostly intact.",
        "the shell of a burned out car blocks the entrance.",
        "most of the windows at ground level are busted anyway.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower",
      sceneKey: "thug",
      combat: {
        enemy: "thug",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "steel sword": 1,
        "cured meat": 1,
        cloth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower",
      sceneKey: "bird",
      combat: {
        enemy: "bird",
        phase: "fighting",
        enemyHp: 45,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower",
      sceneKey: "nest",
      text: [
        "bird must have liked shiney things.",
        "some good stuff woven into its nest.",
      ],
      loot: {
        loot: {
          bullets: 5,
          bolas: 1,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityOldTowerCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(17);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.cloth")).toBe(1);
    expect(engine.state.get("outfit.meat")).toBe(5);
    expect(engine.state.get("outfit.bullets")).toBe(5);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city old-tower branch through scavenged loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(
      events.triggerByKeyForTest("setpiece.city-old-tower-scavenged"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-scavenged",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-scavenged",
      sceneKey: "empty-streets",
      text: [
        "the streets are empty.",
        "the air is filled with dust, driven relentlessly by the hard winds.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-scavenged",
      sceneKey: "tower",
      text: [
        "the old tower seems mostly intact.",
        "the shell of a burned out car blocks the entrance.",
        "most of the windows at ground level are busted anyway.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-scavenged",
      sceneKey: "thug",
      combat: {
        enemy: "thug",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "steel sword": 1,
        "cured meat": 1,
        cloth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-scavenged",
      sceneKey: "bird",
      combat: {
        enemy: "bird",
        phase: "fighting",
        enemyHp: 45,
      },
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-scavenged",
      sceneKey: "scavenged",
      text: [
        "not much here.",
        "scavengers must have gotten to this place already.",
      ],
      loot: {
        loot: {
          torch: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityOldTowerScavengedCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(17);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get("outfit.cloth")).toBe(1);
    expect(engine.state.get("outfit.meat")).toBe(5);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city old-tower branch through thug and rubble loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(
      events.triggerByKeyForTest("setpiece.city-old-tower-thug-rubble"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-thug-rubble",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-thug-rubble",
      sceneKey: "empty-streets",
      text: [
        "the streets are empty.",
        "the air is filled with dust, driven relentlessly by the hard winds.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-thug-rubble",
      sceneKey: "tower",
      text: [
        "the old tower seems mostly intact.",
        "the shell of a burned out car blocks the entrance.",
        "most of the windows at ground level are busted anyway.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-thug-rubble",
      sceneKey: "thug",
      combat: {
        enemy: "thug",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "steel sword": 1,
        "cured meat": 1,
        cloth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-thug-rubble",
      sceneKey: "rubble",
      text: [
        "the debris is denser here.",
        "maybe some useful stuff in the rubble.",
      ],
      loot: {
        loot: {
          bullets: 1,
          steel: 1,
          "alien alloy": 1,
          cloth: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-thug-rubble",
      sceneKey: "scavenged",
      text: [
        "not much here.",
        "scavengers must have gotten to this place already.",
      ],
      loot: {
        loot: {
          torch: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityOldTowerThugRubbleCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(21);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get("outfit.cloth")).toBe(2);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get("outfit.steel")).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused city old-tower rubble branch through beast combat and scavenged loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wagon", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.city-old-tower-rubble")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-rubble",
      title: "A Ruined City",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-rubble",
      sceneKey: "empty-streets",
      text: [
        "the streets are empty.",
        "the air is filled with dust, driven relentlessly by the hard winds.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-rubble",
      sceneKey: "tower",
      text: [
        "the old tower seems mostly intact.",
        "the shell of a burned out car blocks the entrance.",
        "most of the windows at ground level are busted anyway.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-rubble",
      sceneKey: "beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 30,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 1,
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-rubble",
      sceneKey: "rubble",
      text: [
        "the debris is denser here.",
        "maybe some useful stuff in the rubble.",
      ],
      loot: {
        loot: {
          bullets: 1,
          steel: 1,
          "alien alloy": 1,
          cloth: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-old-tower-rubble",
      sceneKey: "scavenged",
      text: [
        "not much here.",
        "scavengers must have gotten to this place already.",
      ],
      loot: {
        loot: {
          torch: 1,
          "cured meat": 1,
        },
      },
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityOldTowerRubbleCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(21);
    expect(engine.state.get("outfit.meat")).toBe(1);
    expect(engine.state.get("outfit.fur")).toBe(1);
    expect(engine.state.get("outfit.teeth")).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get("outfit.steel")).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);
    expect(engine.state.get("outfit.cloth")).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives focused town and city setpiece combat slices through the event runtime", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.town-thug")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-thug",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "thug",
      phase: "fighting",
      enemyHp: 30,
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 5,
        leather: 5,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-thug",
      sceneKey: "cleared",
      text: [
        "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
        "the double doors creak endlessly in the wind.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();

    expect(events.triggerByKeyForTest("setpiece.city-sniper")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-sniper",
      title: "A Ruined City",
      sceneKey: "start",
      text: [
        "a battered highway sign stands guard at the entrance to this once-great city.",
        "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
        "might be things worth having still inside.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "sniper",
      phase: "fighting",
      enemyHp: 30,
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-sniper",
      sceneKey: "cleared",
      text: [
        "street above the subway platform is blown away.",
        "lets some light down into the dusty haze.",
        "a sound comes from the tunnel, just ahead.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused coal mine setpiece traversal through chained combat scenes", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(30).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.coalmine")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      title: "The Coal Mine",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "man",
      phase: "fighting",
      enemyHp: 10,
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      sceneKey: "a2",
      combat: {
        enemy: "man",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      sceneKey: "a3",
      combat: {
        enemy: "chief",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 5,
        cloth: 5,
        iron: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      sceneKey: "cleared",
      text: [
        "the camp is still, save for the crackling of the fires.",
        "the mine is now safe for workers.",
      ],
    });
    expect(engine.state.get("game.world.coalmine")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the coal mine is clear of dangers",
    );

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused iron mine setpiece combat traversal through the cleared mine scene", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0, 0, 0, 0, 0, 0]),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["bone spear"]', 0);
    engine.state.set('outfit["grenade"]', 1);
    engine.state.set('outfit["bone spear"]', 1);
    expect(events.triggerByKeyForTest("setpiece.ironmine")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.ironmine",
      title: "The Iron Mine",
      sceneKey: "start",
      buttons: [
        {
          key: "enter",
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "beastly matriarch",
      phase: "fighting",
      enemyHp: 10,
    });

    expect(events.chooseCombatAction("attack:grenade")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        teeth: 5,
        scales: 5,
        cloth: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);

    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.ironmine",
      sceneKey: "cleared",
      text: ["the beast is dead.", "the mine is now safe for workers."],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["bone spear"]')).toBe(0);
    expect(engine.state.get('outfit["bone spear"]')).toBe(1);
    expect(engine.state.get("game.world.ironmine")).toBe(true);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the iron mine is clear of dangers",
    );

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("routes executioner antechamber elevator choices through linked event slices", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("executioner.antechamber")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.antechamber",
      title: "A Ravaged Battleship",
      sceneKey: "start",
      text: [
        "a large hatch opens into a wide corridor.",
        "the corridor leads to a bank of elevators, which appear to be functional.",
      ],
      buttons: [
        expect.objectContaining({ key: "engineering", text: "engineering" }),
        expect.objectContaining({ key: "medical", text: "medical" }),
        expect.objectContaining({ key: "martial", text: "martial" }),
        expect.objectContaining({ key: "leave", text: "leave" }),
      ],
    });
    expect(
      events.snapshot()?.buttons.some((button) => button.key === "command"),
    ).toBe(false);

    expect(events.choose("engineering")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly-loot",
      title: "Engineering Wing",
      sceneKey: "start",
      text: [
        "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
        "emergency lighting flickers.",
      ],
    });

    const engineeringEngine = createGameEngine({ rng: sequenceRng([0, 0.85]) });
    const engineeringEvents = new EventRuntime(engineeringEngine, () => "room");

    expect(
      engineeringEvents.triggerByKeyForTest("executioner.antechamber"),
    ).toBe(true);
    expect(engineeringEvents.choose("engineering")).toBe(true);
    expect(engineeringEvents.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-fire-guard-post",
      title: "Engineering Wing",
      sceneKey: "start",
      text: [
        "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
        "emergency lighting flickers.",
      ],
    });

    const martialEngine = createGameEngine({ rng: sequenceRng([0, 0.75]) });
    const martialEvents = new EventRuntime(martialEngine, () => "room");

    expect(martialEvents.triggerByKeyForTest("executioner.antechamber")).toBe(
      true,
    );
    expect(martialEvents.choose("martial")).toBe(true);
    expect(martialEvents.snapshot()).toMatchObject({
      eventKey: "executioner.martial-scrap-blueprint",
      title: "Martial Wing",
      sceneKey: "start",
      text: [
        "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
        "looks like they tried to barricade the elevators.",
      ],
    });

    const clearedEngine = createGameEngine({ rng: sequenceRng([0]) });
    const clearedEvents = new EventRuntime(clearedEngine, () => "room");
    clearedEngine.state.set("game.world.engineering", true);
    clearedEngine.state.set("game.world.medical", true);
    clearedEngine.state.set("game.world.martial", true);

    expect(clearedEvents.triggerByKeyForTest("executioner.antechamber")).toBe(
      true,
    );
    expect(
      clearedEvents.snapshot()?.buttons.map((button) => button.key),
    ).toEqual(["command", "leave"]);

    expect(clearedEvents.choose("command")).toBe(true);
    expect(clearedEvents.snapshot()).toMatchObject({
      eventKey: "executioner.command-wanderer",
      title: "Command Deck",
      sceneKey: "start",
      text: [
        "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
        "in a flash, the figure is standing.",
      ],
    });
  });

  it("drives a focused executioner intro web branch through arthropod combats", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);

    expect(events.triggerByKeyForTest("executioner.intro-webs")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-webs",
      title: "A Ravaged Battleship",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-webs",
      sceneKey: "webbing",
      text: [
        "thick, sticky webbing covers the walls of the corridor.",
        "deeper into the ship, the darkness seems almost to writhe.",
        "a small knapsack hangs from a cluster of webs, a few feet from the floor.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          bullets: 1,
          "energy cell": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get('outfit["energy cell"]')).toBe(51);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "chitinous horror",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 5,
        scales: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "chitinous queen",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        meat: 8,
        scales: 8,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-webs",
      sceneKey: "maintenance-panel",
      text: [
        "a maintenance panel is embedded in the wall next to a large sealed door.",
        "perhaps the ship's systems are still operational.",
      ],
    });

    expect(events.choose("power")).toBe(true);
    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-webs",
      sceneKey: "device",
    });
    expect(engine.state.get("game.world.executioner")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused executioner intro military branch through camp loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);

    expect(events.triggerByKeyForTest("executioner.intro-military-camp")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-military-camp",
      title: "A Ravaged Battleship",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "operative",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        bayonet: 1,
        bullets: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-military-camp",
      sceneKey: "camp",
      text: [
        "the military has set up a small camp just inside the ship.",
        "crude attempts have been made to cut into the walls.",
        "scraps of copper wire litter the floor.",
        "two bedrolls are wedged into a corner.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          bullets: 1,
          "alien alloy": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "researcher",
      phase: "fighting",
      enemyHp: 20,
    });

    for (let attack = 0; attack < 2; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        torch: 1,
        cloth: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-military-camp",
      sceneKey: "maintenance-panel",
      text: [
        "a maintenance panel is embedded in the wall next to a large sealed door.",
        "perhaps the ship's systems are still operational.",
      ],
    });

    expect(events.choose("power")).toBe(true);
    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-military-camp",
      sceneKey: "device",
    });
    expect(engine.state.get("game.world.executioner")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused executioner intro barricade branch through weapons loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);

    expect(events.triggerByKeyForTest("executioner.intro-barricade")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-barricade",
      title: "A Ravaged Battleship",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-barricade",
      sceneKey: "barricade",
      text: [
        "debris is stacked in the corridor, forming a low barricade.",
        "the walls are scorched and melted.",
        "behind the barricade, a few weapons lay abandoned.",
      ],
      loot: {
        loot: {
          "laser rifle": 1,
          "energy cell": 1,
          "plasma rifle": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(2);
    expect(engine.state.get('outfit["energy cell"]')).toBe(51);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-barricade",
      sceneKey: "wanderer-remains",
      text: [
        "the partially devoured remains of several wanderers are piled before a dark corridor.",
        "shuffling noises can be heard from within.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          cloth: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(52);
    expect(engine.state.get("outfit.cloth")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "ancient beast",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 5,
        meat: 5,
        teeth: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-barricade",
      sceneKey: "maintenance-panel",
      text: [
        "a maintenance panel is embedded in the wall next to a large sealed door.",
        "perhaps the ship's systems are still operational.",
      ],
    });

    expect(events.choose("power")).toBe(true);
    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-barricade",
      sceneKey: "device",
    });
    expect(engine.state.get("game.world.executioner")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused executioner intro branch through beast and turret combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    expect(events.triggerByKeyForTest("executioner.intro-defences")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-defences",
      title: "A Ravaged Battleship",
      sceneKey: "start",
      text: [
        "the remains of a massive battleship lie here, like a silent sealed city.",
        "it lists to the side in a deep crevasse, cut when it fell from the sky.",
        "the hatches are all sealed, but the hull is blown out just above the dirt, providing an entrance.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "corridor",
      text: [
        "the interior of the ship is cold and dark. what little light there is only accentuates its harsh angles.",
        "the walls hum faintly.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "beast-approach",
      text: [
        "the partially devoured remains of several wanderers are piled before a dark corridor.",
        "shuffling noises can be heard from within.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "ancient beast",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 5,
        meat: 5,
        teeth: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-defences",
      sceneKey: "maintenance-panel",
      text: [
        "a maintenance panel is embedded in the wall next to a large sealed door.",
        "perhaps the ship's systems are still operational.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("power")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "automated turret",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.intro-defences",
      sceneKey: "device",
      text: [
        "beyond the bulkhead is a small antechamber, seemingly untouched by scavengers.",
        "a large hatch grinds open, and the wind rushes in.",
        "a strange device sits on the floor. looks important.",
      ],
    });
    expect(engine.state.get("game.world.executioner")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused engineering assembly executioner slice through welder and guard combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    expect(events.triggerByKeyForTest("executioner.engineering-assembly")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly",
      title: "Engineering Wing",
      sceneKey: "start",
      text: [
        "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
        "emergency lighting flickers.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "assembly",
      text: [
        "an automated assembly line performs its empty routines, long since deprived of materials.",
        "its final works lie forgotten, covered by a thin layer of dust.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unruly welder",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 59,
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 39,
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly",
      sceneKey: "cleared",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "start",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused engineering assembly loot branch into welder and guard combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);
    engine.state.set('outfit["hypo"]', 1);

    expect(
      events.triggerByKeyForTest("executioner.engineering-assembly-loot"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly-loot",
      title: "Engineering Wing",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "assembly",
      text: [
        "an automated assembly line performs its empty routines, long since deprived of materials.",
        "its final works lie forgotten, covered by a thin layer of dust.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          "laser rifle": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(41);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unruly welder",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });
  });

  it("drives a focused engineering assembly quiet branch into guard combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    expect(
      events.triggerByKeyForTest("executioner.engineering-assembly-quiet"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly-quiet",
      title: "Engineering Wing",
      sceneKey: "start",
      text: [
        "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
        "emergency lighting flickers.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly-quiet",
      sceneKey: "assembly",
      text: [
        "an automated assembly line performs its empty routines, long since deprived of materials.",
        "its final works lie forgotten, covered by a thin layer of dust.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          "laser rifle": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(31);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly-quiet",
      sceneKey: "machinery",
      text: [
        "assembly arms spark and jitter.",
        "a cacophony of decrepit machinery fills the room.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-assembly-quiet",
      sceneKey: "cleared",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('outfit["energy cell"]')).toBe(27);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(2);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "start",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });
  });

  it("drives a focused engineering engine-room branch through salvage and guard combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);

    expect(
      events.triggerByKeyForTest("executioner.engineering-engine-room"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-engine-room",
      title: "Engineering Wing",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-engine-room",
      sceneKey: "engine-room",
      text: [
        "must have been the engine room, once. the massive machines now stand inert, twisted and scorched by explosions.",
        "the destruction is uniform and precise.",
        "bits of them can be scavenged.",
      ],
      loot: {
        loot: {
          "alien alloy": 2,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(2);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });
  });

  it("drives a focused engineering engine-room quiet branch through destroyed-engine text", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);

    expect(
      events.triggerByKeyForTest("executioner.engineering-engine-room-quiet"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-engine-room-quiet",
      title: "Engineering Wing",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-engine-room-quiet",
      sceneKey: "engine-room",
      text: [
        "must have been the engine room, once. the massive machines now stand inert, twisted and scorched by explosions.",
        "the destruction is uniform and precise.",
        "bits of them can be scavenged.",
      ],
      loot: {
        loot: {
          "alien alloy": 2,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(2);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-engine-room-quiet",
      sceneKey: "destroyed-engines",
      text: [
        "none of the ship's engines escaped the destruction.",
        "it's no mystery why she no longer flies.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-engine-room-quiet",
      sceneKey: "cleared",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "start",
    });
  });

  it("drives a focused engineering fire branch through guard-post loot and prototype cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);
    engine.state.set('outfit["water"]', 5);

    expect(
      events.triggerByKeyForTest("executioner.engineering-fire-guard-post"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-fire-guard-post",
      title: "Engineering Wing",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "fire-junction",
      text: [
        "sparks cascade from a reactivated power junction, and catch.",
        "the flames fill the corridor.",
      ],
      buttons: expect.arrayContaining([
        {
          key: "water",
          text: "extinguish",
          cost: { water: 5 },
          link: null,
          disabled: false,
        },
        {
          key: "run",
          text: "rush through",
          cost: { hp: 10 },
          link: null,
          disabled: false,
        },
      ]),
    });

    expect(events.choose("water")).toBe(true);
    expect(engine.state.get('outfit["water"]')).toBe(0);
    expect(engine.state.get("character.health")).toBe(85);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-fire-guard-post",
      sceneKey: "guard-post",
      text: [
        "more signs of past combat down the hall. guard post is ransacked.",
        "still, some things can be found.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          "laser rifle": 1,
          grenade: 1,
          "plasma rifle": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(2);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-fire-guard-post",
      sceneKey: "cleared",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "start",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "plans",
      text: [
        "experimental plans cover one wall, held by an unseen force.",
        "this one looks useful.",
      ],
      loot: {
        loot: {
          "hypo blueprint": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["hypo blueprint"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "prototype-intro",
      text: ["clattering metal and old servos. something is coming..."],
    });

    expect(events.choose("fight")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable prototype",
      phase: "fighting",
      enemyHp: 150,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);

    for (let attack = 0; attack < 13; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        "kinetic armour blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "cleared",
      text: [
        "at the back of the workshop, elevator doors twitch and buzz.",
        "looks like a way out of here.",
      ],
    });
    expect(engine.state.get("game.world.engineering")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("spends health on the focused engineering fire rush-through branch", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0.75, ...Array(40).fill(0)]),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(
      events.triggerByKeyForTest("executioner.engineering-fire-guard-post"),
    ).toBe(true);
    expect(events.choose("continue")).toBe(true);

    expect(events.choose("run")).toBe(true);
    expect(engine.state.get("character.health")).toBe(75);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-fire-guard-post",
      sceneKey: "robot-hangar",
      text: [
        "rows of inert security robots hang suspended from the ceiling.",
        "wires run overhead, corroded and useless.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "guard-post",
      loot: {
        loot: {
          "energy cell": 1,
          "laser rifle": 1,
          grenade: 1,
          "plasma rifle": 1,
        },
      },
    });
  });

  it("drives a focused engineering R&D branch through turret, hypo blueprint, and prototype combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 70);

    expect(
      events.triggerByKeyForTest("executioner.engineering-rd-blueprint"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      title: "Engineering Wing",
      sceneKey: "start",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "plans",
      text: [
        "experimental plans cover one wall, held by an unseen force.",
        "this one looks useful.",
      ],
      loot: {
        loot: {
          "hypo blueprint": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["hypo blueprint"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "prototype-intro",
      text: ["clattering metal and old servos. something is coming..."],
    });

    expect(events.choose("fight")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable prototype",
      phase: "fighting",
      enemyHp: 150,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);

    for (let attack = 0; attack < 13; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        "kinetic armour blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "cleared",
      text: [
        "at the back of the workshop, elevator doors twitch and buzz.",
        "looks like a way out of here.",
      ],
    });
    expect(engine.state.get("game.world.engineering")).toBe(true);
    expect(engine.state.get('outfit["hypo blueprint"]')).toBe(1);
  });

  it("uses the focused engineering R&D heal machine before the workbench branch", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.75, ...Array(180).fill(0)]),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set('stores["alien alloy"]', 1);
    engine.state.set("character.health", 25);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 70);

    expect(
      events.triggerByKeyForTest("executioner.engineering-rd-blueprint"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      title: "Engineering Wing",
      sceneKey: "start",
      text: [
        "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
        "one machine thrums with power, and might still work.",
      ],
      buttons: expect.arrayContaining([
        expect.objectContaining({
          key: "use",
          text: "use machine",
          cost: { "alien alloy": 1 },
          disabled: false,
        }),
      ]),
    });

    expect(events.choose("use")).toBe(true);
    expect(engine.state.get('stores["alien alloy"]', true)).toBe(0);
    expect(engine.state.get("character.health")).toBe(85);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "healed",
      text: [
        "step inside, and the machine whirs. muscle and bone reknit. good as new.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "workbenches",
      text: [
        "the machines here look unfinished, abandoned by their creator. wires and other scrap are scattered about the work benches.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "plans",
      text: [
        "experimental plans cover one wall, held by an unseen force.",
        "this one looks useful.",
      ],
      loot: {
        loot: {
          "hypo blueprint": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "prototype-intro",
      text: ["clattering metal and old servos. something is coming..."],
    });

    expect(events.choose("fight")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable prototype",
      phase: "fighting",
      enemyHp: 150,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);

    for (let attack = 0; attack < 13; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        "kinetic armour blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "cleared",
      text: [
        "at the back of the workshop, elevator doors twitch and buzz.",
        "looks like a way out of here.",
      ],
    });
    expect(engine.state.get("game.world.engineering")).toBe(true);
    expect(engine.state.get('outfit["hypo blueprint"]')).toBe(1);
    expect(engine.state.get('outfit["kinetic armour blueprint"]')).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused medical checkpoint executioner slice through dispatch loot and automaton handoff", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 300);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);
    engine.state.set('outfit["hypo"]', 1);

    expect(events.triggerByKeyForTest("executioner.medical-checkpoint")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "elevator doors open to an empty corridor.",
        "a few dusty corpses can be seen further down, but this deck appears to have been spared most of the combat.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 60,
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "quiet-corridor",
      text: [
        "past the checkpoint, the corridor is undamaged save for sporadic graffiti.",
        "there was no fighting here.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 20,
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "gurneys",
      text: [
        "medical gurneys are fixed to grooves running down the corridor walls.",
        "the automated patient transport system now sits motionless.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 32,
      enemyStatus: "venomous",
    });

    for (let attack = 0; attack < 3; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 20,
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "cleared",
      text: [
        "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
        "more strange graffiti adorns the walls.",
      ],
      loot: {
        loot: {
          "laser rifle": 1,
          "energy cell": 3,
        },
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);
    engine.clock.advanceBy(10000);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable automaton",
      phase: "fighting",
      enemyHp: 100,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 9; attack += 1) {
      if (attack === 8) {
        expect(events.chooseCombatAction("heal:hypo")).toBe(true);
      }
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
      if (attack < 8) engine.clock.advanceBy(1000);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "exploding",
      enemyHp: 0,
    });

    engine.clock.advanceBy(3000);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "glowstone blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "checkpoint",
      text: [
        "another checkpoint ahead, fitted with heavy doors.",
        "security is even tighter here.",
      ],
    });
    expect(engine.state.get('outfit["glowstone blueprint"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-cold-guard",
      sceneKey: "start",
      text: [
        "another checkpoint ahead, fitted with heavy doors.",
        "security is even tighter here.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives the focused medical checkpoint guardians branch after the turret", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0.75)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 300);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);

    expect(events.triggerByKeyForTest("executioner.medical-checkpoint")).toBe(
      true,
    );
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "quiet-corridor",
      text: [
        "past the checkpoint, the corridor is undamaged save for sporadic graffiti.",
        "there was no fighting here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "guardians",
      text: [
        "automated guardians still stalk the halls, unaware that their masters have long gone.",
        "clumsy machines, and easily avoided.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "gurneys",
      text: [
        "medical gurneys are fixed to grooves running down the corridor walls.",
        "the automated patient transport system now sits motionless.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "strategy-room",
      text: [
        "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
        "a secure locker is set into one wall.",
      ],
      buttons: expect.arrayContaining([
        expect.objectContaining({
          key: "force",
          text: "force locker",
        }),
        expect.objectContaining({
          key: "continue",
          text: "continue",
        }),
      ]),
    });

    expect(events.choose("force")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "locker",
      text: ["hinges rusted through. no challenge."],
      loot: {
        loot: {
          "energy cell": 8,
          hypo: 2,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["hypo"]')).toBe(2);
    expect(engine.state.get('outfit["energy cell"]')).toBe(43);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
  });

  it("drives a focused medical cold-storage branch through malformed experiment cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(events.triggerByKeyForTest("executioner.medical-cold-storage")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-cold-storage",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "another checkpoint ahead, fitted with heavy doors.",
        "security is even tighter here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "slipped",
      text: [
        "slipped through unnoticed.",
        "air whistles as the doors open. this section must have lower pressure than the rest of the ship.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "cold-storage",
      text: [
        "the air is cooler here. low cabinets ring the room, doors dusted with frost.",
        "samples of something biological inside.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(5);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "drones",
      text: [
        "security drones still patrol the hallways.",
        "predictable paths.",
      ],
    });

    engine.clock.advanceBy(3000);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-cold-storage",
      sceneKey: "containment",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "start",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "malformed experiment",
      phase: "fighting",
      enemyHp: 200,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);

    for (let attack = 0; attack < 17; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "stim blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "cleared",
      text: ["the creature's tortured breathing ceases.", "nothing more here."],
    });
    expect(engine.state.get("game.world.medical")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused medical cold-storage guard branch into containment handoff", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(220).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 100);

    expect(events.triggerByKeyForTest("executioner.medical-cold-guard")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-cold-guard",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "another checkpoint ahead, fitted with heavy doors.",
        "security is even tighter here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "cold-storage",
      text: [
        "the air is cooler here. low cabinets ring the room, doors dusted with frost.",
        "samples of something biological inside.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(5);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-cold-guard",
      sceneKey: "containment",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
  });

  it("drives a focused medical surgical-tools explosives branch through experiment cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);

    expect(
      events.triggerByKeyForTest("executioner.medical-surgical-explosives"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-surgical-explosives",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
        "strange.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "explosives",
      text: [
        "the air in this room has a metallic tinge. floor is covered in dark powder.",
        "some completed explosives in the corner.",
      ],
      loot: {
        loot: {
          grenade: 3,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["grenade"]')).toBe(3);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-surgical-explosives",
      sceneKey: "containment",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "start",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "malformed experiment",
      phase: "fighting",
      enemyHp: 200,
    });

    for (let attack = 0; attack < 17; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "stim blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "cleared",
      text: ["the creature's tortured breathing ceases.", "nothing more here."],
    });
    expect(engine.state.get("game.world.medical")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused medical surgical-tools branch through direct medic combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(
      events.triggerByKeyForTest("executioner.medical-surgical-medic"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-surgical-medic",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
        "strange.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-surgical-medic",
      sceneKey: "containment",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
  });

  it("drives a focused medical guarded checkpoint branch into surgical tools", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(
      events.triggerByKeyForTest("executioner.medical-guarded-surgical"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-guarded-surgical",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "another checkpoint ahead, fitted with heavy doors.",
        "security is even tighter here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "surgical-tools",
      text: [
        "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
        "strange.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "explosives",
      loot: {
        loot: {
          grenade: 3,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["grenade"]')).toBe(3);

    engine.clock.advanceBy(3000);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-guarded-surgical",
      sceneKey: "containment",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
  });

  it("drives a focused medical friends branch through dispatch bay loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(
      events.triggerByKeyForTest("executioner.medical-friends-dispatch"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-friends-dispatch",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "medical gurneys are fixed to grooves running down the corridor walls.",
        "the automated patient transport system now sits motionless.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-friends-dispatch",
      sceneKey: "dispatch-bay",
      text: [
        "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
        "more strange graffiti adorns the walls.",
      ],
      loot: {
        loot: {
          "laser rifle": 1,
          "energy cell": 3,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable automaton",
      phase: "fighting",
      enemyHp: 100,
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
  });

  it("drives a focused medical automated-guardians branch through quiet movement", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);

    expect(
      events.triggerByKeyForTest("executioner.medical-guardians-quiet"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-guardians-quiet",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "past the checkpoint, the corridor is undamaged save for sporadic graffiti.",
        "there was no fighting here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "guardians",
      text: [
        "automated guardians still stalk the halls, unaware that their masters have long gone.",
        "clumsy machines, and easily avoided.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "gurneys",
      text: [
        "medical gurneys are fixed to grooves running down the corridor walls.",
        "the automated patient transport system now sits motionless.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "strategy-room",
      text: [
        "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
        "a secure locker is set into one wall.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "quiet-move",
      text: [
        "better to move without drawing attention.",
        "noises can be heard from the corridor outside.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable automaton",
      phase: "fighting",
      enemyHp: 100,
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
  });

  it("drives a focused medical strategy-room locker branch into automaton handoff", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(
      events.triggerByKeyForTest("executioner.medical-locker-quadruped"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-locker-quadruped",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
        "a secure locker is set into one wall.",
      ],
    });

    expect(events.choose("force")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "locker",
      text: ["hinges rusted through. no challenge."],
      loot: {
        loot: {
          "energy cell": 5,
          hypo: 1,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["hypo"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable automaton",
      phase: "fighting",
      enemyHp: 100,
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
  });

  it("drives a focused medical frozen-robots branch through automaton and cold-storage cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(
      events.triggerByKeyForTest("executioner.medical-frozen-automaton"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-frozen-automaton",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "medical gurneys are fixed to grooves running down the corridor walls.",
        "the automated patient transport system now sits motionless.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });

    for (let attack = 0; attack < 4; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 32,
      enemyStatus: "venomous",
    });

    for (let attack = 0; attack < 3; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-frozen-automaton",
      sceneKey: "frozen-robots",
      text: [
        "more medical robots stand frozen, attached by a network of wires.",
        "they take no notice of the intrusion.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "dispatch-bay",
      loot: {
        loot: {
          "laser rifle": 1,
          "energy cell": 3,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable automaton",
      phase: "fighting",
      enemyHp: 100,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 9; attack += 1) {
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
      if (attack < 8) engine.clock.advanceBy(1000);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "exploding",
      enemyHp: 0,
    });

    engine.clock.advanceBy(3000);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "glowstone blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-frozen-automaton",
      sceneKey: "checkpoint",
      text: [
        "another checkpoint ahead, fitted with heavy doors.",
        "security is even tighter here.",
      ],
    });
    expect(engine.state.get('outfit["glowstone blueprint"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-cold-storage",
      sceneKey: "start",
      text: [
        "another checkpoint ahead, fitted with heavy doors.",
        "security is even tighter here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "slipped",
      text: [
        "slipped through unnoticed.",
        "air whistles as the doors open. this section must have lower pressure than the rest of the ship.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "cold-storage",
      text: [
        "the air is cooler here. low cabinets ring the room, doors dusted with frost.",
        "samples of something biological inside.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "drones",
      text: [
        "security drones still patrol the hallways.",
        "predictable paths.",
      ],
    });

    engine.clock.advanceBy(3000);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
      enemyHp: 80,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        hypo: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-cold-storage",
      sceneKey: "containment",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "start",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "malformed experiment",
      phase: "fighting",
      enemyHp: 200,
    });
    expect(events.chooseCombatAction("heal:hypo")).toBe(true);
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 17; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "stim blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "cleared",
      text: ["the creature's tortured breathing ceases.", "nothing more here."],
    });
    expect(engine.state.get("game.world.medical")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused martial right-corridor branch through cabins and plasma-rifle blueprint loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 60);

    expect(
      events.triggerByKeyForTest("executioner.martial-right-cabins-blueprint"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-right-cabins-blueprint",
      title: "Martial Wing",
      sceneKey: "start",
      text: [
        "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
        "looks like they tried to barricade the elevators.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "branch",
      text: [
        "further along, the corridor branches.",
        "the door to the left is sealed and refuses to open.",
      ],
    });

    expect(events.choose("right")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-right-cabins-blueprint",
      sceneKey: "cabins",
      text: [
        "crew cabins flank the hall, devoid of life.",
        "a few useful items can be scavenged.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          "energy blade": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy blade"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "barricade",
      text: [
        "large barricades bisect the corridor, scorched by weapons fire.",
        "bodies litter the ground on either side.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "documents",
      text: [
        "documents are scattered down the hall, most charred and curled.",
        "this one looks interesting.",
      ],
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });
  });

  it("drives a focused martial right-corridor branch through the silent cabins route", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);

    expect(
      events.triggerByKeyForTest("executioner.martial-right-silent-cabins"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-right-silent-cabins",
      title: "Martial Wing",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.choose("right")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "silent-corridor",
      text: ["the corridor is eerily silent."],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "cabins",
      text: [
        "crew cabins flank the hall, devoid of life.",
        "a few useful items can be scavenged.",
      ],
      loot: {
        loot: {
          "energy cell": 1,
          "energy blade": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy blade"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "barricade",
      text: [
        "large barricades bisect the corridor, scorched by weapons fire.",
        "bodies litter the ground on either side.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-right-silent-cabins",
      sceneKey: "documents",
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });
  });

  it("drives a focused martial armory blast branch through weapon loot, turret combat, and robot cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.grenade", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 60);

    expect(events.triggerByKeyForTest("executioner.martial-armory-blast")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-armory-blast",
      title: "Martial Wing",
      sceneKey: "start",
      text: [
        "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
        "looks like they tried to barricade the elevators.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "branch",
      text: [
        "further along, the corridor branches.",
        "the door to the left is sealed and refuses to open.",
      ],
    });
    expect(events.choose("blast")).toBe(true);
    expect(engine.state.get("stores.grenade", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "armory",
      text: [
        "the blast throws the door inwards.",
        "through the bulkhead is a large room, walls lined with weapon racks. fighting seems to have passed it by.",
      ],
      loot: {
        loot: {
          "energy blade": 2,
          "laser rifle": 2,
          "energy cell": 5,
          grenade: 1,
          "plasma rifle": 1,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy blade"]')).toBe(2);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(2);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(2);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
      enemyHp: 50,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "alien alloy": 1,
        "laser rifle": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "sealed-door",
      text: [
        "another door at the end of the hall, sealed from this side.",
        "should be able to open it.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "barricade",
      text: [
        "large barricades bisect the corridor, scorched by weapons fire.",
        "bodies litter the ground on either side.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "documents",
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });
    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["plasma rifle blueprint"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-armory-blast",
      sceneKey: "training-complex",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "start",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "robot-intro",
      text: [
        "motion from the centre of the yard.",
        "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
      ],
    });

    expect(events.choose("engage")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
      enemyHp: 250,
    });

    for (let attack = 0; attack < 14; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 82,
      enemyStatus: "energised",
      playerHp: 20,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 50,
      loot: {
        "alien alloy": 1,
        "disruptor blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["disruptor blueprint"]')).toBe(1);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "cleared",
      text: [
        "the ruins of the sparring machine clatter to the ground.",
        "picked this deck clean.",
      ],
    });
    expect(engine.state.get("game.world.martial")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused martial scrap route through guard, quadruped, and plasma-rifle blueprint loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 60);

    expect(
      events.triggerByKeyForTest("executioner.martial-scrap-blueprint"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-scrap-blueprint",
      title: "Martial Wing",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.choose("right")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "scrap",
      text: [
        "ruined defence turrets flank the corridor.",
        "could put the scrap to good use.",
      ],
      loot: {
        loot: {
          "alien alloy": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "barricade",
      text: [
        "large barricades bisect the corridor, scorched by weapons fire.",
        "bodies litter the ground on either side.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-scrap-blueprint",
      sceneKey: "documents",
      text: [
        "documents are scattered down the hall, most charred and curled.",
        "this one looks interesting.",
      ],
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });
  });

  it("drives a focused martial scrap route through avoided sensors and quadruped combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);

    expect(
      events.triggerByKeyForTest("executioner.martial-scrap-sensors"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-scrap-sensors",
      title: "Martial Wing",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.choose("right")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "scrap",
      text: [
        "ruined defence turrets flank the corridor.",
        "could put the scrap to good use.",
      ],
      loot: {
        loot: {
          "alien alloy": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "sensors",
      text: [
        "small sensors in the walls still look to be operational.",
        "easily avoided.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "barricade",
      text: [
        "large barricades bisect the corridor, scorched by weapons fire.",
        "bodies litter the ground on either side.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-scrap-sensors",
      sceneKey: "documents",
      text: [
        "documents are scattered down the hall, most charred and curled.",
        "this one looks interesting.",
      ],
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });
  });

  it("drives a focused martial security-checkpoint branch through dead guards and robot cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 70);

    expect(
      events.triggerByKeyForTest("executioner.martial-security-checkpoint"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-security-checkpoint",
      title: "Martial Wing",
      sceneKey: "start",
      text: [
        "documents are scattered down the hall, most charred and curled.",
        "this one looks interesting.",
      ],
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["plasma rifle blueprint"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "checkpoint",
      text: [
        "the corridor passes through a security checkpoint. the defences are blown apart, ragged edges scorched by laser fire.",
        "past the checkpoint, banks of containment cells can be seen.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "dead-guards",
      text: [
        "the guards died at their posts, shot through with superheated plasma.",
        "their weapons lie on the floor beside them.",
      ],
      loot: {
        loot: {
          "laser rifle": 2,
          "energy cell": 5,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(2);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-security-checkpoint",
      sceneKey: "training-complex",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "start",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "robot-intro",
      text: [
        "motion from the centre of the yard.",
        "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
      ],
    });

    expect(events.choose("engage")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
      enemyHp: 250,
    });

    for (let attack = 0; attack < 14; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 82,
      enemyStatus: "energised",
      playerHp: 5,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 35,
      loot: {
        "alien alloy": 1,
        "disruptor blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["disruptor blueprint"]')).toBe(1);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "cleared",
      text: [
        "the ruins of the sparring machine clatter to the ground.",
        "picked this deck clean.",
      ],
    });
    expect(engine.state.get("game.world.martial")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused martial security-checkpoint branch through empty cells and robot cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 70);

    expect(
      events.triggerByKeyForTest("executioner.martial-security-empty-cells"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-security-empty-cells",
      title: "Martial Wing",
      sceneKey: "start",
      text: [
        "documents are scattered down the hall, most charred and curled.",
        "this one looks interesting.",
      ],
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "checkpoint",
      text: [
        "the corridor passes through a security checkpoint. the defences are blown apart, ragged edges scorched by laser fire.",
        "past the checkpoint, banks of containment cells can be seen.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "empty-cells",
      text: [
        "the cells are all empty.",
        "power cables running across the ceiling are split in several places, sparking occasionally.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
      enemyHp: 70,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 2,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-security-empty-cells",
      sceneKey: "training-complex",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "start",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "robot-intro",
      text: [
        "motion from the centre of the yard.",
        "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
      ],
    });

    expect(events.choose("engage")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
      enemyHp: 250,
    });

    for (let attack = 0; attack < 14; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 82,
      enemyStatus: "energised",
      playerHp: 5,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 35,
      loot: {
        "alien alloy": 1,
        "disruptor blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["disruptor blueprint"]')).toBe(1);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "cleared",
      text: [
        "the ruins of the sparring machine clatter to the ground.",
        "picked this deck clean.",
      ],
    });
    expect(engine.state.get("game.world.martial")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused martial planning-room branch through map scavenging and chained guards", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const mapApplications: string[] = [];
    const events = new EventRuntime(engine, () => "room", {
      applyMap: () => mapApplications.push("applyMap"),
    });

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 60);

    expect(
      events.triggerByKeyForTest("executioner.martial-planning-room-maps"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-planning-room-maps",
      title: "Martial Wing",
      sceneKey: "start",
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "planning-room",
      text: [
        "the next door leads to a ransacked planning room.",
        "maps of the surface can still be found amongst the debris.",
      ],
    });

    expect(events.choose("scavenge")).toBe(true);
    expect(mapApplications).toEqual(["applyMap", "applyMap", "applyMap"]);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-planning-room-maps",
      sceneKey: "training-complex",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });
  });

  it("drives a focused martial planning-room branch through sentry and robot cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(180).fill(0)),
    });
    const mapApplications: string[] = [];
    const events = new EventRuntime(engine, () => "room", {
      applyMap: () => mapApplications.push("applyMap"),
    });

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 70);

    expect(
      events.triggerByKeyForTest("executioner.martial-planning-room-maps"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-planning-room-maps",
      title: "Martial Wing",
      sceneKey: "start",
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "planning-room",
      text: [
        "the next door leads to a ransacked planning room.",
        "maps of the surface can still be found amongst the debris.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(mapApplications).toEqual([]);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "sentry",
      text: [
        "slipped past an automated sentry.",
        "if only they'd been destroyed along with everything else.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-planning-room-maps",
      sceneKey: "training-complex",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "start",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "robot-intro",
      text: [
        "motion from the centre of the yard.",
        "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
      ],
    });

    expect(events.choose("engage")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
      enemyHp: 250,
    });

    for (let attack = 0; attack < 14; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 82,
      enemyStatus: "energised",
      playerHp: 25,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 55,
      loot: {
        "alien alloy": 1,
        "disruptor blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["disruptor blueprint"]')).toBe(1);

    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "cleared",
      text: [
        "the ruins of the sparring machine clatter to the ground.",
        "picked this deck clean.",
      ],
    });
    expect(engine.state.get("game.world.martial")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused martial training-complex handoff through murderous robot combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);

    expect(
      events.triggerByKeyForTest("executioner.martial-training-robot"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      title: "Martial Wing",
      sceneKey: "start",
      text: [
        "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
        "a regenerative machine hums uncannily by one of the courses.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "robot-intro",
      text: [
        "motion from the centre of the yard.",
        "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
      ],
    });

    expect(events.choose("engage")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
      enemyHp: 250,
    });

    for (let attack = 0; attack < 14; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 82,
      enemyStatus: "energised",
      playerHp: 45,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 75,
      loot: {
        "alien alloy": 1,
        "disruptor blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "cleared",
      text: [
        "the ruins of the sparring machine clatter to the ground.",
        "picked this deck clean.",
      ],
    });
    expect(engine.state.get("game.world.martial")).toBe(true);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("uses the focused martial training-complex regenerative machine before robot combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(40).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set('stores["alien alloy"]', 1);
    engine.state.set("character.health", 25);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);

    expect(
      events.triggerByKeyForTest("executioner.martial-training-robot"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "start",
      buttons: expect.arrayContaining([
        expect.objectContaining({
          key: "use",
          text: "use machine",
          cost: { "alien alloy": 1 },
          disabled: false,
        }),
      ]),
    });

    expect(events.choose("use")).toBe(true);
    expect(engine.state.get('stores["alien alloy"]', true)).toBe(0);
    expect(engine.state.get("character.health")).toBe(85);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "robot-intro",
      text: [
        "motion from the centre of the yard.",
        "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
      ],
    });

    expect(events.choose("engage")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
      enemyHp: 250,
      playerHp: 85,
    });
  });

  it("drives a focused engineering executioner slice through prototype shield combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    expect(
      events.triggerByKeyForTest("executioner.engineering-prototype"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-prototype",
      title: "Engineering Wing",
      sceneKey: "start",
      text: ["clattering metal and old servos. something is coming..."],
    });

    expect(events.choose("fight")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "unstable prototype",
      phase: "fighting",
      enemyHp: 150,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 90,
      enemyStatus: null,
    });

    engine.clock.advanceBy(1000);
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 90,
      enemyStatus: "shield",
    });
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 102,
      enemyStatus: null,
    });

    for (let attack = 0; attack < 13; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        "kinetic armour blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.engineering-prototype",
      sceneKey: "cleared",
      text: [
        "at the back of the workshop, elevator doors twitch and buzz.",
        "looks like a way out of here.",
      ],
    });
    expect(engine.state.get("game.world.engineering")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused martial executioner slice through energised robot combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 40);

    expect(events.triggerByKeyForTest("executioner.martial-robot")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-robot",
      title: "Martial Wing",
      sceneKey: "start",
      text: [
        "motion from the centre of the yard.",
        "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
      ],
    });

    expect(events.choose("engage")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
      enemyHp: 250,
    });

    for (let attack = 0; attack < 14; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 82,
      enemyStatus: "energised",
      playerHp: 45,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);

    for (let attack = 0; attack < 7; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 75,
      loot: {
        "alien alloy": 1,
        "disruptor blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.martial-robot",
      sceneKey: "cleared",
      text: [
        "the ruins of the sparring machine clatter to the ground.",
        "picked this deck clean.",
      ],
    });
    expect(engine.state.get("game.world.martial")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused medical executioner slice through enraged experiment combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(160).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["laser rifle"]', 0);
    engine.state.set('outfit["laser rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 60);

    expect(events.triggerByKeyForTest("executioner.medical-experiment")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      title: "Medical Wing",
      sceneKey: "start",
      text: [
        "containment cells arranged at the back of the room, all open.",
        "something moving up ahead.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "malformed experiment",
      phase: "fighting",
      enemyHp: 200,
    });

    for (let attack = 0; attack < 17; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:laser rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 64,
      enemyStatus: "enraged",
      playerHp: 50,
    });

    for (let attack = 0; attack < 8; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:laser rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 5,
      loot: {
        "stim blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "cleared",
      text: ["the creature's tortured breathing ceases.", "nothing more here."],
    });
    expect(engine.state.get("game.world.medical")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["laser rifle"]')).toBe(0);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused command executioner slice through rotating wanderer specials", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(260).fill(0.9)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('character.perks["precise"]', true);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 120);

    expect(events.triggerByKeyForTest("executioner.command-wanderer")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-wanderer",
      title: "Command Deck",
      sceneKey: "start",
      text: [
        "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
        "in a flash, the figure is standing.",
      ],
    });

    expect(events.choose("approach")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "observe",
      text: [
        "wanderer form, but not quite flesh. not quite metal either. a crystal set into its chest pulses with light.",
        "it says it saw the rebellion coming. said it made arrangements.",
        "says it can't die.",
      ],
    });

    expect(events.choose("observe")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "immortal wanderer",
      phase: "fighting",
      enemyHp: 500,
    });

    for (let attack = 0; attack < 7; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    engine.clock.advanceBy(1000);
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 416,
      enemyStatus: "meditation",
      playerHp: 85,
    });
    expect(events.chooseCombatAction("shield")).toBe(true);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 416,
      enemyStatus: "meditation",
      playerHp: 85,
    });

    for (let attack = 0; attack < 6; attack += 1) {
      engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    engine.clock.advanceBy(1000);
    expect(events.snapshot()?.combat).toMatchObject({
      enemyHp: 392,
      enemyStatus: "enraged",
      playerHp: 85,
    });

    let guard = 0;
    while (events.snapshot()?.combat?.phase === "fighting" && guard < 80) {
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
    expect(guard).toBeLessThan(80);

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 85,
      loot: {
        "fleet beacon": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-wanderer",
      sceneKey: "cleared",
      text: [
        "the crystal pulses brightly, then goes dark. the assailant shimmers as its shape becomes less defined.",
        "then it is gone.",
        "time to get out of here.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("routes a focused command deck lounge branch through cache loot into the wanderer", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(events.triggerByKeyForTest("executioner.command-lounge-cache")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-lounge-cache",
      title: "Command Deck",
      sceneKey: "start",
      text: [
        "the path to the command bridge is wide, walls adorned with decorative shields.",
        "fighting hadn't reached here, it seems.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
      enemyHp: 60,
    });

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "energy cell": 1,
        "laser rifle": 1,
        "alien alloy": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-lounge-cache",
      sceneKey: "lounge",
      text: [
        "detour through the officer's lounge.",
        "might be something useful here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "weapons-cache",
      text: ["small weapons cache in a cabinet.", "lucky."],
      loot: {
        loot: {
          "energy cell": 3,
          grenade: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(78);
    expect(engine.state.get("outfit.grenade")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "command-deck",
      text: [
        "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
        "in a flash, the figure is standing.",
      ],
    });

    expect(events.choose("approach")).toBe(true);
    expect(events.choose("observe")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "immortal wanderer",
      phase: "fighting",
      enemyHp: 500,
    });
  });

  it("routes a focused command deck lounge branch through defeated wanderer cleanup", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(260).fill(0.9)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('character.perks["precise"]', true);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 90);

    expect(events.triggerByKeyForTest("executioner.command-lounge-cache")).toBe(
      true,
    );
    expect(events.choose("continue")).toBe(true);

    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "won",
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "lounge",
      text: [
        "detour through the officer's lounge.",
        "might be something useful here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "weapons-cache",
      text: ["small weapons cache in a cabinet.", "lucky."],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "command-deck",
      text: [
        "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
        "in a flash, the figure is standing.",
      ],
    });

    expect(events.choose("approach")).toBe(true);
    expect(events.choose("observe")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "immortal wanderer",
      phase: "fighting",
      enemyHp: 500,
    });

    defeatImmortalWanderer(events, engine);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["fleet beacon"]')).toBe(1);

    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-lounge-cache",
      sceneKey: "cleared",
      text: [
        "the crystal pulses brightly, then goes dark. the assailant shimmers as its shape becomes less defined.",
        "then it is gone.",
        "time to get out of here.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("routes a focused command deck lounge branch through medical supplies", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(260).fill(0.9)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('character.perks["precise"]', true);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 80);

    expect(
      events.triggerByKeyForTest("executioner.command-lounge-medicine"),
    ).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-lounge-medicine",
      title: "Command Deck",
      sceneKey: "start",
    });

    expect(events.choose("continue")).toBe(true);
    for (let attack = 0; attack < 5; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "won",
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-lounge-medicine",
      sceneKey: "lounge",
      text: [
        "detour through the officer's lounge.",
        "might be something useful here.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "medical-supplies",
      text: ["found some medical supplies in a discarded bag."],
      loot: {
        loot: {
          hypo: 2,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get("outfit.hypo")).toBe(2);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "command-deck",
      text: [
        "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
        "in a flash, the figure is standing.",
      ],
    });

    expect(events.choose("approach")).toBe(true);
    expect(events.choose("observe")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "immortal wanderer",
      phase: "fighting",
      enemyHp: 500,
    });

    defeatImmortalWanderer(events, engine);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["fleet beacon"]')).toBe(1);

    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.command-lounge-medicine",
      sceneKey: "cleared",
      text: [
        "the crystal pulses brightly, then goes dark. the assailant shimmers as its shape becomes less defined.",
        "then it is gone.",
        "time to get out of here.",
      ],
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused executioner combat slice through blueprint redemption", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 80);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("executioner.unstable-automaton")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "executioner.unstable-automaton",
      title: "Medical Wing",
      combat: {
        enemy: "unstable automaton",
        phase: "fighting",
      },
    });

    for (let i = 0; i < 9; i += 1) {
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
      if (i < 8) engine.clock.advanceBy(1000);
    }

    expect(events.snapshot()?.combat).toMatchObject({
      phase: "exploding",
      enemyHp: 0,
    });

    engine.clock.advanceBy(3000);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      playerHp: 10,
      loot: {
        "glowstone blueprint": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);

    expect(events.snapshot()).toBeNull();
    expect(engine.state.get('character.blueprints["glowstone"]')).toBe(true);
    expect(engine.state.get('stores["glowstone blueprint"]', true)).toBe(0);
    expect(engine.state.get('outfit["glowstone blueprint"]', true)).toBe(0);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "blueprints feed into the fabricator data port. possibilities grow.",
    );
  });

  it("restores active combat and enemy attack timing from lifecycle state", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("encounter.snarling-beast")).toBe(true);
    engine.clock.advanceBy(500);
    const lifecycle = events.lifecycleSnapshot();
    const restored = new EventRuntime(engine, () => "room");

    engine.clock.clearAll();
    restored.restoreLifecycle(lifecycle);
    engine.clock.advanceBy(499);
    expect(restored.snapshot()?.combat?.playerHp).toBe(10);

    engine.clock.advanceBy(1);
    expect(restored.snapshot()?.combat?.playerHp).toBe(9);
  });
});
