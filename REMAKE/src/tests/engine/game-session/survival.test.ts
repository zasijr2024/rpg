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

describe("GameSession survival contracts", () => {
  it("applies original crashed ship road and visited-map consequences during active World exploration", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.SHIP;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 35);
    engine.state.set("game.world.y", 33);

    engine.state.set("game.world.ship", true);
    engine.state.set("game.world.crashedShipVisited", true);
    session.world.recordLandmarkResolutionForEffect(
      "game.world.crashedShipVisited",
    );
    session.update();

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.SHIP}!`);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("applies crashed ship road and visited consequences after organic World discovery", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.SHIP;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.ship",
      title: "A Crashed Ship",
    });
    expect(engine.state.get("game.world.ship")).toBe(true);
    expect(engine.state.get("game.world.crashedShipVisited")).toBe(true);

    session.chooseEventButton("leavel");

    expect(session.snapshot().event).toBeNull();
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.SHIP}!`);
    expect(updatedMap[30][31]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[30][33]).toBe(WORLD_TILE.ROAD);
    expect(updatedMap[34][33]).toBe(WORLD_TILE.ROAD);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("takes organic Borehole salvage and marks the landmark visited", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.5]) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.BOREHOLE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.borehole",
      title: "A Huge Borehole",
      loot: {
        loot: {
          "alien alloy": 2,
        },
      },
    });
    expect(engine.state.get("game.world.boreholeVisited")).toBe(true);

    session.chooseEventLootAction("takeEverything");
    session.chooseEventButton("leave");

    expect(engine.state.get('outfit["alien alloy"]')).toBe(2);
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.BOREHOLE}!`);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("takes organic Battlefield salvage and marks the landmark visited", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.BATTLEFIELD;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.battlefield",
      title: "A Forgotten Battlefield",
      loot: {
        loot: {
          rifle: 1,
          bullets: 5,
          "laser rifle": 1,
          "energy cell": 5,
          grenade: 1,
          "alien alloy": 1,
        },
      },
    });
    expect(engine.state.get("game.world.battlefieldVisited")).toBe(true);

    session.chooseEventLootAction("take:rifle");
    session.chooseEventLootAction("take:bullets");
    session.chooseEventLootAction("take:energy cell");
    session.chooseEventButton("leave");

    expect(engine.state.get('outfit["rifle"]')).toBe(1);
    expect(engine.state.get('outfit["bullets"]')).toBe(1);
    expect(engine.state.get('outfit["energy cell"]')).toBe(1);
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.BATTLEFIELD}!`);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("collects organic Destroyed Village cache and marks the landmark visited", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();
    const prestigeStores = [
      5, 2, 0, 4, 0, 0, 1, 3, 0, 6, 2, 1, 1, 8, 1, 0, 0, 0, 1, 0, 7, 0, 2, 1,
    ];

    map[35][33] = WORLD_TILE.CACHE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("previous.stores", prestigeStores, true);
    engine.state.set("stores.compass", 1);
    engine.state.set("stores.wood", 3);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.cache",
      title: "A Destroyed Village",
    });

    session.chooseEventButton("enter");
    session.chooseEventButton("take");

    expect(engine.state.get("game.world.destroyedVillageVisited")).toBe(true);
    expect(engine.state.get("game.world.cacheCollected")).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(8);
    expect(engine.state.get('stores["cured meat"]')).toBe(3);
    expect(engine.state.get('stores["rifle"]')).toBe(1);
    expect(engine.state.get('stores["bullets"]')).toBe(7);
    expect(engine.state.get('stores["grenade"]')).toBe(2);
    expect(engine.state.get("previous.stores", true)).toEqual([]);

    session.chooseEventButton("leave");

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.CACHE}!`);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("takes organic Swamp wanderer perk and marks the landmark visited", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.SWAMP;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set("stores.charm", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.increaseSupply("charm", 1);
    session.embark();
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.swamp",
      title: "A Murky Swamp",
      sceneKey: "start",
      text: [
        "rotting reeds rise out of the swampy earth.",
        "a lone frog sits in the muck, silently.",
      ],
    });

    session.chooseEventButton("enter");

    expect(session.snapshot().event).toMatchObject({
      sceneKey: "cabin",
      text: [
        "deep in the swamp is a moss-covered cabin.",
        "an old wanderer sits inside, in a seeming trance.",
      ],
    });

    session.chooseEventButton("talk");

    expect(engine.state.get("stores.charm", true)).toBe(0);
    expect(engine.state.get("outfit.charm", true)).toBe(0);
    expect(engine.state.get('character.perks["gastronome"]')).toBe(true);
    expect(engine.state.get("game.world.swampVisited")).toBe(true);
    expect(engine.state.get('game.world.resolvedLandmarks["35,33"]')).toBe(
      true,
    );
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "talk",
      text: [
        "the wanderer takes the charm and nods slowly.",
        "he speaks of once leading the great fleets to fresh worlds.",
        "unfathomable destruction to fuel wanderer hungers.",
        "his time here, now, is his penance.",
      ],
    });

    session.chooseEventButton("leave");

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.SWAMP}!`);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("takes organic Old House supplies and replenishes active World water", () => {
    const engine = createGameEngine({
      rng: sequenceRng([0, 0, 0.3, 0, 0, 0, 0, 0, 0]),
    });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[35][33] = WORLD_TILE.HOUSE;
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.water", 3);
    engine.state.set("game.world.x", 34);
    engine.state.set("game.world.y", 33);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.house",
      title: "An Old House",
    });

    session.chooseEventButton("enter");

    expect(session.snapshot().event).toMatchObject({
      sceneKey: "supplies",
      loot: {
        loot: {
          "cured meat": 1,
          leather: 1,
          cloth: 1,
        },
      },
    });
    expect(engine.state.get("game.world.oldHouseVisited")).toBe(true);
    expect(engine.state.get("game.world.water")).toBe(10);
    expect(engine.state.get("game.world.waterReplenished", true)).toBe(0);

    session.chooseEventLootAction("takeEverything");
    session.chooseEventButton("leave");

    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["leather"]')).toBe(1);
    expect(engine.state.get('outfit["cloth"]')).toBe(1);
    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[35][33]).toBe(`${WORLD_TILE.HOUSE}!`);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("applies original visited marker and water replenishment for non-dungeon landmarks", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.HOUSE;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    session.moveWorld("east");
    engine.state.set("game.world.water", 3);

    engine.state.set("game.world.oldHouseVisited", true);
    session.world.recordLandmarkResolutionForEffect(
      "game.world.oldHouseVisited",
    );
    engine.state.set("game.world.waterReplenished", true);
    session.update();

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[31][30]).toBe(`${WORLD_TILE.HOUSE}!`);
    expect(engine.state.get("game.world.water")).toBe(10);
    expect(engine.state.get("game.world.waterReplenished", true)).toBe(0);
    expect(session.snapshot().world.landmark).toBeNull();
  });

  it("uses active outposts once and hides them from further landmark entry", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.OUTPOST;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    engine.state.set("game.world.water", 3);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.outpost",
    });
    expect(engine.state.get("game.world.water")).toBe(10);
    expect(engine.state.get('game.world.usedOutposts["31,30"]')).toBe(true);
    expect(engine.state.get("game.world.outpostUsed", true)).toBe(0);
    expect(session.snapshot().world.landmark).toBeNull();

    session.chooseEventButton("leave");
    session.enterWorldLandmark();

    expect(session.snapshot().event).toBeNull();
  });

  it("takes organic Outpost supplies while marking the outpost used for the expedition", () => {
    const engine = createGameEngine({ rng: sequenceRng([0, 0.4]) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.OUTPOST;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    engine.state.set("game.world.water", 3);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.outpost",
      loot: {
        loot: {
          "cured meat": 7,
        },
      },
    });
    expect(engine.state.get("game.world.water")).toBe(10);
    expect(engine.state.get('game.world.usedOutposts["31,30"]')).toBe(true);

    session.chooseEventLootAction("takeEverything");

    expect(engine.state.get('outfit["cured meat"]')).toBe(9);
    expect(session.snapshot().event?.loot?.loot).toEqual({});
  });

  it("resets used outposts for each safe World expedition", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.OUTPOST;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 3);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.outpost",
    });
    expect(engine.state.get('game.world.usedOutposts["31,30"]')).toBe(true);

    session.chooseEventButton("leave");
    session.moveWorld("west");
    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);

    session.embark();

    expect(engine.state.get("game.world.usedOutposts", true)).toBe(0);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "setpiece.outpost",
    });
  });

  it("applies original World meat healing and gastronome bonus while travelling", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set('character.perks["gastronome"]', true);
    engine.state.set('stores["l armour"]', 1);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 3);
    session.setLocation("path");
    session.increaseSupply("cured meat", 3);
    session.embark();
    engine.state.set("game.world.health", 1);
    engine.state.set("game.world.water", 20);

    session.moveWorld("east");
    session.moveWorld("north");

    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(engine.state.get("game.world.health")).toBe(15);
  });

  it("uses original slow metabolism movement cadence for World food", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set('character.perks["slow metabolism"]', true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set("game.world.water", 20);

    session.moveWorld("east");
    session.moveWorld("north");

    expect(engine.state.get('outfit["cured meat"]')).toBe(1);
    expect(engine.state.get("game.world.foodMove")).toBe(2);

    session.moveWorld("south");
    session.moveWorld("east");

    expect(engine.state.get('outfit["cured meat"]')).toBe(0);
    expect(engine.state.get("game.world.foodMove")).toBe(0);
  });

  it("kills the traveller on repeated World starvation and returns to the room", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    engine.state.set('outfit["cured meat"]', 0);
    engine.state.set("game.world.water", 20);

    session.moveWorld("east");
    session.moveWorld("north");

    expect(engine.state.get("game.world.starvation")).toBe(true);
    expect(session.snapshot().location).toBe("world");

    session.moveWorld("south");
    session.moveWorld("east");

    expect(session.snapshot().location).toBe("room");
    expect(session.snapshot().world.active).toBe(false);
    expect(engine.state.get("character.dead")).toBe(true);
    expect(engine.state.get("game.world.dead")).toBe(true);
    expect(engine.state.get("character.starved")).toBe(1);
    expect(engine.state.get("outfit", true)).toBe(0);
    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toContain("the world fades");
  });

  it("unlocks desert rat after the tenth World dehydration death", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set("character.dehydrated", 9);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    engine.state.set("game.world.water", 0);
    engine.state.set("game.world.thirst", true);

    session.moveWorld("east");

    expect(session.snapshot().location).toBe("room");
    expect(engine.state.get("character.dehydrated")).toBe(10);
    expect(engine.state.get('character.perks["desert rat"]')).toBe(true);
    expect(engine.state.get("character.dead")).toBe(true);
  });

  it("delays World random fights until after the original fight movement threshold", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap(WORLD_TILE.FIELD);

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

    expect(engine.state.get("game.world.fightMove")).toBe(3);
    expect(session.snapshot().event).toBeNull();

    session.moveWorld("east");

    expect(engine.state.get("game.world.fightMove")).toBe(0);
    expect(session.snapshot().event).toMatchObject({
      eventKey: "encounter.strange-bird",
    });
  });

  it("applies the original stealthy modifier to World random fight chance", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.15)) });
    const session = new GameSession(engine);
    const map = terrainMap(WORLD_TILE.FIELD);

    engine.state.set("game.world.map", map, true);
    engine.state.set('character.perks["stealthy"]', true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 10);
    session.setLocation("path");
    session.increaseSupply("cured meat", 10);
    session.embark();
    engine.state.set("game.world.water", 20);

    session.moveWorld("east");
    session.moveWorld("east");
    session.moveWorld("east");
    session.moveWorld("east");

    expect(engine.state.get("game.world.fightMove")).toBe(4);
    expect(session.snapshot().event).toBeNull();
  });

  it("emits original World danger and safer notifications at armour thresholds", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(30).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set("config.events.randomDisabled", true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 10);
    session.setLocation("path");
    session.increaseSupply("cured meat", 10);
    session.embark();
    engine.state.set("game.world.water", 30);

    for (let step = 0; step < 8; step += 1) {
      session.moveWorld("east");
    }

    expect(session.snapshot().world.distance).toBe(8);
    expect(engine.state.get("game.world.danger")).toBe(true);
    expect(session.snapshot().world).toMatchObject({
      danger: true,
      starvation: false,
      thirst: false,
    });
    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toContain(
      "dangerous to be this far from the village without proper protection",
    );

    session.moveWorld("west");

    expect(session.snapshot().world.distance).toBe(7);
    expect(engine.state.get("game.world.danger")).toBe(false);
    expect(session.snapshot().world.danger).toBe(false);
    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toContain("safer here");
  });
});
