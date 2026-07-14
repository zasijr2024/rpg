import { describe, expect, it } from "vitest";
import { createGameEngine, MemoryDevSaveAdapter } from "../../engine";

describe("GameEngine core services", () => {
  it("does not register arbitrary state-path commands", () => {
    const engine = createGameEngine();

    expect(() =>
      (
        engine.commands as unknown as { dispatch(command: unknown): void }
      ).dispatch({
        type: "state.set",
        payload: { path: "stores.wood", value: 5 },
      }),
    ).toThrow(/No command handler/);
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

  it("round-trips engine state through the versioned save shape", () => {
    const saveAdapter = new MemoryDevSaveAdapter();
    const first = createGameEngine({ saveAdapter });

    first.state.set('stores["alien alloy"]', 4);
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

  it("restores the exact RNG continuation before resumed engine work", () => {
    const saveAdapter = new MemoryDevSaveAdapter();
    const first = createGameEngine({ saveAdapter, rngSeed: 0x12345678 });
    Array.from({ length: 37 }, () => first.rng.next());
    first.saveDevState();
    const expected = Array.from({ length: 100 }, () => first.rng.next());

    const second = createGameEngine({ saveAdapter, rngSeed: 0x87654321 });
    expect(second.loadDevState()).toBe(true);

    expect(Array.from({ length: 100 }, () => second.rng.next())).toEqual(
      expected,
    );
  });
});
