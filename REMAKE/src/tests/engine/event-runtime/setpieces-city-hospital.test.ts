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

describe("EventRuntime city hospital contracts", () => {
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
});
