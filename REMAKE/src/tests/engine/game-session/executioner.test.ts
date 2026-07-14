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

describe("GameSession executioner contracts", () => {
  it("reaches the executioner intro organically from World movement and unlocks Fabricator discovery", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(100).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.EXECUTIONER;
    engine.state.set("game.world.map", map, true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set('stores["alien alloy"]', 1);
    engine.state.set("stores.convoy", 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    engine.state.set("game.world.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 30);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.intro-defences",
      title: "A Ravaged Battleship",
      sceneKey: "start",
    });

    session.chooseEventButton("enter");
    session.chooseEventButton("continue");
    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "ancient beast",
      phase: "fighting",
    });

    firePlasmaUntilWon(session, 5);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.intro-defences",
      sceneKey: "maintenance-panel",
    });

    session.chooseEventButton("power");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "automated turret",
      phase: "fighting",
    });

    firePlasmaUntilWon(session, 5);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.intro-defences",
      sceneKey: "device",
    });
    expect(engine.state.get("game.world.executioner")).toBe(true);

    session.chooseEventButton("leave");

    expect(session.snapshot().event).toBeNull();
    expect(session.snapshot().world).toMatchObject({
      active: true,
      x: 31,
      y: 30,
      landmark: {
        scene: "executioner",
        label: "A Ravaged Battleship",
      },
    });

    session.moveWorld("west");

    expect(session.snapshot().location).toBe("path");
    expect(session.snapshot().world.active).toBe(false);
    expect(engine.state.get("features.location.fabricator")).toBe(true);
    expect(
      engine.notifications.list("world").map((entry) => entry.message),
    ).toContain(
      "builder knows the strange device when she sees it. takes it for herself real quick. doesn't ask where it came from.",
    );
  });

  it.each([
    {
      button: "engineering",
      eventKey: "executioner.engineering-assembly-loot",
      title: "Engineering Wing",
    },
    {
      button: "medical",
      eventKey: "executioner.medical-checkpoint",
      title: "Medical Wing",
    },
    {
      button: "martial",
      eventKey: "executioner.martial-armory-blast",
      title: "Martial Wing",
    },
  ])(
    "routes organically from the executioner antechamber into the $button wing",
    ({ button, eventKey, title }) => {
      const engine = createGameEngine({ rng: sequenceRng(Array(20).fill(0)) });
      const session = new GameSession(engine);
      const map = terrainMap();

      map[31][30] = WORLD_TILE.EXECUTIONER;
      engine.state.set("game.world.map", map, true);
      engine.state.set("game.world.executioner", true);
      engine.state.set("stores.compass", 1);
      engine.state.set('stores["cured meat"]', 1);
      session.setLocation("path");
      session.increaseSupply("cured meat", 1);
      session.embark();

      session.moveWorld("east");

      expect(session.snapshot().event).toMatchObject({
        eventKey: "executioner.antechamber",
        title: "A Ravaged Battleship",
        sceneKey: "start",
        buttons: expect.arrayContaining([
          expect.objectContaining({ key: button }),
          expect.objectContaining({ key: "leave", text: "leave" }),
        ]),
      });

      session.chooseEventButton(button);

      expect(session.snapshot().event).toMatchObject({
        eventKey,
        title,
        sceneKey: "start",
      });
      expect(session.snapshot()).toMatchObject({
        location: "world",
        world: {
          active: true,
          x: 31,
          y: 30,
          landmark: {
            scene: "executioner",
            label: "A Ravaged Battleship",
          },
        },
      });
    },
  );

  it("clears the executioner engineering wing organically from the return antechamber", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(180).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.EXECUTIONER;
    engine.state.set("game.world.map", map, true);
    engine.state.set("game.world.executioner", true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    engine.state.set('stores["kinetic armour"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    engine.state.set("game.world.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 140);
    engine.state.set('outfit["hypo"]', 6);

    session.moveWorld("east");
    session.chooseEventButton("engineering");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.engineering-assembly-loot",
      title: "Engineering Wing",
      sceneKey: "start",
    });

    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "assembly",
      loot: {
        loot: {
          "energy cell": 1,
          "laser rifle": 1,
        },
      },
    });

    session.chooseEventLootAction("takeEverything");
    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "unruly welder",
      phase: "fighting",
    });

    firePlasmaUntilWonWithHypo(session, 15);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "mechanical guard",
      phase: "fighting",
    });

    firePlasmaUntilWonWithHypo(session, 15);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.engineering-assembly-loot",
      sceneKey: "cleared",
    });

    session.chooseEventButton("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "start",
    });

    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
    });

    firePlasmaUntilWonWithHypo(session, 15);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "plans",
      loot: {
        loot: {
          "hypo blueprint": 1,
        },
      },
    });

    session.chooseEventLootAction("takeEverything");
    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "prototype-intro",
    });

    session.chooseEventButton("fight");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "unstable prototype",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 35);

    expect(session.snapshot().event?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        "kinetic armour blueprint": 1,
      },
    });

    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.engineering-rd-blueprint",
      sceneKey: "cleared",
    });
    expect(engine.state.get("game.world.engineering")).toBe(true);
    expect(engine.state.get("game.world.medical", true)).toBe(0);
    expect(engine.state.get("game.world.martial", true)).toBe(0);

    session.chooseEventButton("leave");
    expect(session.snapshot()).toMatchObject({
      location: "world",
      event: null,
      world: {
        active: true,
        x: 31,
        y: 30,
      },
    });

    session.enterWorldLandmark();
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.antechamber",
      buttons: expect.arrayContaining([
        expect.objectContaining({ key: "medical" }),
        expect.objectContaining({ key: "martial" }),
        expect.objectContaining({ key: "leave" }),
      ]),
    });
    expect(session.snapshot().event?.buttons).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "engineering" })]),
    );
  }, 30_000);

  it("clears the executioner medical wing organically from the return antechamber", () => {
    const engine = createGameEngine({
      rng: sequenceRng(Array(260).fill(0.75)),
    });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.EXECUTIONER;
    engine.state.set("game.world.map", map, true);
    engine.state.set("game.world.executioner", true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    engine.state.set('stores["kinetic armour"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    engine.state.set("game.world.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 260);
    engine.state.set('outfit["hypo"]', 20);

    session.moveWorld("east");
    session.chooseEventButton("medical");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      title: "Medical Wing",
      sceneKey: "start",
    });

    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 15);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "quiet-corridor",
    });

    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "guardians",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "gurneys",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "strategy-room",
    });
    session.chooseEventButton("force");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "locker",
      loot: {
        loot: {
          "energy cell": 8,
          hypo: 2,
        },
      },
    });
    session.chooseEventLootAction("takeEverything");

    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 20);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "mechanical quadruped",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 20);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "unstable automaton",
      phase: "fighting",
    });
    firePlasmaUntilWonOrExplodedWithHypo(session, 20);
    expect(session.snapshot().event?.combat).toMatchObject({
      phase: "won",
      loot: {
        "glowstone blueprint": 1,
      },
    });
    session.advanceForTest(1000);
    session.chooseEventCombatAction("takeEverything");
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-checkpoint",
      sceneKey: "checkpoint",
    });
    session.chooseEventButton("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-cold-storage",
      sceneKey: "start",
    });

    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "slipped",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 20);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("takeEverything");
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-cold-storage",
      sceneKey: "cold-storage",
      loot: {
        loot: {
          "cured meat": 8,
        },
      },
    });
    session.chooseEventLootAction("takeEverything");

    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "drones",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "broken medic",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 20);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-cold-storage",
      sceneKey: "containment",
    });
    session.chooseEventButton("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "start",
    });

    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "malformed experiment",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 30);
    expect(session.snapshot().event?.combat).toMatchObject({
      phase: "won",
      loot: {
        "stim blueprint": 1,
      },
    });

    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.medical-experiment",
      sceneKey: "cleared",
    });
    expect(engine.state.get("game.world.medical")).toBe(true);
    expect(engine.state.get("game.world.engineering", true)).toBe(0);
    expect(engine.state.get("game.world.martial", true)).toBe(0);

    session.chooseEventButton("leave");
    expect(session.snapshot()).toMatchObject({
      location: "world",
      event: null,
      world: {
        active: true,
        x: 31,
        y: 30,
      },
    });

    session.enterWorldLandmark();
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.antechamber",
      buttons: expect.arrayContaining([
        expect.objectContaining({ key: "engineering" }),
        expect.objectContaining({ key: "martial" }),
        expect.objectContaining({ key: "leave" }),
      ]),
    });
    expect(session.snapshot().event?.buttons).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "medical" })]),
    );
  }, 30_000);

  it("clears the executioner martial wing organically from the return antechamber", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(260).fill(0)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.EXECUTIONER;
    engine.state.set("game.world.map", map, true);
    engine.state.set("game.world.executioner", true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.convoy", 1);
    engine.state.set("stores.grenade", 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.increaseSupply("grenade", 1);
    session.embark();
    engine.state.set("game.world.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 260);
    engine.state.set('outfit["hypo"]', 20);

    session.moveWorld("east");
    session.chooseEventButton("martial");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.martial-armory-blast",
      title: "Martial Wing",
      sceneKey: "start",
    });

    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "branch",
    });

    session.chooseEventButton("blast");
    expect(engine.state.get("stores.grenade", true)).toBe(0);
    expect(engine.state.get("outfit.grenade", true)).toBe(0);
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "armory",
      loot: {
        loot: {
          "energy blade": 2,
          "laser rifle": 2,
          "energy cell": 5,
          grenade: 1,
          "plasma rifle": 1,
        },
      },
    });
    session.chooseEventLootAction("takeEverything");

    session.chooseEventButton("continue");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "defence turret",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 15);
    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.martial-armory-blast",
      sceneKey: "sealed-door",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "barricade",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      sceneKey: "documents",
      loot: {
        loot: {
          "plasma rifle blueprint": 1,
        },
      },
    });
    session.chooseEventLootAction("takeEverything");

    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.martial-armory-blast",
      sceneKey: "training-complex",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "start",
    });
    session.chooseEventButton("continue");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "robot-intro",
    });

    session.chooseEventButton("engage");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "murderous robot",
      phase: "fighting",
    });
    firePlasmaUntilWonWithHypo(session, 45);
    expect(session.snapshot().event?.combat).toMatchObject({
      phase: "won",
      loot: {
        "alien alloy": 1,
        "disruptor blueprint": 1,
      },
    });

    session.advanceForTest(1000);
    session.chooseEventCombatAction("takeEverything");
    session.chooseEventCombatAction("leave");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.martial-training-robot",
      sceneKey: "cleared",
    });
    expect(engine.state.get("game.world.martial")).toBe(true);
    expect(engine.state.get("game.world.engineering", true)).toBe(0);
    expect(engine.state.get("game.world.medical", true)).toBe(0);

    session.chooseEventButton("leave");
    expect(session.snapshot()).toMatchObject({
      location: "world",
      event: null,
      world: {
        active: true,
        x: 31,
        y: 30,
      },
    });

    session.enterWorldLandmark();
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.antechamber",
      buttons: expect.arrayContaining([
        expect.objectContaining({ key: "engineering" }),
        expect.objectContaining({ key: "medical" }),
        expect.objectContaining({ key: "leave" }),
      ]),
    });
    expect(session.snapshot().event?.buttons).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "martial" })]),
    );
  }, 30_000);

  it("reaches the executioner command deck organically and converts the cleared battleship", () => {
    const engine = createGameEngine({ rng: sequenceRng(Array(260).fill(0.9)) });
    const session = new GameSession(engine);
    const map = terrainMap();

    map[31][30] = WORLD_TILE.EXECUTIONER;
    engine.state.set("game.world.map", map, true);
    engine.state.set("game.world.executioner", true);
    engine.state.set("game.world.engineering", true);
    engine.state.set("game.world.medical", true);
    engine.state.set("game.world.martial", true);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["cured meat"]', 2);
    engine.state.set('character.perks["precise"]', true);
    engine.state.set('stores["kinetic armour"]', 1);
    session.setLocation("path");
    session.increaseSupply("cured meat", 2);
    session.embark();
    engine.state.set("game.world.health", 85);
    engine.state.set('stores["plasma rifle"]', 0);
    engine.state.set('outfit["plasma rifle"]', 1);
    engine.state.set('outfit["energy cell"]', 120);

    session.moveWorld("east");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.antechamber",
      title: "A Ravaged Battleship",
      sceneKey: "start",
      buttons: [
        expect.objectContaining({ key: "command", text: "command deck" }),
        expect.objectContaining({ key: "leave", text: "leave" }),
      ],
    });

    session.chooseEventButton("command");
    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.command-wanderer",
      title: "Command Deck",
      sceneKey: "start",
    });

    session.chooseEventButton("approach");
    session.chooseEventButton("observe");
    expect(session.snapshot().event?.combat).toMatchObject({
      enemy: "immortal wanderer",
      phase: "fighting",
      enemyHp: 500,
    });

    let guard = 0;
    while (
      session.snapshot().event?.combat?.phase === "fighting" &&
      guard < 120
    ) {
      const combat = session.snapshot().event?.combat;
      if (
        combat?.enemyStatus === "meditation" &&
        combat.actions.some(
          (action) => action.key === "shield" && !action.disabled,
        )
      ) {
        session.chooseEventCombatAction("shield");
      }
      session.chooseEventCombatAction("attack:plasma rifle");
      if (session.snapshot().event?.combat?.phase === "fighting") {
        session.advanceForTest(1000);
      }
      guard += 1;
    }
    expect(guard).toBeLessThan(120);
    expect(session.snapshot().event?.combat).toMatchObject({
      phase: "won",
      playerHp: 85,
      loot: {
        "fleet beacon": 1,
      },
    });

    session.advanceForTest(1000);
    session.chooseEventCombatAction("leave");

    expect(session.snapshot().event).toMatchObject({
      eventKey: "executioner.command-wanderer",
      sceneKey: "cleared",
    });
    expect(engine.state.get("game.world.executionerCleared")).toBe(true);

    session.chooseEventButton("leave");

    const updatedMap = engine.state.get("game.world.map") as WorldMapGrid;
    expect(updatedMap[31][30]).toBe(WORLD_TILE.OUTPOST);
    expect(session.snapshot().event).toBeNull();
    expectImmediateConvertedOutpostUse(session, engine, 31, 30);
  }, 30_000);
});
