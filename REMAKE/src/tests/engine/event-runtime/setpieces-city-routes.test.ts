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

describe("EventRuntime city route contracts", () => {
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
});
