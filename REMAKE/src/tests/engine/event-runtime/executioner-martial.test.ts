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

describe("EventRuntime executioner martial contracts", () => {
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
});
