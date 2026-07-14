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

describe("EventRuntime city district contracts", () => {
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
});
