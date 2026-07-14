import { describe, expect, it } from "vitest";
import { createGameEngine, GameSession } from "../../engine";

describe("Phase 14 systems regressions", () => {
  it("starts thieves organically, records actual theft, and returns stolen stores on hang", () => {
    const engine = createGameEngine({ rngSeed: 51 });
    const session = new GameSession(engine);
    session.setStateForTest("features.location.outside", true);
    session.setStateForTest("features.location.world", true);
    session.setStateForTest("stores.wood", 5_000);
    session.setStateForTest("stores.fur", 3);
    session.setStateForTest("stores.meat", 0);
    expect(engine.state.get("game.thieves")).toBeUndefined();

    session.setStateForTest("stores.wood", 5_001);
    expect(engine.state.get("game.thieves")).toBe(1);
    expect(engine.state.get('income["thieves"].timeLeft')).toBe(10);

    session.advanceForTest(10_000);
    expect(engine.state.get("stores.wood")).toBe(4_991);
    expect(engine.state.get("stores.fur")).toBe(0);
    expect(engine.state.get("stores.meat")).toBe(0);
    expect(engine.state.get('game.stolen["wood"]')).toBe(10);
    expect(engine.state.get('game.stolen["fur"]')).toBe(3);
    expect(engine.state.get('game.stolen["meat"]')).toBe(0);

    session.triggerEventByKeyForTest("global.thief");
    session.chooseEventButton("kill");
    expect(engine.state.get("game.thieves")).toBe(2);
    expect(engine.state.get('income["thieves"]')).toBeUndefined();
    expect(engine.state.get("stores.wood")).toBe(5_001);
    expect(engine.state.get("stores.fur")).toBe(3);
  });

  it("makes the organically started thief event's stealthy route reachable", () => {
    const engine = createGameEngine({ rngSeed: 52 });
    const session = new GameSession(engine);
    session.setStateForTest("features.location.outside", true);
    session.setStateForTest("features.location.world", true);
    session.setStateForTest("stores.wood", 5_001);

    session.triggerEventByKeyForTest("global.thief");
    session.chooseEventButton("spare");
    expect(engine.state.get("game.thieves")).toBe(2);
    expect(engine.state.get('character.perks["stealthy"]')).toBe(true);
    expect(engine.state.get('income["thieves"]')).toBeUndefined();
  });

  it("generates the World before a Nomad Compass can announce its heading", () => {
    const engine = createGameEngine({ rngSeed: 1 });
    const session = new GameSession(engine);
    session.setStateForTest("stores.fur", 300);
    session.setStateForTest("stores.scales", 15);
    session.setStateForTest("stores.teeth", 5);

    session.triggerEventByKeyForTest("room.nomad");
    session.chooseEventButton("buyCompass");
    expect(engine.state.get("game.world.map")).toBeInstanceOf(Array);
    expect(engine.state.get("game.world.ship")).toBeUndefined();
    expect(engine.state.get("game.world.shipPosition.x")).toEqual(
      expect.any(Number),
    );
    expect(engine.state.get("game.world.shipPosition.y")).toEqual(
      expect.any(Number),
    );
    const direction = session.snapshot().path.compassDirection;

    session.chooseEventButton("goodbye");
    session.setLocation("path");
    expect(
      engine.notifications.list().map((notification) => notification.message),
    ).toContain(`the compass points ${direction}`);
  });

  it("suspends passive income throughout Space so score and prestige stay stable", () => {
    const engine = createGameEngine({ rngSeed: 53 });
    const session = new GameSession(engine);
    session.setStateForTest("features.location.outside", true);
    session.setStateForTest("game.population", 10);
    session.setStateForTest("game.workers", {});
    session.setStateForTest("stores.wood", 0);
    session.setStateForTest("features.location.spaceShip", true);
    session.setStateForTest("game.spaceShip.hull", 6);
    session.setStateForTest("game.spaceShip.thrusters", 1);
    session.setRngSequenceForTest(Array(1_000).fill(0.9));
    session.setHyperMode(true);
    expect(session.snapshot().settings.speedMultiplier).toBe(2);

    session.requestShipLiftOff();
    session.confirmShipLiftOff();
    expect(session.snapshot().settings.speedMultiplier).toBe(1);
    for (let step = 0; step < 100; step += 1) session.moveSpace("west");
    session.advanceForTest(60_000);

    expect(session.snapshot().space.phase).toBe("ending");
    expect(session.snapshot().space.score).toBe(300);
    expect(engine.state.get("stores.wood", true)).toBe(0);
    expect(engine.state.get("previous.stores")).toEqual(
      expect.arrayContaining([0]),
    );
  });
});
