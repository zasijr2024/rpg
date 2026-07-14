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

describe("GameSession landmark contracts", () => {
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

  it("commits original mine building unlocks when returning safely to the village", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 1);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();

    engine.state.set("game.world.ironmine", true);
    engine.state.set("game.world.coalmine", true);
    engine.state.set("game.world.sulphurmine", true);
    session.returnFromWorld();

    expect(engine.state.get('game.buildings["iron mine"]')).toBe(1);
    expect(engine.state.get('game.buildings["coal mine"]')).toBe(1);
    expect(engine.state.get('game.buildings["sulphur mine"]')).toBe(1);
    expect(engine.state.get('game.workers["iron miner"]')).toBe(0);
    expect(engine.state.get('game.workers["coal miner"]')).toBe(0);
    expect(engine.state.get('game.workers["sulphur miner"]')).toBe(0);
  });

  it("commits original Ship and Fabricator discovery on safe village return", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();

    engine.state.set("game.world.ship", true);
    engine.state.set("game.world.executioner", true);
    session.returnFromWorld();

    expect(engine.state.get("features.location.spaceShip")).toBe(true);
    expect(engine.state.get("game.spaceShip.hull")).toBe(SHIP_BASE_HULL);
    expect(engine.state.get("game.spaceShip.thrusters")).toBe(
      SHIP_BASE_THRUSTERS,
    );
    expect(engine.state.get("features.location.fabricator")).toBe(true);
    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toContain(
      "builder knows the strange device when she sees it. takes it for herself real quick. doesn't ask where it came from.",
    );
  });

  it("does not overwrite existing Ship state on later safe returns", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("features.location.spaceShip", true);
    engine.state.set("game.spaceShip.hull", 4);
    engine.state.set("game.spaceShip.thrusters", 3);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();

    engine.state.set("game.world.ship", true);
    session.returnFromWorld();

    expect(engine.state.get("game.spaceShip.hull")).toBe(4);
    expect(engine.state.get("game.spaceShip.thrusters")).toBe(3);
  });

  it("applies original mine road and visited-map consequences during active World exploration", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.IRON_MINE;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 35);
    engine.state.set("game.world.y", 33);

    engine.state.set("game.world.ironmine", true);
    session.world.recordLandmarkResolutionForEffect("game.world.ironmine");
    session.update();

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.IRON_MINE}!`);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(
      session
        .snapshot()
        .world.rows.flat()
        .some((cell) => cell.glyph.length > 1),
    ).toBe(false);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("applies mine road and visited consequences after organic World mine clearing", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(30).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.IRON_MINE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);
    engine.state.set("outfit.torch", 1);
    engine.state.set('outfit["grenade"]', 1);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.ironmine",
    });

    session.chooseEventButton("enter");
    session.chooseEventCombatAction("attack:grenade");
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(engine.state.get("game.world.ironmine")).toBe(true);
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.IRON_MINE}!`);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("commits mine building and worker unlocks after organic World mine clearing and safe return", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(50).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.IRON_MINE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("features.location.outside", true);
    engine.state.set("game.population", 1);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 6);
    session.setLocation("path");
    session.increaseSupply("cured meat", 6);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);
    engine.state.set("outfit.torch", 1);
    engine.state.set('outfit["grenade"]', 1);

    session.moveWorld("east");
    session.chooseEventButton("enter");
    session.chooseEventCombatAction("attack:grenade");
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");
    session.chooseEventButton("leave");

    session.moveWorld("west");
    session.moveWorld("west");
    session.moveWorld("west");
    session.moveWorld("west");
    session.moveWorld("west");
    session.moveWorld("north");
    session.moveWorld("north");
    session.moveWorld("north");

    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);
    expect(engine.state.get('game.buildings["iron mine"]')).toBe(1);
    expect(engine.state.get('game.workers["iron miner"]')).toBe(0);
  });

  it("applies coal mine road and visited consequences after organic World mine clearing", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(80).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.COAL_MINE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);
    engine.state.set("game.world.health", 300);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 20);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.coalmine",
    });

    session.chooseEventButton("attack");
    firePlasmaUntilWon(session, 1);
    session.advanceForTest(1000);
    session.chooseEventButton("continue");
    firePlasmaUntilWon(session, 1);
    session.advanceForTest(1000);
    session.chooseEventButton("continue");
    firePlasmaUntilWon(session, 2);
    session.advanceForTest(1000);
    session.chooseEventButton("continue");

    expect(engine.state.get("game.world.coalmine")).toBe(true);
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.COAL_MINE}!`);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("applies sulphur mine road and visited consequences after organic World mine clearing", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(120).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.SULPHUR_MINE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);
    engine.state.set("game.world.health", 300);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.sulphurmine",
    });

    session.chooseEventButton("attack");
    firePlasmaUntilWon(session, 5);
    session.advanceForTest(1000);
    session.chooseEventButton("continue");
    firePlasmaUntilWon(session, 5);
    session.advanceForTest(1000);
    session.chooseEventButton("continue");
    firePlasmaUntilWon(session, 6);
    session.advanceForTest(1000);
    session.chooseEventButton("continue");

    expect(engine.state.get("game.world.sulphurmine")).toBe(true);
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.SULPHUR_MINE}!`);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it.each([
    {
      eventKey: "setpiece.coalmine",
      tile: WORLD_TILE.COAL_MINE,
      flag: "game.world.coalmine",
      building: 'game.buildings["coal mine"]',
      worker: 'game.workers["coal miner"]',
      energyCells: 20,
      attacksByCombat: [1, 1, 2],
      rngCount: 80,
    },
    {
      eventKey: "setpiece.sulphurmine",
      tile: WORLD_TILE.SULPHUR_MINE,
      flag: "game.world.sulphurmine",
      building: 'game.buildings["sulphur mine"]',
      worker: 'game.workers["sulphur miner"]',
      energyCells: 30,
      attacksByCombat: [5, 5, 6],
      rngCount: 120,
    },
  ])(
    "commits $eventKey building and worker unlocks after organic clear and safe return",
    ({
      eventKey,
      tile,
      flag,
      building,
      worker,
      energyCells,
      attacksByCombat,
      rngCount,
    }) => {
      const engine = createGameEngine({
        rng: sequenceRng(Array(rngCount).fill(0)),
      });
      const session = new GameSession(engine);
      const map = terrainMap();

      map[35][33] = tile;
      engine.state.set("config.events.randomDisabled", true);
      engine.state.set("features.location.outside", true);
      engine.state.set("game.population", 1);
      engine.state.set("game.world.map", map, true);
      engine.state.set("stores.compass", 1);
      engine.state.set('stores["cured meat"]', 6);
      session.setLocation("path");
      session.increaseSupply("cured meat", 6);
      session.embark();
      engine.state.set("game.world.x", 34);
      engine.state.set("game.world.y", 33);
      engine.state.set("game.world.health", 300);
      engine.state.set('stores["kinetic armour"]', 1);
      engine.state.set('outfit["plasma rifle"]', 1);
      engine.state.set('outfit["energy cell"]', energyCells);

      session.moveWorld("east");
      expect(session.snapshot().event).toMatchObject({ eventKey });

      const usesCanonicalMineChoices =
        eventKey === "setpiece.coalmine" || eventKey === "setpiece.sulphurmine";
      session.chooseEventButton(usesCanonicalMineChoices ? "attack" : "enter");
      for (const attacksRequired of attacksByCombat) {
        firePlasmaUntilWon(session, attacksRequired);
        session.advanceForTest(1000);
        if (usesCanonicalMineChoices) {
          session.chooseEventButton("continue");
        } else {
          session.chooseEventCombatAction("leave");
        }
      }

      expect(engine.state.get(flag)).toBe(true);
      session.chooseEventButton("leave");
      returnToVillageFromSoutheastMine(session);

      expect(session.snapshot().location).toBe("path");
      expect(session.snapshot().world.active).toBe(false);
      expect(engine.state.get(building)).toBe(1);
      expect(engine.state.get(worker)).toBe(0);
    },
  );

  it.each([
    {
      name: "Iron Mine",
      tile: WORLD_TILE.IRON_MINE,
      eventKey: "setpiece.ironmine",
      flag: "game.world.ironmine",
      building: 'game.buildings["iron mine"]',
      worker: 'game.workers["iron miner"]',
      attacksByCombat: [1],
      energyCells: 0,
      grenades: 1,
    },
    {
      name: "Coal Mine",
      tile: WORLD_TILE.COAL_MINE,
      eventKey: "setpiece.coalmine",
      flag: "game.world.coalmine",
      building: 'game.buildings["coal mine"]',
      worker: 'game.workers["coal miner"]',
      attacksByCombat: [1, 1, 2],
      energyCells: 200,
      grenades: 0,
    },
    {
      name: "Sulphur Mine",
      tile: WORLD_TILE.SULPHUR_MINE,
      eventKey: "setpiece.sulphurmine",
      flag: "game.world.sulphurmine",
      building: 'game.buildings["sulphur mine"]',
      worker: 'game.workers["sulphur miner"]',
      attacksByCombat: [5, 5, 6],
      energyCells: 200,
      grenades: 0,
    },
  ])(
    "reaches a generated $name from the generated map and returns safely",
    ({
      tile,
      eventKey,
      flag,
      building,
      worker,
      attacksByCombat,
      energyCells,
      grenades,
    }) => {
      const engine = createGameEngine({
        rng: sequenceRng(
          Array.from(
            { length: 50_000 },
            (_, index) => (((index + 1) * 9301 + 49297) % 233280) / 233280,
          ),
        ),
      });
      const session = new GameSession(engine);

      engine.state.set("config.events.randomDisabled", true);
      engine.state.set("features.location.outside", true);
      engine.state.set("game.population", 1);
      engine.state.set('game.buildings["trading post"]', 1);
      engine.state.set("stores.fur", 400);
      engine.state.set("stores.scales", 20);
      engine.state.set("stores.teeth", 10);
      engine.state.set('stores["cured meat"]', 40);
      session.update();
      session.buy("compass");

      const generatedMap = engine.state.get("game.world.map") as WorldMapGrid;
      const roadsBeforeClear = roadTileCount(generatedMap);
      const generatedMine = originalWorldMapSearch(tile, generatedMap, 1)?.[0];
      expect(generatedMine).toBeDefined();
      const mineX = WORLD_RADIUS + generatedMine!.x;
      const mineY = WORLD_RADIUS + generatedMine!.y;
      const entry = adjacentEntryFor(mineX, mineY);

      session.setLocation("path");
      session.increaseSupply("cured meat", 20);
      session.embark();
      engine.state.set("game.world.water", 100);
      engine.state.set("game.world.x", entry.x);
      engine.state.set("game.world.y", entry.y);
      engine.state.set("game.world.health", 300);
      engine.state.set('stores["kinetic armour"]', 1);
      if (eventKey === "setpiece.ironmine") {
        engine.state.set("outfit.torch", 1);
      }
      if (grenades > 0) {
        engine.state.set('outfit["grenade"]', grenades);
      }
      if (energyCells > 0) {
        engine.state.set('outfit["plasma rifle"]', 1);
        engine.state.set('outfit["energy cell"]', energyCells);
      }

      session.moveWorld(entry.direction);

      expect(session.snapshot().event).toMatchObject({ eventKey });

      const usesCanonicalMineChoices =
        eventKey === "setpiece.coalmine" || eventKey === "setpiece.sulphurmine";
      session.chooseEventButton(usesCanonicalMineChoices ? "attack" : "enter");
      for (const attacksRequired of attacksByCombat) {
        if (grenades > 0) {
          session.chooseEventCombatAction("attack:grenade");
        } else {
          firePlasmaUntilWonWithin(session, attacksRequired * 10);
        }
        session.advanceForTest(1000);
        if (usesCanonicalMineChoices) {
          session.chooseEventButton("continue");
        } else {
          session.chooseEventCombatAction("leave");
        }
      }

      expect(engine.state.get(flag)).toBe(true);
      const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
      expect(updatedMap[mineX]?.[mineY]).toBe(`${tile}!`);
      expect(roadTileCount(updatedMap)).toBeGreaterThan(roadsBeforeClear);
      const roadHome = roadPathToVillage(updatedMap, { x: mineX, y: mineY });
      const pathHome =
        roadHome.length > 0
          ? roadHome
          : travelPathToVillage(updatedMap, { x: mineX, y: mineY });
      expect(pathHome.length).toBeGreaterThan(0);

      session.chooseEventButton("leave");
      for (const direction of pathHome) {
        session.moveWorld(direction);
      }

      expect(session.snapshot().location).toBe("path");
      expect(session.snapshot().world.active).toBe(false);
      expect(engine.state.get(building)).toBe(1);
      expect(engine.state.get(worker)).toBe(0);
    },
  );

  it("converts cleared original dungeons to road-connected outposts during active World exploration", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.CAVE;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 35);
    engine.state.set("game.world.y", 33);

    engine.state.set("game.world.caveDepthsCleared", true);
    session.world.recordLandmarkResolutionForEffect(
      "game.world.caveDepthsCleared",
    );
    session.update();

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(WORLD_TILE.OUTPOST);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toMatchObject({
      scene: "outpost",
      label: "An Outpost",
    });

    engine.state.set("game.world.water", 3);
    session.enterWorldLandmark();

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.outpost",
      title: "An Outpost",
      sceneKey: "start",
      text: ["a safe place in the wilds."],
      loot: {
        loot: {
          "cured meat": 9,
        },
      },
    });
    expect(engine.state.get("game.world.water")).toBe(10);
    expect(engine.state.get('game.world.usedOutposts["35,33"]')).toBe(true);
    expect(engine.state.get("game.world.outpostUsed", true)).toBe(0);
    expect(engine.state.get("game.world.waterReplenished", true)).toBe(0);
    expect(
      engine.notifications.list("event").map((entry) => entry.message),
    ).toEqual(["a safe place in the wilds.", "water replenished"]);
    expect(session.snapshot().world.landmark).toBeNull();

    session.chooseEventButton("leave");
    session.enterWorldLandmark();

    expect(session.snapshot().event).toBeNull();
  });

  it("converts an organically cleared Cave to a road-connected outpost", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(80).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.CAVE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.increaseSupply("torch", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 10);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.cave",
      title: "A Damp Cave",
      sceneKey: "start",
    });

    session.chooseEventButton("enter");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.cave",
      sceneKey: "a1",
    });
    firePlasmaUntilWon(session, 1);
    session.chooseEventButton("continue");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.cave",
      sceneKey: "b1",
    });

    session.chooseEventButton("continue");
    firePlasmaUntilWon(session, 2);
    session.chooseEventButton("continue");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.cave",
      sceneKey: "end1",
    });
    expect(engine.state.get("game.world.caveDepthsCleared")).toBe(true);

    session.chooseEventButton("leave");

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(WORLD_TILE.OUTPOST);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expectImmediateConvertedOutpostUse(session, engine, 35, 33);
  });

  it("keeps a second Cave enterable after another Cave is cleared", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(80).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.CAVE;
    map[33][30] = WORLD_TILE.CAVE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set("stores.torch", 2);
    engine.state.set('stores["cured meat"]', 3);
    session.setLocation("path");
    session.increaseSupply("cured meat", 3);
    session.increaseSupply("torch", 2);
    session.embark();
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 10);

    session.moveWorld("east");
    session.chooseEventButton("enter");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.cave",
      sceneKey: "a1",
    });
    firePlasmaUntilWon(session, 1);
    session.chooseEventButton("continue");
    session.chooseEventButton("continue");
    firePlasmaUntilWon(session, 2);
    session.chooseEventButton("continue");
    session.chooseEventButton("leave");

    expect(engine.state.get("game.world.caveDepthsCleared")).toBe(true);
    expect(engine.state.get('game.world.resolvedLandmarks["31,30"]')).toBe(
      true,
    );

    session.moveWorld("east");
    session.moveWorld("east");

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[31][30]).toBe(WORLD_TILE.OUTPOST);
    expect(updatedMap[33][30]).toBe(WORLD_TILE.CAVE);
    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.cave",
      sceneKey: "start",
    });
  });

  it("converts an organically cleared canonical Town to a road-connected outpost", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0.5, 0.5, 0.9, 0]),
    });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.TOWN;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set("stores.torch", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.increaseSupply("torch", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.town",
      title: "A Deserted Town",
      sceneKey: "start",
    });

    session.chooseEventButton("enter");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.town",
      sceneKey: "a3",
    });

    session.chooseEventButton("enter");

    expect(engine.state.get("stores.torch", true)).toBe(0);
    expect(engine.state.get("outfit.torch", true)).toBe(0);
    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.town",
      sceneKey: "end5",
      loot: {
        loot: {
          medicine: 2,
        },
      },
    });
    expect(engine.state.get("game.world.townCleared")).toBe(true);

    session.chooseEventLootAction("takeEverything");
    session.chooseEventButton("leave");

    expect(engine.state.get('outfit["medicine"]')).toBe(2);
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(WORLD_TILE.OUTPOST);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expectImmediateConvertedOutpostUse(session, engine, 35, 33);
  });

  it("converts an organically cleared canonical City route to a road-connected outpost", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(120).fill(0)),
    });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.CITY;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 12);
    engine.state.set("game.world.health", 300);
    engine.state.set('stores["kinetic armour"]', 1);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.city",
      title: "A Ruined City",
      sceneKey: "start",
    });

    session.chooseEventButton("enter");
    session.chooseEventButton("continue");
    session.chooseEventButton("enter");

    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "thug",
      phase: "fighting",
    });

    firePlasmaUntilWon(session, 3);
    session.chooseEventButton("continue");

    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "bird",
      phase: "fighting",
    });

    session.advanceForTest(1000);
    firePlasmaUntilWon(session, 4);
    session.chooseEventButton("continue");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.city",
      sceneKey: "end1",
    });
    expect(engine.state.get("game.cityCleared")).toBe(true);
    expect(engine.state.get("game.world.cityCleared")).toBe(true);

    session.chooseEventButton("leave");

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(WORLD_TILE.OUTPOST);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toMatchObject({
      scene: "outpost",
      label: "An Outpost",
    });
  });

  it("converts the cleared executioner battleship to a road-connected outpost", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.EXECUTIONER;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 35);
    engine.state.set("game.world.y", 33);

    engine.state.set("game.world.executionerCleared", true);
    session.world.recordLandmarkResolutionForEffect(
      "game.world.executionerCleared",
    );
    session.update();

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(WORLD_TILE.OUTPOST);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toMatchObject({
      scene: "outpost",
      label: "An Outpost",
    });
  });
});
