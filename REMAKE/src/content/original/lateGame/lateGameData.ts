import { canonicalManifest } from "../manifest/canonicalManifest";

export type FabricatorCraftableType = "weapon" | "upgrade" | "tool";

export interface FabricatorCraftableDefinition {
  key: string;
  name: string;
  type: FabricatorCraftableType;
  buildMsg: string;
  cost: Record<string, number>;
  maximum?: number;
  blueprintRequired?: true;
  quantity?: number;
}

export interface SpaceTitleThreshold {
  minAltitude: number;
  title: string;
}

export interface SpaceAsteroidDefinition {
  rollUnder: number;
  glyph: string;
}

export interface SpaceAsteroidWaveThreshold {
  minAltitudeExclusive: number;
  extraAsteroids: number;
}

export interface SpaceHitAudioTier {
  minAltitudeExclusive: number;
  offset: number;
}

export const SHIP_LIFTOFF_COOLDOWN = 120;
export const SHIP_ALLOY_PER_HULL = 1;
export const SHIP_ALLOY_PER_THRUSTER = 1;
export const SHIP_BASE_HULL = 0;
export const SHIP_BASE_THRUSTERS = 1;

export const SPACE_SHIP_SPEED = 3;
export const SPACE_BASE_ASTEROID_DELAY = 500;
export const SPACE_BASE_ASTEROID_SPEED = 1500;
export const SPACE_FADE_TO_BLACK_SPEED = 60000;
export const SPACE_STAR_WIDTH = 3000;
export const SPACE_STAR_HEIGHT = 3000;
export const SPACE_NUM_STARS = 200;
export const SPACE_STAR_SPEED = 60000;
export const SPACE_FRAME_DELAY = 100;
export const SPACE_SHIP_TIMER_INTERVAL = 33;
export const SPACE_VOLUME_TIMER_INTERVAL = 1000;
export const SPACE_ALTITUDE_TICK_INTERVAL = 1000;
export const SPACE_ESCAPE_ALTITUDE = 60;
export const SPACE_PANEL_SIZE = 700;
export const SPACE_ASTEROID_END_TOP = 740;
export const SPACE_SHIP_MIN_POSITION = 10;
export const SPACE_SHIP_MAX_POSITION = 690;
export const SPACE_SHIP_START_TOP = 350;
export const SPACE_SHIP_START_LEFT = 350;
export const SPACE_SHIP_END_TOP = 350;
export const SPACE_SHIP_END_LEFT = 240;
export const SPACE_SHIP_EXIT_TOP = -100;
export const SPACE_ASTEROID_SPEED_RANDOM_FACTOR = 0.65;

export const originalFabricatorCraftables: FabricatorCraftableDefinition[] = [
  {
    key: "energy blade",
    name: "energy blade",
    type: "weapon",
    buildMsg: "the blade hums, charged particles sparking and fizzing.",
    cost: { "alien alloy": 1 }
  },
  {
    key: "fluid recycler",
    name: "fluid recycler",
    type: "upgrade",
    maximum: 1,
    buildMsg: "water out, water in. waste not, want not.",
    cost: { "alien alloy": 2 }
  },
  {
    key: "cargo drone",
    name: "cargo drone",
    type: "upgrade",
    maximum: 1,
    buildMsg: "the workhorse of the wanderer fleet.",
    cost: { "alien alloy": 2 }
  },
  {
    key: "kinetic armour",
    name: "kinetic armour",
    type: "upgrade",
    maximum: 1,
    blueprintRequired: true,
    buildMsg: "wanderer soldiers succeed by subverting the enemy's rage.",
    cost: { "alien alloy": 2 }
  },
  {
    key: "disruptor",
    name: "disruptor",
    type: "weapon",
    blueprintRequired: true,
    buildMsg: "somtimes it is best not to fight.",
    cost: { "alien alloy": 1 }
  },
  {
    key: "hypo",
    name: "hypo",
    type: "tool",
    blueprintRequired: true,
    buildMsg: "a handful of hypos. life in a vial.",
    cost: { "alien alloy": 1 },
    quantity: 5
  },
  {
    key: "stim",
    name: "stim",
    type: "tool",
    blueprintRequired: true,
    buildMsg: "sometimes it is best to fight without restraint.",
    cost: { "alien alloy": 1 }
  },
  {
    key: "plasma rifle",
    name: "plasma rifle",
    type: "weapon",
    blueprintRequired: true,
    buildMsg: "the peak of wanderer weapons technology, sleek and deadly.",
    cost: { "alien alloy": 1 }
  },
  {
    key: "glowstone",
    name: "glow stone",
    type: "tool",
    blueprintRequired: true,
    buildMsg: "a smooth, perfect sphere. its light is inextinguishable.",
    cost: { "alien alloy": 1 }
  }
];

export const originalSpaceTitleThresholds: SpaceTitleThreshold[] = [
  { minAltitude: 0, title: "Troposphere" },
  { minAltitude: 10, title: "Stratosphere" },
  { minAltitude: 20, title: "Mesosphere" },
  { minAltitude: 30, title: "Thermosphere" },
  { minAltitude: 45, title: "Exosphere" },
  { minAltitude: 60, title: "Space" }
];

export const originalSpaceAsteroids: SpaceAsteroidDefinition[] = [
  { rollUnder: 0.2, glyph: "#" },
  { rollUnder: 0.4, glyph: "$" },
  { rollUnder: 0.6, glyph: "%" },
  { rollUnder: 0.8, glyph: "&" },
  { rollUnder: 1, glyph: "H" }
];

export const originalSpaceAsteroidWaveThresholds: SpaceAsteroidWaveThreshold[] = [
  { minAltitudeExclusive: 10, extraAsteroids: 1 },
  { minAltitudeExclusive: 20, extraAsteroids: 2 },
  { minAltitudeExclusive: 40, extraAsteroids: 2 }
];

export const originalSpaceHitAudioTiers: SpaceHitAudioTier[] = [
  { minAltitudeExclusive: 40, offset: 6 },
  { minAltitudeExclusive: 20, offset: 4 },
  { minAltitudeExclusive: -Infinity, offset: 1 }
];

export const originalSpaceKeyBindings = {
  up: [38, 87],
  down: [40, 83],
  left: [37, 65],
  right: [39, 68]
} as const;

export function originalSpaceShipSpeed(thrusters: number): number {
  return SPACE_SHIP_SPEED + thrusters;
}

export function originalSpaceAsteroidDuration(roll: number): number {
  return (
    SPACE_BASE_ASTEROID_SPEED -
    Math.floor(roll * (SPACE_BASE_ASTEROID_SPEED * SPACE_ASTEROID_SPEED_RANDOM_FACTOR))
  );
}

export function originalSpaceNextAsteroidDelay(altitude: number): number {
  return 1000 - altitude * 10;
}

export function originalSpaceAsteroidCountForAltitude(altitude: number): number {
  return (
    1 +
    originalSpaceAsteroidWaveThresholds.reduce(
      (count, threshold) =>
        altitude > threshold.minAltitudeExclusive
          ? count + threshold.extraAsteroids
          : count,
      0
    )
  );
}

export function originalSpaceTitleForAltitude(altitude: number): string {
  for (let i = originalSpaceTitleThresholds.length - 1; i >= 0; i -= 1) {
    const threshold = originalSpaceTitleThresholds[i];
    if (altitude >= threshold.minAltitude) return threshold.title;
  }
  return originalSpaceTitleThresholds[0].title;
}

export function originalSpaceHitAudioOffset(altitude: number): number {
  return (
    originalSpaceHitAudioTiers.find(
      (tier) => altitude > tier.minAltitudeExclusive
    )?.offset ?? 1
  );
}

export function originalSpaceBackgroundMusicVolume(altitude: number): number {
  return 1 - altitude / SPACE_ESCAPE_ALTITUDE;
}

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const craftableKeys = originalFabricatorCraftables.map(
    (craftable) => craftable.key
  );
  if (
    craftableKeys.join("\u0000") !==
    canonicalManifest.keys.fabricatorCraftables.join("\u0000")
  ) {
    throw new Error(
      "Original fabricator craftable keys do not match canonical manifest"
    );
  }
}
