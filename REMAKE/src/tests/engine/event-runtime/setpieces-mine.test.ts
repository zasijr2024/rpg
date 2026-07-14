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

describe("EventRuntime mine contracts", () => {
  it("drives a focused sulphur mine setpiece traversal through military combat scenes", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 300);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    const firePlasmaUntilWon = (
      expectedEnemy: string,
      attacksRequired: number,
    ) => {
      expect(events.snapshot()?.combat).toMatchObject({
        enemy: expectedEnemy,
        phase: "fighting",
      });
      for (let attack = 0; attack < attacksRequired; attack += 1) {
        if (attack > 0) {
          engine.clock.advanceBy(1000);
        }
        expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
      }
      expect(events.snapshot()?.combat).toMatchObject({
        enemy: expectedEnemy,
        phase: "won",
      });
    };

    expect(events.triggerByKeyForTest("setpiece.sulphurmine")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      title: "The Sulphur Mine",
      sceneKey: "start",
      text: [
        "the military is already set up at the mine's entrance.",
        "soldiers patrol the perimeter, rifles slung over their shoulders.",
      ],
    });

    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "attack", text: "attack" },
      { key: "leave", text: "leave" },
    ]);
    expect(events.choose("attack")).toBe(true);
    firePlasmaUntilWon("soldier", 5);
    expect(events.snapshot()?.combat).toMatchObject({
      loot: {
        "cured meat": 1,
        bullets: 1,
        rifle: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "continue", text: "continue" },
      { key: "run", text: "run" },
    ]);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      sceneKey: "a2",
      combat: {
        enemy: "soldier",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    firePlasmaUntilWon("soldier", 5);
    engine.clock.advanceBy(1000);
    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "continue", text: "continue" },
      { key: "run", text: "run" },
    ]);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      sceneKey: "a3",
      combat: {
        enemy: "veteran",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);

    firePlasmaUntilWon("veteran", 6);
    expect(events.snapshot()?.combat).toMatchObject({
      loot: {
        bayonet: 1,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "continue", text: "continue" },
    ]);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.sulphurmine",
      sceneKey: "cleared",
      text: [
        "the military presence has been cleared.",
        "the mine is now safe for workers.",
      ],
    });
    expect(engine.state.get("game.world.sulphurmine")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the sulphur mine is clear of dangers",
    );

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives the canonical outpost through replenishment and scene loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.4]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.outpost")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.outpost",
      title: "An Outpost",
      sceneKey: "start",
      text: ["a safe place in the wilds."],
      loot: {
        loot: {
          "cured meat": 7,
        },
      },
    });
    expect(engine.state.get("game.world.outpostUsed")).toBe(true);
    expect(engine.state.get("game.world.waterReplenished", true)).toBe(0);
    expect(
      engine.notifications.list("event").map((entry) => entry.message),
    ).toEqual(["a safe place in the wilds.", "water replenished"]);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(7);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused borehole setpiece through alien-alloy scene loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.5]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.borehole")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.borehole",
      title: "A Huge Borehole",
      sceneKey: "start",
      text: [
        "a huge hole is cut deep into the earth, evidence of the past harvest.",
        "they took what they came for, and left.",
        "castoff from the mammoth drills can still be found by the edges of the precipice.",
      ],
      loot: {
        loot: {
          "alien alloy": 2,
        },
      },
    });
    expect(engine.state.get("game.world.boreholeVisited")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(2);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused battlefield setpiece through original scene loot rolls", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(20).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.battlefield")).toBe(true);
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

    expect(events.chooseLootAction("take:rifle")).toBe(true);
    expect(events.chooseLootAction("take:bullets")).toBe(true);
    expect(events.chooseLootAction("take:energy cell")).toBe(true);
    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(1);
    expect(engine.state.get('outfit["energy cell"]')).toBe(1);
    expect(events.snapshot()?.loot?.loot).toMatchObject({
      bullets: 4,
      "energy cell": 4,
      "laser rifle": 1,
      grenade: 1,
      "alien alloy": 1,
    });

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives the canonical Ship setpiece through salvage discovery", () => {
    const engine = createGameEngine();
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.ship")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.ship",
      title: "A Crashed Ship",
      sceneKey: "start",
      text: [
        "the familiar curves of a wanderer vessel rise up out of the dust and ash. ",
        "lucky that the natives can't work the mechanisms.",
        "with a little effort, it might fly again.",
      ],
      buttons: [
        {
          key: "leavel",
          text: "salvage",
        },
      ],
    });
    expect(engine.state.get("game.world.ship")).toBe(true);
    expect(engine.state.get("game.world.crashedShipVisited")).toBe(true);

    expect(events.choose("leavel")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused destroyed-village cache setpiece through collection", () => {
    const engine = createGameEngine();
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.wood", 3);
    engine.state.set(
      "previous.stores",
      [5, 2, 0, 4, 0, 0, 1, 3, 0, 6, 2, 1, 1, 8, 1, 0, 0, 0, 1, 0, 7, 0, 2, 1],
    );

    expect(events.triggerByKeyForTest("setpiece.cache")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cache",
      title: "A Destroyed Village",
      sceneKey: "start",
      text: [
        "a destroyed village lies in the dust.",
        "charred bodies litter the ground.",
      ],
    });
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the metallic tang of wanderer afterburner hangs in the air.",
    );

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cache",
      sceneKey: "underground",
      text: [
        "a shack stands at the center of the village.",
        "there are still supplies inside.",
      ],
    });

    expect(events.choose("take")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cache",
      sceneKey: "exit",
      text: [
        "all the work of a previous generation is here.",
        "ripe for the picking.",
      ],
    });
    expect(engine.state.get("game.world.destroyedVillageVisited")).toBe(true);
    expect(engine.state.get("game.world.cacheCollected")).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(8);
    expect(engine.state.get("stores.fur")).toBe(2);
    expect(engine.state.get("stores.iron")).toBe(4);
    expect(engine.state.get('stores["cured meat"]')).toBe(3);
    expect(engine.state.get("stores.teeth")).toBe(6);
    expect(engine.state.get("stores.cloth")).toBe(8);
    expect(engine.state.get('stores["bone spear"]')).toBe(1);
    expect(engine.state.get("stores.rifle")).toBe(1);
    expect(engine.state.get("stores.bullets")).toBe(7);
    expect(engine.state.get("stores.grenade")).toBe(2);
    expect(engine.state.get("stores.bolas")).toBe(1);
    expect(engine.state.get("previous.stores")).toEqual([]);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives focused cave setpiece combat through beast and lizard scenes", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(20).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 10);

    expect(events.triggerByKeyForTest("setpiece.cave-depths")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-depths",
      title: "A Damp Cave",
      sceneKey: "start",
      text: [
        "the mouth of the cave is wide and dark.",
        "can't see what's inside.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "beast",
      phase: "fighting",
      enemyHp: 5,
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-depths",
      sceneKey: "narrow",
      text: [
        "the cave narrows a few feet in.",
        "the walls are moist and moss-covered",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "cave lizard",
      phase: "fighting",
      enemyHp: 6,
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-depths",
      sceneKey: "cleared",
      text: [
        "the torch sputters and dies in the damp air",
        "the darkness is absolute",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get("game.world.caveDepthsCleared")).toBe(true);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused cave camp branch through supply-cache loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.cave-camp-cache")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      title: "A Damp Cave",
      sceneKey: "start",
      text: [
        "the mouth of the cave is wide and dark.",
        "can't see what's inside.",
      ],
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      sceneKey: "camp",
      text: [
        "the remains of an old camp sits just inside the cave.",
        "bedrolls, torn and blackened, lay beneath a thin layer of dust.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          leather: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.leather")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      sceneKey: "lizard",
      combat: {
        enemy: "lizard",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-camp-cache",
      sceneKey: "supply-cache",
      text: ["a small supply cache is hidden at the back of the cave."],
      loot: {
        loot: {
          cloth: 5,
          leather: 5,
          iron: 5,
          "cured meat": 5,
          steel: 5,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.caveCampCacheCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(19);
    expect(engine.state.get('outfit["cured meat"]')).toBe(6);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.leather")).toBe(6);
    expect(engine.state.get("outfit.scales")).toBe(1);
    expect(engine.state.get("outfit.teeth")).toBe(1);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get("outfit.iron")).toBe(5);
    expect(engine.state.get("outfit.steel")).toBe(5);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused cave wanderer-body branch through nest loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.cave-wanderer-nest")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      title: "A Damp Cave",
      sceneKey: "start",
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 5,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "wanderer-body",
      text: [
        "the body of a wanderer lies in a small cavern.",
        "rot's been to work on it, and some of the pieces are missing.",
        "can't tell what left it here.",
      ],
      loot: {
        loot: {
          "iron sword": 1,
          "cured meat": 1,
          torch: 1,
          medicine: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["iron sword"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "large-beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-wanderer-nest",
      sceneKey: "nest",
      text: ["the nest of a large animal lies at the back of the cave."],
      loot: {
        loot: {
          meat: 5,
          fur: 5,
          scales: 5,
          teeth: 5,
          cloth: 5,
        },
      },
    });
    expect(engine.state.get("game.world.caveWandererNestCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get("outfit.fur")).toBe(7);
    expect(engine.state.get("outfit.teeth")).toBe(7);
    expect(engine.state.get("outfit.meat")).toBe(5);
    expect(engine.state.get("outfit.scales")).toBe(5);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused cave old-case branch through small-beast and lizard combat", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.cave-old-case")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      title: "A Damp Cave",
      sceneKey: "start",
      buttons: [
        {
          key: "enter",
          cost: { torch: 1 },
          disabled: false,
        },
        {
          key: "leave",
        },
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "narrow",
      text: [
        "the cave narrows a few feet in.",
        "the walls are moist and moss-covered",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "beast",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 5,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        fur: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "lizard",
      combat: {
        enemy: "lizard",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        scales: 1,
        teeth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.cave-old-case",
      sceneKey: "old-case",
      text: [
        "an old case is wedged behind a rock, covered in a thick layer of dust.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.caveOldCaseCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get("outfit.fur")).toBe(1);
    expect(engine.state.get("outfit.teeth")).toBe(2);
    expect(engine.state.get("outfit.scales")).toBe(1);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });
});
