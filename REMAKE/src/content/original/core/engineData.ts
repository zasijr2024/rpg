export interface EngineOptionsDefaults {
  state: null;
  debug: boolean;
  log: boolean;
  dropbox: boolean;
  doubleTime: boolean;
}

export interface StateMigrationStep {
  from: number;
  to: number;
  summary: string;
  operations: readonly string[];
}

export interface ScoringBonus {
  key: string;
  factor: number;
}

export const ENGINE_SITE_URL = "http://adarkroom.doublespeakgames.com";
export const ENGINE_SITE_URL_ENCODED =
  "http%3A%2F%2Fadarkroom.doublespeakgames.com";
export const ENGINE_VERSION = 1.3;
export const ENGINE_MAX_STORE = 99999999999999;
export const ENGINE_SAVE_DISPLAY = 30 * 1000;
export const ENGINE_GAME_OVER_INITIAL = false;
export const STATE_MANAGER_MAX_STORE = 99999999999999;
export const ENGINE_INCOME_TICK_MS = 1000;
export const ENGINE_HYPER_MODE_FACTOR = 2;

export const originalEngineOptionDefaults: EngineOptionsDefaults = {
  state: null,
  debug: false,
  log: false,
  dropbox: false,
  doubleTime: false,
};

export const originalStateCategories = [
  "features",
  "stores",
  "character",
  "income",
  "timers",
  "game",
  "playStats",
  "previous",
  "outfit",
  "config",
  "wait",
  "cooldown",
] as const;

export const originalStateMigrationSteps: StateMigrationStep[] = [
  {
    from: 1.0,
    to: 1.1,
    summary: "v1.1 introduced the lodge, so lodgeless hunters are removed.",
    operations: ["remove outside.workers.hunter", "remove income.hunter"],
  },
  {
    from: 1.1,
    to: 1.2,
    summary: "v1.2 added the swamp landmark to already generated maps.",
    operations: ["place swamp landmark when world exists"],
  },
  {
    from: 1.2,
    to: 1.3,
    summary:
      "StateManager moved legacy room, outside, world, ship, perk, thief, and city state into modern categories.",
    operations: [
      "remove room.fire",
      "remove room.temperature",
      "remove room.buttons",
      "move room.builder to game.builder.level",
      "move outside population, buildings, workers, and seenForest",
      "move world map and mask under game.world",
      "move ship hull, thrusters, seenWarning, and seenShip under game.spaceShip",
      "move punches and perks under character",
      "move thieves and stolen under game",
      "move cityCleared under character",
      "set version to 1.3",
    ],
  },
];

export const originalScoreFactors = [
  1, 1.5, 1, 2, 2, 3, 3, 2, 2, 2, 2, 1.5, 1, 1, 10, 30, 50, 100, 150, 150, 3, 3,
  5, 4,
] as const;

export const originalScoreBonuses: ScoringBonus[] = [
  { key: "alien alloy", factor: 10 },
  { key: "fleet beacon", factor: 500 },
  { key: "ship hull", factor: 50 },
];

export function originalCalculateScore(
  prestigeStores: readonly number[],
  stores: Partial<Record<string, number>>,
  shipHull: number,
): number {
  let fullScore = 0;
  for (let i = 0; i < originalScoreFactors.length; i += 1) {
    fullScore += (prestigeStores[i] ?? 0) * originalScoreFactors[i];
  }

  fullScore += (stores["alien alloy"] ?? 0) * 10;
  fullScore += (stores["fleet beacon"] ?? 0) * 500;
  fullScore += shipHull * 50;
  return Math.floor(fullScore);
}
