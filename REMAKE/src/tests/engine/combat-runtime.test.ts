import { describe, expect, it } from "vitest";
import {
  originalExecutionerCombatDefinitions,
  originalEventDefinitions,
  originalSetpieceCombatDefinitions,
  type OriginalCombatDefinition,
  type OriginalCombatStatus,
} from "../../content/original/events/eventData";
import { originalWorldWeapons } from "../../content/original/world/worldData";
import {
  CombatRuntime,
  createGameEngine,
  ExpeditionTransaction,
  type Rng,
} from "../../engine";

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

function snarlingBeastCombat() {
  const event = originalEventDefinitions.find(
    (entry) => entry.key === "encounter.snarling-beast",
  );
  const combat = event?.scenes.start.combat;
  if (!combat) throw new Error("Missing representative combat fixture");
  return combat;
}

function venomousMedicCombat(): OriginalCombatDefinition {
  return {
    enemy: "broken medic",
    enemyName: "broken medic",
    deathMessage: "the broken medic is dead",
    chara: "M",
    damage: 4,
    hit: 1,
    attackDelay: 10,
    health: 50,
    atHealth: {
      40: "venomous",
    },
    loot: {},
  };
}

function scheduledSpecialCombat(
  status: OriginalCombatStatus | OriginalCombatStatus[],
  options: Partial<OriginalCombatDefinition> & {
    delaySeconds?: number;
    avoidRepeat?: boolean;
  } = {},
): OriginalCombatDefinition {
  return {
    enemy: "unstable prototype",
    enemyName: "unstable prototype",
    deathMessage: "the unstable prototype is dead",
    chara: "P",
    damage: options.damage ?? 2,
    hit: options.hit ?? 1,
    attackDelay: options.attackDelay ?? 30,
    health: options.health ?? 20,
    specials: [
      {
        delaySeconds: options.delaySeconds ?? 5,
        status,
        avoidRepeat: options.avoidRepeat,
      },
    ],
    loot: {},
  };
}

function explodingAutomatonCombat(): OriginalCombatDefinition {
  return {
    enemy: "unstable automaton",
    enemyName: "unstable automaton",
    deathMessage: "the unstable automaton is destroyed",
    chara: "A",
    damage: 10,
    hit: 0.7,
    attackDelay: 2,
    health: 10,
    explosion: 30,
    loot: {
      "alien alloy": { min: 1, max: 1, chance: 1 },
    },
  };
}

function weaponTargetCombat(): OriginalCombatDefinition {
  return {
    enemy: "training target",
    enemyName: "training target",
    deathMessage: "the target is down",
    chara: "T",
    damage: 0,
    hit: 0,
    attackDelay: 100,
    health: 200,
    loot: {},
  };
}

describe("CombatRuntime", () => {
  it("starts the representative encounter without EventRuntime ownership", () => {
    const engine = createGameEngine();
    const combat = new CombatRuntime(engine);

    combat.start(snarlingBeastCombat());

    expect(combat.snapshot()).toMatchObject({
      active: true,
      enemy: "snarling beast",
      phase: "fighting",
      playerHp: 10,
      enemyHp: 5,
      actions: [
        {
          key: "attack:fists",
          kind: "attack",
        },
      ],
    });
  });

  it("owns attacks, cooldowns, victory loot, and one-time loot transfer", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0.5, 0, 0, 0.9]),
    });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["grenade"]', 1);
    combat.start(snarlingBeastCombat());

    expect(combat.chooseAction("attack:grenade")).toBe(true);
    expect(combat.snapshot()).toMatchObject({
      phase: "won",
      status: "the snarling beast is dead",
      loot: {
        fur: 2,
        meat: 1,
      },
    });
    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "takeEverything"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 1000,
    });
    expect(
      combat.snapshot()?.actions.find((action) => action.key === "leave"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 1000,
    });
    expect(combat.chooseAction("takeEverything")).toBe(false);

    engine.clock.advanceBy(1000);

    expect(combat.chooseAction("takeEverything")).toBe(true);
    expect(combat.chooseAction("takeEverything")).toBe(false);

    expect(engine.state.get('outfit["grenade"]')).toBe(0);
    expect(engine.state.get('outfit["fur"]')).toBe(2);
    expect(engine.state.get('outfit["meat"]')).toBe(1);
  });

  it("restores won combat loot and post-victory cooldowns without duplicating rewards", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0.5, 0, 0, 0.9]),
    });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["grenade"]', 1);
    combat.start(snarlingBeastCombat());

    expect(combat.chooseAction("attack:grenade")).toBe(true);
    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing won combat lifecycle");
    expect(lifecycle).toMatchObject({
      phase: "won",
      loot: {
        fur: 2,
        meat: 1,
      },
      lootTaken: false,
    });

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine);
    restored.restore(snarlingBeastCombat(), lifecycle);

    expect(restored.snapshot()).toMatchObject({
      phase: "won",
      loot: {
        fur: 2,
        meat: 1,
      },
    });
    expect(
      restored
        .snapshot()
        ?.actions.find((action) => action.key === "takeEverything"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 1000,
    });
    expect(
      restored.snapshot()?.actions.find((action) => action.key === "leave"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 1000,
    });
    expect(restored.chooseAction("takeEverything")).toBe(false);
    expect(restored.chooseAction("leave")).toBe(false);

    engine.clock.advanceBy(1000);
    expect(restored.chooseAction("takeEverything")).toBe(true);
    expect(restored.chooseAction("takeEverything")).toBe(false);
    expect(restored.snapshot()?.loot).toEqual({});
    expect(engine.state.get('outfit["fur"]')).toBe(2);
    expect(engine.state.get('outfit["meat"]')).toBe(1);
  });

  it("exposes every original weapon with its cost, cooldown, and damage or stun effect", () => {
    for (const weapon of originalWorldWeapons) {
      const engine = createGameEngine({ rng: sequenceRng([0]) });
      const combat = new CombatRuntime(engine);

      if (weapon.key !== "fists") {
        engine.state.set(`outfit["${weapon.key}"]`, 1);
      }
      for (const [key, amount] of Object.entries(weapon.cost ?? {})) {
        engine.state.set(`outfit["${key}"]`, amount + 1);
      }

      combat.start(weaponTargetCombat());

      expect(
        combat
          .snapshot()
          ?.actions.find((action) => action.key === `attack:${weapon.key}`),
      ).toMatchObject({
        text: weapon.verb,
        cost: weapon.cost ?? {},
        disabled: false,
        cooldownRemainingMs: 0,
        kind: "attack",
      });

      expect(combat.chooseAction(`attack:${weapon.key}`)).toBe(true);

      for (const [key, amount] of Object.entries(weapon.cost ?? {})) {
        expect(engine.state.get(`outfit["${key}"]`)).toBe(amount === 1 ? 1 : 1);
      }

      if (weapon.damage === "stun") {
        expect(combat.snapshot()?.enemyHp).toBe(200);
        expect(combat.lifecycleSnapshot()?.enemyStunnedUntil).toBe(4000);
      } else {
        expect(combat.snapshot()?.enemyHp).toBe(200 - weapon.damage);
      }

      const nextAction = combat
        .snapshot()
        ?.actions.find((action) => action.key === `attack:${weapon.key}`);
      if (nextAction) {
        expect(nextAction).toMatchObject({
          disabled: true,
          cooldownRemainingMs: weapon.cooldown * 1000,
        });
      }
    }
  });

  it("takes only loot that fits the original Path carrying capacity", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0.5, 0, 0, 0.9]),
    });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["cured meat"]', 9);
    engine.state.set('outfit["grenade"]', 1);
    combat.start(snarlingBeastCombat());

    expect(combat.chooseAction("attack:grenade")).toBe(true);
    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "takeEverything"),
    ).toMatchObject({
      text: "take all you can",
      disabled: true,
      cooldownRemainingMs: 1000,
    });

    engine.clock.advanceBy(1000);

    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "takeEverything"),
    ).toMatchObject({
      text: "take all you can",
      disabled: false,
    });

    expect(combat.chooseAction("takeEverything")).toBe(true);

    expect(engine.state.get('outfit["fur"]')).toBe(1);
    expect(engine.state.get('outfit["meat"]', true)).toBe(0);
    expect(combat.snapshot()).toMatchObject({
      loot: {
        fur: 1,
        meat: 1,
      },
    });
    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "takeEverything"),
    ).toMatchObject({
      text: "take all you can",
      disabled: true,
    });
    expect(combat.chooseAction("takeEverything")).toBe(false);

    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "dropFor:meat:cured meat"),
    ).toMatchObject({
      text: "drop cured meat x1 for meat",
      kind: "drop",
      disabled: false,
    });

    expect(combat.chooseAction("dropFor:meat:cured meat")).toBe(true);

    expect(engine.state.get('outfit["cured meat"]')).toBe(8);
    expect(engine.state.get('outfit["meat"]')).toBe(1);
    expect(combat.snapshot()).toMatchObject({
      loot: {
        fur: 1,
        "cured meat": 1,
      },
    });
  });

  it("returns outfit to stores on safe combat leave using original Path filtering", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0.5, 0, 0, 0.9]),
    });
    const leaves: Array<string | null> = [];
    const combat = new CombatRuntime(engine, {
      onLeave: (outcome) => leaves.push(outcome.returnLocation),
    });

    engine.state.set('stores["cured meat"]', 8);
    engine.state.set('stores["bone spear"]', 0);
    engine.state.set('stores["bullets"]', 6);
    engine.state.set('stores["fur"]', 0);
    engine.state.set('outfit["cured meat"]', 2);
    engine.state.set('outfit["bone spear"]', 1);
    engine.state.set('outfit["bullets"]', 4);
    engine.state.set('outfit["grenade"]', 1);
    combat.start(snarlingBeastCombat());

    expect(combat.chooseAction("attack:grenade")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(combat.chooseAction("takeEverything")).toBe(true);
    expect(engine.state.get('outfit["fur"]')).toBe(2);
    expect(combat.chooseAction("leave")).toBe(true);

    expect(leaves).toEqual(["path"]);
    expect(engine.state.get("game.world.returnLocation")).toBe("path");
    expect(engine.state.get('stores["cured meat"]')).toBe(10);
    expect(engine.state.get('stores["bone spear"]')).toBe(1);
    expect(engine.state.get('stores["bullets"]')).toBe(10);
    expect(engine.state.get('stores["fur"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["bone spear"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(4);
    expect(engine.state.get('outfit["fur"]')).toBe(0);
  });

  it("keeps loot carried when combat leave continues the active expedition", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0.5, 0, 0, 0.9]),
    });
    const expedition = new ExpeditionTransaction(engine);
    const leaves: Array<string | null> = [];
    const combat = new CombatRuntime(
      engine,
      {
        onLeave: (outcome) => leaves.push(outcome.returnLocation),
        shouldReturnOnLeave: () => false,
      },
      expedition,
    );

    engine.state.set('outfit["cured meat"]', 2);
    engine.state.set('outfit["grenade"]', 1);
    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 });
    combat.start(snarlingBeastCombat());

    expect(combat.chooseAction("attack:grenade")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(combat.chooseAction("takeEverything")).toBe(true);
    expect(combat.chooseAction("leave")).toBe(true);

    expect(leaves).toEqual([null]);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["fur"]', true)).toBe(0);
    expect(engine.state.get('outfit["fur"]')).toBe(2);
    expect(expedition.active()).toBe(true);
  });

  it("applies original world-death effects and reports lifecycle closure through callback", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const deaths: string[] = [];
    const combat = new CombatRuntime(engine, {
      onPlayerDeath: (outcome) => deaths.push(outcome.notification),
    });

    engine.state.set('outfit["cured meat"]', 3);
    engine.state.set('outfit["bone spear"]', 1);
    engine.state.set("character.health", 1);
    combat.start(snarlingBeastCombat());
    engine.clock.advanceBy(1000);

    expect(engine.state.get("character.health")).toBe(0);
    expect(engine.state.get("character.dead")).toBe(true);
    expect(engine.state.get("game.world.dead")).toBe(true);
    expect(engine.state.get("game.world.returnLocation")).toBe("room");
    expect(engine.state.get("outfit", true)).toBe(0);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the world fades",
    );
    expect(deaths).toEqual(["the world fades"]);
    expect(combat.snapshot()).toBeNull();
  });

  it("restores lethal enemy attack timing and applies death effects once", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const deaths: string[] = [];
    const combat = new CombatRuntime(engine, {
      onPlayerDeath: (outcome) => deaths.push(outcome.notification),
    });
    const lethalCombat: OriginalCombatDefinition = {
      enemy: "charging beast",
      enemyName: "charging beast",
      deathMessage: "the beast is dead",
      chara: "B",
      damage: 20,
      hit: 1,
      attackDelay: 1,
      health: 20,
      loot: {},
    };

    engine.state.set('outfit["cured meat"]', 3);
    engine.state.set("character.health", 10);
    combat.start(lethalCombat);
    engine.clock.advanceBy(500);
    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing lethal combat lifecycle");
    expect(lifecycle.enemyAttackDueAt).toBe(1000);

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine, {
      onPlayerDeath: (outcome) => deaths.push(outcome.notification),
    });
    restored.restore(lethalCombat, lifecycle);

    engine.clock.advanceBy(499);
    expect(restored.snapshot()?.playerHp).toBe(10);
    expect(deaths).toEqual([]);

    engine.clock.advanceBy(1);
    expect(restored.snapshot()).toBeNull();
    expect(engine.state.get("character.dead")).toBe(true);
    expect(engine.state.get("game.world.dead")).toBe(true);
    expect(engine.state.get("game.world.returnLocation")).toBe("room");
    expect(engine.state.get("outfit", true)).toBe(0);
    expect(deaths).toEqual(["the world fades"]);

    engine.clock.advanceBy(5000);
    expect(deaths).toEqual(["the world fades"]);
    expect(
      engine.notifications
        .list("event")
        .filter((entry) => entry.message === "the world fades"),
    ).toHaveLength(1);
  });

  it("uses the original armour health ladder and clamps existing health into max hp", () => {
    const armourCases = [
      { item: null, maxHp: 10 },
      { item: "l armour", maxHp: 15 },
      { item: "i armour", maxHp: 25 },
      { item: "s armour", maxHp: 45 },
      { item: "kinetic armour", maxHp: 85 },
    ];

    for (const { item, maxHp } of armourCases) {
      const engine = createGameEngine();
      const combat = new CombatRuntime(engine);

      if (item) engine.state.set(`stores["${item}"]`, 1);
      engine.state.set("character.health", 999);

      combat.start(snarlingBeastCombat());

      expect(combat.snapshot()).toMatchObject({
        playerHp: maxHp,
        playerMaxHp: maxHp,
      });
      expect(engine.state.get("character.health")).toBe(999);
    }
  });

  it("applies original precise and evasive hit chance formulas at the combat boundary", () => {
    const preciseEngine = createGameEngine({ rng: sequenceRng([0.85]) });
    const preciseCombat = new CombatRuntime(preciseEngine);

    preciseEngine.state.set('character.perks["precise"]', true);
    preciseCombat.start(weaponTargetCombat());

    expect(preciseCombat.chooseAction("attack:fists")).toBe(true);
    expect(preciseCombat.snapshot()).toMatchObject({
      enemyHp: 199,
    });

    const missEngine = createGameEngine({ rng: sequenceRng([0.85]) });
    const missCombat = new CombatRuntime(missEngine);

    missCombat.start(weaponTargetCombat());

    expect(missCombat.chooseAction("attack:fists")).toBe(true);
    expect(missCombat.snapshot()).toMatchObject({
      enemyHp: 200,
    });

    const evasiveEngine = createGameEngine({ rng: sequenceRng([0.7]) });
    const evasiveCombat = new CombatRuntime(evasiveEngine);

    evasiveEngine.state.set('character.perks["evasive"]', true);
    evasiveCombat.start({
      ...weaponTargetCombat(),
      damage: 2,
      hit: 0.8,
      attackDelay: 1,
    });

    evasiveEngine.clock.advanceBy(1000);
    expect(evasiveCombat.snapshot()).toMatchObject({
      playerHp: 10,
    });

    const hitEngine = createGameEngine({ rng: sequenceRng([0.7]) });
    const hitCombat = new CombatRuntime(hitEngine);

    hitCombat.start({
      ...weaponTargetCombat(),
      damage: 2,
      hit: 0.8,
      attackDelay: 1,
    });

    hitEngine.clock.advanceBy(1000);
    expect(hitCombat.snapshot()).toMatchObject({
      playerHp: 8,
    });
  });

  it("uses original enemy attack delays, including fractional seconds, on repeated attacks", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const combat = new CombatRuntime(engine);

    combat.start({
      enemy: "precise raider",
      enemyName: "precise raider",
      deathMessage: "the raider is dead",
      chara: "R",
      damage: 1,
      hit: 1,
      attackDelay: 2.5,
      health: 20,
      loot: {},
    });

    expect(combat.lifecycleSnapshot()?.enemyAttackDueAt).toBe(2500);

    engine.clock.advanceBy(2499);
    expect(combat.snapshot()?.playerHp).toBe(10);

    engine.clock.advanceBy(1);
    expect(combat.snapshot()?.playerHp).toBe(9);
    expect(combat.lifecycleSnapshot()?.enemyAttackDueAt).toBe(5000);

    engine.clock.advanceBy(2499);
    expect(combat.snapshot()?.playerHp).toBe(9);

    engine.clock.advanceBy(1);
    expect(combat.snapshot()?.playerHp).toBe(8);
  });

  it("uses kinetic armour shield to turn one successful enemy hit into healing", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 20);
    combat.start(snarlingBeastCombat());

    expect(
      combat.snapshot()?.actions.find((action) => action.key === "shield"),
    ).toMatchObject({
      text: "shield",
      kind: "defend",
      disabled: false,
    });

    expect(combat.chooseAction("shield")).toBe(true);
    expect(
      combat.snapshot()?.actions.find((action) => action.key === "shield"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 10000,
    });

    engine.clock.advanceBy(1000);
    expect(combat.snapshot()?.playerHp).toBe(21);

    engine.clock.advanceBy(1000);
    expect(combat.snapshot()?.playerHp).toBe(20);
  });

  it("uses kinetic armour shield to suppress venom damage-over-time", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 20);
    combat.start(
      scheduledSpecialCombat("venomous", {
        damage: 4,
        hit: 1,
        attackDelay: 6,
        delaySeconds: 5,
      }),
    );

    engine.clock.advanceBy(5000);
    expect(combat.snapshot()?.enemyStatus).toBe("venomous");
    expect(combat.chooseAction("shield")).toBe(true);

    engine.clock.advanceBy(1000);
    expect(combat.snapshot()).toMatchObject({
      playerHp: 24,
      enemyStatus: null,
    });
    expect(combat.lifecycleSnapshot()).toMatchObject({
      playerDotDamage: 0,
      playerDotDueAt: null,
    });

    engine.clock.advanceBy(5000);
    expect(combat.snapshot()?.playerHp).toBe(24);
  });

  it("expires stim boost after three seconds and restores normal weapon cooldowns", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 30);
    engine.state.set('outfit["stim"]', 1);
    engine.state.set('outfit["bone spear"]', 1);
    combat.start(snarlingBeastCombat());

    expect(
      combat.snapshot()?.actions.find((action) => action.key === "stim"),
    ).toMatchObject({
      text: "boost",
      kind: "boost",
      disabled: false,
    });

    expect(combat.chooseAction("stim")).toBe(true);
    expect(combat.snapshot()?.playerHp).toBe(20);
    expect(engine.state.get('outfit["stim"]')).toBe(1);
    expect(combat.lifecycleSnapshot()).toMatchObject({
      playerBoosted: true,
      playerBoostExpiresAt: 3000,
    });
    expect(
      combat.snapshot()?.actions.find((action) => action.key === "stim"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 10000,
    });

    expect(combat.chooseAction("attack:bone spear")).toBe(true);
    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "attack:bone spear"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 1000,
    });

    engine.clock.advanceBy(2999);
    expect(combat.lifecycleSnapshot()).toMatchObject({
      playerBoosted: true,
      playerBoostExpiresAt: 3000,
    });

    engine.clock.advanceBy(1);
    expect(combat.lifecycleSnapshot()).toMatchObject({
      playerBoosted: false,
      playerBoostExpiresAt: null,
    });

    expect(combat.chooseAction("attack:bone spear")).toBe(true);
    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "attack:bone spear"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 2000,
    });
  });

  it("restores the one-second stim remainder from a two-second lifecycle snapshot", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 30);
    engine.state.set('outfit["stim"]', 1);
    engine.state.set('outfit["bone spear"]', 1);
    combat.start(weaponTargetCombat());

    expect(combat.chooseAction("stim")).toBe(true);
    engine.clock.advanceBy(2000);
    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing stim lifecycle");
    expect(lifecycle).toMatchObject({
      playerBoosted: true,
      playerBoostExpiresAt: 3000,
    });

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine);
    restored.restore(weaponTargetCombat(), lifecycle);

    expect(restored.chooseAction("attack:bone spear")).toBe(true);
    expect(
      restored
        .snapshot()
        ?.actions.find((action) => action.key === "attack:bone spear"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 1000,
    });

    engine.clock.advanceBy(999);
    expect(restored.lifecycleSnapshot()).toMatchObject({
      playerBoosted: true,
      playerBoostExpiresAt: 3000,
    });

    engine.clock.advanceBy(1);
    expect(restored.lifecycleSnapshot()).toMatchObject({
      playerBoosted: false,
      playerBoostExpiresAt: null,
    });
  });

  it("keeps healing item costs, gastronome meat bonus, and heal cooldowns in the combat boundary", () => {
    const engine = createGameEngine();
    const combat = new CombatRuntime(engine);

    engine.state.set("character.health", 2);
    engine.state.set('character.perks["gastronome"]', true);
    engine.state.set('outfit["cured meat"]', 2);
    combat.start(snarlingBeastCombat());

    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "heal:cured meat"),
    ).toMatchObject({
      text: "eat meat",
      kind: "heal",
      disabled: false,
    });

    expect(combat.chooseAction("heal:cured meat")).toBe(true);
    expect(combat.snapshot()?.playerHp).toBe(10);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "heal:cured meat"),
    ).toMatchObject({
      disabled: true,
      cooldownRemainingMs: 5000,
    });

    engine.state.set("character.health", 6);
    expect(combat.chooseAction("heal:cured meat")).toBe(false);

    engine.clock.advanceBy(5000);
    expect(combat.chooseAction("heal:cured meat")).toBe(true);
    expect(combat.snapshot()?.playerHp).toBe(10);
    expect(engine.state.get('outfit["cured meat"]')).toBe(0);
  });

  it("uses medicine and hypo healing amounts, costs, and cooldowns", () => {
    const cases = [
      {
        item: "medicine",
        actionKey: "heal:medicine",
        text: "use meds",
        healedHp: 50,
      },
      {
        item: "hypo",
        actionKey: "heal:hypo",
        text: "use hypo",
        healedHp: 60,
      },
    ];

    for (const healingItem of cases) {
      const engine = createGameEngine();
      const combat = new CombatRuntime(engine);

      engine.state.set('stores["kinetic armour"]', 1);
      engine.state.set("character.health", 30);
      engine.state.set(`outfit["${healingItem.item}"]`, 2);
      combat.start(weaponTargetCombat());

      expect(
        combat
          .snapshot()
          ?.actions.find((action) => action.key === healingItem.actionKey),
      ).toMatchObject({
        text: healingItem.text,
        kind: "heal",
        cost: { [healingItem.item]: 1 },
        disabled: false,
      });

      expect(combat.chooseAction(healingItem.actionKey)).toBe(true);
      expect(combat.snapshot()?.playerHp).toBe(healingItem.healedHp);
      expect(engine.state.get(`outfit["${healingItem.item}"]`)).toBe(1);
      expect(
        combat
          .snapshot()
          ?.actions.find((action) => action.key === healingItem.actionKey),
      ).toMatchObject({
        disabled: true,
        cooldownRemainingMs: 7000,
      });

      engine.clock.advanceBy(7000);
      engine.state.set("character.health", 40);
      expect(combat.chooseAction(healingItem.actionKey)).toBe(true);
      expect(combat.snapshot()?.playerHp).toBe(
        healingItem.item === "medicine" ? 60 : 70,
      );
      expect(engine.state.get(`outfit["${healingItem.item}"]`)).toBe(0);
    }
  });

  it("records unarmed progression and applies punch damage perks through fists", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(55).fill(0)) });
    const combat = new CombatRuntime(engine);

    engine.state.set("character.punches", 49);
    combat.start({
      enemy: "training target",
      enemyName: "training target",
      deathMessage: "the target is down",
      chara: "T",
      damage: 0,
      hit: 0,
      attackDelay: 100,
      health: 25,
      loot: {},
    });

    expect(combat.chooseAction("attack:fists")).toBe(true);
    expect(engine.state.get("character.punches")).toBe(50);
    expect(engine.state.get('character.perks["boxer"]')).toBe(true);
    expect(combat.snapshot()).toMatchObject({
      enemyHp: 23,
    });

    engine.clock.advanceBy(2000);
    expect(combat.chooseAction("attack:fists")).toBe(true);
    expect(combat.snapshot()).toMatchObject({
      enemyHp: 21,
    });

    engine.state.set('character.perks["martial artist"]', true);
    engine.clock.advanceBy(2000);
    expect(combat.chooseAction("attack:fists")).toBe(true);
    expect(combat.snapshot()).toMatchObject({
      enemyHp: 15,
    });

    engine.state.set('character.perks["unarmed master"]', true);
    engine.clock.advanceBy(2000);
    expect(
      combat
        .snapshot()
        ?.actions.find((action) => action.key === "attack:fists"),
    ).toMatchObject({
      disabled: false,
    });
    expect(combat.chooseAction("attack:fists")).toBe(true);
    expect(combat.snapshot()).toMatchObject({
      enemyHp: 3,
    });
  });

  it("lets stun weapons suppress the next enemy attack before normal timing resumes", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["bolas"]', 1);
    combat.start({
      enemy: "charging beast",
      enemyName: "charging beast",
      deathMessage: "the beast is dead",
      chara: "B",
      damage: 2,
      hit: 1,
      attackDelay: 1,
      health: 20,
      loot: {},
    });

    expect(combat.chooseAction("attack:bolas")).toBe(true);
    engine.clock.advanceBy(1000);
    expect(combat.snapshot()?.playerHp).toBe(10);

    engine.clock.advanceBy(3000);
    expect(combat.snapshot()?.playerHp).toBe(8);
  });

  it("restores stun timing and resumes enemy attacks at the stun boundary", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0, 0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["bolas"]', 1);
    combat.start({
      enemy: "charging beast",
      enemyName: "charging beast",
      deathMessage: "the beast is dead",
      chara: "B",
      damage: 2,
      hit: 1,
      attackDelay: 1,
      health: 20,
      loot: {},
    });

    expect(combat.chooseAction("attack:bolas")).toBe(true);
    engine.clock.advanceBy(500);
    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing stun lifecycle");
    expect(lifecycle.enemyAttackDueAt).toBe(1000);
    expect(lifecycle.enemyStunnedUntil).toBe(4000);

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine);
    restored.restore(
      {
        enemy: "charging beast",
        enemyName: "charging beast",
        deathMessage: "the beast is dead",
        chara: "B",
        damage: 2,
        hit: 1,
        attackDelay: 1,
        health: 20,
        loot: {},
      },
      lifecycle,
    );

    engine.clock.advanceBy(499);
    expect(restored.snapshot()?.playerHp).toBe(10);

    engine.clock.advanceBy(1);
    expect(restored.snapshot()?.playerHp).toBe(10);
    expect(restored.lifecycleSnapshot()?.enemyAttackDueAt).toBe(2000);

    engine.clock.advanceBy(2999);
    expect(restored.snapshot()?.playerHp).toBe(10);

    engine.clock.advanceBy(1);
    expect(restored.snapshot()?.playerHp).toBe(8);
  });

  it("applies executioner-style at-health venom and restores its dot timer", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 1);
    combat.start(venomousMedicCombat());

    expect(combat.chooseAction("attack:plasma rifle")).toBe(true);
    expect(combat.snapshot()).toMatchObject({
      enemyHp: 38,
      enemyStatus: "venomous",
    });

    engine.clock.advanceBy(10000);
    expect(combat.snapshot()).toMatchObject({
      playerHp: 6,
      enemyStatus: null,
    });

    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing venom lifecycle");
    expect(lifecycle.playerDotDamage).toBe(2);
    expect(lifecycle.playerDotDueAt).toBe(11000);

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine);
    restored.restore(venomousMedicCombat(), lifecycle);

    engine.clock.advanceBy(999);
    expect(restored.snapshot()?.playerHp).toBe(6);

    engine.clock.advanceBy(1);
    expect(restored.snapshot()?.playerHp).toBe(4);
  });

  it("restores scheduled enemy shield specials and heals one hit before breaking", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["bone spear"]', 1);
    combat.start(scheduledSpecialCombat("shield"));

    expect(combat.chooseAction("attack:bone spear")).toBe(true);
    expect(combat.snapshot()?.enemyHp).toBe(18);

    engine.clock.advanceBy(3000);
    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing shield lifecycle");
    expect(lifecycle.enemySpecialDueAts[0]).toBe(5000);

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine);
    restored.restore(scheduledSpecialCombat("shield"), lifecycle);

    engine.clock.advanceBy(1999);
    expect(restored.snapshot()?.enemyStatus).toBeNull();

    engine.clock.advanceBy(1);
    expect(restored.snapshot()?.enemyStatus).toBe("shield");
    expect(restored.chooseAction("attack:bone spear")).toBe(true);
    expect(restored.snapshot()).toMatchObject({
      enemyHp: 20,
      enemyStatus: null,
    });
  });

  it("uses scheduled energised specials to multiply the next enemy hit", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const combat = new CombatRuntime(engine);

    combat.start(
      scheduledSpecialCombat("energised", {
        damage: 2,
        attackDelay: 6,
      }),
    );

    engine.clock.advanceBy(5000);
    expect(combat.snapshot()?.enemyStatus).toBe("energised");

    engine.clock.advanceBy(1000);
    expect(combat.snapshot()).toMatchObject({
      playerHp: 2,
      enemyStatus: null,
    });
  });

  it("uses scheduled enraged specials to accelerate enemy attacks", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const combat = new CombatRuntime(engine);

    combat.start(
      scheduledSpecialCombat("enraged", {
        damage: 1,
        attackDelay: 10,
        delaySeconds: 1,
      }),
    );

    engine.clock.advanceBy(999);
    expect(combat.snapshot()).toMatchObject({
      playerHp: 10,
      enemyStatus: null,
    });

    engine.clock.advanceBy(1);
    expect(combat.snapshot()?.enemyStatus).toBe("enraged");

    engine.clock.advanceBy(499);
    expect(combat.snapshot()?.playerHp).toBe(10);

    engine.clock.advanceBy(1);
    expect(combat.snapshot()?.playerHp).toBe(9);
  });

  it("uses scheduled meditation specials to reflect stored player damage", () => {
    const engine = createGameEngine({ rng: sequenceRng([1, 1, 0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('outfit["bone spear"]', 1);
    combat.start(
      scheduledSpecialCombat("meditation", {
        damage: 1,
        hit: 0,
        attackDelay: 3,
        delaySeconds: 7,
      }),
    );

    engine.clock.advanceBy(7000);
    expect(combat.snapshot()?.enemyStatus).toBe("meditation");

    expect(combat.chooseAction("attack:bone spear")).toBe(true);
    expect(combat.snapshot()?.enemyHp).toBe(20);

    engine.clock.advanceBy(4999);
    expect(combat.snapshot()?.playerHp).toBe(10);

    engine.clock.advanceBy(1);
    expect(combat.snapshot()).toMatchObject({
      playerHp: 8,
      enemyStatus: null,
    });
  });

  it("delays explosive enemy defeat and applies original world-death effects if the blast kills", () => {
    const engine = createGameEngine({ rng: sequenceRng([0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set("character.health", 10);
    engine.state.set('outfit["grenade"]', 1);
    engine.state.set('outfit["cured meat"]', 1);
    combat.start(explodingAutomatonCombat());

    expect(combat.chooseAction("attack:grenade")).toBe(true);
    expect(combat.snapshot()).toMatchObject({
      phase: "exploding",
      enemyHp: 0,
      playerHp: 10,
      actions: [],
    });

    engine.clock.advanceBy(2999);
    expect(combat.snapshot()).toMatchObject({
      phase: "exploding",
      playerHp: 10,
    });

    engine.clock.advanceBy(1);
    expect(combat.snapshot()).toBeNull();
    expect(engine.state.get("character.dead")).toBe(true);
    expect(engine.state.get("game.world.dead")).toBe(true);
    expect(engine.state.get("outfit", true)).toBe(0);
  });

  it("restores explosive enemy defeat and lets shielded survivors reach victory loot", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const combat = new CombatRuntime(engine);

    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("character.health", 20);
    engine.state.set('outfit["grenade"]', 1);
    combat.start(explodingAutomatonCombat());

    expect(combat.chooseAction("shield")).toBe(true);
    expect(combat.chooseAction("attack:grenade")).toBe(true);
    engine.clock.advanceBy(1000);
    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing explosion lifecycle");
    expect(lifecycle.phase).toBe("exploding");
    expect(lifecycle.enemyExplosionDueAt).toBe(3000);

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine);
    restored.restore(explodingAutomatonCombat(), lifecycle);

    engine.clock.advanceBy(1999);
    expect(restored.snapshot()).toMatchObject({
      phase: "exploding",
      playerHp: 20,
    });

    engine.clock.advanceBy(1);
    expect(restored.snapshot()).toMatchObject({
      phase: "won",
      playerHp: 50,
      loot: {
        "alien alloy": 1,
      },
    });
  });

  it("mounts executioner combat catalog entries through the combat boundary", () => {
    const prototypeEngine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const prototypeCombat = new CombatRuntime(prototypeEngine);

    prototypeEngine.state.set('stores["kinetic armour"]', 1);
    prototypeEngine.state.set("character.health", 80);
    prototypeEngine.state.set('outfit["plasma rifle"]', 1);
    prototypeEngine.state.set('outfit["energy cell"]', 10);
    prototypeCombat.start(
      originalExecutionerCombatDefinitions["unstable-prototype"],
    );

    prototypeEngine.clock.advanceBy(5000);
    expect(prototypeCombat.snapshot()).toMatchObject({
      enemy: "unstable prototype",
      enemyStatus: "shield",
      enemyHp: 150,
    });
    expect(prototypeCombat.chooseAction("attack:plasma rifle")).toBe(true);
    expect(prototypeCombat.snapshot()).toMatchObject({
      enemyHp: 150,
      enemyStatus: null,
    });

    const automatonEngine = createGameEngine({ rng: sequenceRng([0]) });
    const automatonCombat = new CombatRuntime(automatonEngine);

    automatonEngine.state.set('stores["kinetic armour"]', 1);
    automatonEngine.state.set("character.health", 80);
    automatonEngine.state.set('outfit["plasma rifle"]', 1);
    automatonEngine.state.set('outfit["energy cell"]', 20);
    automatonCombat.start(
      originalExecutionerCombatDefinitions["unstable-automaton"],
    );

    for (let i = 0; i < 9; i += 1) {
      expect(automatonCombat.chooseAction("attack:plasma rifle")).toBe(true);
      automatonEngine.clock.advanceBy(1000);
    }

    expect(automatonCombat.snapshot()).toMatchObject({
      phase: "exploding",
      enemyHp: 0,
    });
    automatonEngine.clock.advanceBy(3000);
    expect(automatonCombat.snapshot()).toMatchObject({
      phase: "won",
      playerHp: 10,
      loot: {
        "glowstone blueprint": 1,
      },
    });
    automatonEngine.clock.advanceBy(1000);
    expect(automatonCombat.chooseAction("takeEverything")).toBe(true);
    expect(automatonCombat.chooseAction("leave")).toBe(true);
    expect(
      automatonEngine.state.get('character.blueprints["glowstone"]', true),
    ).toBe(0);
    expect(
      automatonEngine.state.get('outfit["glowstone blueprint"]', true),
    ).toBe(0);
    expect(automatonEngine.state.get('stores["glowstone blueprint"]')).toBe(1);
  });

  it("mounts setpiece combat catalog entries through the combat boundary", () => {
    const sniperEngine = createGameEngine();
    const sniperCombat = new CombatRuntime(sniperEngine);

    sniperCombat.start(originalSetpieceCombatDefinitions["city-sniper"]);

    expect(sniperCombat.snapshot()).toMatchObject({
      enemy: "sniper",
      ranged: true,
      phase: "fighting",
      enemyHp: 30,
      damage: 15,
    });

    const matriarchEngine = createGameEngine({
      rng: sequenceRng([0, 0, 0, 0, 0, 0, 0]),
    });
    const matriarchCombat = new CombatRuntime(matriarchEngine);

    matriarchEngine.state.set('outfit["grenade"]', 1);
    matriarchCombat.start(
      originalSetpieceCombatDefinitions["ironmine-matriarch"],
    );

    expect(matriarchCombat.chooseAction("attack:grenade")).toBe(true);
    expect(matriarchCombat.snapshot()).toMatchObject({
      enemy: "beastly matriarch",
      phase: "won",
      enemyHp: 0,
      loot: {
        teeth: 5,
        scales: 5,
        cloth: 5,
      },
    });
  });

  it("restores active combat and enemy attack timing independently", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const combat = new CombatRuntime(engine);

    combat.start(snarlingBeastCombat());
    engine.clock.advanceBy(500);
    const lifecycle = combat.lifecycleSnapshot();
    if (!lifecycle) throw new Error("Missing active combat lifecycle");

    engine.clock.clearAll();
    const restored = new CombatRuntime(engine);
    restored.restore(snarlingBeastCombat(), lifecycle);

    engine.clock.advanceBy(499);
    expect(restored.snapshot()?.playerHp).toBe(10);

    engine.clock.advanceBy(1);
    expect(restored.snapshot()?.playerHp).toBe(9);
  });
});
