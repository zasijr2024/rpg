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

describe("EventRuntime world contracts", () => {
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

  it("routes the Battlefield landmark into the canonical salvage scene", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(12).fill(0)) });
    const events = worldBackedEvents(engine);

    expect(events.triggerWorldSetpiece("battlefield")).toBe(true);
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
  });

  it("routes every city world landmark roll into the canonical setpiece", () => {
    const lowRollEngine = createGameEngine({ rng: sequenceRng([0]) });
    const lowRollEvents = worldBackedEvents(lowRollEngine);

    expect(lowRollEvents.triggerWorldSetpiece("city")).toBe(true);
    expect(lowRollEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.city",
      title: "A Ruined City",
      sceneKey: "start",
    });

    const highRollEngine = createGameEngine({ rng: sequenceRng([0.99]) });
    const highRollEvents = worldBackedEvents(highRollEngine);

    expect(highRollEvents.triggerWorldSetpiece("city")).toBe(true);
    expect(highRollEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.city",
      title: "A Ruined City",
      sceneKey: "start",
    });
  });

  it("routes the Old House world landmark into the canonical setpiece", () => {
    const engine = createGameEngine({ rng: sequenceRng([0.99]) });
    const events = worldBackedEvents(engine);

    expect(events.triggerWorldSetpiece("house")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.house",
      title: "An Old House",
      sceneKey: "start",
      text: [
        "an old house remains here, once white siding yellowed and peeling.",
        "the door hangs open.",
      ],
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

  it("keeps original encounter loot carried when active World combat ends", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0, 0.5, 0, 0, 0.9]),
    });
    const expedition = new ExpeditionTransaction(engine);
    const events = new EventRuntime(
      engine,
      () => "world",
      {},
      undefined,
      expedition,
    );

    engine.state.set('outfit["grenade"]', 1);
    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 });
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
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["fur"]', true)).toBe(0);
    expect(engine.state.get('stores["meat"]', true)).toBe(0);
    expect(engine.state.get('outfit["fur"]')).toBe(2);
    expect(engine.state.get('outfit["meat"]')).toBe(1);
    expect(expedition.active()).toBe(true);
  });
});
