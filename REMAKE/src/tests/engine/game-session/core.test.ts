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

describe("GameSession core recovery contracts", () => {
  it("resumes the same active World after encounter victory and another move", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0)) });
    const session = new GameSession(engine);

    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set('outfit["grenade"]', 1);
    engine.state.set('outfit["cured meat"]', 2);
    session.expedition.begin({
      position: { x: WORLD_RADIUS, y: WORLD_RADIUS },
      health: 10,
      water: 10,
    });
    session.setLocation("world");
    const before = session.expedition.snapshot();

    session.triggerWorldEncounter({ distance: 6, terrain: "forest" });

    expect(session.snapshot().event).toMatchObject({
      eventKey: "encounter.snarling-beast",
    });

    session.chooseEventCombatAction("attack:grenade");
    session.advanceForTest(1000);
    session.chooseEventCombatAction("takeEverything");
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toBeNull();
    expect(session.snapshot().location).toBe("world");
    expect(session.snapshot().world.active).toBe(true);
    expect(session.expedition.snapshot()).toMatchObject({
      active: true,
      position: before.position,
      health: before.health,
      water: before.water,
      hasDraft: true,
    });
    expect(engine.state.get("game.world.returnLocation", true)).toBe(0);
    expect(engine.state.get('stores["fur"]', true)).toBe(0);
    expect(engine.state.get('outfit["fur"]')).toBe(1);

    session.moveWorld("east");

    expect(session.snapshot().world).toMatchObject({
      active: true,
      x: WORLD_RADIUS + 1,
      y: WORLD_RADIUS,
      distance: 1,
    });
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

    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
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
    expect(engine.state.get('stores["cured meat"]')).toBe(3);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
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

    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(engine.state.get('stores["cured meat"]')).toBe(3);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);

    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(engine.state.get('stores["cured meat"]')).toBe(3);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);

    session.embark();

    expect(session.snapshot().location).toBe("world");
    expect(engine.state.get('stores["cured meat"]')).toBe(1);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);

    session.returnFromWorld();

    expect(session.snapshot().location).toBe("path");
    expect(engine.state.get('stores["cured meat"]')).toBe(3);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
  });

  it("redeems every carried blueprint only on a successful village return", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);
    const blueprints = [
      ["hypo blueprint", "hypo"],
      ["kinetic armour blueprint", "kinetic armour"],
      ["disruptor blueprint", "disruptor"],
      ["plasma rifle blueprint", "plasma rifle"],
      ["stim blueprint", "stim"],
      ["glowstone blueprint", "glowstone"],
    ];

    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();
    for (const [blueprint] of blueprints) {
      engine.state.set(`outfit["${blueprint}"]`, 1);
    }

    session.returnFromWorld();

    for (const [blueprint, item] of blueprints) {
      expect(engine.state.get(`outfit["${blueprint}"]`, true)).toBe(0);
      expect(engine.state.get(`stores["${blueprint}"]`, true)).toBe(0);
      expect(engine.state.get(`character.blueprints["${item}"]`)).toBe(true);
    }
    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toContain(
      "blueprints feed into the fabricator data port. possibilities grow.",
    );
  });

  it("returns home automatically when World movement enters the village", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();

    session.moveWorld("east");
    session.moveWorld("west");

    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);
    expect(engine.state.get('stores["cured meat"]')).toBe(2);
    expect(engine.state.get('outfit["cured meat"]')).toBe(2);
    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toContain("the village is close enough to touch");
  });

  it("prevents re-embark after all carried cured meat is consumed before returning", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0.9)) });
    const session = new GameSession(engine);

    engine.state.set("game.world.map", terrainMap(WORLD_TILE.FIELD), true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 1);
    session.embark();

    session.moveWorld("east");
    session.moveWorld("north");
    session.moveWorld("south");
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
    engine.state.set("game.world.shipPosition.x", 28);
    engine.state.set("game.world.shipPosition.y", -20);
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
});
