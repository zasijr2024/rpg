import { canonicalManifest } from "../manifest/canonicalManifest";

export type WorldDirection = readonly [number, number];
export type WorldWeaponType = "unarmed" | "melee" | "ranged";
export type WorldWeaponDamage = number | "stun";

export interface WorldWeaponDefinition {
  key: string;
  verb: string;
  type: WorldWeaponType;
  damage: WorldWeaponDamage;
  cooldown: number;
  cost?: Record<string, number>;
}

export interface WorldLandmarkDefinition {
  tileKey: keyof typeof WORLD_TILE;
  tile: string;
  num: number;
  minRadius: number;
  maxRadius: number;
  scene: string;
  label: string;
  conditional?: "previous.stores";
}

export const WORLD_RADIUS = 30;
export const WORLD_VILLAGE_POS: WorldDirection = [30, 30];
export const WORLD_STICKINESS = 0.5;
export const WORLD_LIGHT_RADIUS = 2;
export const WORLD_BASE_WATER = 10;
export const WORLD_MOVES_PER_FOOD = 2;
export const WORLD_MOVES_PER_WATER = 1;
export const WORLD_DEATH_COOLDOWN = 120;
export const WORLD_FIGHT_CHANCE = 0.2;
export const WORLD_BASE_HEALTH = 10;
export const WORLD_BASE_HIT_CHANCE = 0.8;
export const WORLD_MEAT_HEAL = 8;
export const WORLD_MEDS_HEAL = 20;
export const WORLD_HYPO_HEAL = 30;
export const WORLD_FIGHT_DELAY = 3;

export const WORLD_DIRECTIONS = {
  NORTH: [0, -1],
  SOUTH: [0, 1],
  WEST: [-1, 0],
  EAST: [1, 0]
} as const satisfies Record<string, WorldDirection>;

export const WORLD_TILE = {
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
} as const;

export const WORLD_TILE_PROBS = {
  [WORLD_TILE.FOREST]: 0.15,
  [WORLD_TILE.FIELD]: 0.35,
  [WORLD_TILE.BARRENS]: 0.5
} as const;

export const originalWorldWeapons: WorldWeaponDefinition[] = [
  { key: "fists", verb: "punch", type: "unarmed", damage: 1, cooldown: 2 },
  { key: "bone spear", verb: "stab", type: "melee", damage: 2, cooldown: 2 },
  { key: "iron sword", verb: "swing", type: "melee", damage: 4, cooldown: 2 },
  { key: "steel sword", verb: "slash", type: "melee", damage: 6, cooldown: 2 },
  { key: "bayonet", verb: "thrust", type: "melee", damage: 8, cooldown: 2 },
  {
    key: "rifle",
    verb: "shoot",
    type: "ranged",
    damage: 5,
    cooldown: 1,
    cost: { bullets: 1 }
  },
  {
    key: "laser rifle",
    verb: "blast",
    type: "ranged",
    damage: 8,
    cooldown: 1,
    cost: { "energy cell": 1 }
  },
  {
    key: "grenade",
    verb: "lob",
    type: "ranged",
    damage: 15,
    cooldown: 5,
    cost: { grenade: 1 }
  },
  {
    key: "bolas",
    verb: "tangle",
    type: "ranged",
    damage: "stun",
    cooldown: 15,
    cost: { bolas: 1 }
  },
  {
    key: "plasma rifle",
    verb: "disintegrate",
    type: "ranged",
    damage: 12,
    cooldown: 1,
    cost: { "energy cell": 1 }
  },
  {
    key: "energy blade",
    verb: "slice",
    type: "melee",
    damage: 10,
    cooldown: 2
  },
  {
    key: "disruptor",
    verb: "stun",
    type: "ranged",
    damage: "stun",
    cooldown: 15
  }
];

export const originalWorldLandmarks: WorldLandmarkDefinition[] = [
  {
    tileKey: "OUTPOST",
    tile: WORLD_TILE.OUTPOST,
    num: 0,
    minRadius: 0,
    maxRadius: 0,
    scene: "outpost",
    label: "An&nbsp;Outpost"
  },
  {
    tileKey: "IRON_MINE",
    tile: WORLD_TILE.IRON_MINE,
    num: 1,
    minRadius: 5,
    maxRadius: 5,
    scene: "ironmine",
    label: "Iron&nbsp;Mine"
  },
  {
    tileKey: "COAL_MINE",
    tile: WORLD_TILE.COAL_MINE,
    num: 1,
    minRadius: 10,
    maxRadius: 10,
    scene: "coalmine",
    label: "Coal&nbsp;Mine"
  },
  {
    tileKey: "SULPHUR_MINE",
    tile: WORLD_TILE.SULPHUR_MINE,
    num: 1,
    minRadius: 20,
    maxRadius: 20,
    scene: "sulphurmine",
    label: "Sulphur&nbsp;Mine"
  },
  {
    tileKey: "HOUSE",
    tile: WORLD_TILE.HOUSE,
    num: 10,
    minRadius: 0,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "house",
    label: "An&nbsp;Old&nbsp;House"
  },
  {
    tileKey: "CAVE",
    tile: WORLD_TILE.CAVE,
    num: 5,
    minRadius: 3,
    maxRadius: 10,
    scene: "cave",
    label: "A&nbsp;Damp&nbsp;Cave"
  },
  {
    tileKey: "TOWN",
    tile: WORLD_TILE.TOWN,
    num: 10,
    minRadius: 10,
    maxRadius: 20,
    scene: "town",
    label: "An&nbsp;Abandoned&nbsp;Town"
  },
  {
    tileKey: "CITY",
    tile: WORLD_TILE.CITY,
    num: 20,
    minRadius: 20,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "city",
    label: "A&nbsp;Ruined&nbsp;City"
  },
  {
    tileKey: "SHIP",
    tile: WORLD_TILE.SHIP,
    num: 1,
    minRadius: 28,
    maxRadius: 28,
    scene: "ship",
    label: "A&nbsp;Crashed&nbsp;Starship"
  },
  {
    tileKey: "BOREHOLE",
    tile: WORLD_TILE.BOREHOLE,
    num: 10,
    minRadius: 15,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "borehole",
    label: "A&nbsp;Borehole"
  },
  {
    tileKey: "BATTLEFIELD",
    tile: WORLD_TILE.BATTLEFIELD,
    num: 5,
    minRadius: 18,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "battlefield",
    label: "A&nbsp;Battlefield"
  },
  {
    tileKey: "SWAMP",
    tile: WORLD_TILE.SWAMP,
    num: 1,
    minRadius: 15,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "swamp",
    label: "A&nbsp;Murky&nbsp;Swamp"
  },
  {
    tileKey: "EXECUTIONER",
    tile: WORLD_TILE.EXECUTIONER,
    num: 1,
    minRadius: 28,
    maxRadius: 28,
    scene: "executioner",
    label: "A&nbsp;Ravaged&nbsp;Battleship"
  },
  {
    tileKey: "CACHE",
    tile: WORLD_TILE.CACHE,
    num: 1,
    minRadius: 10,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "cache",
    label: "A&nbsp;Destroyed&nbsp;Village",
    conditional: "previous.stores"
  }
];

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const tileKeys = Object.keys(WORLD_TILE);
  if (
    tileKeys.join("\u0000") !==
    canonicalManifest.keys.worldTileConstants.join("\u0000")
  ) {
    throw new Error("Original world tile keys do not match canonical manifest");
  }

  const weaponKeys = originalWorldWeapons.map((weapon) => weapon.key);
  if (weaponKeys.join("\u0000") !== canonicalManifest.keys.weapons.join("\u0000")) {
    throw new Error("Original world weapon keys do not match canonical manifest");
  }

  const landmarkKeys = originalWorldLandmarks.map((landmark) => landmark.tileKey);
  if (
    landmarkKeys.join("\u0000") !==
    canonicalManifest.keys.worldLandmarkAssignments.join("\u0000")
  ) {
    throw new Error("Original world landmark keys do not match canonical manifest");
  }
}

