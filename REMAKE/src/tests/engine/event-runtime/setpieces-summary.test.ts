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

describe("EventRuntime setpiece summary contracts", () => {
  it("drives focused town and city setpiece combat slices through the event runtime", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(80).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("character.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.town-thug")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-thug",
      title: "A Deserted Town",
      sceneKey: "start",
      text: [
        "a small suburb lays ahead, empty houses scorched and peeling.",
        "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "thug",
      phase: "fighting",
      enemyHp: 30,
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
    expect(events.chooseCombatAction("leave")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.town-thug",
      sceneKey: "cleared",
      text: [
        "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
        "the double doors creak endlessly in the wind.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get("game.world.townThugCleared")).toBe(true);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();

    expect(events.triggerByKeyForTest("setpiece.city-sniper")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.city-sniper",
      title: "A Ruined City",
      sceneKey: "start",
      text: [
        "a battered highway sign stands guard at the entrance to this once-great city.",
        "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
        "might be things worth having still inside.",
      ],
    });

    expect(events.choose("enter")).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "sniper",
      phase: "fighting",
      enemyHp: 30,
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
      eventKey: "setpiece.city-sniper",
      sceneKey: "cleared",
      text: [
        "street above the subway platform is blown away.",
        "lets some light down into the dusty haze.",
        "a sound comes from the tunnel, just ahead.",
      ],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.citySniperCleared")).toBe(true);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused coal mine setpiece traversal through chained combat scenes", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(30).fill(0)),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    expect(events.triggerByKeyForTest("setpiece.coalmine")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      title: "The Coal Mine",
      sceneKey: "start",
    });

    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "attack", text: "attack" },
      { key: "leave", text: "leave" },
    ]);
    expect(events.choose("attack")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "man",
      phase: "fighting",
      enemyHp: 10,
    });

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 1,
        cloth: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "continue", text: "continue" },
      { key: "run", text: "run" },
    ]);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      sceneKey: "a2",
      combat: {
        enemy: "man",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "continue", text: "continue" },
      { key: "run", text: "run" },
    ]);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      sceneKey: "a3",
      combat: {
        enemy: "chief",
        phase: "fighting",
      },
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);

    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("attack:plasma rifle")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        "cured meat": 5,
        cloth: 5,
        iron: 1,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.snapshot()?.buttons).toMatchObject([
      { key: "continue", text: "continue" },
    ]);
    expect(events.choose("continue")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.coalmine",
      sceneKey: "cleared",
      text: [
        "the camp is still, save for the crackling of the fires.",
        "the mine is now safe for workers.",
      ],
    });
    expect(engine.state.get("game.world.coalmine")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["plasma rifle"]')).toBe(0);
    expect(engine.state.get('outfit["plasma rifle"]')).toBe(1);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the coal mine is clear of dangers",
    );

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });

  it("drives a focused iron mine setpiece combat traversal through the cleared mine scene", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0, 0, 0, 0, 0, 0]),
    });
    const events = new EventRuntime(engine, () => "room");

    engine.state.set('stores["bone spear"]', 0);
    engine.state.set("stores.torch", 1);
    engine.state.set('outfit["grenade"]', 1);
    engine.state.set('outfit["bone spear"]', 1);
    expect(events.triggerByKeyForTest("setpiece.ironmine")).toBe(true);
    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.ironmine",
      title: "The Iron Mine",
      sceneKey: "start",
      buttons: [
        {
          key: "enter",
          text: "go inside",
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
    expect(events.snapshot()?.combat).toMatchObject({
      enemy: "beastly matriarch",
      phase: "fighting",
      enemyHp: 10,
    });

    expect(events.chooseCombatAction("attack:grenade")).toBe(true);
    expect(events.snapshot()?.combat).toMatchObject({
      phase: "won",
      loot: {
        teeth: 5,
        scales: 5,
        cloth: 5,
      },
    });

    engine.clock.advanceBy(1000);
    expect(events.chooseCombatAction("leave")).toBe(true);

    expect(events.snapshot()).toMatchObject({
      eventKey: "setpiece.ironmine",
      sceneKey: "cleared",
      text: ["the beast is dead.", "the mine is now safe for workers."],
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["bone spear"]')).toBe(0);
    expect(engine.state.get('outfit["bone spear"]')).toBe(1);
    expect(engine.state.get("game.world.ironmine")).toBe(true);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the iron mine is clear of dangers",
    );

    expect(events.choose("leave")).toBe(true);
    expect(events.snapshot()).toBeNull();
  });
});
