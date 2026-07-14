import { describe, expect, it } from "vitest";
import type { OriginalCombatDefinition } from "../../content/original/events/eventData";
import {
  CombatRuntime,
  EventRuntime,
  EXPEDITION_EMBARK_COOLDOWN_KEY,
  ExpeditionTransaction,
  PathRuntime,
  createGameEngine,
} from "../../engine";

describe("atomic expedition death", () => {
  it("rolls back World state, loses the outfit, and starts one cooldown", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);
    const baselineMap = [["A", ","]];
    const baselineMask = [[true, false]];

    engine.state.set("game.world.map", baselineMap, true);
    engine.state.set("game.world.mask", baselineMask, true);
    engine.state.set("game.world.oldHouseVisited", false, true);
    engine.state.set('outfit["cured meat"]', 2, true);
    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 });
    engine.state.set("game.world.map", [["A", "H!"]], true);
    engine.state.set("game.world.mask", [[true, true]], true);
    engine.state.set("game.world.oldHouseVisited", true, true);
    expedition.setPosition({ x: 31, y: 30 });

    expect(expedition.abortOnDeath()).toBe(true);

    expect(engine.state.get("game.world.map")).toEqual(baselineMap);
    expect(engine.state.get("game.world.mask")).toEqual(baselineMask);
    expect(engine.state.get("game.world.oldHouseVisited")).toBe(false);
    expect(engine.state.get("game.world.active")).toBe(false);
    expect(engine.state.get("game.expedition", true)).toBe(0);
    expect(engine.state.get("outfit", true)).toBe(0);
    expect(engine.state.get("character.dead")).toBe(true);
    expect(engine.state.get("game.world.dead")).toBe(true);
    expect(engine.state.get("game.world.returnLocation")).toBe("room");
    expect(
      engine.cooldowns.snapshot(EXPEDITION_EMBARK_COOLDOWN_KEY),
    ).toMatchObject({ active: true, remainingMs: 120_000 });

    const startedAt = engine.cooldowns.snapshot(
      EXPEDITION_EMBARK_COOLDOWN_KEY,
    ).startedAt;
    expect(expedition.abortOnDeath()).toBe(false);
    expect(
      engine.cooldowns.snapshot(EXPEDITION_EMBARK_COOLDOWN_KEY).startedAt,
    ).toBe(startedAt);
  });

  it("keeps embark blocked through 119999 ms and releases at 120000 ms", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);
    const path = new PathRuntime(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 3);
    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 });
    expedition.abortOnDeath();
    path.update();
    expect(path.increaseSupply("cured meat", 1)).toBe(true);

    expect(path.snapshot()).toMatchObject({
      canEmbark: false,
      embarkCooldown: { active: true, remainingMs: 120_000 },
    });
    expect(path.embark()).toBe(false);

    engine.clock.advanceBy(119_999);
    expect(path.snapshot()).toMatchObject({
      canEmbark: false,
      embarkCooldown: { active: true, remainingMs: 1 },
    });

    engine.clock.advanceBy(1);
    expect(path.snapshot()).toMatchObject({
      canEmbark: true,
      embarkCooldown: { active: false, remainingMs: 0 },
    });
    expect(path.embark()).toBe(true);
  });

  it("uses the same rollback boundary for lethal combat", () => {
    const engine = createGameEngine({ rng: alwaysHitRng() });
    const expedition = new ExpeditionTransaction(engine);
    const combat = new CombatRuntime(engine, {}, expedition);

    engine.state.set("game.world.oldHouseVisited", false, true);
    engine.state.set('outfit["cured meat"]', 1, true);
    expedition.begin({ position: { x: 30, y: 30 }, health: 1, water: 10 });
    engine.state.set("game.world.oldHouseVisited", true, true);
    combat.start(lethalCombat());

    engine.clock.advanceBy(1000);

    expect(combat.snapshot()).toBeNull();
    expect(expedition.active()).toBe(false);
    expect(engine.state.get("game.world.oldHouseVisited")).toBe(false);
    expect(engine.state.get("outfit", true)).toBe(0);
    expect(engine.state.get("game.world.returnLocation")).toBe("room");
    expect(engine.cooldowns.isActive(EXPEDITION_EMBARK_COOLDOWN_KEY)).toBe(
      true,
    );
  });

  it("never redeems carried blueprints when an expedition ends in death", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);
    const blueprints = [
      ["hypo blueprint", "hypo"],
      ["kinetic armour blueprint", "kinetic armour"],
      ["disruptor blueprint", "disruptor"],
      ["plasma rifle blueprint", "plasma rifle"],
      ["stim blueprint", "stim"],
      ["glowstone blueprint", "glowstone"],
    ];

    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 });
    for (const [blueprint] of blueprints) {
      engine.state.set(`outfit["${blueprint}"]`, 1);
    }

    expedition.abortOnDeath();

    for (const [blueprint, item] of blueprints) {
      expect(engine.state.get(`outfit["${blueprint}"]`, true)).toBe(0);
      expect(engine.state.get(`character.blueprints["${item}"]`, true)).toBe(0);
    }
  });

  it("terminates a lethal World event cost before rewards or scene loading", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);
    const events = new EventRuntime(
      engine,
      () => "world",
      {},
      undefined,
      expedition,
    );

    engine.state.set('outfit["cured meat"]', 1, true);
    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 });
    expect(
      events.triggerByKeyForTest("executioner.engineering-fire-guard-post"),
    ).toBe(true);
    expect(events.choose("continue")).toBe(true);
    expect(events.choose("run")).toBe(true);

    expect(events.snapshot()).toBeNull();
    expect(expedition.active()).toBe(false);
    expect(engine.state.get("outfit", true)).toBe(0);
    expect(engine.state.get("game.world.returnLocation")).toBe("room");
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the world fades",
    );
  });
});

function lethalCombat(): OriginalCombatDefinition {
  return {
    enemy: "test",
    enemyName: "test",
    deathMessage: "the test is dead",
    chara: "t",
    damage: 2,
    hit: 1,
    attackDelay: 1,
    health: 10,
    loot: {},
  };
}

function alwaysHitRng() {
  return {
    next: () => 0,
    nextInt: () => 0,
    fork: () => alwaysHitRng(),
  };
}
