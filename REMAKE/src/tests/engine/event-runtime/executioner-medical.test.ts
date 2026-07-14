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

describe("EventRuntime executioner medical contracts", () => {
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
});
