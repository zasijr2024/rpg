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

export type WorldMapGrid = string[][];
export type WorldMaskGrid = boolean[][];

export interface WorldRandomSource {
  next(): number;
}

export interface WorldMapGenerationOptions {
  includeCache?: boolean;
}

export interface WorldMapSearchResult {
  x: number;
  y: number;
}

export interface WorldMapPosition {
  x: number;
  y: number;
}

export type WorldCompassDirection =
  | "north"
  | "south"
  | "east"
  | "west"
  | "northeast"
  | "northwest"
  | "southeast"
  | "southwest";

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
  EAST: [1, 0],
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
  EXECUTIONER: "X",
} as const;

export const WORLD_TILE_PROBS = {
  [WORLD_TILE.FOREST]: 0.15,
  [WORLD_TILE.FIELD]: 0.35,
  [WORLD_TILE.BARRENS]: 0.5,
} as const;

const WORLD_TERRAIN_TILES = [
  WORLD_TILE.FOREST,
  WORLD_TILE.FIELD,
  WORLD_TILE.BARRENS,
] as const;

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
    cost: { bullets: 1 },
  },
  {
    key: "laser rifle",
    verb: "blast",
    type: "ranged",
    damage: 8,
    cooldown: 1,
    cost: { "energy cell": 1 },
  },
  {
    key: "grenade",
    verb: "lob",
    type: "ranged",
    damage: 15,
    cooldown: 5,
    cost: { grenade: 1 },
  },
  {
    key: "bolas",
    verb: "tangle",
    type: "ranged",
    damage: "stun",
    cooldown: 15,
    cost: { bolas: 1 },
  },
  {
    key: "plasma rifle",
    verb: "disintegrate",
    type: "ranged",
    damage: 12,
    cooldown: 1,
    cost: { "energy cell": 1 },
  },
  {
    key: "energy blade",
    verb: "slice",
    type: "melee",
    damage: 10,
    cooldown: 2,
  },
  {
    key: "disruptor",
    verb: "stun",
    type: "ranged",
    damage: "stun",
    cooldown: 15,
  },
];

export const originalWorldLandmarks: WorldLandmarkDefinition[] = [
  {
    tileKey: "OUTPOST",
    tile: WORLD_TILE.OUTPOST,
    num: 0,
    minRadius: 0,
    maxRadius: 0,
    scene: "outpost",
    label: "An&nbsp;Outpost",
  },
  {
    tileKey: "IRON_MINE",
    tile: WORLD_TILE.IRON_MINE,
    num: 1,
    minRadius: 5,
    maxRadius: 5,
    scene: "ironmine",
    label: "Iron&nbsp;Mine",
  },
  {
    tileKey: "COAL_MINE",
    tile: WORLD_TILE.COAL_MINE,
    num: 1,
    minRadius: 10,
    maxRadius: 10,
    scene: "coalmine",
    label: "Coal&nbsp;Mine",
  },
  {
    tileKey: "SULPHUR_MINE",
    tile: WORLD_TILE.SULPHUR_MINE,
    num: 1,
    minRadius: 20,
    maxRadius: 20,
    scene: "sulphurmine",
    label: "Sulphur&nbsp;Mine",
  },
  {
    tileKey: "HOUSE",
    tile: WORLD_TILE.HOUSE,
    num: 10,
    minRadius: 0,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "house",
    label: "An&nbsp;Old&nbsp;House",
  },
  {
    tileKey: "CAVE",
    tile: WORLD_TILE.CAVE,
    num: 5,
    minRadius: 3,
    maxRadius: 10,
    scene: "cave",
    label: "A&nbsp;Damp&nbsp;Cave",
  },
  {
    tileKey: "TOWN",
    tile: WORLD_TILE.TOWN,
    num: 10,
    minRadius: 10,
    maxRadius: 20,
    scene: "town",
    label: "An&nbsp;Abandoned&nbsp;Town",
  },
  {
    tileKey: "CITY",
    tile: WORLD_TILE.CITY,
    num: 20,
    minRadius: 20,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "city",
    label: "A&nbsp;Ruined&nbsp;City",
  },
  {
    tileKey: "SHIP",
    tile: WORLD_TILE.SHIP,
    num: 1,
    minRadius: 28,
    maxRadius: 28,
    scene: "ship",
    label: "A&nbsp;Crashed&nbsp;Starship",
  },
  {
    tileKey: "BOREHOLE",
    tile: WORLD_TILE.BOREHOLE,
    num: 10,
    minRadius: 15,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "borehole",
    label: "A&nbsp;Borehole",
  },
  {
    tileKey: "BATTLEFIELD",
    tile: WORLD_TILE.BATTLEFIELD,
    num: 5,
    minRadius: 18,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "battlefield",
    label: "A&nbsp;Battlefield",
  },
  {
    tileKey: "SWAMP",
    tile: WORLD_TILE.SWAMP,
    num: 1,
    minRadius: 15,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "swamp",
    label: "A&nbsp;Murky&nbsp;Swamp",
  },
  {
    tileKey: "EXECUTIONER",
    tile: WORLD_TILE.EXECUTIONER,
    num: 1,
    minRadius: 28,
    maxRadius: 28,
    scene: "executioner",
    label: "A&nbsp;Ravaged&nbsp;Battleship",
  },
  {
    tileKey: "CACHE",
    tile: WORLD_TILE.CACHE,
    num: 1,
    minRadius: 10,
    maxRadius: WORLD_RADIUS * 1.5,
    scene: "cache",
    label: "A&nbsp;Destroyed&nbsp;Village",
    conditional: "previous.stores",
  },
];

export function originalWorldCompassDirection(pos: {
  x: number;
  y: number;
}): WorldCompassDirection {
  const horz = pos.x < 0 ? "west" : "east";
  const vert = pos.y < 0 ? "north" : "south";
  if (Math.abs(pos.x) / 2 > Math.abs(pos.y)) return horz;
  if (Math.abs(pos.y) / 2 > Math.abs(pos.x)) return vert;
  return `${vert}${horz}`;
}

export function originalWorldGenerateMap(
  rng: WorldRandomSource,
  options: WorldMapGenerationOptions = {},
): WorldMapGrid {
  const size = WORLD_RADIUS * 2 + 1;
  const map: WorldMapGrid = Array.from({ length: size }, () =>
    Array<string>(size),
  );

  map[WORLD_RADIUS][WORLD_RADIUS] = WORLD_TILE.VILLAGE;

  for (let radius = 1; radius <= WORLD_RADIUS; radius += 1) {
    for (let step = 0; step < radius * 8; step += 1) {
      let x: number;
      let y: number;
      if (step < 2 * radius) {
        x = WORLD_RADIUS - radius + step;
        y = WORLD_RADIUS - radius;
      } else if (step < 4 * radius) {
        x = WORLD_RADIUS + radius;
        y = WORLD_RADIUS - 3 * radius + step;
      } else if (step < 6 * radius) {
        x = WORLD_RADIUS + 5 * radius - step;
        y = WORLD_RADIUS + radius;
      } else {
        x = WORLD_RADIUS - radius;
        y = WORLD_RADIUS + 7 * radius - step;
      }

      map[x][y] = originalWorldChooseTile(x, y, map, rng);
    }
  }

  for (const landmark of originalWorldLandmarks) {
    if (landmark.conditional === "previous.stores" && !options.includeCache) {
      continue;
    }
    for (let index = 0; index < landmark.num; index += 1) {
      originalWorldPlaceLandmark(
        landmark.minRadius,
        landmark.maxRadius,
        landmark.tile,
        map,
        rng,
      );
    }
  }

  return map;
}

export function originalWorldNewMask(scout = false): WorldMaskGrid {
  const size = WORLD_RADIUS * 2 + 1;
  const mask: WorldMaskGrid = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false),
  );
  return originalWorldLightMap(WORLD_RADIUS, WORLD_RADIUS, mask, scout);
}

export function originalWorldLightMap(
  x: number,
  y: number,
  mask: WorldMaskGrid,
  scout = false,
): WorldMaskGrid {
  return originalWorldUncoverMap(
    x,
    y,
    WORLD_LIGHT_RADIUS * (scout ? 2 : 1),
    mask,
  );
}

export function originalWorldUncoverMap(
  x: number,
  y: number,
  radius: number,
  mask: WorldMaskGrid,
): WorldMaskGrid {
  if (mask[x]) mask[x][y] = true;
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (
      let dy = -radius + Math.abs(dx);
      dy <= radius - Math.abs(dx);
      dy += 1
    ) {
      const nextX = x + dx;
      const nextY = y + dy;
      if (
        nextY >= 0 &&
        nextY <= WORLD_RADIUS * 2 &&
        nextX >= 0 &&
        nextX <= WORLD_RADIUS * 2
      ) {
        mask[nextX][nextY] = true;
      }
    }
  }
  return mask;
}

export function originalWorldMapSearch(
  target: string,
  map: WorldMapGrid,
  required?: number,
): WorldMapSearchResult[] | null {
  const maxLandmarks = originalWorldLandmarks.find(
    (landmark) => landmark.tile === target,
  )?.num;
  if (!maxLandmarks) return null;

  const max = required ? Math.min(required, maxLandmarks) : maxLandmarks;
  const targets: WorldMapSearchResult[] = [];

  for (let x = 0; x <= WORLD_RADIUS * 2; x += 1) {
    for (let y = 0; y <= WORLD_RADIUS * 2; y += 1) {
      if (map[x][y]?.charAt(0) === target) {
        targets.push({ x: x - WORLD_RADIUS, y: y - WORLD_RADIUS });
        if (targets.length === max) return targets;
      }
    }
  }

  return targets;
}

export function originalWorldDrawRoad(
  map: WorldMapGrid,
  startPos: WorldMapPosition,
): WorldMapGrid {
  const closestRoad = originalWorldFindClosestRoad(map, startPos);
  const xDistance = startPos.x - closestRoad.x;
  const yDistance = startPos.y - closestRoad.y;
  const xDirection = sign(xDistance);
  const yDirection = sign(yDistance);
  const xIntersect =
    Math.abs(xDistance) > Math.abs(yDistance)
      ? closestRoad.x
      : closestRoad.x + xDistance;
  const yIntersect =
    Math.abs(xDistance) > Math.abs(yDistance)
      ? closestRoad.y + yDistance
      : closestRoad.y;

  for (let x = 0; x < Math.abs(xDistance); x += 1) {
    const roadX = closestRoad.x + xDirection * x;
    if (originalWorldIsTerrain(map[roadX]?.[yIntersect])) {
      map[roadX][yIntersect] = WORLD_TILE.ROAD;
    }
  }

  for (let y = 0; y < Math.abs(yDistance); y += 1) {
    const roadY = closestRoad.y + yDirection * y;
    if (originalWorldIsTerrain(map[xIntersect]?.[roadY])) {
      map[xIntersect][roadY] = WORLD_TILE.ROAD;
    }
  }

  return map;
}

export function originalWorldMarkVisited(
  map: WorldMapGrid,
  pos: WorldMapPosition,
): WorldMapGrid {
  const tile = map[pos.x]?.[pos.y];
  if (typeof tile === "string" && !tile.endsWith("!")) {
    map[pos.x][pos.y] = `${tile}!`;
  }
  return map;
}

export function originalWorldIsTerrain(tile: string | undefined): boolean {
  return (
    tile === WORLD_TILE.FOREST ||
    tile === WORLD_TILE.FIELD ||
    tile === WORLD_TILE.BARRENS
  );
}

export function originalWorldDisplayLabel(label: string): string {
  return label.replaceAll("&nbsp;", " ");
}

function originalWorldPlaceLandmark(
  minRadius: number,
  maxRadius: number,
  landmark: string,
  map: WorldMapGrid,
  rng: WorldRandomSource,
): readonly [number, number] {
  const maxAttempts = (WORLD_RADIUS * 2 + 1) ** 2;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const radius = Math.floor(rng.next() * (maxRadius - minRadius)) + minRadius;
    let xDistance = Math.floor(rng.next() * radius);
    let yDistance = radius - xDistance;
    if (rng.next() < 0.5) xDistance = -xDistance;
    if (rng.next() < 0.5) yDistance = -yDistance;
    const x = clampWorldCoordinate(WORLD_RADIUS + xDistance);
    const y = clampWorldCoordinate(WORLD_RADIUS + yDistance);
    if (originalWorldIsTerrain(map[x][y])) {
      map[x][y] = landmark;
      return [x, y] as const;
    }
  }
  return originalWorldPlaceLandmarkFallback(
    minRadius,
    maxRadius,
    landmark,
    map,
  );
}

function originalWorldPlaceLandmarkFallback(
  minRadius: number,
  maxRadius: number,
  landmark: string,
  map: WorldMapGrid,
): readonly [number, number] {
  const min = Math.floor(minRadius);
  const max =
    minRadius === maxRadius ? Math.floor(maxRadius) : Math.ceil(maxRadius) - 1;

  for (let radius = min; radius <= max; radius += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const dy = radius - Math.abs(dx);
      const candidates =
        dy === 0
          ? ([[dx, 0]] as const)
          : ([
              [dx, dy],
              [dx, -dy],
            ] as const);
      for (const [candidateX, candidateY] of candidates) {
        const x = clampWorldCoordinate(WORLD_RADIUS + candidateX);
        const y = clampWorldCoordinate(WORLD_RADIUS + candidateY);
        if (originalWorldIsTerrain(map[x][y])) {
          map[x][y] = landmark;
          return [x, y] as const;
        }
      }
    }
  }

  for (let x = 0; x <= WORLD_RADIUS * 2; x += 1) {
    for (let y = 0; y <= WORLD_RADIUS * 2; y += 1) {
      if (originalWorldIsTerrain(map[x][y])) {
        map[x][y] = landmark;
        return [x, y] as const;
      }
    }
  }

  throw new Error(`Unable to place world landmark ${landmark}`);
}

function originalWorldFindClosestRoad(
  map: WorldMapGrid,
  startPos: WorldMapPosition,
): WorldMapPosition {
  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = -1;
  const maxAttempts =
    (manhattanDistance(startPos, { x: WORLD_RADIUS, y: WORLD_RADIUS }) + 2) **
    2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const searchX = startPos.x + x;
    const searchY = startPos.y + y;
    if (
      0 < searchX &&
      searchX < WORLD_RADIUS * 2 &&
      0 < searchY &&
      searchY < WORLD_RADIUS * 2
    ) {
      const tile = map[searchX]?.[searchY];
      if (
        tile === WORLD_TILE.ROAD ||
        (tile === WORLD_TILE.OUTPOST && !(x === 0 && y === 0)) ||
        tile === WORLD_TILE.VILLAGE
      ) {
        return { x: searchX, y: searchY };
      }
    }

    if (x === 0 || y === 0) {
      const previousDx = dx;
      dx = -dy;
      dy = previousDx;
    }
    if (x === 0 && y <= 0) {
      x += 1;
    } else {
      x += dx;
      y += dy;
    }
  }

  return { x: WORLD_RADIUS, y: WORLD_RADIUS };
}

function originalWorldChooseTile(
  x: number,
  y: number,
  map: WorldMapGrid,
  rng: WorldRandomSource,
): string {
  const adjacent = [
    y > 0 ? map[x][y - 1] : undefined,
    y < WORLD_RADIUS * 2 ? map[x][y + 1] : undefined,
    x < WORLD_RADIUS * 2 ? map[x + 1][y] : undefined,
    x > 0 ? map[x - 1][y] : undefined,
  ];

  const chances: Record<string, number> = {};
  let nonSticky = 1;

  for (const tile of adjacent) {
    if (tile === WORLD_TILE.VILLAGE) {
      return WORLD_TILE.FOREST;
    }
    if (typeof tile === "string") {
      chances[tile] = (chances[tile] ?? 0) + WORLD_STICKINESS;
      nonSticky -= WORLD_STICKINESS;
    }
  }

  for (const tile of WORLD_TERRAIN_TILES) {
    chances[tile] = (chances[tile] ?? 0) + WORLD_TILE_PROBS[tile] * nonSticky;
  }

  const sorted = Object.entries(chances).sort(
    ([, left], [, right]) => right - left,
  );
  let cumulative = 0;
  const roll = rng.next();
  for (const [tile, chance] of sorted) {
    cumulative += chance;
    if (roll < cumulative) return tile;
  }

  return WORLD_TILE.BARRENS;
}

function manhattanDistance(left: WorldMapPosition, right: WorldMapPosition) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function sign(value: number): -1 | 0 | 1 {
  if (value < 0) return -1;
  if (value > 0) return 1;
  return 0;
}

function clampWorldCoordinate(value: number): number {
  return Math.max(0, Math.min(WORLD_RADIUS * 2, value));
}

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
  if (
    weaponKeys.join("\u0000") !== canonicalManifest.keys.weapons.join("\u0000")
  ) {
    throw new Error(
      "Original world weapon keys do not match canonical manifest",
    );
  }

  const landmarkKeys = originalWorldLandmarks.map(
    (landmark) => landmark.tileKey,
  );
  if (
    landmarkKeys.join("\u0000") !==
    canonicalManifest.keys.worldLandmarkAssignments.join("\u0000")
  ) {
    throw new Error(
      "Original world landmark keys do not match canonical manifest",
    );
  }
}
