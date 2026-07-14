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

describe("EventRuntime city tower contracts", () => {
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
});
