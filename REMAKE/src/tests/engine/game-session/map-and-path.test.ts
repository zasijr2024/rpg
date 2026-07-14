/* eslint-disable @typescript-eslint/no-unused-vars -- Contract slices retain shared local fixtures. */
import { describe, expect, it } from "vitest";
import { createGameEngine, GameSession, type Rng } from "../../../engine";
import {
  SHIP_BASE_HULL,
  SHIP_BASE_THRUSTERS,
  originalWorldMapSearch,
  WORLD_RADIUS,
  WORLD_TILE,
  type WorldMapGrid,
} from "../../../content/original";

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

function terrainMap(fill: string = WORLD_TILE.FIELD): WorldMapGrid {
  const size = WORLD_RADIUS * 2 + 1;
  const map = Array.from({ length: size }, () =>
    Array<string>(size).fill(fill),
  );
  map[WORLD_RADIUS][WORLD_RADIUS] = WORLD_TILE.VILLAGE;
  return map;
}

function firePlasmaUntilWon(
  session: GameSession,
  attacksRequired: number,
): void {
  for (let attack = 0; attack < attacksRequired; attack += 1) {
    if (attack > 0) {
      session.advanceForTest(1000);
    }
    session.chooseEventCombatAction("attack:plasma rifle");
  }
  expect(session.snapshot().event?.combat?.phase).toBe("won");
}

function firePlasmaUntilWonWithin(
  session: GameSession,
  maxAttacks: number,
): void {
  let attacks = 0;
  while (
    session.snapshot().event?.combat?.phase === "fighting" &&
    attacks < maxAttacks
  ) {
    if (attacks > 0) {
      session.advanceForTest(1000);
    }
    session.chooseEventCombatAction("attack:plasma rifle");
    attacks += 1;
  }
  expect(attacks).toBeLessThan(maxAttacks);
  expect(session.snapshot().event?.combat?.phase).toBe("won");
}

function firePlasmaUntilWonWithHypo(
  session: GameSession,
  maxActions: number,
): void {
  let actions = 0;
  while (
    session.snapshot().event?.combat?.phase === "fighting" &&
    actions < maxActions
  ) {
    const combat = session.snapshot().event?.combat;
    if (!combat) break;
    const hypo = combat.actions.find(
      (action) => action.key === "heal:hypo" && !action.disabled,
    );
    const shield = combat.actions.find(
      (action) => action.key === "shield" && !action.disabled,
    );
    if (
      (combat.enemyStatus === "energised" ||
        combat.enemyStatus === "venomous" ||
        combat.enemyStatus === "meditation") &&
      shield
    ) {
      session.chooseEventCombatAction("shield");
    } else if (combat.playerHp <= 35 && hypo) {
      session.chooseEventCombatAction("heal:hypo");
    } else {
      session.chooseEventCombatAction("attack:plasma rifle");
    }
    if (session.snapshot().event?.combat?.phase === "fighting") {
      session.advanceForTest(1000);
    }
    actions += 1;
  }
  expect(actions).toBeLessThan(maxActions);
  expect(session.snapshot().event?.combat?.phase).toBe("won");
}

function firePlasmaUntilWonOrExplodedWithHypo(
  session: GameSession,
  maxActions: number,
): void {
  let actions = 0;
  while (
    session.snapshot().event?.combat?.phase === "fighting" &&
    actions < maxActions
  ) {
    const combat = session.snapshot().event?.combat;
    if (!combat) break;
    const hypo = combat.actions.find(
      (action) => action.key === "heal:hypo" && !action.disabled,
    );
    const shield = combat.actions.find(
      (action) => action.key === "shield" && !action.disabled,
    );
    if (
      (combat.enemyStatus === "energised" ||
        combat.enemyStatus === "venomous" ||
        combat.enemyStatus === "meditation") &&
      shield
    ) {
      session.chooseEventCombatAction("shield");
    } else if (combat.playerHp <= 35 && hypo) {
      session.chooseEventCombatAction("heal:hypo");
    } else {
      session.chooseEventCombatAction("attack:plasma rifle");
    }
    if (session.snapshot().event?.combat?.phase === "fighting") {
      session.advanceForTest(1000);
    }
    actions += 1;
  }
  expect(actions).toBeLessThan(maxActions);
  if (session.snapshot().event?.combat?.phase === "exploding") {
    session.advanceForTest(3000);
  }
  expect(session.snapshot().event?.combat?.phase).toBe("won");
}

function returnToVillageFromSoutheastMine(session: GameSession): void {
  session.moveWorld("west");
  session.moveWorld("west");
  session.moveWorld("west");
  session.moveWorld("west");
  session.moveWorld("west");
  session.moveWorld("north");
  session.moveWorld("north");
  session.moveWorld("north");
}

type TestWorldMoveDirection = Parameters<GameSession["moveWorld"]>[0];

function adjacentEntryFor(
  x: number,
  y: number,
): { x: number; y: number; direction: TestWorldMoveDirection } {
  if (x > 0) return { x: x - 1, y, direction: "east" };
  if (x < WORLD_RADIUS * 2) return { x: x + 1, y, direction: "west" };
  if (y > 0) return { x, y: y - 1, direction: "south" };
  return { x, y: y + 1, direction: "north" };
}

function roadPathToVillage(
  map: WorldMapGrid,
  start: { x: number; y: number },
): TestWorldMoveDirection[] {
  return pathToVillage(map, start, (tile) => {
    return tile === WORLD_TILE.ROAD || tile === WORLD_TILE.VILLAGE;
  });
}

function travelPathToVillage(
  map: WorldMapGrid,
  start: { x: number; y: number },
): TestWorldMoveDirection[] {
  return pathToVillage(map, start, (tile) => {
    return (
      tile === WORLD_TILE.ROAD ||
      tile === WORLD_TILE.VILLAGE ||
      tile === WORLD_TILE.FOREST ||
      tile === WORLD_TILE.FIELD ||
      tile === WORLD_TILE.BARRENS
    );
  });
}

function pathToVillage(
  map: WorldMapGrid,
  start: { x: number; y: number },
  canEnter: (tile: string | undefined) => boolean,
): TestWorldMoveDirection[] {
  const key = (x: number, y: number) => `${x},${y}`;
  const queue: { x: number; y: number }[] = [start];
  const seen = new Set([key(start.x, start.y)]);
  const previous = new Map<
    string,
    {
      from: string;
      direction: TestWorldMoveDirection;
    }
  >();
  const directions: readonly {
    direction: TestWorldMoveDirection;
    dx: number;
    dy: number;
  }[] = [
    { direction: "north", dx: 0, dy: -1 },
    { direction: "south", dx: 0, dy: 1 },
    { direction: "west", dx: -1, dy: 0 },
    { direction: "east", dx: 1, dy: 0 },
  ];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (!current) break;
    if (map[current.x]?.[current.y] === WORLD_TILE.VILLAGE) {
      const path: TestWorldMoveDirection[] = [];
      let cursor = key(current.x, current.y);
      while (cursor !== key(start.x, start.y)) {
        const step = previous.get(cursor);
        if (!step) break;
        path.unshift(step.direction);
        cursor = step.from;
      }
      return path;
    }

    for (const { direction, dx, dy } of directions) {
      const nextX = current.x + dx;
      const nextY = current.y + dy;
      if (
        nextX < 0 ||
        nextY < 0 ||
        nextX > WORLD_RADIUS * 2 ||
        nextY > WORLD_RADIUS * 2
      ) {
        continue;
      }
      const tile = map[nextX]?.[nextY];
      if (!canEnter(tile)) continue;
      const nextKey = key(nextX, nextY);
      if (seen.has(nextKey)) continue;
      seen.add(nextKey);
      previous.set(nextKey, {
        from: key(current.x, current.y),
        direction,
      });
      queue.push({ x: nextX, y: nextY });
    }
  }

  return [];
}

function roadTileCount(map: WorldMapGrid): number {
  return map.flat().filter((tile) => tile === WORLD_TILE.ROAD).length;
}

function expectImmediateConvertedOutpostUse(
  session: GameSession,
  engine: ReturnType<typeof createGameEngine>,
  x: number,
  y: number,
): void {
  expect(session.snapshot().world.landmark).toMatchObject({
    scene: "outpost",
    label: "An Outpost",
  });

  engine.state.set("game.world.water", 3);
  session.enterWorldLandmark();

  expect(session.snapshot().event).toMatchObject({
    eventKey: "setpiece.outpost",
    title: "An Outpost",
  });
  expect(engine.state.get("game.world.water")).toBe(10);
  expect(engine.state.get(`game.world.usedOutposts["${x},${y}"]`)).toBe(true);
  expect(engine.state.get("game.world.outpostUsed", true)).toBe(0);
  expect(session.snapshot().world.landmark).toBeNull();

  session.chooseEventButton("leave");
  session.enterWorldLandmark();

  expect(session.snapshot().event).toBeNull();
}

describe("GameSession map and path contracts", () => {
  it("opens Path and emits compass direction when Compass is bought", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set('game.buildings["trading post"]', 1);
    engine.state.set("stores.fur", 400);
    engine.state.set("stores.scales", 20);
    engine.state.set("stores.teeth", 10);
    engine.state.set("game.world.shipPosition.x", -28);
    engine.state.set("game.world.shipPosition.y", 20);
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
    expect(engine.state.get("game.world.shipPosition.x")).toEqual(
      expect.any(Number),
    );
    expect(engine.state.get("game.world.shipPosition.y")).toEqual(
      expect.any(Number),
    );
    expect(session.snapshot().path.compassDirection).toMatch(
      /^(north|south|east|west|northeast|northwest|southeast|southwest)$/,
    );
  });

  it("renders the original full World map through the persisted visibility mask", () => {
    const size = WORLD_RADIUS * 2 + 1;
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap(WORLD_TILE.BARRENS);
    const mask = Array.from({ length: size }, () =>
      Array<boolean>(size).fill(false),
    );

    map[0][0] = WORLD_TILE.ROAD;
    map[1][0] = `${WORLD_TILE.IRON_MINE}!`;
    map[3][0] = WORLD_TILE.CAVE;
    mask[0][0] = true;
    mask[1][0] = true;
    mask[3][0] = true;
    mask[WORLD_RADIUS][WORLD_RADIUS] = true;

    engine.state.set("features.location.world", true);
    engine.state.set("game.world.active", true);
    engine.state.set("game.world.x", 2);
    engine.state.set("game.world.y", 2);
    engine.state.set("game.world.map", map, true);
    engine.state.set("game.world.mask", mask, true);

    const rows = session.snapshot().world.rows;

    expect(rows).toHaveLength(size);
    expect(rows.every((row) => row.length === size)).toBe(true);
    expect(rows[0][0]).toMatchObject({
      x: 0,
      y: 0,
      glyph: WORLD_TILE.ROAD,
      visible: true,
      current: false,
    });
    expect(rows[0][1]).toMatchObject({
      x: 1,
      y: 0,
      glyph: WORLD_TILE.IRON_MINE,
      visible: true,
      current: false,
    });
    expect(rows[0][1].label).toBeUndefined();
    expect(rows[0][2]).toMatchObject({
      glyph: " ",
      visible: false,
      current: false,
    });
    expect(rows[0][3]).toMatchObject({
      glyph: WORLD_TILE.CAVE,
      visible: true,
      current: false,
      label: "A Damp Cave",
    });
    expect(rows[2][2]).toMatchObject({
      x: 2,
      y: 2,
      glyph: "@",
      visible: false,
      current: true,
      label: "Wanderer",
    });
    expect(rows[WORLD_RADIUS][WORLD_RADIUS]).toMatchObject({
      glyph: WORLD_TILE.VILLAGE,
      visible: true,
      current: false,
      label: "The Village",
    });
  });

  it("applies original Scout map purchases through the World mask bridge", () => {
    const size = WORLD_RADIUS * 2 + 1;
    const engine = createGameEngine({ rng: sequenceRng([0, 0]) });
    const session = new GameSession(engine);
    const mask = Array.from({ length: size }, () =>
      Array<boolean>(size).fill(true),
    );
    mask[0][0] = false;
    mask[0][1] = false;
    mask[1][0] = false;
    mask[1][1] = false;

    engine.state.set("features.location.world", true);
    engine.state.set("game.world.mask", mask, true);
    engine.state.set("stores.fur", 200);
    engine.state.set("stores.scales", 10);
    session.triggerEventByKeyForTest("room.scout");

    expect(
      session.snapshot().event?.buttons.map((button) => button.key),
    ).toEqual(["buyMap", "learn", "leave"]);

    session.chooseEventButton("buyMap");

    expect(engine.state.get("stores.fur", true)).toBe(0);
    expect(engine.state.get("stores.scales", true)).toBe(0);
    expect(engine.state.get("game.world.seenAll")).toBe(true);
    const revealedMask = engine.state.get(
      "game.world.mask",
      true,
    ) as boolean[][];
    expect(revealedMask.flat().every((visible) => visible === true)).toBe(true);
    expect(engine.notifications.list("event").at(-1)?.message).toBe(
      "the map uncovers a bit of the world",
    );
    expect(
      session.snapshot().event?.buttons.map((button) => button.key),
    ).toEqual(["learn", "leave"]);
  });

  it("tests World map completion on safe village return after exploration", () => {
    const size = WORLD_RADIUS * 2 + 1;
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const mask = Array.from({ length: size }, () =>
      Array<boolean>(size).fill(true),
    );
    mask[WORLD_RADIUS + 1][WORLD_RADIUS] = false;

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", terrainMap(), true);
    engine.state.set("game.world.mask", mask, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();

    session.moveWorld("east");

    expect(engine.state.get("game.world.seenAll", true)).toBe(0);

    session.moveWorld("west");
    session.returnFromWorld();

    expect(engine.state.get("game.world.seenAll")).toBe(true);
    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);
  });

  it("emits original terrain transition notifications while moving in World", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[WORLD_RADIUS][WORLD_RADIUS] = WORLD_TILE.FOREST;
    map[WORLD_RADIUS + 1][WORLD_RADIUS] = WORLD_TILE.FIELD;
    map[WORLD_RADIUS + 2][WORLD_RADIUS] = WORLD_TILE.BARRENS;
    map[WORLD_RADIUS + 3][WORLD_RADIUS] = WORLD_TILE.FOREST;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 10);
    session.setLocation("path");
    session.increaseSupply("cured meat", 10);
    session.embark();
    engine.state.set("game.world.water", 20);

    session.moveWorld("east");
    session.moveWorld("east");
    session.moveWorld("east");
    session.moveWorld("west");
    session.moveWorld("west");
    session.moveWorld("west");

    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toEqual([
      "the trees yield to dry grass. the yellowed brush rustles in the wind.",
      "the grasses thin. soon, only dust remains.",
      "a wall of gnarled trees rises from the dust. their branches twist into a skeletal canopy overhead.",
      "the trees are gone. parched earth and blowing dust are poor replacements.",
      "the barrens break at a sea of dying grass, swaying in the arid breeze.",
      "trees loom on the horizon. grasses gradually yield to a forest floor of dry branches and fallen leaves.",
    ]);
  });

  it("does not tick World supplies when entering landmark tiles", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[WORLD_RADIUS + 1][WORLD_RADIUS] = WORLD_TILE.OUTPOST;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();

    session.moveWorld("east");
    session.moveWorld("west");

    expect(engine.state.get("game.world.foodMove", true)).toBe(0);
    expect(engine.state.get("game.world.waterMove", true)).toBe(0);
    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
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
});
