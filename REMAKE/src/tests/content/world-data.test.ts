import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalContentRegistry,
  originalWorldLandmarks,
  originalWorldCompassDirection,
  originalWorldDrawRoad,
  originalWorldGenerateMap,
  originalWorldMarkVisited,
  originalWorldMapSearch,
  originalWorldNewMask,
  originalWorldWeapons,
  WORLD_BASE_HEALTH,
  WORLD_BASE_HIT_CHANCE,
  WORLD_BASE_WATER,
  WORLD_DEATH_COOLDOWN,
  WORLD_DIRECTIONS,
  WORLD_FIGHT_CHANCE,
  WORLD_FIGHT_DELAY,
  WORLD_HYPO_HEAL,
  WORLD_LIGHT_RADIUS,
  WORLD_MEAT_HEAL,
  WORLD_MEDS_HEAL,
  WORLD_MOVES_PER_FOOD,
  WORLD_MOVES_PER_WATER,
  WORLD_RADIUS,
  WORLD_STICKINESS,
  WORLD_TILE,
  WORLD_TILE_PROBS,
  WORLD_VILLAGE_POS,
} from "../../content/original";

function seededRng(seed: number) {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    },
  };
}

function terrainMap(fill = WORLD_TILE.FIELD) {
  const size = WORLD_RADIUS * 2 + 1;
  const map = Array.from({ length: size }, () =>
    Array<string>(size).fill(fill),
  );
  map[WORLD_RADIUS][WORLD_RADIUS] = WORLD_TILE.VILLAGE;
  return map;
}

describe("original world data", () => {
  it("ports exact world constants", () => {
    expect(WORLD_RADIUS).toBe(30);
    expect(WORLD_VILLAGE_POS).toEqual([30, 30]);
    expect(WORLD_STICKINESS).toBe(0.5);
    expect(WORLD_LIGHT_RADIUS).toBe(2);
    expect(WORLD_BASE_WATER).toBe(10);
    expect(WORLD_MOVES_PER_FOOD).toBe(2);
    expect(WORLD_MOVES_PER_WATER).toBe(1);
    expect(WORLD_DEATH_COOLDOWN).toBe(120);
    expect(WORLD_FIGHT_CHANCE).toBe(0.2);
    expect(WORLD_BASE_HEALTH).toBe(10);
    expect(WORLD_BASE_HIT_CHANCE).toBe(0.8);
    expect(WORLD_MEAT_HEAL).toBe(8);
    expect(WORLD_MEDS_HEAL).toBe(20);
    expect(WORLD_HYPO_HEAL).toBe(30);
    expect(WORLD_FIGHT_DELAY).toBe(3);
    expect(WORLD_DIRECTIONS).toEqual({
      NORTH: [0, -1],
      SOUTH: [0, 1],
      WEST: [-1, 0],
      EAST: [1, 0],
    });
  });

  it("ports exact tile symbols and terrain probabilities", () => {
    expect(WORLD_TILE).toEqual({
      VILLAGE: "A",
      IRON_MINE: "I",
      COAL_MINE: "C",
      SULPHUR_MINE: "S",
      FOREST: ";",
      FIELD: ",",
      BARRENS: ".",
      ROAD: "#",
      HOUSE: "H",
      CAVE: "V",
      TOWN: "O",
      CITY: "Y",
      OUTPOST: "P",
      SHIP: "W",
      BOREHOLE: "B",
      BATTLEFIELD: "F",
      SWAMP: "M",
      CACHE: "U",
      EXECUTIONER: "X",
    });
    expect(WORLD_TILE_PROBS).toEqual({
      ";": 0.15,
      ",": 0.35,
      ".": 0.5,
    });
  });

  it("matches world manifest keys", () => {
    expect(Object.keys(WORLD_TILE)).toEqual(
      canonicalManifest.keys.worldTileConstants,
    );
    expect(originalWorldWeapons.map((weapon) => weapon.key)).toEqual(
      canonicalManifest.keys.weapons,
    );
    expect(originalWorldLandmarks.map((landmark) => landmark.tileKey)).toEqual(
      canonicalManifest.keys.worldLandmarkAssignments,
    );
  });

  it("ports exact weapon values", () => {
    expect(originalWorldWeapons).toContainEqual({
      key: "fists",
      verb: "punch",
      type: "unarmed",
      damage: 1,
      cooldown: 2,
    });
    expect(originalWorldWeapons).toContainEqual({
      key: "rifle",
      verb: "shoot",
      type: "ranged",
      damage: 5,
      cooldown: 1,
      cost: { bullets: 1 },
    });
    expect(originalWorldWeapons).toContainEqual({
      key: "bolas",
      verb: "tangle",
      type: "ranged",
      damage: "stun",
      cooldown: 15,
      cost: { bolas: 1 },
    });
    expect(originalWorldWeapons).toContainEqual({
      key: "disruptor",
      verb: "stun",
      type: "ranged",
      damage: "stun",
      cooldown: 15,
    });
  });

  it("ports exact landmark values including conditional cache", () => {
    expect(originalWorldLandmarks).toContainEqual({
      tileKey: "IRON_MINE",
      tile: "I",
      num: 1,
      minRadius: 5,
      maxRadius: 5,
      scene: "ironmine",
      label: "Iron&nbsp;Mine",
    });
    expect(originalWorldLandmarks).toContainEqual({
      tileKey: "CITY",
      tile: "Y",
      num: 20,
      minRadius: 20,
      maxRadius: 45,
      scene: "city",
      label: "A&nbsp;Ruined&nbsp;City",
    });
    expect(originalWorldLandmarks).toContainEqual({
      tileKey: "CACHE",
      tile: "U",
      num: 1,
      minRadius: 10,
      maxRadius: 45,
      scene: "cache",
      label: "A&nbsp;Destroyed&nbsp;Village",
      conditional: "previous.stores",
    });
  });

  it("matches original compass direction thresholds", () => {
    expect(originalWorldCompassDirection({ x: 28, y: -1 })).toBe("east");
    expect(originalWorldCompassDirection({ x: -28, y: 1 })).toBe("west");
    expect(originalWorldCompassDirection({ x: 1, y: -28 })).toBe("north");
    expect(originalWorldCompassDirection({ x: -1, y: 28 })).toBe("south");
    expect(originalWorldCompassDirection({ x: 28, y: -20 })).toBe("northeast");
    expect(originalWorldCompassDirection({ x: -28, y: -20 })).toBe("northwest");
    expect(originalWorldCompassDirection({ x: 28, y: 20 })).toBe("southeast");
    expect(originalWorldCompassDirection({ x: -28, y: 20 })).toBe("southwest");
  });

  it("generates an original-shaped world map with landmark counts", () => {
    const map = originalWorldGenerateMap(seededRng(0x1fada462), {
      includeCache: true,
    });

    expect(map).toHaveLength(WORLD_RADIUS * 2 + 1);
    expect(map.every((column) => column.length === WORLD_RADIUS * 2 + 1)).toBe(
      true,
    );
    expect(map[WORLD_RADIUS][WORLD_RADIUS]).toBe(WORLD_TILE.VILLAGE);
    expect(map[WORLD_RADIUS - 1][WORLD_RADIUS]).toBe(WORLD_TILE.FOREST);
    expect(map[WORLD_RADIUS + 1][WORLD_RADIUS]).toBe(WORLD_TILE.FOREST);

    for (const landmark of originalWorldLandmarks) {
      const count = map.flat().filter((tile) => tile === landmark.tile).length;
      expect(count, landmark.tileKey).toBe(landmark.num);
    }

    const ship = originalWorldMapSearch(WORLD_TILE.SHIP, map, 1)?.[0];
    expect(ship).toEqual(expect.objectContaining({ x: expect.any(Number) }));
  });

  it("creates the original diamond visibility mask", () => {
    const mask = originalWorldNewMask();
    const visible = mask.flat().filter(Boolean).length;

    expect(mask[WORLD_RADIUS][WORLD_RADIUS]).toBe(true);
    expect(mask[WORLD_RADIUS][WORLD_RADIUS - WORLD_LIGHT_RADIUS]).toBe(true);
    expect(mask[WORLD_RADIUS + WORLD_LIGHT_RADIUS][WORLD_RADIUS]).toBe(true);
    expect(mask[WORLD_RADIUS + WORLD_LIGHT_RADIUS][WORLD_RADIUS + 1]).toBe(
      false,
    );
    expect(visible).toBe(13);

    expect(originalWorldNewMask(true).flat().filter(Boolean)).toHaveLength(41);
  });

  it("draws original mine roads to the closest existing road anchor", () => {
    const map = terrainMap();
    map[35][33] = WORLD_TILE.IRON_MINE;

    originalWorldDrawRoad(map, { x: 35, y: 33 });

    expect(map[35][33]).toBe(WORLD_TILE.IRON_MINE);
    expect(map[30][30]).toBe(WORLD_TILE.VILLAGE);
    expect(map[30][31]).toBe(WORLD_TILE.ROAD);
    expect(map[30][32]).toBe(WORLD_TILE.ROAD);
    expect(map[30][33]).toBe(WORLD_TILE.ROAD);
    expect(map[31][33]).toBe(WORLD_TILE.ROAD);
    expect(map[34][33]).toBe(WORLD_TILE.ROAD);
  });

  it("marks visited world landmarks without changing the visible tile glyph", () => {
    const map = terrainMap();
    map[35][33] = WORLD_TILE.IRON_MINE;

    originalWorldMarkVisited(map, { x: 35, y: 33 });
    originalWorldMarkVisited(map, { x: 35, y: 33 });

    expect(map[35][33]).toBe(`${WORLD_TILE.IRON_MINE}!`);
    expect(map[35][33]?.charAt(0)).toBe(WORLD_TILE.IRON_MINE);
  });

  it("feeds the original content registry", () => {
    expect(originalContentRegistry.worldWeapons).toBe(originalWorldWeapons);
    expect(originalContentRegistry.worldLandmarks).toBe(originalWorldLandmarks);
  });
});
