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

describe("EventRuntime executioner engineering contracts", () => {
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
    const expedition = new ExpeditionTransaction(engine);
    const events = new EventRuntime(
      engine,
      () => "world",
      {},
      undefined,
      expedition,
    );

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 50);
    expedition.begin({ position: { x: 30, y: 30 }, health: 85, water: 5 });

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
    expect(expedition.water()).toBe(0);
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
});
