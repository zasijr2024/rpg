import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameEngine, GameSession } from "../../engine";

afterEach(() => vi.useRealTimers());

describe("GameSession domain UI subscriptions", () => {
  it("does not snapshot or notify inactive, unsubscribed domains", () => {
    vi.useFakeTimers();
    const session = new GameSession(createGameEngine({ rngSeed: 1 }));
    const roomListener = vi.fn();

    session.uiSnapshot("room");
    const unsubscribe = session.subscribeUi("room", roomListener);
    session.start();
    vi.advanceTimersByTime(250);
    session.stop();

    const diagnostics = session.uiDiagnostics();
    expect(diagnostics.snapshots.room).toBe(2);
    expect(diagnostics.snapshots.outside).toBe(0);
    expect(diagnostics.snapshots.path).toBe(0);
    expect(diagnostics.snapshots.world).toBe(0);
    expect(diagnostics.snapshots.ship).toBe(0);
    expect(diagnostics.snapshots.settings).toBe(0);
    expect(roomListener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("notifies only the changed subscribed domain", () => {
    const session = new GameSession(createGameEngine({ rngSeed: 2 }));
    session.lightFire();

    const navigationListener = vi.fn();
    const roomListener = vi.fn();
    session.uiSnapshot("navigation");
    session.uiSnapshot("room");
    const unsubscribeNavigation = session.subscribeUi(
      "navigation",
      navigationListener,
    );
    const unsubscribeRoom = session.subscribeUi("room", roomListener);

    session.advanceForTest(250);

    expect(roomListener).toHaveBeenCalledTimes(1);
    expect(navigationListener).not.toHaveBeenCalled();
    unsubscribeNavigation();
    unsubscribeRoom();
  });

  it("drops inactive caches so remounted domains receive current state", () => {
    const session = new GameSession(createGameEngine({ rngSeed: 3 }));
    expect(session.uiSnapshot("world").active).toBe(false);

    session.setStateForTest("game.world.active", true);

    expect(session.uiSnapshot("world").active).toBe(true);
    expect(session.uiDiagnostics().snapshots.world).toBe(2);
  });
});
