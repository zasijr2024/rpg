import { describe, expect, it } from "vitest";
import { createGameEngine } from "../../engine/GameEngine";
import { ExpeditionTransaction } from "../../engine/world/ExpeditionTransaction";

describe("ExpeditionTransaction", () => {
  it("owns the active expedition resources and cadence through typed methods", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);

    engine.state.set("game.world.map", [["A"]], true);
    engine.state.set('outfit["cured meat"]', 2, true);
    expedition.begin({ position: { x: 30, y: 30 }, health: 15, water: 20 });
    expedition.setPosition({ x: 31, y: 29 });
    expedition.setHealth(12, 15);
    expedition.setWater(18, 20);
    expedition.addInventory("cured meat", -1);
    expedition.setCadence("food", 1);
    expedition.setCadence("water", 2);
    expedition.setCadence("fight", 3);

    expect(expedition.snapshot()).toEqual({
      active: true,
      position: { x: 31, y: 29 },
      health: 12,
      water: 18,
      inventory: { "cured meat": 1 },
      cadence: { food: 1, water: 2, fight: 3 },
      hasDraft: true,
    });
  });

  it("commits world mutations and discards the rollback draft", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);

    engine.state.set("game.world.map", [["A", "V"]], true);
    expedition.begin({ position: { x: 0, y: 0 }, health: 10, water: 10 });
    engine.state.set("game.world.map", [["A", "P"]], true);

    expect(expedition.commit()).toBe(true);
    expect(engine.state.get("game.world.map")).toEqual([["A", "P"]]);
    expect(engine.state.get("game.expedition", true)).toBe(0);
    expect(expedition.snapshot()).toMatchObject({
      active: false,
      hasDraft: false,
    });
  });

  it("rolls world mutations back to the embark baseline", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);

    engine.state.set("game.world.map", [["A", "V"]], true);
    engine.state.set("game.world.caveCleared", false, true);
    expedition.begin({ position: { x: 0, y: 0 }, health: 10, water: 10 });
    engine.state.set("game.world.map", [["A", "P"]], true);
    engine.state.set("game.world.caveCleared", true, true);

    expect(expedition.rollback()).toBe(true);
    expect(engine.state.get("game.world.map")).toEqual([["A", "V"]]);
    expect(engine.state.get("game.world.caveCleared")).toBe(false);
    expect(engine.state.get("game.expedition", true)).toBe(0);
    expect(expedition.snapshot()).toMatchObject({
      active: false,
      hasDraft: false,
    });
  });

  it("rejects nested expeditions instead of replacing the active draft", () => {
    const engine = createGameEngine();
    const expedition = new ExpeditionTransaction(engine);

    expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 });

    expect(() =>
      expedition.begin({ position: { x: 30, y: 30 }, health: 10, water: 10 }),
    ).toThrow("Cannot begin an expedition while one is active");
  });
});
