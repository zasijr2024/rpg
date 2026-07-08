import { describe, expect, it } from "vitest";
import { createGameEngine, MemoryDevSaveAdapter } from "../../engine";

describe("GameEngine core services", () => {
  it("dispatches state commands through the command bus", () => {
    const engine = createGameEngine();

    engine.commands.dispatch({
      type: "state.set",
      payload: { path: "stores.wood", value: 5 },
    });
    engine.commands.dispatch({
      type: "state.add",
      payload: { path: "stores.wood", amount: 2 },
    });

    expect(engine.state.get("stores.wood")).toBe(7);
  });

  it("publishes notification events through notify commands", () => {
    const engine = createGameEngine();
    const messages: string[] = [];
    engine.events.subscribe("notification", (notification) => {
      messages.push(notification.message);
    });

    engine.commands.dispatch({
      type: "notify",
      payload: { source: "room", message: "a test notification" },
    });

    expect(messages).toEqual(["a test notification"]);
  });

  it("starts cooldowns through commands", () => {
    const engine = createGameEngine();

    engine.commands.dispatch({
      type: "cooldown.start",
      payload: { key: "light-fire", durationMs: 1000 },
    });
    engine.clock.advanceBy(400);

    expect(engine.cooldowns.snapshot("light-fire")).toMatchObject({
      active: true,
      remainingMs: 600,
      progress: 0.4,
    });
  });

  it("round-trips dev saves with the current disposable save shape", () => {
    const saveAdapter = new MemoryDevSaveAdapter();
    const first = createGameEngine({ saveAdapter });

    first.commands.dispatch({
      type: "state.set",
      payload: { path: 'stores["alien alloy"]', value: 4 },
    });
    first.saveDevState();

    const second = createGameEngine({ saveAdapter });
    expect(second.loadDevState()).toBe(true);
    expect(second.state.get('stores["alien alloy"]')).toBe(4);
    expect(second.clock.now()).toBe(0);

    second.clearDevState();
    const third = createGameEngine({ saveAdapter });
    expect(third.loadDevState()).toBe(false);
  });

  it("round-trips clock, cooldowns, and notifications in dev saves", () => {
    const saveAdapter = new MemoryDevSaveAdapter();
    const first = createGameEngine({ saveAdapter });

    first.clock.advanceBy(5000);
    first.cooldowns.start("test", 10000);
    first.notifications.notify("room", "saved notification");
    first.saveDevState();

    const second = createGameEngine({ saveAdapter });
    expect(second.loadDevState()).toBe(true);

    expect(second.clock.now()).toBe(5000);
    expect(second.cooldowns.snapshot("test")).toMatchObject({
      active: true,
      remainingMs: 10000,
    });
    expect(second.notifications.list()).toEqual([
      {
        id: 1,
        source: "room",
        message: "saved notification",
        createdAt: 5000,
      },
    ]);
  });
});
