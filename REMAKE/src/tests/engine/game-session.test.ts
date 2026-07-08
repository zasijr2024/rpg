import { describe, expect, it } from "vitest";
import { createGameEngine, GameSession, type Rng } from "../../engine";

function sequenceRng(values: number[]): Rng {
  let index = 0;
  return {
    next: () => values[Math.min(index++, values.length - 1)] ?? 0,
    nextInt: (maxExclusive) =>
      Math.floor(
        (values[Math.min(index++, values.length - 1)] ?? 0) * maxExclusive,
      ),
    fork: () => sequenceRng(values),
  };
}

describe("GameSession world recovery", () => {
  it("consumes safe combat return markers as a pending Path handoff", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0)) });
    const session = new GameSession(engine);

    engine.state.set('outfit["grenade"]', 1);
    session.triggerWorldEncounter({ distance: 6, terrain: "forest" });

    expect(session.snapshot().event).toMatchObject({
      eventKey: "encounter.snarling-beast",
    });

    session.chooseEventCombatAction("attack:grenade");
    session.advanceForTest(1000);
    session.chooseEventCombatAction("takeEverything");
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toBeNull();
    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get("game.world.lastReturnLocation")).toBe("path");
    expect(engine.state.get("features.location.path")).toBe(true);
    expect(engine.state.get("game.path.pendingReturn", true)).toBe(0);
    expect(engine.state.get('stores["fur"]')).toBe(1);
  });

  it("consumes combat death return markers and keeps the session in the room", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0)) });
    const session = new GameSession(engine);

    engine.state.set("features.location.outside", true);
    session.setLocation("outside");
    engine.state.set("character.health", 1);
    engine.state.set('outfit["cured meat"]', 2);
    session.triggerWorldEncounter({ distance: 6, terrain: "forest" });

    session.advanceForTest(1000);

    expect(session.snapshot().event).toBeNull();
    expect(session.snapshot().location).toBe("room");
    expect(engine.state.get("character.dead")).toBe(true);
    expect(engine.state.get("game.world.dead")).toBe(true);
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get("game.world.lastReturnLocation")).toBe("room");
    expect(engine.state.get("game.path.pendingReturn", true)).toBe(0);
  });

  it("unlocks Path from compass, outfits supplies, embarks, moves, and returns through visible session state", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 3);
    session.update();

    expect(session.snapshot().path).toMatchObject({
      unlocked: true,
      title: "A Dusty Path",
      canEmbark: false,
    });

    session.setLocation("path");
    session.increaseSupply("cured meat", 2);

    expect(session.snapshot().path).toMatchObject({
      canEmbark: true,
      free: 8,
    });

    session.embark();
    expect(session.snapshot().location).toBe("world");
    expect(session.snapshot().world).toMatchObject({
      active: true,
      x: 30,
      y: 30,
      water: 10,
      food: 2,
    });
    expect(engine.state.get('stores["cured meat"]')).toBe(1);

    session.moveWorld("east");
    expect(session.snapshot().world).toMatchObject({
      x: 31,
      y: 30,
      distance: 1,
    });

    session.moveWorld("west");
    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);
    expect(engine.state.get('stores["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
  });

  it("preserves remaining carried supplies across repeated safe expeditions without duplication", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 3);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);

    session.embark();
    expect(engine.state.get('stores["cured meat"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);

    session.moveWorld("east");
    session.moveWorld("west");
    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(engine.state.get('stores["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);

    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(engine.state.get('stores["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);

    session.embark();

    expect(session.snapshot().location).toBe("world");
    expect(engine.state.get('stores["cured meat"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);

    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(engine.state.get('stores["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
  });

  it("prevents re-embark after all carried cured meat is consumed before returning", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();

    session.moveWorld("east");
    session.moveWorld("west");
    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().path.canEmbark).toBe(false);
    expect(engine.state.get('stores["cured meat"]', true)).toBe(0);
    expect(engine.state.get('outfit["cured meat"]')).toBe(0);

    session.embark();

    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);
  });

  it("uses original compass direction data for Path reveal messaging", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set("game.world.ship.x", 28);
    engine.state.set("game.world.ship.y", -20);
    session.setLocation("path");

    expect(session.snapshot().path.compassDirection).toBe("northeast");
    expect(engine.notifications.list("room").at(-1)?.message).toBe(
      "the compass points northeast",
    );
  });

  it("uses stored compass direction before full ship placement exists", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set("game.world.shipDirection", "southwest");
    session.setLocation("path");

    expect(session.snapshot().path.compassDirection).toBe("southwest");
    expect(engine.notifications.list("room").at(-1)?.message).toBe(
      "the compass points southwest",
    );
  });

  it("opens Path and emits compass direction when Compass is bought", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set('game.buildings["trading post"]', 1);
    engine.state.set("stores.fur", 400);
    engine.state.set("stores.scales", 20);
    engine.state.set("stores.teeth", 10);
    engine.state.set("game.world.ship.x", -28);
    engine.state.set("game.world.ship.y", 20);
    session.update();

    session.buy("compass");

    expect(engine.state.get("stores.compass")).toBe(1);
    expect(engine.state.get("stores.fur", true)).toBe(0);
    expect(engine.state.get("stores.scales", true)).toBe(0);
    expect(engine.state.get("stores.teeth", true)).toBe(0);
    expect(session.snapshot().path).toMatchObject({
      unlocked: true,
      compassDirection: "southwest",
    });
    expect(
      engine.notifications.list("room").map((item) => item.message),
    ).toEqual(["the compass points southwest"]);

    session.setLocation("path");

    expect(
      engine.notifications.list("room").map((item) => item.message),
    ).toEqual(["the compass points southwest"]);
  });

  it("generates original World map, mask, and ship direction on Compass purchase", () => {
    const engine = createGameEngine({
      rng: sequenceRng(
        Array.from(
          { length: 50_000 },
          (_, index) => (((index + 1) * 9301 + 49297) % 233280) / 233280,
        ),
      ),
    });
    const session = new GameSession(engine);

    engine.state.set('game.buildings["trading post"]', 1);
    engine.state.set("stores.fur", 400);
    engine.state.set("stores.scales", 20);
    engine.state.set("stores.teeth", 10);
    session.update();

    session.buy("compass");

    const map = engine.state.get("game.world.map");
    const mask = engine.state.get("game.world.mask");

    expect(Array.isArray(map)).toBe(true);
    expect(Array.isArray(mask)).toBe(true);
    expect(engine.state.get("game.world.ship.x")).toEqual(expect.any(Number));
    expect(engine.state.get("game.world.ship.y")).toEqual(expect.any(Number));
    expect(session.snapshot().path.compassDirection).toMatch(
      /^(north|south|east|west|northeast|northwest|southeast|southwest)$/,
    );
  });

  it("renders Path supplies in original name order with tooltip metadata", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["laser rifle"]', 1);
    engine.state.set('stores["energy cell"]', 5);
    engine.state.set('stores["cured meat"]', 3);
    engine.state.set('stores["glowstone"]', 1);
    session.update();

    expect(
      session.snapshot().path.supplies.map((supply) => supply.name),
    ).toEqual(["cured meat", "energy cell", "glow stone", "laser rifle"]);
    expect(
      session
        .snapshot()
        .path.supplies.find((supply) => supply.key === "cured meat"),
    ).toMatchObject({
      type: "tool",
      desc: "restores 8 hp",
      weight: 1,
    });
    expect(
      session
        .snapshot()
        .path.supplies.find((supply) => supply.key === "laser rifle"),
    ).toMatchObject({
      type: "weapon",
      damage: 8,
      weight: 5,
    });
  });

  it("rejects non-carryable supplies through the Path command boundary", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set("stores.wood", 100);
    engine.state.set("stores.fur", 100);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");

    session.increaseSupply("wood", 10);
    session.increaseSupply("fur", 10);
    session.increaseSupply("cured meat", 1);

    expect(engine.state.get("outfit.wood", true)).toBe(0);
    expect(engine.state.get("outfit.fur", true)).toBe(0);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(
      session.snapshot().path.supplies.map((supply) => supply.key),
    ).toEqual(["cured meat"]);
  });

  it("clamps Path outfit amounts to available stores before embark", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    engine.state.set('stores["bullets"]', 0);
    engine.state.set('outfit["cured meat"]', 5);
    engine.state.set('outfit["bullets"]', -3);
    session.setLocation("path");

    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["bullets"]')).toBe(0);
    expect(session.snapshot().path).toMatchObject({
      canEmbark: true,
      used: 2,
      free: 8,
    });

    session.embark();

    expect(session.snapshot().location).toBe("world");
    expect(engine.state.get('stores["cured meat"]', true)).toBe(0);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
  });

  it("keeps many-controls enabled whenever one-step controls are possible", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");

    expect(
      session
        .snapshot()
        .path.supplies.find((supply) => supply.key === "cured meat"),
    ).toMatchObject({
      canIncrease: true,
      canIncreaseMany: true,
      canDecrease: false,
      canDecreaseMany: false,
    });

    session.increaseSupply("cured meat", 10);

    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(
      session
        .snapshot()
        .path.supplies.find((supply) => supply.key === "cured meat"),
    ).toMatchObject({
      canIncrease: false,
      canIncreaseMany: false,
      canDecrease: true,
      canDecreaseMany: true,
    });

    session.decreaseSupply("cured meat", 10);

    expect(engine.state.get('outfit["cured meat"]')).toBe(0);
  });

  it("does not clamp carried supplies while a World expedition is active", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();

    session.update();

    expect(session.snapshot().location).toBe("world");
    expect(engine.state.get('stores["cured meat"]', true)).toBe(0);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
  });

  it("applies original capacity, armour, and water upgrade priority in Path and World", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set("stores.rucksack", 1);
    engine.state.set("stores.wagon", 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set('stores["cargo drone"]', 1);
    engine.state.set("stores.waterskin", 1);
    engine.state.set("stores.cask", 1);
    engine.state.set('stores["water tank"]', 1);
    engine.state.set('stores["fluid recycler"]', 1);
    engine.state.set('stores["l armour"]', 1);
    engine.state.set('stores["i armour"]', 1);
    engine.state.set('stores["s armour"]', 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");

    expect(session.snapshot().path).toMatchObject({
      capacity: 110,
      armour: "kinetic",
      water: 110,
    });

    session.increaseSupply("cured meat", 1);
    session.embark();

    expect(session.snapshot().world).toMatchObject({
      maxHp: 85,
      hp: 85,
      maxWater: 110,
      water: 110,
    });
  });

  it("uses original safe return rules for outfit and stores at the village", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    engine.state.set('stores["laser rifle"]', 1);
    engine.state.set('stores["alien alloy"]', 1);
    engine.state.set('stores["charm"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.increaseSupply("laser rifle", 1);
    session.increaseSupply("alien alloy", 1);
    session.increaseSupply("charm", 1);
    session.embark();

    engine.state.set('outfit["fleet beacon"]', 1);
    session.returnFromWorld();

    expect(engine.state.get('stores["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get('stores["laser rifle"]')).toBe(1);
    expect(engine.state.get('outfit["laser rifle"]')).toBe(1);
    expect(engine.state.get('stores["alien alloy"]')).toBe(1);
    expect(engine.state.get('outfit["alien alloy"]')).toBe(0);
    expect(engine.state.get('stores["charm"]')).toBe(1);
    expect(engine.state.get('outfit["charm"]')).toBe(1);
    expect(engine.state.get('stores["fleet beacon"]')).toBe(1);
    expect(engine.state.get('outfit["fleet beacon"]')).toBe(0);
  });
});
