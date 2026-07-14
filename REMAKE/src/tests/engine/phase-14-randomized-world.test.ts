import { describe, expect, it } from "vitest";
import {
  originalWorldLandmarks,
  WORLD_RADIUS,
  WORLD_TILE,
  WORLD_VILLAGE_POS,
} from "../../content/original";
import { createGameEngine, GameSession } from "../../engine";

describe("Phase 14 randomized World corpus", () => {
  it("keeps every required landmark present and reachable across 64 production seeds", () => {
    const expectedLandmarks = originalWorldLandmarks.filter(
      (landmark) => landmark.conditional === undefined && landmark.num > 0,
    );

    for (let seed = 0; seed < 64; seed += 1) {
      const engine = createGameEngine({ rngSeed: seed });
      const session = new GameSession(engine);
      session.setStateForTest("stores.compass", 1);
      const map = engine.state.get("game.world.map") as string[][];

      expect(map, `seed ${seed}`).toHaveLength(WORLD_RADIUS * 2 + 1);
      expect(
        map.every((column) => column.length === WORLD_RADIUS * 2 + 1),
      ).toBe(true);
      expect(map[WORLD_VILLAGE_POS[0]][WORLD_VILLAGE_POS[1]]).toBe(
        WORLD_TILE.VILLAGE,
      );

      const reachable = reachableCoordinates(map);
      for (const landmark of expectedLandmarks) {
        const positions = positionsOf(map, landmark.tile);
        expect(
          positions,
          `seed ${seed}, landmark ${landmark.tileKey}`,
        ).toHaveLength(landmark.num);
        positions.forEach(({ x, y }) => {
          expect(reachable.has(`${x},${y}`)).toBe(true);
        });
      }
    }
  });
});

function positionsOf(map: string[][], tile: string) {
  const positions: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < map.length; x += 1) {
    for (let y = 0; y < map[x].length; y += 1) {
      if (map[x][y] === tile) positions.push({ x, y });
    }
  }
  return positions;
}

function reachableCoordinates(map: string[][]): Set<string> {
  const pending = [{ x: WORLD_VILLAGE_POS[0], y: WORLD_VILLAGE_POS[1] }];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const point = pending.shift()!;
    const key = `${point.x},${point.y}`;
    if (visited.has(key)) continue;
    if (point.x < 0 || point.y < 0 || point.x >= map.length) continue;
    if (point.y >= map[point.x].length) continue;
    visited.add(key);
    pending.push(
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    );
  }
  return visited;
}
