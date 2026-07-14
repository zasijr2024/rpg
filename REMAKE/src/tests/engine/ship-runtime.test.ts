import { describe, expect, it } from "vitest";
import {
  createGameEngine,
  GameSession,
  MemoryDevSaveAdapter,
  SHIP_ARRIVAL_NOTIFICATION,
  ShipRuntime,
} from "../../engine";

describe("ShipRuntime", () => {
  it("stays unavailable until the World discovery has been committed", () => {
    const engine = createGameEngine({ rngSeed: 1 });
    const ship = new ShipRuntime(engine);

    expect(ship.snapshot()).toMatchObject({
      unlocked: false,
      hull: 0,
      thrusters: 1,
      canReinforce: false,
      canUpgradeEngine: false,
      canLiftOff: false,
    });
    expect(ship.reinforceHull()).toBe(false);
    expect(ship.upgradeEngine()).toBe(false);
  });

  it("announces the first arrival exactly once and preserves initialized state", () => {
    const engine = createGameEngine({ rngSeed: 2 });
    const ship = new ShipRuntime(engine);
    engine.state.set("features.location.spaceShip", true);

    ship.onArrival();
    ship.onArrival();

    expect(engine.state.get("game.spaceShip.hull")).toBe(0);
    expect(engine.state.get("game.spaceShip.thrusters")).toBe(1);
    expect(engine.state.get("game.spaceShip.seenShip")).toBe(true);
    expect(
      engine.notifications.list("ship").map(({ message }) => message),
    ).toEqual([SHIP_ARRIVAL_NOTIFICATION]);
  });

  it("spends one alien alloy for each original hull and engine operation", () => {
    const engine = createGameEngine({ rngSeed: 3 });
    const ship = new ShipRuntime(engine);
    engine.state.set("features.location.spaceShip", true);
    engine.state.set('stores["alien alloy"]', 2);
    ship.onArrival();

    expect(ship.reinforceHull()).toBe(true);
    expect(ship.snapshot()).toMatchObject({
      hull: 1,
      thrusters: 1,
      alienAlloy: 1,
      canLiftOff: true,
    });

    expect(ship.upgradeEngine()).toBe(true);
    expect(ship.snapshot()).toMatchObject({
      hull: 1,
      thrusters: 2,
      alienAlloy: 0,
      canReinforce: false,
      canUpgradeEngine: false,
    });
  });

  it("rejects an unaffordable operation without partially mutating Ship state", () => {
    const engine = createGameEngine({ rngSeed: 4 });
    const ship = new ShipRuntime(engine);
    engine.state.set("features.location.spaceShip", true);
    ship.onArrival();

    expect(ship.reinforceHull()).toBe(false);
    expect(ship.snapshot()).toMatchObject({ hull: 0, alienAlloy: 0 });
    expect(engine.notifications.list("ship").at(-1)?.message).toBe(
      "not enough alien alloy",
    );
  });
});

describe("GameSession Ship integration", () => {
  it("guards navigation and exposes the unlocked Ship as its own UI domain", () => {
    const session = new GameSession(createGameEngine({ rngSeed: 5 }));

    session.setLocation("ship");
    expect(session.snapshot().location).toBe("room");

    session.setStateForTest("features.location.spaceShip", true);
    session.setStateForTest('stores["alien alloy"]', 2);
    expect(session.uiSnapshot("navigation").ship).toEqual({
      unlocked: true,
      title: "An Old Starship",
    });

    session.setLocation("ship");
    session.reinforceShipHull();
    session.upgradeShipEngine();

    expect(session.snapshot()).toMatchObject({
      location: "ship",
      ship: { hull: 1, thrusters: 2, alienAlloy: 0 },
    });
  });

  it("round-trips Ship location and upgrades through the validated save shape", () => {
    const adapter = new MemoryDevSaveAdapter();
    const first = new GameSession(
      createGameEngine({ rngSeed: 6, saveAdapter: adapter }),
    );
    first.setStateForTest("features.location.spaceShip", true);
    first.setStateForTest('stores["alien alloy"]', 2);
    first.setLocation("ship");
    first.reinforceShipHull();
    first.upgradeShipEngine();
    first.saveDevState();

    const restored = new GameSession(
      createGameEngine({ rngSeed: 7, saveAdapter: adapter }),
    );
    expect(restored.loadDevState()).toBe(true);
    expect(restored.snapshot()).toMatchObject({
      location: "ship",
      ship: { unlocked: true, hull: 1, thrusters: 2 },
    });
  });
});
