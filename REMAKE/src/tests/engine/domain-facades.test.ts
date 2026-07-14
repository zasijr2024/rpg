import { describe, expect, it } from "vitest";
import {
  CombatDomainFacade,
  createGameEngine,
  EconomyDomainFacade,
  WorldDomainFacade,
} from "../../engine";

describe("typed domain facades", () => {
  it("owns Economy mutations and returns immutable detached records", () => {
    const engine = createGameEngine();
    const economy = new EconomyDomainFacade(engine);

    economy.dispatch({ type: "economy.initialize", payload: {} });
    economy.dispatch({
      type: "economy.changeStores",
      payload: { changes: { wood: 4 } },
    });
    economy.dispatch({
      type: "economy.setWorker",
      payload: { key: "hunter", value: 2 },
    });

    const read = economy.read();
    expect(read.stores.wood).toBe(4);
    expect(read.workers.hunter).toBe(2);
    expect(Object.isFrozen(read)).toBe(true);
    expect(Object.isFrozen(read.stores)).toBe(true);
  });

  it("owns coordinate-scoped World mutations through typed commands", () => {
    const engine = createGameEngine();
    const world = new WorldDomainFacade(engine);

    world.dispatch({ type: "world.begin", payload: {} });
    engine.state.set("game.world.ship", true);
    world.dispatch({
      type: "world.resolveLandmark",
      payload: { x: 12, y: 8 },
    });
    world.dispatch({
      type: "world.consumeOutpost",
      payload: { x: 4, y: 9 },
    });
    world.dispatch({
      type: "world.setShipPosition",
      payload: { x: 7, y: 11 },
    });

    const read = world.read();
    expect(read.unlocked).toBe(true);
    expect(read.resolvedLandmarks["12,8"]).toBe(true);
    expect(read.usedOutposts["4,9"]).toBe(true);
    expect(read.shipPosition).toEqual({ x: 7, y: 11 });
    expect(read.shipCleared).toBe(true);
    expect(engine.state.get("game.world.ship")).toBe(true);
    expect(Object.isFrozen(read.resolvedLandmarks)).toBe(true);
  });

  it("owns persistent Combat mutations and perk milestones", () => {
    const engine = createGameEngine();
    const combat = new CombatDomainFacade(engine);
    engine.state.set("character.punches", 49);

    combat.dispatch({ type: "combat.recordPunch", payload: {} });
    combat.dispatch({
      type: "combat.setHealth",
      payload: { value: 30, maximum: 20 },
    });
    combat.dispatch({
      type: "combat.changeOutfit",
      payload: { key: "grenade", amount: 1 },
    });

    const read = combat.read();
    expect(read.health).toBe(20);
    expect(read.perks.boxer).toBe(true);
    expect(read.outfit.grenade).toBe(1);
    expect(Object.isFrozen(read.perks)).toBe(true);
  });
});
