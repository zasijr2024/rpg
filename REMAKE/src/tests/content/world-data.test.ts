import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalContentRegistry,
  originalWorldLandmarks,
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
  WORLD_VILLAGE_POS
} from "../../content/original";

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
      EAST: [1, 0]
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
      EXECUTIONER: "X"
    });
    expect(WORLD_TILE_PROBS).toEqual({
      ";": 0.15,
      ",": 0.35,
      ".": 0.5
    });
  });

  it("matches world manifest keys", () => {
    expect(Object.keys(WORLD_TILE)).toEqual(
      canonicalManifest.keys.worldTileConstants
    );
    expect(originalWorldWeapons.map((weapon) => weapon.key)).toEqual(
      canonicalManifest.keys.weapons
    );
    expect(originalWorldLandmarks.map((landmark) => landmark.tileKey)).toEqual(
      canonicalManifest.keys.worldLandmarkAssignments
    );
  });

  it("ports exact weapon values", () => {
    expect(originalWorldWeapons).toContainEqual({
      key: "fists",
      verb: "punch",
      type: "unarmed",
      damage: 1,
      cooldown: 2
    });
    expect(originalWorldWeapons).toContainEqual({
      key: "rifle",
      verb: "shoot",
      type: "ranged",
      damage: 5,
      cooldown: 1,
      cost: { bullets: 1 }
    });
    expect(originalWorldWeapons).toContainEqual({
      key: "bolas",
      verb: "tangle",
      type: "ranged",
      damage: "stun",
      cooldown: 15,
      cost: { bolas: 1 }
    });
    expect(originalWorldWeapons).toContainEqual({
      key: "disruptor",
      verb: "stun",
      type: "ranged",
      damage: "stun",
      cooldown: 15
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
      label: "Iron&nbsp;Mine"
    });
    expect(originalWorldLandmarks).toContainEqual({
      tileKey: "CITY",
      tile: "Y",
      num: 20,
      minRadius: 20,
      maxRadius: 45,
      scene: "city",
      label: "A&nbsp;Ruined&nbsp;City"
    });
    expect(originalWorldLandmarks).toContainEqual({
      tileKey: "CACHE",
      tile: "U",
      num: 1,
      minRadius: 10,
      maxRadius: 45,
      scene: "cache",
      label: "A&nbsp;Destroyed&nbsp;Village",
      conditional: "previous.stores"
    });
  });

  it("feeds the original content registry", () => {
    expect(originalContentRegistry.worldWeapons).toBe(originalWorldWeapons);
    expect(originalContentRegistry.worldLandmarks).toBe(originalWorldLandmarks);
  });
});

