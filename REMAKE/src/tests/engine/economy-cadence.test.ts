import { describe, expect, it } from "vitest";
import { createGameEngine, ManualClock, OutsideRuntime } from "../../engine";

describe("worker income cadence", () => {
  it("pays one gatherer exactly once per ten seconds across income resyncs", () => {
    const clock = new ManualClock();
    const engine = createGameEngine({ clock });
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 1);
    engine.state.set("stores.wood", 0);
    outside.initialize();

    clock.advanceBy(1000);
    expect(engine.state.get("stores.wood")).toBe(0);

    clock.advanceBy(1000);
    expect(engine.state.get("stores.wood")).toBe(0);

    const dueAtBeforeSync = outside.lifecycleSnapshot().incomeTimerDueAt;
    outside.update();
    expect(outside.lifecycleSnapshot().incomeTimerDueAt).toBe(dueAtBeforeSync);
    expect(engine.state.get('income["gatherer"].timeLeft')).toBe(8);

    clock.advanceBy(7000);
    expect(engine.state.get("stores.wood")).toBe(0);

    clock.advanceBy(1000);
    expect(engine.state.get("stores.wood")).toBe(1);

    clock.advanceBy(1000);
    expect(engine.state.get("stores.wood")).toBe(1);
  });

  it("keeps a consuming job on the existing ten-second countdown", () => {
    const clock = new ManualClock();
    const engine = createGameEngine({ clock });
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 1);
    engine.state.set('game.buildings["lodge"]', 1);
    engine.state.set("stores.meat", 1);
    engine.state.set("stores.bait", 0);
    outside.initialize();

    clock.advanceBy(4000);
    const dueAtBeforeAssignment = outside.lifecycleSnapshot().incomeTimerDueAt;
    expect(outside.increaseWorker("trapper", 1)).toBe(true);
    expect(outside.lifecycleSnapshot().incomeTimerDueAt).toBe(
      dueAtBeforeAssignment,
    );
    expect(engine.state.get('income["trapper"].timeLeft')).toBe(6);

    clock.advanceBy(5000);
    expect(engine.state.get("stores.meat")).toBe(1);
    expect(engine.state.get("stores.bait")).toBe(0);

    clock.advanceBy(1000);
    expect(engine.state.get("stores.meat")).toBe(0);
    expect(engine.state.get("stores.bait")).toBe(1);

    clock.advanceBy(1000);
    expect(engine.state.get("stores.meat")).toBe(0);
    expect(engine.state.get("stores.bait")).toBe(1);
  });

  it("applies debug income x10 without accelerating the cadence", () => {
    const clock = new ManualClock();
    const engine = createGameEngine({ clock });
    const outside = new OutsideRuntime(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 1);
    engine.state.set("stores.wood", 0);
    engine.state.set("config.debug.incomeMultiplier", 10, true);
    outside.initialize();

    clock.advanceBy(9000);
    expect(engine.state.get("stores.wood")).toBe(0);

    clock.advanceBy(1000);
    expect(engine.state.get("stores.wood")).toBe(10);

    clock.advanceBy(1000);
    expect(engine.state.get("stores.wood")).toBe(10);
  });
});
