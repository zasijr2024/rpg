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

describe("EventRuntime executioner command contracts", () => {
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
    expect(engine.state.get("game.world.executionerCleared")).toBe(true);
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
    expect(engine.state.get("game.world.executionerCleared")).toBe(true);

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
    expect(engine.state.get("game.world.executionerCleared")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("returns an executioner blueprint without redeeming it before village return", () => {
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
    expect(engine.state.get('character.blueprints["glowstone"]', true)).toBe(0);
    expect(engine.state.get('stores["glowstone blueprint"]')).toBe(1);
    expect(engine.state.get('outfit["glowstone blueprint"]', true)).toBe(0);
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
