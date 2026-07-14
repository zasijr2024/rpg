import { describe, expect, it } from "vitest";
import {
  createGameEngine,
  GameSession,
  MemoryDevSaveAdapter,
  SpaceRuntime,
} from "../../engine";

describe("SpaceRuntime", () => {
  it("runs the original altitude titles, debris loop, and bounded movement", () => {
    const engine = createGameEngine({ rngSeed: 10 });
    engine.rng.next = () => 0.9;
    const space = new SpaceRuntime(engine);

    expect(space.startFlight(3)).toBe(true);
    expect(space.snapshot()).toMatchObject({
      phase: "flying",
      title: "Troposphere",
      altitude: 0,
      hull: 3,
      maxHull: 3,
    });
    expect(space.snapshot().asteroids).toHaveLength(1);

    for (let step = 0; step < 100; step += 1) space.move("west");
    expect(space.snapshot().shipX).toBe(10);

    engine.clock.advanceBy(10_000);
    space.update();
    expect(space.snapshot()).toMatchObject({
      phase: "flying",
      title: "Stratosphere",
      altitude: 10,
      hull: 3,
    });
  });

  it("reaches the ending at sixty seconds and records the original score", () => {
    const engine = createGameEngine({ rngSeed: 11 });
    engine.rng.next = () => 0.9;
    engine.state.set("stores.wood", 2);
    engine.state.set('stores["alien alloy"]', 1);
    engine.state.set("previous.score", 7);
    const space = new SpaceRuntime(engine);

    space.startFlight(2);
    engine.clock.advanceBy(60_000);
    space.update();

    expect(space.snapshot()).toMatchObject({
      phase: "ending",
      title: "Space",
      altitude: 60,
      score: 112,
      totalScore: 119,
    });
    expect(engine.state.get("playStats.score")).toBe(112);
    expect(engine.state.get("previous.score")).toBe(119);
    expect(engine.state.get("previous.stores")).toHaveLength(24);
  });

  it("uses frame-scaled, diagonal-normalized held movement", () => {
    const engine = createGameEngine({ rngSeed: 21 });
    engine.rng.next = () => 0.9;
    engine.state.set("game.spaceShip.thrusters", 2);
    const space = new SpaceRuntime(engine);
    space.startFlight(3);
    space.setMovement("north", true);
    space.setMovement("east", true);

    engine.clock.advanceBy(33);
    space.update();

    expect(space.snapshot().shipX).toBeCloseTo(350 + 5 / Math.sqrt(2));
    expect(space.snapshot().shipY).toBeCloseTo(350 - 5 / Math.sqrt(2));
  });

  it("shows the fleet-beacon ending before scores and saves reduced stores", () => {
    const engine = createGameEngine({ rngSeed: 22 });
    engine.rng.next = () => 0.5;
    engine.state.set('stores["fleet beacon"]', 1);
    engine.state.set("stores.wood", 19);
    engine.state.set('stores["rifle"]', 9);
    engine.state.set('stores["bullets"]', 99);
    const space = new SpaceRuntime(engine);

    space.startFlight(1);
    for (let step = 0; step < 100; step += 1) space.move("west");
    engine.clock.advanceBy(60_000);
    space.update();

    expect(space.snapshot().endingStage).toBe("fleet");
    expect(space.continueEnding()).toBe(true);
    expect(space.snapshot().endingStage).toBe("scores");
    const carried = engine.state.get("previous.stores") as number[];
    expect(carried[0]).toBe(3);
    expect(carried[18]).toBe(4);
    expect(carried[20]).toBe(3);
  });
});

describe("GameSession Space integration", () => {
  it("requires the original one-time warning before entering Space", () => {
    const session = preparedShipSession(12, 1);

    session.requestShipLiftOff();
    expect(session.snapshot()).toMatchObject({
      location: "ship",
      ship: { awaitingLiftOffConfirmation: true },
      space: { phase: "idle" },
    });

    session.lingerAtShip();
    expect(session.snapshot().ship.awaitingLiftOffConfirmation).toBe(false);

    session.requestShipLiftOff();
    session.confirmShipLiftOff();
    expect(session.snapshot()).toMatchObject({
      location: "space",
      ship: { awaitingLiftOffConfirmation: false },
      space: { phase: "flying", hull: 1 },
    });
  });

  it("returns a destroyed ship to the Ship surface with the 120 second cooldown", () => {
    const session = preparedShipSession(13, 1);
    session.setRngSequenceForTest([0, 0.5, 0]);
    session.requestShipLiftOff();
    session.confirmShipLiftOff();

    session.advanceForTest(800);
    expect(session.snapshot()).toMatchObject({
      location: "ship",
      space: { phase: "idle" },
      ship: { canLiftOff: false },
    });
    expect(session.snapshot().ship.liftOffCooldownMs).toBeGreaterThan(119_000);

    session.advanceForTest(120_000);
    expect(session.snapshot().ship.canLiftOff).toBe(true);
  });

  it("round-trips a newly started active flight with offscreen debris", () => {
    const adapter = new MemoryDevSaveAdapter();
    const first = new GameSession(
      createGameEngine({ rngSeed: 14, saveAdapter: adapter }),
    );
    first.setStateForTest("features.location.spaceShip", true);
    first.setStateForTest("game.spaceShip.hull", 20);
    first.setLocation("ship");
    first.requestShipLiftOff();
    first.confirmShipLiftOff();
    const before = first.snapshot().space;
    expect(before.asteroids.map(({ y }) => y)).toContain(-40);
    first.saveDevState();

    const restored = new GameSession(
      createGameEngine({ rngSeed: 15, saveAdapter: adapter }),
    );
    expect(restored.loadDevState()).toBe(true);
    expect(restored.snapshot().location).toBe("space");
    expect(restored.snapshot().space).toEqual(before);
  });

  it("keeps consecutive active-flight saves loadable", () => {
    const adapter = new MemoryDevSaveAdapter();
    const first = new GameSession(
      createGameEngine({ rngSeed: 16, saveAdapter: adapter }),
    );
    first.setStateForTest("features.location.spaceShip", true);
    first.setStateForTest("game.spaceShip.hull", 20);
    first.setLocation("ship");
    first.requestShipLiftOff();
    first.confirmShipLiftOff();
    first.saveDevState();
    first.advanceForTest(250);
    first.saveDevState();
    const expected = first.snapshot().space;

    const restored = new GameSession(
      createGameEngine({ rngSeed: 17, saveAdapter: adapter }),
    );
    expect(restored.loadDevState()).toBe(true);
    expect(restored.snapshot().location).toBe("space");
    expect(restored.snapshot().space).toEqual(expected);
  });

  it("restarts a completed game while preserving prestige", () => {
    const adapter = new MemoryDevSaveAdapter();
    const first = new GameSession(
      createGameEngine({ rngSeed: 23, saveAdapter: adapter }),
    );
    first.setStateForTest("features.location.spaceShip", true);
    first.setStateForTest("game.spaceShip.hull", 1);
    first.setStateForTest("stores.wood", 20);
    first.setLocation("ship");
    first.setRngSequenceForTest(Array(500).fill(0.9));
    first.requestShipLiftOff();
    first.confirmShipLiftOff();
    for (let step = 0; step < 100; step += 1) first.moveSpace("west");
    first.advanceForTest(60_000);

    expect(first.restartAfterEnding()).toBe(true);
    const restored = new GameSession(
      createGameEngine({ rngSeed: 24, saveAdapter: adapter }),
    );
    expect(restored.loadDevState()).toBe(true);
    expect(restored.snapshot().location).toBe("room");
    expect(restored.getStateForTest("previous.score")).toBe(70);
    expect(restored.getStateForTest("previous.stores")).toHaveLength(24);
    expect(restored.getStateForTest("features.location.spaceShip")).toBe(
      undefined,
    );
  });
});

function preparedShipSession(seed: number, hull: number): GameSession {
  const session = new GameSession(createGameEngine({ rngSeed: seed }));
  session.setStateForTest("features.location.spaceShip", true);
  session.setStateForTest("game.spaceShip.hull", hull);
  session.setStateForTest("game.spaceShip.thrusters", 1);
  session.setLocation("ship");
  return session;
}
