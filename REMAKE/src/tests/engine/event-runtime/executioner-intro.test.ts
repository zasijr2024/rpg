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

describe("EventRuntime executioner entrance contracts", () => {
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
        "perhaps the ship’s systems are still operational.",
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
        "perhaps the ship’s systems are still operational.",
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
        "perhaps the ship’s systems are still operational.",
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
        "perhaps the ship’s systems are still operational.",
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
});
