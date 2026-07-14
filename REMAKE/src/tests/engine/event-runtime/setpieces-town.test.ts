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

describe("EventRuntime town contracts", () => {
  it("drives the canonical Town schoolhouse route into an original ending", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(100).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.torch", 1);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 10);

    expect(events.triggerByKeyForTest("setpiece.town")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town",
      title: "A Deserted Town",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({ sceneKey: "a1" });
    expect(events.choose("enter")).toBe(true);
    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "b1",
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          bullets: 1,
          medicine: 1,
        },
      },
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "c1",
      combat: { enemy: "thug", phase: "fighting", enemyHp: 30 },
    });
    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat?.phase).toBe("won");

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "d1",
      combat: { enemy: "scavenger", phase: "fighting", enemyHp: 30 },
    });
    engine.clock.advanceBy(1000);
    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat?.phase).toBe("won");

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      sceneKey: "end1",
      text: [
        "scavenger had a small camp in the school.",
        "collected scraps spread across the floor like they fell from heaven.",
      ],
    });
    expect(engine.state.get("game.world.townCleared")).toBe(true);
  });

  it("drives the canonical swamp through the charm-gated wanderer scene", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.swamp")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.swamp",
      title: "A Murky Swamp",
      sceneKey: "start",
      text: [
        "rotting reeds rise out of the swampy earth.",
        "a lone frog sits in the muck, silently.",
      ],
      buttons: [
        {
          key: "enter",
          text: "enter",
        },
        {
          key: "leave",
          text: "leave",
        },
      ],
    });
    expect(
      engine.notifications.list("event").map((entry) => entry.message),
    ).toEqual(["a swamp festers in the stagnant air."]);

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.swamp",
      sceneKey: "cabin",
      text: [
        "deep in the swamp is a moss-covered cabin.",
        "an old wanderer sits inside, in a seeming trance.",
      ],
      buttons: [
        {
          key: "talk",
          text: "talk",
          cost: { charm: 1 },
          disabled: true,
        },
        {
          key: "leave",
          text: "leave",
        },
      ],
    });
    expect(events.choose("talk")).toBe(false);

    engine.state.set("stores.charm", 1);
    expect(events.choose("talk")).toBe(true);
    expect(engine.state.get("stores.charm", true)).toBe(0);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.swamp",
      sceneKey: "talk",
      text: [
        "the wanderer takes the charm and nods slowly.",
        "he speaks of once leading the great fleets to fresh worlds.",
        "unfathomable destruction to fuel wanderer hungers.",
        "his time here, now, is his penance.",
      ],
      buttons: [{ key: "leave", text: "leave" }],
    });
    expect(engine.state.get('character.perks["gastronome"]')).toBe(true);
    expect(engine.state.get("game.world.swampVisited")).toBe(true);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives canonical Old House non-combat loot branches through scene loot", () => {
    const medicineEngine = createGameEngine({
      rng: sequenceRng([0, 0.1, 0, 0.99]),
    });
    const medicineEvents = new EventRuntime(medicineEngine, () => "room");

    expect(medicineEvents.triggerByKeyForTest("setpiece.house")).toBe(true);
    expect(medicineEvents.choose("enter")).toBe(true);
    expect(medicineEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.house",
      sceneKey: "medicine",
      text: [
        "the house has been ransacked.",
        "but there is a cache of medicine under the floorboards.",
      ],
      loot: {
        loot: {
          medicine: 4,
        },
      },
    });
    expect(medicineEngine.state.get("game.world.oldHouseVisited")).toBe(true);

    const restoredMedicine = new EventRuntime(medicineEngine, () => "room");
    restoredMedicine.restoreLifecycle(medicineEvents.lifecycleSnapshot());
    expect(restoredMedicine.snapshot()).toMatchObject({
      eventKey: "setpiece.house",
      sceneKey: "medicine",
      loot: {
        loot: {
          medicine: 4,
        },
      },
    });

    expect(restoredMedicine.chooseLootAction("takeEverything")).toBe(true);
    expect(medicineEngine.state.get('outfit["medicine"]')).toBe(4);
    expect(restoredMedicine.snapshot()?.loot?.loot).toEqual({});
    expect(restoredMedicine.choose("leave")).toBe(true);
    expect(restoredMedicine.snapshot()).toBeNull();

    const suppliesEngine = createGameEngine({
      rng: sequenceRng([0, 0.3, 0, 0, 0, 0, 0, 0]),
    });
    const suppliesEvents = new EventRuntime(suppliesEngine, () => "room");

    expect(suppliesEvents.triggerByKeyForTest("setpiece.house")).toBe(true);
    expect(suppliesEvents.choose("enter")).toBe(true);
    expect(suppliesEvents.snapshot()).toMatchObject({
      eventKey: "setpiece.house",
      sceneKey: "supplies",
      text: [
        "the house is abandoned, but not yet picked over.",
        "still a few drops of water in the old well.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          leather: 1,
          cloth: 1,
        },
      },
    });
    expect(suppliesEngine.state.get("game.world.oldHouseVisited")).toBe(true);
    expect(suppliesEngine.state.get("game.world.waterReplenished")).toBe(true);
    expect(suppliesEngine.notifications.list("event").at(-1)?.message).toBe(
      "water replenished",
    );

    expect(suppliesEvents.chooseLootAction("take:cured meat")).toBe(true);
    expect(suppliesEvents.chooseLootAction("takeEverything")).toBe(true);
    expect(suppliesEngine.state.get('outfit["cured meat"]')).toBe(1);
    expect(suppliesEngine.state.get('outfit["leather"]')).toBe(1);
    expect(suppliesEngine.state.get('outfit["cloth"]')).toBe(1);
    expect(suppliesEvents.snapshot()?.loot?.loot).toEqual({});
    expect(suppliesEvents.choose("leave")).toBe(true);
    expect(suppliesEvents.snapshot()).toBeNull();
  });

  it("drives the canonical Old House through the occupied combat branch", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.9, 0, 0, 0, 0, 0, 0]),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 2);

    expect(events.triggerByKeyForTest("setpiece.house")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.house",
      title: "An Old House",
      sceneKey: "start",
      text: [
        "an old house remains here, once white siding yellowed and peeling.",
        "the door hangs open.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.house",
      sceneKey: "occupied",
      combat: {
        enemy: "squatter",
        phase: "fighting",
        enemyHp: 10,
      },
    });
    expect(engine.state.get("game.world.oldHouseVisited")).toBe(true);

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        leather: 1,
        cloth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get('outfit["leather"]')).toBe(1);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);

    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
    expect(engine.state.get("game.world.returnLocation")).toBe("path");
  });

  it("drives a focused town clinic branch through torch-gated medicine loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.99]),
    });
    const events = new EventRuntime(engine, () => "room");

    expect(events.triggerByKeyForTest("setpiece.town-clinic")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic",
      sceneKey: "clinic",
      text: [
        "a squat building up ahead.",
        "a green cross barely visible behind grimy windows.",
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
      eventKey: "setpiece.town-clinic",
      sceneKey: "medicine",
      text: ["some medicine abandoned in the drawers."],
      loot: {
        loot: {
          medicine: 4,
        },
      },
    });
    expect(engine.state.get("game.world.townClinicCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["medicine"]')).toBe(4);
    expect(events.snapshot()?.loot?.loot).toEqual({});
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town clinic madman branch through combat and ransacked ending", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(40).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 4);

    expect(events.triggerByKeyForTest("setpiece.town-clinic-madman")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic-madman",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic-madman",
      sceneKey: "clinic",
      text: [
        "a squat building up ahead.",
        "a green cross barely visible behind grimy windows.",
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
      eventKey: "setpiece.town-clinic-madman",
      sceneKey: "madman",
      combat: {
        enemy: "madman",
        phase: "fighting",
        enemyHp: 10,
      },
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        cloth: 2,
        "cured meat": 1,
        medicine: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-clinic-madman",
      sceneKey: "ransacked",
      text: ["the clinic has been ransacked.", "only dust and stains remain."],
    });
    expect(engine.state.get("game.world.townClinicMadmanCleared")).toBe(true);

    expect(engine.state.get('outfit["energy cell"]')).toBe(3);
    expect(engine.state.get("outfit.cloth")).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town schoolhouse branch through chained combat and camp loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.town-schoolhouse")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "schoolhouse",
      text: [
        "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
        "the double doors creak endlessly in the wind.",
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
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "locker",
      text: ["a small cache of supplies is tucked inside a rusting locker."],
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          bullets: 1,
          medicine: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("outfit.torch")).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(1);

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
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
        cloth: 5,
        leather: 5,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "scavenger",
      combat: {
        enemy: "scavenger",
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
        leather: 5,
        "steel sword": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-schoolhouse",
      sceneKey: "camp",
      text: [
        "scavenger had a small camp in the school.",
        "collected scraps spread across the floor like they fell from heaven.",
      ],
      loot: {
        loot: {
          "steel sword": 1,
          steel: 5,
          "cured meat": 5,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.townSchoolhouseCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cured meat"]')).toBe(8);
    expect(engine.state.get("outfit.leather")).toBe(10);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get('outfit["steel sword"]')).toBe(2);
    expect(engine.state.get("outfit.steel")).toBe(5);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(2);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town park branch through vigilante combat and rifle loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 300);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.town-park-vigilante")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "ambush",
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
        cloth: 5,
        leather: 5,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "park",
      combat: {
        enemy: "beast",
        phase: "fighting",
        enemyHp: 25,
      },
    });

    for (let attack = 0; attack < 3; attack += 1) {
      if (attack > 0) engine.clock.advanceBy(1000);
      expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    }
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        teeth: 1,
        fur: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "commotion",
      text: [
        "something's causing a commotion a ways down the road.",
        "a fight, maybe.",
      ],
    });

    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "vigilante",
      combat: {
        enemy: "vigilante",
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
        leather: 5,
        "steel sword": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-park-vigilante",
      sceneKey: "wanderer-rifle",
      text: [
        "beneath the wanderer's rags, clutched in one of its many hands, a glint of steel.",
        "worth killing for, it seems.",
      ],
      loot: {
        loot: {
          rifle: 1,
          bullets: 1,
        },
      },
    });
    expect(engine.state.get("game.world.townParkVigilanteCleared")).toBe(true);

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(15);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get("outfit.leather")).toBe(10);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get("outfit.teeth")).toBe(1);
    expect(engine.state.get("outfit.fur")).toBe(5);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get("outfit.rifle")).toBe(1);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused town caravan branch through vigilante combat and trinket loot", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(140).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set("stores.convoy", 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 24);

    expect(events.triggerByKeyForTest("setpiece.town-caravan-vigilante")).toBe(
      true,
    );
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      title: "A Deserted Town",
      sceneKey: "start",
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "ambush",
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
        cloth: 5,
        leather: 5,
        "cured meat": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "caravan",
      text: [
        "an overturned caravan is spread across the pockmarked street.",
        "it's been picked over by scavengers, but there's still some things worth taking.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
          torch: 1,
          bullets: 1,
          medicine: 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "food-basket",
      text: [
        "a small basket of food is hidden under a park bench, with a note attached.",
        "can't read the words.",
      ],
      loot: {
        loot: {
          "cured meat": 1,
        },
      },
    });

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "vigilante",
      combat: {
        enemy: "vigilante",
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
        leather: 5,
        "steel sword": 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("takeEverything")).toBe(true);
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-caravan-vigilante",
      sceneKey: "trinkets",
      text: [
        "eye for an eye seems fair.",
        "always worked before, at least.",
        "picking the bones finds some useful trinkets.",
      ],
      loot: {
        loot: {
          "cured meat": 5,
          iron: 5,
          torch: 1,
          bolas: 1,
          medicine: 1,
        },
      },
    });
    expect(engine.state.get("game.world.townCaravanVigilanteCleared")).toBe(
      true,
    );

    expect(events.chooseLootAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["energy cell"]')).toBe(18);
    expect(engine.state.get('outfit["cured meat"]')).toBe(9);
    expect(engine.state.get("outfit.leather")).toBe(10);
    expect(engine.state.get("outfit.cloth")).toBe(5);
    expect(engine.state.get("outfit.torch")).toBe(2);
    expect(engine.state.get("outfit.bullets")).toBe(1);
    expect(engine.state.get("outfit.medicine")).toBe(2);
    expect(engine.state.get('outfit["steel sword"]')).toBe(1);
    expect(engine.state.get("outfit.iron")).toBe(5);
    expect(engine.state.get("outfit.bolas")).toBe(1);
    expect(events.snapshot()?.loot?.loot).toEqual({});

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });
});
