import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import {
  WORLD_RADIUS,
  WORLD_TILE,
  type WorldMapGrid,
  type WorldMaskGrid,
} from "../../content/original";
import { createGameEngine, WorldRuntime } from "../../engine";

const WORLD_SIZE = WORLD_RADIUS * 2 + 1;

function worldMap(): WorldMapGrid {
  const map = Array.from({ length: WORLD_SIZE }, () =>
    Array<string>(WORLD_SIZE).fill(WORLD_TILE.FIELD),
  );
  map[WORLD_RADIUS][WORLD_RADIUS] = WORLD_TILE.VILLAGE;
  return map;
}

function worldMask(visible = false): WorldMaskGrid {
  return Array.from({ length: WORLD_SIZE }, () =>
    Array<boolean>(WORLD_SIZE).fill(visible),
  );
}

function configuredWorld(): {
  runtime: WorldRuntime;
  engine: ReturnType<typeof createGameEngine>;
} {
  const engine = createGameEngine({ rngSeed: 42 });
  engine.state.set("game.world.map", worldMap(), true);
  engine.state.set("game.world.mask", worldMask(true), true);
  return { runtime: new WorldRuntime(engine), engine };
}

describe("World snapshot cache", () => {
  it("builds a compact model from current and visible World state only", () => {
    const { runtime, engine } = configuredWorld();
    const map = worldMap();
    const mask = worldMask(false);
    map[WORLD_RADIUS + 1][WORLD_RADIUS] = WORLD_TILE.CAVE;
    map[WORLD_RADIUS + 2][WORLD_RADIUS] = WORLD_TILE.SHIP;
    mask[WORLD_RADIUS][WORLD_RADIUS] = true;
    mask[WORLD_RADIUS + 1][WORLD_RADIUS] = true;
    engine.state.set("game.world.map", map, true);
    engine.state.set("game.world.mask", mask, true);
    engine.state.set("game.world.x", WORLD_RADIUS);
    engine.state.set("game.world.y", WORLD_RADIUS);

    const accessible = runtime.snapshot().accessible;

    expect(accessible).toMatchObject({
      terrain: "the village",
      villageDistance: 0,
      villageDirection: "here",
      moves: ["north", "west", "east", "south"],
    });
    expect(accessible.landmarks).toEqual([
      { label: "A Damp Cave", distance: 1, direction: "east" },
    ]);
    expect(accessible.landmarks.map(({ label }) => label)).not.toContain(
      "A Crashed Starship",
    );
  });

  it("reuses warm rows and invalidates them when a grid reference changes", () => {
    const { runtime, engine } = configuredWorld();

    const first = runtime.snapshot();
    const warm = runtime.snapshot();
    expect(warm.rows).toBe(first.rows);

    const replacementMask = worldMask(false);
    replacementMask[WORLD_RADIUS][WORLD_RADIUS] = true;
    engine.state.set("game.world.mask", replacementMask, true);

    const changed = runtime.snapshot();
    expect(changed.rows).not.toBe(first.rows);
    expect(changed.rows[0][0].visible).toBe(false);
  });

  it("rejects malformed grids once and still returns a complete safe snapshot", () => {
    const { runtime, engine } = configuredWorld();
    engine.state.set("game.world.map", [[WORLD_TILE.VILLAGE]], true);
    engine.state.set("game.world.mask", [[true]], true);

    const snapshot = runtime.snapshot();
    expect(snapshot.rows).toHaveLength(WORLD_SIZE);
    expect(snapshot.rows.every((row) => row.length === WORLD_SIZE)).toBe(true);
    expect(snapshot.rows[0][0]).toMatchObject({ glyph: "@", visible: false });
    expect(snapshot.rows[0][1]).toMatchObject({ glyph: " ", visible: false });
  });

  it("keeps a warm headless snapshot below the 2 ms package budget", () => {
    const { runtime } = configuredWorld();
    runtime.snapshot();

    const iterations = 1_000;
    const startedAt = performance.now();
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      runtime.snapshot();
    }
    const averageMs = (performance.now() - startedAt) / iterations;

    expect(averageMs).toBeLessThan(2);
  });
});
